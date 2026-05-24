---
name: java-maintenance-workflow
description: >
  Full dependency-maintenance workflow for Spring Boot 4 / Java 21+ projects
  using Maven or Gradle.
  Consolidates Dependabot PRs, triages Dependabot security alerts, upgrades all
  stable dependencies and plugins, upgrades frontend/npm packages (stable-only),
  fixes breaking code changes, updates stale version strings in documentation,
  bumps GitHub Actions action versions, bootstraps SpotBugs exclusions, runs
  quality/security gates (Spotless → compile → test → SpotBugs), commits, and opens a PR.
  Use this skill whenever the user says: "update dependencies", "upgrade all deps",
  "upgrade dependencies compile test lint", "perform security audit", "incorporate
  Dependabot PRs", "do the usual maintenance run", "dependency maintenance",
  "run the dependency upgrade cycle", "consolidate Dependabot PRs",
  "security audit and upgrade", or any variation that implies a scheduled or
  ad-hoc dependency/security hygiene pass on a Java/Maven/Gradle project.
  Also invoke automatically when the user is about to manually close Dependabot PRs,
  run versions:display-dependency-updates (Maven), or dependencyUpdates (Gradle) —
  this skill covers the full workflow.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Java Maintenance Workflow

**Version:** 1.1.0

End-to-end dependency maintenance for Spring Boot 4 / Java 21+ Maven **and** Gradle projects.
v1.1.0 adds a `--target-rc=<artifactId>:<version>` opt-in for deliberate RC/milestone bumps
(e.g., Spring Boot 4.1.0-RC1, Spring AI 2.0.0-M7) without weakening the default stable-only
filter for the rest of the project.

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
1.  Branch            → maintenance/dependency-upgrades-and-security-<YYYY-MM-DD>
2.  Triage PRs        → consolidate Dependabot / stale PRs
3.  Security alerts   → fetch Dependabot alerts, research fixes
4.  Upgrade Java/JVM  → versions:display-* → apply STABLE updates
5.  Upgrade npm       → npm outdated → apply stable-only updates
6.  Fix breakage      → deprecated APIs, renamed properties, package moves
7.  Docs              → grep pom.xml property values in markdown; update stale refs
8.  GH Actions        → bump actions/checkout, setup-java, cache, codeql-action
9.  SpotBugs setup    → create exclusion file if absent
10. Quality gates     → spotless:apply → compile → test → spotbugs:spotbugs
11. Commit            → detailed message with every bump and fix
12. Push + CI         → wait for green
13. PR                → version table, security notes, npm summary, GH Actions list
```

Dependency bumps and GitHub Actions action-version upgrades go in the **same PR**
(same risk surface, same reviewer sign-off). To update only GitHub Actions versions
without a full dependency pass, invoke the **github-actions-updater** skill standalone.

---

## Step 1 — Create Branch

```bash
git checkout main && git pull
git checkout -b "maintenance/dependency-upgrades-and-security-$(date +%Y-%m-%d)"
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

## Step 3 — Security Alerts

Fetch open Dependabot security alerts and research each fix:

```bash
# Requires gh CLI authenticated with security_events scope
REPO=$(gh repo view --json nameWithOwner --jq '.nameWithOwner')
gh api "repos/$REPO/dependabot/alerts" --jq '[.[] | select(.state == "open")]'
```

For each alert:

1. Read `fixed_in` version from the alert JSON (`security_vulnerability.first_patched_version.identifier`).
2. Determine whether the fix requires a major version bump.
3. Research breaking changes if major bump is needed (check release notes, migration guide).
4. Record each alert number, package, CVE/GHSA, and target fix version in a local working list
   to include in the commit message and PR body.

If Dependabot alerts API is unavailable (insufficient token scope), fall back to reading
open Dependabot PRs triaged in Step 2 for security-labelled items.

---

## Step 4 — Discover & Apply Stable Updates

**Default behavior — skip any version string that contains** (case-insensitive):
`-M`, `-RC`, `-SNAPSHOT`, `alpha`, `beta`, `Alpha`, `Dev`, `milestone`, `preview`, `nf-`

### RC / Milestone Opt-in (v1.1.0+)

When the user wants to deliberately onboard a specific RC or milestone (e.g., Spring
Boot 4.1.0-RC1 or Spring AI 2.0.0-M7) without weakening the stable-only filter for
every other dependency, pass `--target-rc=<artifactId>:<version>` (repeatable):

