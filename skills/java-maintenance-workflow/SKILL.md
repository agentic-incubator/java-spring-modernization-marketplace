---
name: java-maintenance-workflow
description: >
  Full dependency-maintenance workflow for Spring Boot 4 / Java 21+ projects
  using Maven or Gradle.
  Consolidates Dependabot PRs, upgrades all stable dependencies and plugins, fixes
  breaking code changes, bootstraps SpotBugs exclusions, runs quality/security gates
  (Spotless → compile → test → SpotBugs), commits, and opens a PR.
  Use this skill whenever the user says: "update dependencies", "upgrade all deps",
  "upgrade dependencies compile test lint", "perform security audit", "incorporate
  Dependabot PRs", "do the usual maintenance run", "dependency maintenance",
  "run the dependency upgrade cycle", or any variation that implies a scheduled or
  ad-hoc dependency/security hygiene pass on a Java/Maven/Gradle project.
  Also invoke automatically when the user is about to manually close Dependabot PRs,
  run versions:display-dependency-updates (Maven), or dependencyUpdates (Gradle) —
  this skill covers the full workflow.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Java Maintenance Workflow

End-to-end dependency maintenance for Spring Boot 4 / Java 21+ Maven **and** Gradle projects.

> This skill reuses the **dependency-updater**, **build-runner**, and **pr-submitter**
> skills for their specialised steps. Read them if you need fine-grained detail on
> filtering strategies, build error patterns, or PR templates.

For Maven command reference see `references/maven.md`.
For Gradle command reference see `references/gradle.md`.
For the SpotBugs exclusion template see `references/spotbugs-exclude-template.xml`.

**Detect build tool first:**

```bash
# Maven
test -f pom.xml && echo "maven"

# Gradle (wrapper preferred)
test -f gradlew && echo "gradle"
```

Use the **build-tool-detector** skill when the project root is ambiguous.
All steps below show `Maven` and `Gradle` variants side-by-side.

---

## Workflow Overview

```text
1. Branch          → maintenance/dependency-upgrades-and-security
2. Triage PRs      → consolidate Dependabot / stale PRs into pom.xml
3. Upgrade         → versions:display-* → apply STABLE updates
4. Fix breakage    → deprecated APIs, renamed properties, package moves
5. SpotBugs setup  → create exclusion file if absent
6. Quality gates   → spotless:apply → compile → test → spotbugs:spotbugs
7. Commit          → detailed message with every bump and fix
8. Push + CI       → wait for green
9. PR              → version-change table, fix notes, follow-on items
```

Dependency upgrades and GitHub Actions upgrades are **separate PRs from main**.
Never mix them in one branch (different reviewers, different risk surfaces).

---

## Step 1 — Create Branch

```bash
git checkout main && git pull
git checkout -b maintenance/dependency-upgrades-and-security
```

---

## Step 2 — Triage Open PRs

List open PRs and identify Dependabot or stale dependency bumps:

```bash
gh pr list --state open --json number,title,author,headRefName
```

For each Dependabot / dependency PR:

1. Read the proposed `pom.xml` diff with `gh pr diff <number>`.
2. Copy the version change into the local `pom.xml` (or note it for Step 3).
3. Close the PR with a consolidation comment:

```bash
gh pr close <number> \
  --comment "Consolidated into maintenance/dependency-upgrades-and-security. \
Thank you, Dependabot! The backing branch will be deleted by GitHub automatically."
```

GitHub auto-deletes the backing branch when a PR is closed if the repo setting is
enabled; otherwise delete manually with `gh api repos/:owner/:repo/git/refs/heads/<branch> -X DELETE`.

---

## Step 3 — Discover & Apply Stable Updates

**Skip any version string that contains** (case-insensitive):
`-M`, `-RC`, `-SNAPSHOT`, `alpha`, `beta`, `Alpha`, `Dev`, `milestone`, `preview`, `nf-`

### Maven

Run in report mode first, then apply:

```bash
./mvnw versions:display-dependency-updates versions:display-plugin-updates

./mvnw versions:use-latest-releases \
    -DallowMajorUpdates=false \
    -DprocessDependencies=true \
    -DprocessPlugins=false \
    -DexcludesVersionFilters='(?i).*-(alpha|beta|m\d+|rc\d*|snapshot)|.*\b(dev|milestone|preview|nf-)\b.*'

./mvnw versions:update-plugins \
    -DallowMajorUpdates=false \
    -DexcludesVersionFilters='(?i).*-(alpha|beta|m\d+|rc\d*|snapshot)|.*\b(dev|milestone|preview|nf-)\b.*'

./mvnw versions:commit   # removes .versionsBackup files
```

### Gradle

