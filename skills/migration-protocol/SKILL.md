---
name: migration-protocol
description: Canonical reference for the idempotent transformation protocol shared by all migration skills. Defines the read-check-detect-apply-update loop, skip logic, state file format, build verification commands, and Spring Milestones repository configuration. All migration skills delegate their boilerplate here.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Migration Protocol

Shared protocol used by all migration skills. Individual skills reference this document instead of duplicating the protocol details.

## Idempotent Transformation Protocol

Every migration skill follows this 5-step loop to ensure transformations are safe to run multiple times:

1. **Read migration state** — Load `.migration-state.yaml` to check which transformations have already been applied
2. **Check if already applied** — Skip any transformation whose recorded version >= the skill's current version
3. **Detect if still needed** — Run the skill-specific regex detection pattern against source files
4. **Apply transformation** — Only execute if the detection pattern still matches
5. **Update state** — Record the transformation in `.migration-state.yaml` with version, timestamp, and commit SHA

### Skip Logic

Before applying each transformation:

1. Load `.migration-state.yaml` (or treat as empty if not present)
2. Find the entry for the current skill name in `appliedTransformations`
3. If the entry exists and `appliedVersion >= currentVersion`, skip — already done
4. If the entry is older or missing, run the skill-specific detection pattern
5. If detection pattern matches → apply; if not → skip (already transformed or not applicable)

### Version Comparison Rules

A transformation is re-applied only when:

- Its transformation ID is absent from the state file, OR
- The recorded version is older than the current skill version (e.g., `1.0.0 < 1.1.0`), OR
- The detection pattern still matches (indicating a manual revert)

### State File Format

```yaml
# .migration-state.yaml
appliedTransformations:
  - skill: <skill-name>
    version: <semver>
    transformations:
      - <transformation-id-1>
      - <transformation-id-2>
    completedAt: <ISO-8601-timestamp>
    commitSha: <git-commit-sha>
```

The state file is committed alongside the migration changes to provide an audit trail and enable safe re-runs.

---

## Build Verification Commands

Use these commands to verify compilation after each transformation. Delegate to the `build-runner` skill for the full set of build and test commands.

### Maven

```bash
# Compile only (fast check)
./mvnw clean compile

# Full build including tests
./mvnw clean verify

# Skip tests for faster iteration
./mvnw clean package -DskipTests
```

### Gradle

```bash
# Compile only
./gradlew compileJava

# Full build including tests
./gradlew clean build

# Skip tests
./gradlew clean build -x test
```

After compilation succeeds, re-run the detection pattern to confirm it no longer matches.

---

## Spring Milestones Repository

Required when a project uses milestone or RC/snapshot releases (e.g., Spring AI `2.0.0-M7`,
Spring Boot `4.1.0-RC1`).

> **Critical:** Maven needs **both** `<repositories>` and `<pluginRepositories>` blocks.
> Spring Boot RC/milestone releases publish the `spring-boot-maven-plugin` to
> `repo.spring.io/milestone`, not Maven Central. Omitting `<pluginRepositories>` causes
> `Plugin org.springframework.boot:spring-boot-maven-plugin:<RC-version> not found`
> failures at build time even when `<repositories>` is present.

### Maven

```xml
<repositories>
    <repository>
        <id>spring-milestones</id>
        <name>Spring Milestones</name>
        <url>https://repo.spring.io/milestone</url>
        <snapshots>
            <enabled>false</enabled>
        </snapshots>
    </repository>
</repositories>

<pluginRepositories>
    <pluginRepository>
        <id>spring-milestones</id>
        <name>Spring Milestones</name>
        <url>https://repo.spring.io/milestone</url>
        <snapshots>
            <enabled>false</enabled>
        </snapshots>
    </pluginRepository>
</pluginRepositories>
```

### Gradle Kotlin DSL

`build.gradle.kts` — for dependency resolution:

```kotlin
repositories {
    mavenCentral()
    maven { url = uri("https://repo.spring.io/milestone") }
}
```

`settings.gradle.kts` — for **plugin** resolution (required when the Spring Boot plugin
itself is a milestone/RC version):

```kotlin
pluginManagement {
    repositories {
        gradlePluginPortal()
        mavenCentral()
        maven { url = uri("https://repo.spring.io/milestone") }
    }
}
```

### Gradle Groovy DSL

`build.gradle`:

```groovy
repositories {
    mavenCentral()
    maven { url 'https://repo.spring.io/milestone' }
}
```

`settings.gradle`:

```groovy
pluginManagement {
    repositories {
        gradlePluginPortal()
        mavenCentral()
        maven { url 'https://repo.spring.io/milestone' }
    }
}
```

---

## RC / Milestone Opt-in Upgrades

By default, migration skills filter out RC and milestone versions to protect production
projects from unstable upgrades. When a project deliberately targets an RC (e.g., onboarding
to Spring Boot `4.1.0-RC1` before GA), invoke the relevant skill with an explicit override:

- **`dependency-updater --target-rc=<artifactId>:<version>`** — narrow override that allows
  RC/milestone resolution for one artifact while keeping `stable-only` filtering elsewhere
- **`dependency-updater --filter-strategy=include-milestones`** — global widening (use
  sparingly; pulls every milestone, not just the targeted one)
- **`java-maintenance-workflow --target-rc=<artifactId>:<version>`** — same override
  semantics for the full maintenance cycle

When `--target-rc` is set, skills automatically ensure the Spring Milestones repository is
present in **both** `<repositories>` and `<pluginRepositories>` (Maven) or
`build.gradle*` + `settings.gradle*` `pluginManagement` (Gradle).

---

## Standard Dependencies

### migration-state skill

All migration skills depend on `migration-state` (v1.0.0+) for:

- Reading and writing `.migration-state.yaml`
- Checking applied transformations
- Version comparison logic

### build-runner skill

All migration skills depend on `build-runner` (v1.0.0+) for:

- Executing Maven and Gradle builds
- Running tests post-transformation
- Capturing and surfacing build errors

See `skills/migration-state/SKILL.md` and `skills/build-runner/SKILL.md` for full API details.

---

## Writing a New Migration Skill

When adding a new migration skill, include only the skill-specific content:

1. **Unique migration logic** — before/after code examples, import mapping tables, API changes
2. **Detection Patterns table** — the regex patterns specific to this transformation
3. **Skill-specific state schema** — only the YAML entry for this skill's transformations
4. **A reference to this document** — instead of re-documenting the protocol

Template for the reference section at the bottom of each skill:

````markdown
## Transformation Protocol

Follows the standard migration protocol. See `migration-protocol` skill for the
full transformation loop, skip logic, state file format, and build verification commands.

**Dependencies:** `migration-state` >= 1.0.0, `build-runner` >= 1.0.0

### Skill-Specific State Entry

```yaml
appliedTransformations:
  - skill: <this-skill-name>
    version: <this-skill-version>
    transformations:
      - <transformation-id-1>
      - <transformation-id-2>
    completedAt: <ISO-8601-timestamp>
    commitSha: <git-commit-sha>
```
````