```bash
# Allow ONLY Spring Boot to bump to 4.1.0-RC1; everything else stable-only
java-maintenance-workflow --target-rc=spring-boot:4.1.0-RC1

# Multiple opt-ins
java-maintenance-workflow \
    --target-rc=spring-boot:4.1.0-RC1 \
    --target-rc=spring-ai-bom:2.0.0-M7
```

When `--target-rc` is set, the workflow:

1. Inserts the named artifact + version into a per-artifact override list.
2. Modifies the skip regex so that the **specific** RC version listed is not filtered
   out (other RC/milestones for the same or other artifacts remain skipped).
3. Auto-adds Spring Milestones repository to BOTH `<repositories>` and
   `<pluginRepositories>` (Maven) / `settings.gradle*` `pluginManagement` (Gradle) if
   not present.
4. Delegates the actual bump to `dependency-updater` v2.1.0+ with the equivalent
   `--target-rc` flag.
5. Records the RC opt-in in the PR body so reviewers can see the deliberate choice.

Without `--target-rc`, behavior is unchanged from v1.0.0.

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

## Step 5 — Frontend / npm Packages

Find all `package.json` files that are not inside `node_modules`:

```bash
find . -name "package.json" -not -path "*/node_modules/*" -not -path "*/.git/*"
```

For each `package.json`:

```bash
cd <dir-containing-package.json>
npm outdated --json 2>/dev/null || true
```

**Stable-only filter** — skip any package whose latest version string contains (case-insensitive):
`alpha`, `beta`, `rc`, `next`, `canary`, `experimental`, `-dev`, `nightly`

Apply updates:

```bash
# Upgrade all stable-updatable packages at once
npm install $(npm outdated --json | jq -r '
  to_entries[]
  | select(
      (.value.latest | ascii_downcase | test("alpha|beta|rc|next|canary|experimental|-dev|nightly") | not)
    )
  | "\(.key)@\(.value.latest)"
' | tr '\n' ' ')
```

Known ecosystem-compatible pairs (apply together when either triggers):

| Trigger package | Companion to update                                                                   |
| --------------- | ------------------------------------------------------------------------------------- |
| `vite` 5 → 6    | `@vitejs/plugin-react@4.7.0` supports `^4\|\|^5\|\|^6` — safe to bump                 |
| `vite` 5 → 6    | `@vitejs/plugin-react-swc` — bump to latest that declares `peerDependencies: vite ^6` |

After updating, run:

```bash
npm run build  # or the project's build script
npm test       # or the project's test script
```

Fix any peer-dependency warnings before proceeding.

---

## Step 6 — Fix Breaking Code Changes

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

| Symptom                                           | Likely Cause              | Fix                                                                               |
| ------------------------------------------------- | ------------------------- | --------------------------------------------------------------------------------- |
| `package tools.jackson.annotation does not exist` | Wrong Jackson 3 migration | Revert annotation imports to `com.fasterxml.jackson.annotation.*`                 |
| `AntPathRequestMatcher` not found                 | Spring Security 7         | Use `PathPatternRequestMatcher`                                                   |
| `JsonProcessingException` not found               | Jackson 3 core            | Change to `tools.jackson.core.JacksonException`                                   |
| Property key `spring.security.filter.*`           | Boot 4 property rename    | Check Boot 4 migration guide                                                      |
| `McpJsonMapper.getDefault()` not found            | MCP SDK 0.18.x            | Use `McpJsonDefaults.getMapper()` — see **spring-ai-mcp-client-package-migrator** |

---

## Step 7 — Docs — Update Stale Version Strings

Grep project markdown files for version strings that appear as properties in `pom.xml`
(or as version catalog entries in `gradle/libs.versions.toml`):

```bash
# Extract version property names and values from pom.xml
grep -E '<[a-z][a-z0-9.-]+\.version>' pom.xml | \
  sed 's/.*<\([^>]*\)>\([^<]*\)<.*/\1=\2/'
# Example output: spring-boot.version=4.0.0
```

For each `old_value → new_value` pair discovered in Step 4:

```bash
# Find markdown files that reference the old version string
grep -rl "<old_value>" --include="*.md" .
# Apply replacement
sed -i 's/<old_value>/<new_value>/g' <file>
```

Focus on version strings that appear literally in prose (prerequisites tables, badge URLs,
getting-started guides). Delegate cross-cutting docs updates to the **documentation-migrator**
skill for large-scale version-reference sweeps.

---

## Step 8 — GitHub Actions Action Version Bumps