Requires `com.github.ben-manes.versions` and `se.patrikerdes.use-latest-versions` plugins.
Add them to `build.gradle` / `build.gradle.kts` if absent:

```kotlin
// build.gradle.kts
plugins {
    id("com.github.ben-manes.versions") version "0.51.0"
    id("se.patrikerdes.use-latest-versions") version "0.2.18"
}
```

```bash
# Report mode — shows available updates, filters pre-release
./gradlew dependencyUpdates \
    --no-parallel --refresh-dependencies \
    -DrevisionLevel=release

# Apply stable updates
./gradlew useLatestVersions --no-parallel

# Verify version catalog / gradle.properties were updated
git diff gradle/libs.versions.toml gradle.properties build.gradle.kts
```

Refer to `references/maven.md` for full flag reference and rollback commands.

---

## Step 4 — Fix Breaking Code Changes

After bumping versions, `./mvnw compile` will surface breakage. Common patterns:

### Jackson 3.x

**Annotation namespace is deliberately backward-compatible — do NOT change it.**

| Annotation      | Old Namespace                        | Correct Action |
| --------------- | ------------------------------------ | -------------- |
| `@JsonProperty` | `com.fasterxml.jackson.annotation.*` | **Keep as-is** |
| `@JsonCreator`  | `com.fasterxml.jackson.annotation.*` | **Keep as-is** |
| `@JsonIgnore`   | `com.fasterxml.jackson.annotation.*` | **Keep as-is** |

Migrate only the non-annotation Jackson imports (core, databind, dataformat…) using the
**jackson-migrator** skill. Running it will correctly skip annotation imports.

### Defensive Copy in Setters

If a setter mutates the caller's map AND stores the reference directly:

```java
// BUG — mutates caller's map, then stores the shared reference
public void setHeaders(Map<String, String> headers) {
    headers.replaceAll((k, v) -> v.toLowerCase());
    this.headers = headers;
}

// FIX — copy first, transform, store
public void setHeaders(Map<String, String> headers) {
    Map<String, String> copy = new HashMap<>(headers);
    copy.replaceAll((k, v) -> v.toLowerCase());
    this.headers = copy;
}
```

This is a **real bug** (SpotBugs EI_EXPOSE_REP2 on setters is legitimate here), not a
false positive. The false positive is on constructor-injected Spring collaborators —
see Step 5.

### Other Common Fixes

| Symptom                                           | Likely Cause              | Fix                                                               |
| ------------------------------------------------- | ------------------------- | ----------------------------------------------------------------- |
| `package tools.jackson.annotation does not exist` | Wrong Jackson 3 migration | Revert annotation imports to `com.fasterxml.jackson.annotation.*` |
| `AntPathRequestMatcher` not found                 | Spring Security 7         | Use `PathPatternRequestMatcher`                                   |
| `JsonProcessingException` not found               | Jackson 3 core            | Change to `tools.jackson.core.JacksonException`                   |
| Property key `spring.security.filter.*`           | Boot 4 property rename    | Check Boot 4 migration guide                                      |

---

## Step 5 — Bootstrap SpotBugs Exclusions

Check whether an exclusion file exists:

```bash
test -f src/main/resources/spotbugs-exclude.xml && echo "exists" || echo "missing"
```

If missing, create it from the template at `references/spotbugs-exclude-template.xml`.
The template suppresses two categories of false positives that every Spring application hits:

- **EI_EXPOSE_REP2** on constructor-injected Spring beans — storing a collaborator by
  reference is the correct DI pattern; a defensive copy would break the whole IoC contract.
- **EI_EXPOSE_REP / SE_BAD_FIELD** on in-process `ApplicationEvent` subclasses — these
  are never serialised across a wire; the `Serializable` requirement is moot.

Verify your `pom.xml` references the exclusion file:

```xml
<plugin>
    <groupId>com.github.spotbugs</groupId>
    <artifactId>spotbugs-maven-plugin</artifactId>
    <configuration>
        <excludeFilterFile>src/main/resources/spotbugs-exclude.xml</excludeFilterFile>
        <effort>Max</effort>
        <threshold>Low</threshold>
        <failOnError>true</failOnError>
    </configuration>
</plugin>
```

---

## Step 6 — Quality & Security Gates

Run in order. **Stop and fix if any gate fails before proceeding.**

### Maven

```bash
# 1. Format
./mvnw spotless:apply

# 2. Compile
./mvnw compile

# 3. Unit tests
./mvnw test

# 4. Security/quality (SpotBugs — fast, catches CVE patterns and code bugs)
./mvnw spotbugs:spotbugs
```

### Gradle