Scan all workflow files for stale action versions and update to current stable releases.
Invoke the **github-actions-updater** skill standalone if you only need this step.

Current latest action versions (May 2026):

| Action                   | Latest |
| ------------------------ | ------ |
| `actions/checkout`       | `v6`   |
| `actions/setup-java`     | `v5`   |
| `actions/cache`          | `v5`   |
| `github/codeql-action/*` | `v3`   |

```bash
# Find all workflow files
find .github/workflows -name "*.yml" -o -name "*.yaml" 2>/dev/null

# Check current action versions
grep -rh "uses: actions/\|uses: github/" .github/workflows/
```

For each workflow file, update stale `uses:` pins:

```bash
# Example: checkout v4 → v6
sed -i 's|actions/checkout@v[0-9]*|actions/checkout@v6|g' .github/workflows/*.yml
sed -i 's|actions/setup-java@v[0-9]*|actions/setup-java@v5|g' .github/workflows/*.yml
sed -i 's|actions/cache@v[0-9]*|actions/cache@v5|g' .github/workflows/*.yml
sed -i 's|github/codeql-action/[a-z-]*@v[0-9]*|&|g' .github/workflows/*.yml
# codeql-action: replace the version tag specifically
grep -rl "codeql-action" .github/workflows/ | \
  xargs sed -i 's|github/codeql-action/\([a-z-]*\)@v[0-9]*|github/codeql-action/\1@v3|g'
```

Verify YAML syntax is preserved after edits:

```bash
python3 -c "import yaml, sys; [yaml.safe_load(open(f)) for f in sys.argv[1:]]" \
  .github/workflows/*.yml && echo "YAML OK"
```

---

## Step 9 — Bootstrap SpotBugs Exclusions

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

## Step 10 — Quality & Security Gates

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

## Step 11 — Commit

Write a commit message that enumerates every version bump and every code fix:

```text
chore: dependency maintenance — <YYYY-MM-DD>

## Dependency upgrades
- spring-boot-starter-parent: 4.0.0 → 4.0.3
- jackson-bom: 3.0.1 → 3.0.2
- spring-cloud-dependencies: 2025.0.0 → 2025.1.1
- <plugin> spotbugs-maven-plugin: 4.8.5.0 → 4.9.3.0
... (list every change)

## Security alerts resolved
- GHSA-xxxx-yyyy-zzzz: <package> <old> → <fixed> (CVE-YYYY-NNNNN)
... (list each alert)

## Frontend / npm upgrades
- vite: 5.4.0 → 6.3.5
- @vitejs/plugin-react: 4.3.0 → 4.7.0
... (list every npm change)

## GitHub Actions upgrades
- actions/checkout: v4 → v6
- actions/setup-java: v4 → v5
... (list only changed actions)

## Code fixes
- Fix defensive copy in MyService.setHeaders() (EI_EXPOSE_REP2, real bug)
- Correct Jackson annotation imports: reverted erroneous tools.jackson.annotation → com.fasterxml.jackson.annotation

## Docs
- README.md: spring-boot.version 4.0.0 → 4.0.3

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

## Step 12 — Push & Wait for CI

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

## Step 13 — Open PR

Use the **pr-submitter** skill for the full template. Minimum content:

```bash
gh pr create \
  --base main \
  --title "chore: dependency maintenance $(date +%Y-%m-%d)" \
  --body "$(cat <<'EOF'
## Dependency Maintenance

### Java / JVM Version Changes

| Artifact | From | To |
|---|---|---|
| spring-boot-starter-parent | X.Y.Z | X.Y.Z |
| ... | ... | ... |

### Security Alerts Resolved

| Alert | Package | CVE / GHSA | Fixed In |
|---|---|---|---|
| #N | package-name | GHSA-xxxx | X.Y.Z |

### Frontend / npm Version Changes

| Package | From | To |
|---|---|---|
| vite | 5.4.0 | 6.3.5 |
| ... | ... | ... |

### GitHub Actions Upgrades

| Action | From | To |
|---|---|---|
| actions/checkout | v4 | v6 |
| actions/setup-java | v4 | v5 |
| ... | ... | ... |

### Code Fixes

- **Defensive copy in `MyService.setHeaders()`** — mutated caller map; fixed by copying before transform.
- *(list any other fixes)*

### Documentation Updates

- *(list stale version strings updated in markdown files)*

### Quality Gates

| Gate | Result |
|---|---|
| spotless:apply | PASSED |
| compile | PASSED |
| test | PASSED |
| spotbugs:spotbugs | PASSED |

### Consolidated Dependabot PRs

- #N — bump \`package\` from X to Y
- *(list each closed PR)*
EOF
)"
```

---

## Key Lessons

| Lesson                                  | Detail                                                                                                                        |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Jackson 3 annotation namespace          | `@JsonProperty` etc. stay at `com.fasterxml.jackson.annotation.*`. The `tools.jackson.annotation.*` package does not exist.   |
| SpotBugs EI_EXPOSE_REP2 on Spring beans | False positive — Spring DI stores collaborators by reference by design. Suppress via exclusion file.                          |
| Defensive copy in setters               | A setter that calls `replaceAll()` on its argument then stores the reference IS a real bug — fix it.                          |
| GH Actions + deps in same PR            | Dependency bumps and GitHub Actions action-version upgrades share the same risk surface and reviewer set; keep in one branch. |
| GH Actions standalone invocation        | To update only action versions, invoke `github-actions-updater` skill directly without a full maintenance pass.               |
| OWASP is slow                           | OWASP dependency-check is a 10+ minute CI job. Use SpotBugs as the fast in-loop gate.                                         |
| npm stable-only filter                  | Skip any npm package version containing: `alpha`, `beta`, `rc`, `next`, `canary`, `experimental`, `-dev`, `nightly`.          |
| MCP SDK 0.18.x                          | `McpJsonMapper.getDefault()` removed. Use `McpJsonDefaults.getMapper()`. See `spring-ai-mcp-client-package-migrator`.         |

---

## Reusable Skills Called by This Workflow

| Step | Skill                                   | Purpose                                                     |
| ---- | --------------------------------------- | ----------------------------------------------------------- |
| 4    | `dependency-updater`                    | Maven/Gradle versions plugin, filtering strategies          |
| 6    | `jackson-migrator`                      | Jackson 2→3 import migration (preserves annotations)        |
| 6    | `spring-ai-mcp-client-package-migrator` | McpJsonMapper → McpJsonDefaults (MCP SDK 0.18.x)            |
| 7    | `documentation-migrator`                | Large-scale cross-cutting version-ref sweeps in markdown    |
| 8    | `github-actions-updater`                | Standalone GH Actions action version bump (invocable alone) |
| 10   | `build-runner`                          | Build/test execution and error pattern reference            |
| 13   | `pr-submitter`                          | Standardised PR body template                               |

---

## Known Pitfalls

### Spring Cloud BOM artifact rename (2025.1.x+)

`spring-cloud-starter-parent` was discontinued as a standalone artifact starting with
release train 2025.1.0. The `spring-cloud-starter-parent:2025.1.x` POM does **NOT**
exist on Maven Central. Use `spring-cloud-dependencies` instead:

```xml
<!-- Before -->
<artifactId>spring-cloud-starter-parent</artifactId>
<version>2025.0.x</version>

<!-- After -->
<artifactId>spring-cloud-dependencies</artifactId>
<version>2025.1.1</version>
```

Detection: resolution failure `"was not found in central"` for
`spring-cloud-starter-parent` versions >= 2025.1.0.

---

### Spring Boot 4 module disaggregation

Spring Boot 4 split several autoconfigure classes into separate Maven modules.
`spring-boot-restclient` and `spring-boot-webclient` are **NOT** transitively included
by `spring-boot-starter-webflux`. Add them explicitly when compilation fails with
`"package ... does not exist"`:

| Package                                                                       | Add this dependency                                                      |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `org.springframework.boot.restclient`                                         | `spring-boot-starter-restclient`                                         |
| `org.springframework.boot.webclient`                                          | `spring-boot-starter-webclient`                                          |
| `org.springframework.boot.http.converter.autoconfigure.HttpMessageConverters` | `spring-boot-http-converter` (transitive from `spring-boot-starter-web`) |

See `restclient-to-webclient-customizer-migrator` for the full migration when the
module is a pure WebFlux / reactive stack.

---

### JDK 25 + google-java-format incompatibility

Both `google-java-format` and `palantir-java-format` use:

```text
com.sun.tools.javac.util.Log$DeferredDiagnosticHandler.getDiagnostics()
```

This internal JDK API was **removed in JDK 25**. The error appears as a Spotless lint
failure with `LINE_UNDEFINED`, not a compile error. Switch to Eclipse JDT formatter.

See `spotless-formatter-migrator` for the full migration steps.