```bash
# 1. Format
./gradlew spotlessApply

# 2. Compile
./gradlew compileJava

# 3. Unit tests
./gradlew test

# 4. Security/quality
./gradlew spotbugsMain
```

**Why SpotBugs and not OWASP dependency-check?**
OWASP dependency-check downloads its NVD feed on every run — 10+ minutes per build.
SpotBugs analyses bytecode patterns that correlate with CVEs and catches real code bugs
in seconds. Use OWASP as a separate, scheduled job rather than a per-commit gate.

If SpotBugs reports new bugs that were not caused by your changes, investigate them;
do not suppress everything blindly. Only suppress confirmed false positives with a
`<Match>` rule and a `<!-- WHY: ... -->` comment explaining the reasoning.

---

## Step 7 — Commit

Write a commit message that enumerates every version bump and every code fix:

```text
chore: dependency maintenance — <YYYY-MM-DD>

## Dependency upgrades
- spring-boot-starter-parent: 4.0.0 → 4.0.3
- jackson-bom: 3.0.1 → 3.0.2
- spring-cloud-dependencies: 2025.0.0 → 2025.1.1
- <plugin> spotbugs-maven-plugin: 4.8.5.0 → 4.9.3.0
... (list every change)

## Code fixes
- Fix defensive copy in MyService.setHeaders() (EI_EXPOSE_REP2, real bug)
- Correct Jackson annotation imports: reverted erroneous tools.jackson.annotation → com.fasterxml.jackson.annotation

## Bootstrap
- Added src/main/resources/spotbugs-exclude.xml (Spring DI + ApplicationEvent false positives)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

```bash
git add -p   # stage carefully — never add .env, secrets, or build artefacts
git commit -m "$(cat <<'EOF'
<your message here>
EOF
)"
```

---

## Step 8 — Push & Wait for CI

```bash
git push -u origin maintenance/dependency-upgrades-and-security
```

Monitor CI:

```bash
gh run list --branch maintenance/dependency-upgrades-and-security --limit 5
gh run watch <run-id>
```

Do not open the PR until CI is green. If CI fails, fix locally, push again.

---

## Step 9 — Open PR

Use the **pr-submitter** skill for the full template. Minimum content:

```bash
gh pr create \
  --base main \
  --title "chore: dependency maintenance $(date +%Y-%m-%d)" \
  --body "$(cat <<'EOF'
## Dependency Maintenance

### Version Changes

| Artifact | From | To |
|---|---|---|
| spring-boot-starter-parent | X.Y.Z | X.Y.Z |
| ... | ... | ... |

### Code Fixes

- **Defensive copy in `MyService.setHeaders()`** — mutated caller map; fixed by copying before transform.
- *(list any other fixes)*

### Quality Gates

| Gate | Result |
|---|---|
| spotless:apply | PASSED |
| compile | PASSED |
| test | PASSED |
| spotbugs:spotbugs | PASSED |

### Follow-on Work

- [ ] **GitHub Actions Node.js migration** — open a separate PR from main:
  `checkout@v6`, `setup-java@v5`, `cache@v5`, `codeql-action@v3` (Node 20 retiring).
EOF
)"
```

**GitHub Actions upgrades belong in a separate PR from `main`**, not in this branch.
Current latest action versions (as of May 2026):

- `actions/checkout@v6`
- `actions/setup-java@v5`
- `actions/cache@v5`
- `github/codeql-action@v3`

---

## Key Lessons

| Lesson                                  | Detail                                                                                                                      |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Jackson 3 annotation namespace          | `@JsonProperty` etc. stay at `com.fasterxml.jackson.annotation.*`. The `tools.jackson.annotation.*` package does not exist. |
| SpotBugs EI_EXPOSE_REP2 on Spring beans | False positive — Spring DI stores collaborators by reference by design. Suppress via exclusion file.                        |
| Defensive copy in setters               | A setter that calls `replaceAll()` on its argument then stores the reference IS a real bug — fix it.                        |
| Separate PR concerns                    | Dependency bumps and GitHub Actions upgrades are different risk surfaces; branch both from `main` independently.            |
| OWASP is slow                           | OWASP dependency-check is a 10+ minute CI job. Use SpotBugs as the fast in-loop gate.                                       |

---

## Reusable Skills Called by This Workflow

| Step | Skill                | Purpose                                              |
| ---- | -------------------- | ---------------------------------------------------- |
| 3    | `dependency-updater` | Maven/Gradle versions plugin, filtering strategies   |
| 4    | `jackson-migrator`   | Jackson 2→3 import migration (preserves annotations) |
| 6    | `build-runner`       | Build/test execution and error pattern reference     |
| 9    | `pr-submitter`       | Standardised PR body template                        |
