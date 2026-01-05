---
name: dependency-updater
description: Upgrade all dependencies and plugins to their latest stable/milestone compatible versions. Supports Maven and Gradle with configurable filtering (stable-only, include-milestones, aggressive). Use when upgrading project dependencies incrementally.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Dependency Updater

Upgrade dependencies and plugins to latest compatible versions with intelligent filtering and validation.

## Critical Rules

1. **Always run in report mode first** - Review available updates before applying
2. **Use stable-only filter by default** - Avoid pre-release versions in production
3. **Respect Spring Boot BOM** - Don't update BOM-managed dependencies directly
4. **Create backups automatically** - Maven creates `.versionsBackup` files
5. **Validate after updates** - Run builds and tests to catch breaking changes
6. **Check migration state** - Skip if already applied at current version

## Features

- **Two Modes**: Report (default) and Update (with validation)
- **Three Filter Strategies**: stable-only, include-milestones, aggressive
- **Maven Support**: Uses maven-versions-plugin for dependency/plugin updates
- **Gradle Support**: Uses ben-manes/gradle-versions-plugin + use-latest-versions
- **Special Handling**: BOM dependencies, version catalogs, property-based versions
- **Idempotent**: Safe to run multiple times via migration-state tracking
- **Rollback Support**: Automatic backups with easy rollback commands

## Maven Versions Plugin

### Display Available Updates (Report Mode)

```bash
# Show dependency updates
mvn versions:display-dependency-updates

# Show plugin updates
mvn versions:display-plugin-updates

# Show property updates
mvn versions:display-property-updates
```

### Apply Updates (Update Mode)

```bash
# Update dependencies to latest releases (excludes snapshots)
mvn versions:use-latest-releases \
  -DallowMajorUpdates=false \
  -DprocessDependencies=true \
  -DprocessPlugins=false \
  -Dmaven.version.ignore='(?i).*-(alpha|beta|m|rc)([-.]?\d+)?|.*SNAPSHOT'

# Update plugins to latest releases
mvn versions:update-plugins \
  -DallowMajorUpdates=false \
  -Dmaven.version.ignore='(?i).*-(alpha|beta|m|rc)([-.]?\d+)?|.*SNAPSHOT'

# Update property-based versions
mvn versions:update-properties \
  -DallowMajorUpdates=false \
  -Dmaven.version.ignore='(?i).*-(alpha|beta|m|rc)([-.]?\d+)?|.*SNAPSHOT'
```

### Version Filtering

The `-Dmaven.version.ignore` parameter uses regex to exclude versions:

| Filter Strategy        | Regex Pattern                                        | Excludes                     |
| ---------------------- | ---------------------------------------------------- | ---------------------------- |
| **stable-only**        | `(?i).*-(alpha\|beta\|m\|rc)([-.]?\d+)?\|.*SNAPSHOT` | alpha, beta, M, RC, SNAPSHOT |
| **include-milestones** | `(?i).*-(alpha\|beta)([-.]?\d+)?\|.*SNAPSHOT`        | alpha, beta, SNAPSHOT        |
| **aggressive**         | `.*SNAPSHOT`                                         | SNAPSHOT only                |

### Rollback

```bash
# Restore from automatic backup
mvn versions:revert

# Or manually
cp pom.xml.versionsBackup pom.xml

# Commit changes (deletes backup)
mvn versions:commit
```

## Gradle Versions Plugin

### Display Available Updates (Report Mode)

```bash
# Generate dependency update report
./gradlew dependencyUpdates --no-parallel --refresh-dependencies

# Output JSON report (optional)
./gradlew dependencyUpdates --no-parallel \
  --outputFormatter=json \
  --outputDir=build/dependencyUpdates
```

**Note**: Gradle 9+ requires `--no-parallel` flag for dependencyUpdates task.

### Apply Updates (Update Mode)

```bash
# Use gradle-use-latest-versions plugin to apply updates
./gradlew useLatestVersions --no-parallel

# Update Gradle wrapper if needed
./gradlew wrapper --gradle-version 8.11
```

### Plugin Configuration

The skill temporarily adds these plugins if not already configured:

```kotlin
plugins {
    id("com.github.ben-manes.versions") version "0.51.0"
    id("se.patrikerdes.use-latest-versions") version "0.2.18"
}
```

After execution, plugins can be kept or removed based on preference.

### Rollback

```bash
# Manual restore from backup
cp build.gradle.backup build.gradle
cp build.gradle.kts.backup build.gradle.kts

# Or use git
git checkout build.gradle
git checkout build.gradle.kts
```

## Filtering Strategies

### stable-only (Default)

**Use case**: Production systems requiring maximum stability

**Includes**: Stable releases only (e.g., `3.0.2`, `2.17.0`)

**Excludes**: alpha, beta, RC, milestone, snapshot versions

**Maven**:

```bash
-Dmaven.version.ignore='(?i).*-(alpha|beta|m|rc)([-.]?\d+)?|.*SNAPSHOT'
```

**Example**:

- ✅ `3.0.2` - Included
- ✅ `2.17.0` - Included
- ❌ `3.0.0-M1` - Excluded (milestone)
- ❌ `3.0.0-RC1` - Excluded (release candidate)
- ❌ `3.0.0-SNAPSHOT` - Excluded (snapshot)

### include-milestones

**Use case**: Early adoption of Spring Boot 4, Spring AI 2.0 (requires milestones)

**Includes**: Stable releases, milestones (M1, M2), RC versions

**Excludes**: alpha, beta, snapshot versions

**Maven**:

```bash
-Dmaven.version.ignore='(?i).*-(alpha|beta)([-.]?\d+)?|.*SNAPSHOT'
```

**Example**:

- ✅ `3.0.2` - Included
- ✅ `3.0.0-M1` - Included (milestone)
- ✅ `3.0.0-RC1` - Included (release candidate)
- ❌ `3.0.0-alpha` - Excluded (alpha)
- ❌ `3.0.0-SNAPSHOT` - Excluded (snapshot)

**Note**: Requires Spring Milestones repository - auto-added if milestone versions detected.

### aggressive

**Use case**: Development/testing environments, bleeding edge

**Includes**: All versions except snapshots

**Excludes**: snapshot versions only

**Maven**:

```bash
-Dmaven.version.ignore='.*SNAPSHOT'
```

**Example**:

- ✅ `3.0.2` - Included
- ✅ `3.0.0-M1` - Included
- ✅ `3.0.0-RC1` - Included
- ✅ `3.0.0-alpha` - Included
- ❌ `3.0.0-SNAPSHOT` - Excluded

## Special Handling

### Spring Boot BOM-Managed Dependencies

Dependencies with versions managed by `spring-boot-starter-parent` are **skipped** with an INFO log.

**Example** (pom.xml):

```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>4.0.0</version>
</parent>

<dependencies>
    <!-- Version managed by Spring Boot BOM - NOT updated directly -->
    <dependency>
        <groupId>org.springframework.security</groupId>
        <artifactId>spring-security-core</artifactId>
        <!-- No <version> tag - inherited from BOM -->
    </dependency>

    <!-- Version NOT managed by BOM - CAN be updated -->
    <dependency>
        <groupId>com.google.guava</groupId>
        <artifactId>guava</artifactId>
        <version>32.1.0</version>  <!-- Will be updated -->
    </dependency>
</dependencies>
```

**Action**: To update Spring Security, update the Spring Boot parent version instead:

```bash
mvn versions:update-parent
```

### Gradle Version Catalogs

Detects and updates `libs.versions.toml`:

**Before**:

```toml
[versions]
jackson = "2.17.0"
guava = "32.1.0"

[libraries]
jackson-core = { module = "tools.jackson.core:jackson-core", version.ref = "jackson" }
guava = { module = "com.google.guava:guava", version.ref = "guava" }
```

**After** (stable-only filter):

```toml
[versions]
jackson = "3.0.2"  # Updated
guava = "33.0.0"   # Updated

[libraries]
jackson-core = { module = "tools.jackson.core:jackson-core", version.ref = "jackson" }
guava = { module = "com.google.guava:guava", version.ref = "guava" }
```

### Maven Property-Based Versions

Updates properties in `<properties>` section:

**Before**:

```xml
<properties>
    <jackson.version>2.17.0</jackson.version>
    <guava.version>32.1.0</guava.version>
</properties>

<dependencies>
    <dependency>
        <groupId>com.fasterxml.jackson.core</groupId>
        <artifactId>jackson-databind</artifactId>
        <version>${jackson.version}</version>
    </dependency>
    <dependency>
        <groupId>com.google.guava</groupId>
        <artifactId>guava</artifactId>
        <version>${guava.version}</version>
    </dependency>
</dependencies>
```

**After** (stable-only filter):

```xml
<properties>
    <jackson.version>3.0.2</jackson.version>  <!-- Updated -->
    <guava.version>33.0.0</guava.version>      <!-- Updated -->
</properties>
```

### Milestone Repository Auto-Addition

If milestone versions detected (e.g., `Spring AI 2.0.0-M1`), automatically adds Spring Milestones repository:

**Maven** (pom.xml):

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

**Gradle** (build.gradle.kts):

```kotlin
repositories {
    mavenCentral()
    maven { url = uri("https://repo.spring.io/milestone") }
}
```

## Report Mode Workflow

**Purpose**: Display available updates without making changes.

### Step-by-Step Execution

1. **Detect Build Tool**
   - Use `build-tool-detector` skill
   - Returns: `{ buildTool: "maven|gradle", variant: "standard|groovy-dsl|kotlin-dsl" }`

2. **Check Migration State**
   - Load `.migration-state.yaml`
   - Skip if already applied at current version

3. **Generate Update Report**

   **Maven**:

   ```bash
   mvn versions:display-dependency-updates -Dversions.outputFile=dependency-updates.txt
   mvn versions:display-plugin-updates -Dversions.outputFile=plugin-updates.txt
   mvn versions:display-property-updates -Dversions.outputFile=property-updates.txt
   ```

   **Gradle**:

   ```bash
   ./gradlew dependencyUpdates --no-parallel --refresh-dependencies \
     --outputFormatter=json \
     --outputDir=build/dependencyUpdates
   ```

4. **Parse Output**
   - Extract current version → available versions mapping
   - Identify dependencies vs plugins vs properties
   - Detect BOM-managed dependencies

5. **Apply Filter Strategy**
   - Filter versions based on strategy (stable-only, include-milestones, aggressive)
   - Mark BOM-managed dependencies as "skipped"

6. **Display Summary**
   - Total updates available: X
   - Dependencies: Y
   - Plugins: Z
   - BOM-managed (skipped): W

7. **Generate JSON Report**
   - Output structured JSON for tooling integration

### Example Output

```text
=== Dependency Update Report ===

Project: /path/to/my-spring-app
Build Tool: Maven
Filter Strategy: stable-only

Available Updates:

Dependencies (12):
  ✅ com.google.guava:guava
     Current: 32.1.0 → Latest: 33.0.0
     Source: property:guava.version

  ✅ org.apache.commons:commons-lang3
     Current: 3.12.0 → Latest: 3.14.0
     Source: direct

  ℹ️  org.springframework.security:spring-security-core
     Current: (managed by spring-boot-starter-parent:4.0.0)
     Action: Update Spring Boot parent version instead

Plugins (3):
  ✅ org.apache.maven.plugins:maven-compiler-plugin
     Current: 3.11.0 → Latest: 3.13.0

  ✅ org.apache.maven.plugins:maven-surefire-plugin
     Current: 3.0.0 → Latest: 3.2.5

Total Updates Available: 15 (12 dependencies, 3 plugins)
BOM-Managed (skipped): 8
```

## Update Mode Workflow

**Purpose**: Apply updates with validation and rollback support.

### Step-by-Step Execution

1. **Run Report Mode**
   - Generate update report first
   - Display planned changes to user

2. **Apply Filter Strategy**
   - Use configured filter (stable-only, include-milestones, aggressive)
   - Apply major version control (allowMajorUpdates flag)

3. **Create Backup**
   - **Maven**: Automatic `pom.xml.versionsBackup`
   - **Gradle**: Manual `build.gradle.backup`

4. **Apply Updates**

   **Maven**:

   ```bash
   # Update dependencies
   mvn versions:use-latest-releases \
     -DallowMajorUpdates=false \
     -DprocessDependencies=true \
     -DprocessPlugins=false \
     -DexcludeReactor=true \
     -Dmaven.version.ignore='(?i).*-(alpha|beta|m|rc)([-.]?\d+)?|.*SNAPSHOT'

   # Update plugins
   mvn versions:update-plugins \
     -DallowMajorUpdates=false \
     -Dmaven.version.ignore='(?i).*-(alpha|beta|m|rc)([-.]?\d+)?|.*SNAPSHOT'

   # Update properties
   mvn versions:update-properties \
     -DallowMajorUpdates=false \
     -Dmaven.version.ignore='(?i).*-(alpha|beta|m|rc)([-.]?\d+)?|.*SNAPSHOT'
   ```

   **Gradle**:

   ```bash
   # Temporarily add use-latest-versions plugin
   ./gradlew useLatestVersions --no-parallel
   ```

5. **Detect Milestone Versions**
   - Scan updated versions for `-M\d+` or `-RC\d+` patterns
   - If detected, add Spring Milestones repository

6. **Validate Compilation**
   - Use `build-runner` skill
   - **Maven**: `mvn clean package -DskipTests`
   - **Gradle**: `./gradlew clean build -x test`
   - If fails: suggest rollback

7. **Run Tests**
   - **Maven**: `mvn test`
   - **Gradle**: `./gradlew test`
   - If fails: record partial success, allow user to decide

8. **Update Migration State**
   - Record applied transformations in `.migration-state.yaml`
   - Include: skill, version, transformations, commit SHA, update count

9. **Optional: Git Commit**
   - Commit code changes + state file atomically

### Validation Results

After updates, the skill reports:

```text
=== Validation Results ===

Compilation: ✅ PASSED (45s)
Tests: ✅ PASSED (120s)
  - Passed: 150
  - Failed: 0
  - Skipped: 5

Updated: 15 dependencies/plugins
  - Dependencies: 12
  - Plugins: 3
  - Properties: 5

Backup: pom.xml.versionsBackup
Milestone Repo Added: Yes
```

### Error Handling

**Compilation Failure**:

```text
❌ Compilation FAILED

Error: package tools.jackson.databind does not exist

Suggested Actions:
1. Review breaking changes in Jackson 3.x
2. Rollback: mvn versions:revert
3. Update incrementally (one dependency at a time)

Migration state updated with FAILED status.
```

**Test Failure**:

```text
⚠️  Tests FAILED

Passed: 145
Failed: 5
  - UserServiceTest.testSerialization
  - OrderServiceTest.testDeserialization

Compilation: ✅ PASSED
Code changes applied, but tests failed.

Suggested Actions:
1. Review test failures
2. Fix tests and re-run: mvn test
3. Or rollback: mvn versions:revert

Migration state recorded partial success.
```

## Idempotent Transformation Logic

This skill implements idempotent transformations that can be safely run multiple times.

### Transformation Flow

1. **Read Migration State**
   - Load `.migration-state.yaml`
   - Check for existing `dependency-updater` entry

2. **Check if Already Applied**
   - Compare applied version vs current skill version
   - Skip if `appliedVersion >= skillVersion`

3. **Detect if Still Needed**
   - Use detection patterns from `metadata.yaml`
   - Examples:
     - `dependency-updates`: Match `<dependency>|implementation\(|api\(`
     - `plugin-updates`: Match `<plugin>|id\(.*\) version`
     - `property-updates`: Match `<properties>|\[versions\]`
     - `milestone-repo-addition`: Match `-M\d+|-RC\d+`

4. **Apply Transformation**
   - Only execute if detection pattern matches
   - Skip if pattern doesn't match (already transformed or not applicable)

5. **Update State**
   - Record in `.migration-state.yaml`:
     - skill: `dependency-updater`
     - version: `1.0.0`
     - transformations: `[dependency-updates, plugin-updates, ...]`
     - completedAt: timestamp
     - commitSha: git commit SHA

### Example State File Entry

```yaml
appliedTransformations:
  - skill: dependency-updater
    version: 1.0.0
    transformations:
      - dependency-updates
      - plugin-updates
      - property-updates
      - milestone-repo-addition
    completedAt: '2026-01-03T15:30:00Z'
    commitSha: 'abc123def456'
    summary:
      totalUpdates: 15
      dependencies: 12
      plugins: 3
      properties: 5
      milestoneRepoAdded: true
    validation:
      compile:
        success: true
        duration: '45s'
      tests:
        success: true
        passed: 150
        failed: 0
        duration: '120s'
```

### Skip Logic

Before applying any transformation:

1. Load state from `.migration-state.yaml`
2. For each transformation in `metadata.yaml`:
   - Check if `skill: dependency-updater` exists in `appliedTransformations`
   - If yes, check if transformation ID is in the list
   - If yes, compare versions: skip if `appliedVersion >= currentVersion`
   - If no or version is older, run detection pattern
3. If detection pattern matches, apply transformation
4. If detection pattern doesn't match, skip (already transformed or not applicable)

### Version Comparison

Transformations are only reapplied if:

- Transformation ID not found in state file, OR
- Applied version < current version (e.g., 0.9.0 < 1.0.0), OR
- Detection pattern still matches (manual revert detected)

## Integration with Migration State Skill

This skill depends on the `migration-state` skill (v1.0.0+) for:

- Reading `.migration-state.yaml`
- Checking applied transformations via `is_transformation_applied()`
- Updating state after successful transformation via `update_applied_transformations()`
- Version comparison logic via `get_skill_version()`

### Integration Pattern

```bash
# 1. Check if already applied
is_transformation_applied "." "dependency-updater"
# Returns: true → skip, false → apply

# 2. Apply transformations
# ... (update dependencies, plugins, properties)

# 3. Update state
update_applied_transformations \
  "." \
  "dependency-updater" \
  "1.0.0" \
  "dependency-updates,plugin-updates,property-updates" \
  "$(git rev-parse HEAD)"

# 4. Validate
mvn clean test

# 5. Update validation status
update_validation_status \
  "." \
  "PASSED" \
  "true" \
  "0" \
  "" \
  "150" \
  "0"

# 6. Atomic commit
atomic_commit_state \
  "." \
  "dependency-updater" \
  "1.0.0" \
  "dependency-updates,plugin-updates,property-updates" \
  "Upgrade dependencies to latest stable versions"
```

See `skills/migration-state/SKILL.md` for state management details.

## Output Format

The skill generates structured JSON output for tooling integration:

```json
{
  "project": "/Users/user/my-spring-app",
  "buildTool": "maven",
  "variant": "standard",
  "mode": "update",
  "filterStrategy": "stable-only",
  "allowMajorUpdates": false,
  "updates": {
    "dependencies": [
      {
        "groupId": "com.google.guava",
        "artifactId": "guava",
        "currentVersion": "32.1.0",
        "newVersion": "33.0.0",
        "type": "dependency",
        "source": "property:guava.version",
        "versionChange": "major"
      },
      {
        "groupId": "org.apache.commons",
        "artifactId": "commons-lang3",
        "currentVersion": "3.12.0",
        "newVersion": "3.14.0",
        "type": "dependency",
        "source": "direct",
        "versionChange": "minor"
      }
    ],
    "plugins": [
      {
        "groupId": "org.apache.maven.plugins",
        "artifactId": "maven-compiler-plugin",
        "currentVersion": "3.11.0",
        "newVersion": "3.13.0",
        "type": "plugin",
        "versionChange": "minor"
      }
    ],
    "properties": [
      {
        "name": "guava.version",
        "currentVersion": "32.1.0",
        "newVersion": "33.0.0",
        "type": "property",
        "versionChange": "major"
      }
    ],
    "bomManaged": [
      {
        "groupId": "org.springframework.security",
        "artifactId": "spring-security-core",
        "managedBy": "spring-boot-starter-parent:4.0.0",
        "action": "skipped",
        "reason": "Version managed by Spring Boot BOM"
      }
    ]
  },
  "milestoneRepoAdded": false,
  "validation": {
    "compile": {
      "success": true,
      "duration": "45s",
      "errors": 0
    },
    "tests": {
      "success": true,
      "passed": 150,
      "failed": 0,
      "skipped": 5,
      "duration": "120s"
    }
  },
  "summary": {
    "totalUpdates": 15,
    "dependencyUpdates": 12,
    "pluginUpdates": 3,
    "propertyUpdates": 5,
    "bomManagedSkipped": 8,
    "majorVersionChanges": 2,
    "minorVersionChanges": 10,
    "patchVersionChanges": 3
  },
  "backupCreated": "pom.xml.versionsBackup",
  "stateUpdated": true,
  "commitSha": "abc123def456"
}
```

## Error Handling and Rollback

### Compilation Failures

If compilation fails after updates:

1. **Parse Build Errors**

   ```text
   [ERROR] /path/to/MyService.java:[42,10] package tools.jackson.databind does not exist
   ```

2. **Identify Problematic Dependency**
   - Jackson groupId change: `com.fasterxml.→ tools.jackson`
   - Suggest running `jackson-migrator` skill first

3. **Suggest Rollback**
   - Maven: `mvn versions:revert`
   - Gradle: `cp build.gradle.backup build.gradle`

4. **Update State**
   - Record failure in `.migration-state.yaml`
   - Status: `FAILED`
   - Error message included

### Test Failures

If tests fail but compilation succeeds:

1. **Record Partial Success**
   - Code updates applied successfully
   - Compilation passed
   - Tests failed (with details)

2. **Log Failing Tests**

   ```text
   Failed Tests:
     - UserServiceTest.testSerialization
     - OrderServiceTest.testDeserialization
   ```

3. **Allow User Decision**
   - Keep updates and fix tests
   - Or rollback: `mvn versions:revert`

### Network Issues

If dependency resolution fails:

1. **Retry with Refresh**
   - Maven: `mvn versions:display-dependency-updates -U`
   - Gradle: `./gradlew dependencyUpdates --refresh-dependencies`

2. **Clear Cache**
   - Maven: `mvn dependency:purge-local-repository`
   - Gradle: `./gradlew clean --refresh-dependencies`

3. **Check Repository Accessibility**
   - Verify Maven Central connectivity
   - Check Spring Milestones repo (if milestones enabled)

### Version Conflicts

After updates, may encounter:

1. **Incompatible Transitive Dependencies**
   - Run dependency tree: `mvn dependency:tree` or `./gradlew dependencies`
   - Identify conflicting versions
   - Suggest exclusions or dependency management

2. **Breaking API Changes**
   - Check changelogs for major version bumps
   - Suggest incremental updates (one major version at a time)

3. **Platform Version Mismatches**
   - Ensure Spring Boot BOM compatibility
   - Verify Spring Cloud BOM alignment

## Version Compatibility Matrix

| Component                 | Minimum Version | Recommended Version | Notes                               |
| ------------------------- | --------------- | ------------------- | ----------------------------------- |
| **Maven**                 | 3.9.0           | 3.9.9               | For versions-maven-plugin           |
| **Gradle**                | 8.5             | 8.11                | For dependencyUpdates task          |
| **versions-maven-plugin** | 2.16.0          | 2.16.2              | Maven dependency/plugin update tool |
| **gradle-versions**       | 0.50.0          | 0.51.0              | Ben Manes dependency updates plugin |
| **use-latest-versions**   | 0.2.0           | 0.2.18              | Patrikerdes auto-apply plugin       |
| **Java**                  | 17              | 21+                 | For Spring Boot 4.x compatibility   |
| **Spring Boot**           | 3.0             | 4.0+                | Target for migration                |

### Plugin Dependencies

**Maven** (add to pom.xml if not present):

```xml
<plugin>
    <groupId>org.codehaus.mojo</groupId>
    <artifactId>versions-maven-plugin</artifactId>
    <version>2.16.2</version>
    <configuration>
        <generateBackupPoms>true</generateBackupPoms>
    </configuration>
</plugin>
```

**Gradle** (auto-added temporarily):

```kotlin
plugins {
    id("com.github.ben-manes.versions") version "0.51.0"
    id("se.patrikerdes.use-latest-versions") version "0.2.18"
}
```

## Best Practices

1. **Always Run Report First**
   - Review available updates before applying
   - Check for major version bumps
   - Identify BOM-managed dependencies

2. **Use stable-only in Production**
   - Avoid pre-release versions (alpha, beta, RC, milestone)
   - Minimize risk of breaking changes
   - Only use include-milestones for early Spring Boot 4 adoption

3. **Commit Between Major Updates**
   - Create atomic commits for easier rollback
   - One major dependency update per commit
   - Run full test suite between commits

4. **Review Breaking Changes**
   - Check changelogs for major version bumps
   - Search for migration guides (e.g., Jackson 2→3, Security 6→7)
   - Use OpenRewrite recipes when available

5. **Run Full Test Suite**
   - Catch regressions early
   - Validate API compatibility
   - Check deprecation warnings

6. **Update Incrementally**
   - For large projects (100+ dependencies), update in batches
   - Group related dependencies (e.g., all Jackson artifacts together)
   - Validate between batches

7. **Monitor Transitive Dependencies**
   - Run dependency tree after updates
   - Check for version conflicts
   - Use dependency management to align versions

8. **Keep Build Tools Updated**
   - Ensure Maven 3.9+ or Gradle 8.5+
   - Update wrapper before updating dependencies
   - Check plugin compatibility

## Compatibility Validation (v2.0.0)

This skill includes comprehensive compatibility validation to ensure updated dependencies work correctly with your codebase.

### Validation Workflow

After applying dependency updates via maven-versions-plugin or gradle-versions-plugin:

1. **Compilation Validation** (always enabled)
   - Run clean compile: `mvn clean compile -DskipTests` or `./gradlew compileJava -x test`
   - Parse build output for errors
   - Identify problematic dependencies from error messages

2. **Test Validation** (enabled by default, opt-out with `--skip-tests`)
   - Run full test suite: `mvn test` or `./gradlew test`
   - Record pass/fail counts
   - Identify failing tests and potential root causes

3. **Incremental Rollback** (on validation failure)
   - Parse error logs to identify problematic dependency
   - Revert specific dependency to previous version
   - Keep all other updates
   - Retry compilation/tests
   - Repeat until success or max retries reached

### Validation Configuration

**Command-Line Flags**:

```bash
# Default: validate compilation + tests
dependency-updater

# Skip test validation (faster, less thorough)
dependency-updater --skip-tests

# Custom max retry attempts
dependency-updater --max-retries=5
```

**Configuration File** (`.migration-config.yaml`):

```yaml
migration:
  dependencyUpdates:
    validation:
      compilation: true  # Always enabled
      tests: true  # Set false to skip tests by default
      incrementalRollback: true  # Enable automatic rollback
      maxRetries: 3  # Max rollback attempts per dependency
      failFast: false  # Continue after non-critical failures
```

### Incremental Rollback Logic

**Step-by-Step Process**:

1. **Apply all dependency updates**

   ```bash
   mvn versions:use-latest-releases
   ```

2. **Run compilation**

   ```bash
   mvn clean compile -DskipTests
   ```

3. **If compilation fails, parse error log**

   Example error:

   ```
   [ERROR] /path/to/MyService.java:[42,10] package tools.jackson.databind does not exist
   ```

   **Parsed result**: `jackson-databind` is problematic

4. **Check for related migration skill**

   ```yaml
   problematicDependencies:
     - artifact: jackson-databind
       groupId: tools.jackson
       suggestedSkill: jackson-migrator
       reason: "GroupId changed from com.fasterxml..jackson to tools.jackson"
   ```

5. **If migration skill exists, suggest it**

   ```text
   ⚠️  jackson-databind update failed validation

   Root Cause: Package imports need migration (groupId changed)
   Suggested Action: Run jackson-migrator skill first

   Command:
     /migrate --skill jackson-migrator

   Then retry dependency updates:
     /migrate --skill dependency-updater
   ```

6. **If no migration skill exists, roll back specific dependency**

   ```bash
   # Revert jackson-databind to previous version
   mvn versions:revert-dependency \
     -DgroupId=tools.jackson \
     -DartifactId=jackson-databind \
     -DoldVersion=2.17.0
   ```

7. **Retry compilation**

   ```bash
   mvn clean compile -DskipTests
   ```

8. **Continue until compilation succeeds or max retries reached**

### Compatibility Report

After updates complete, generate detailed compatibility report:

```text
=== Dependency Update Compatibility Report ===

Project: /Users/user/my-spring-app
Build Tool: Maven
Filter Strategy: stable-only
Validation: Compilation + Tests

✅ Successfully Updated (15):
  ✅ com.google.guava:guava
     2.1.0 → 33.0.0 (validated: compilation ✓, tests ✓)
     Major version change, 0 test failures

  ✅ commons-io:commons-io
     2.20.0 → 2.21.0 (validated: compilation ✓, tests ✓)
     Patch version change, 0 test failures

  ... (13 more)

⚠️  Partially Updated (2):
  ⚠️  tools.jackson:jackson-databind
     2.17.0 → 3.0.2 (rolled back)
     Validation: compilation ✗
     Error: package tools.jackson.databind does not exist
     Root Cause: Package imports need migration
     Suggested Action: Run jackson-migrator skill first

  ⚠️  org.springframework.security:spring-security-core
     6.5.0 → 7.0.2 (rolled back)
     Validation: compilation ✗
     Error: SecurityFilterChain cannot be resolved
     Root Cause: Security configuration API changed
     Suggested Action: Run security-config-migrator skill first

ℹ️  Skipped (8):
  ℹ️  org.springframework.boot:spring-boot-starter-web
     (managed by spring-boot-starter-parent:4.0.0)

  ℹ️  org.springframework.security:spring-security-core
     (managed by Spring Boot BOM)

  ... (6 more)

📊 Summary:
  Total Updates Attempted: 25
  Successful: 15 (60%)
  Rolled Back: 2 (8%)
  BOM-Managed (Skipped): 8 (32%)

  Validation Results:
    Compilation: ✅ PASSED (after rollback)
    Tests: ✅ PASSED (150 passed, 0 failed, 5 skipped)

  Time Elapsed: 2m 35s

🔧 Next Steps:
  1. Run jackson-migrator skill
  2. Run security-config-migrator skill
  3. Retry dependency-updater
  4. Expected final success rate: 100% (all 17 updates)
```

### Error Classification

Errors are classified to suggest appropriate actions:

| Error Pattern | Classification | Suggested Action |
|---------------|----------------|------------------|
| `package [groupId] does not exist` | Import/GroupId Change | Run related migrator skill |
| `cannot find symbol: class [ClassName]` | API Removal/Rename | Check migration guide |
| `method [method] not found` | API Change | Check changelogs |
| `incompatible types` | Type System Change | Major version migration required |
| `NoClassDefFoundError` | Transitive Dependency | Check dependency tree |

### Integration with Migration Skills

When rollback occurs due to API/import changes, the skill automatically suggests related migration skills:

```yaml
migrationSkillMapping:
  - pattern: "tools.jackson|com.fasterxml.jackson"
    suggestedSkill: jackson-migrator
    reason: "Jackson 2 → 3 migration required"

  - pattern: "org.springframework.security"
    suggestedSkill: security-config-migrator
    reason: "Spring Security 6 → 7 configuration changes"

  - pattern: "org.springframework.ai"
    suggestedSkill: spring-ai-migrator
    reason: "Spring AI 1.x → 2.x API changes"

  - pattern: "com.vaadin"
    suggestedSkill: vaadin-migrator
    reason: "Vaadin 24 → 25 theme/security changes"
```

### Validation Performance

**Typical Timeline**:

- Dependency updates application: 30-60 seconds
- Compilation validation: 30-45 seconds
- Test validation: 60-120 seconds (if enabled)
- Rollback + retry (per dependency): 20-30 seconds

**Total**: 2-4 minutes for typical project with 20-30 dependencies

**Optimization Tips**:

- Use `--skip-tests` for faster validation (compilation only)
- Run tests in parallel if supported by build tool
- Use incremental compilation if available

### Advanced Configuration

**Selective Validation**:

```yaml
validation:
  compilation: true
  tests: true

  # Custom validation commands
  customValidation:
    - name: "integration-tests"
      command: "mvn verify -Pintegration"
      enabled: false

    - name: "security-scan"
      command: "mvn dependency-check:check"
      enabled: false

  # Dependency-specific overrides
  overrides:
    - dependency: "jackson-databind"
      skipValidation: false  # Always validate Jackson
      maxRetries: 5  # More attempts for critical deps

    - dependency: "spring-security-core"
      skipValidation: false
      suggestedSkill: "security-config-migrator"
```

**Failure Thresholds**:

```yaml
validation:
  thresholds:
    maxRollbacks: 5  # Max total rollbacks before failing
    maxRetriesPerDependency: 3  # Max attempts per dependency
    allowPartialSuccess: true  # Allow some updates to succeed
    minSuccessRate: 50  # Minimum 50% success rate required
```

### Testing and Validation State

Validation results are recorded in `.migration-state.yaml`:

```yaml
appliedTransformations:
  - skill: dependency-updater
    version: 2.0.0
    transformations:
      - dependency-updates
      - plugin-updates
    completedAt: '2026-01-05T15:30:00Z'
    commitSha: 'abc123def'

    validation:
      compilation:
        success: true
        duration: '45s'
        errors: 0
        rollbacksRequired: 2

      tests:
        success: true
        passed: 150
        failed: 0
        skipped: 5
        duration: '120s'

      rollbacks:
        - dependency: "tools.jackson:jackson-databind"
          fromVersion: "3.0.2"
          toVersion: "2.17.0"
          reason: "Compilation failed - package imports not migrated"
          suggestedSkill: "jackson-migrator"

        - dependency: "org.springframework.security:spring-security-core"
          fromVersion: "7.0.2"
          toVersion: "6.5.0"
          reason: "Compilation failed - SecurityFilterChain API change"
          suggestedSkill: "security-config-migrator"

      summary:
        totalUpdates: 25
        successful: 15
        rolledBack: 2
        skipped: 8
        successRate: "60%"
        finalSuccessRate: "100% (after running suggested skills)"
```

---

## Edge Cases

### Multi-Module Maven Projects

```bash
# Update parent POM only
mvn -N versions:use-latest-releases

# Update all modules recursively
mvn versions:use-latest-releases

# Update specific module
cd submodule-a
mvn versions:use-latest-releases
```

### Gradle Multi-Project Builds

```kotlin
// Apply to root project
plugins {
    id("com.github.ben-manes.versions") version "0.51.0" apply false
}

// Apply to all subprojects
subprojects {
    apply(plugin = "com.github.ben-manes.versions")
}
```

### Version Ranges

Some projects use version ranges:

```xml
<version>[2.0,3.0)</version>
```

**Action**:

- Detect and log warning
- Recommend replacing with explicit version
- Don't modify automatically (manual intervention required)

### Parent POM Inheritance

If project inherits from corporate parent POM:

- Don't update parent version automatically
- Only update dependencies not managed by parent
- Log warning if parent version is outdated

### Gradle Wrapper Compatibility

If updating Gradle plugin versions:

- May require Gradle wrapper upgrade
- Check minimum Gradle version requirements
- Integrate with `build-tool-upgrader` skill if needed

## OpenAPI Generator Special Handling (v2.0.0)

The dependency-updater delegates OpenAPI Generator plugin updates to the specialized `openapi-generator-plugin-updater` skill for intelligent compatibility management.

### Why Special Handling?

OpenAPI Generator plugin versions have critical dependencies on Spring Framework versions:

- **Framework 7.x** requires plugin **≥7.18.0** (API changes: `.builderFor()` instead of `.builder()`)
- **Framework 6.x** requires plugin **≥7.0.0** (standard API)
- **Template compatibility** depends on plugin version

Generic version updates could select an incompatible plugin version, breaking code generation.

### Delegation Logic

When dependency-updater encounters OpenAPI Generator plugin:

```bash
# Detect OpenAPI Generator plugin
if detect_plugin "openapi-generator-maven-plugin|org.openapi.generator"; then
  echo "OpenAPI Generator plugin detected - delegating to specialized handler"

  # Delegate to openapi-generator-plugin-updater
  invoke_skill "openapi-generator-plugin-updater"

  # Skip generic plugin update for OpenAPI Generator
  skip_plugin "openapi-generator-maven-plugin"
  skip_plugin "org.openapi.generator"
fi
```

### Delegation Workflow

1. **dependency-updater runs** in Phase 1.5
2. **Detects OpenAPI Generator** plugin in build file
3. **Delegates to openapi-generator-plugin-updater**:
   - Detects Spring Framework version
   - Determines compatible plugin version
   - Updates plugin to correct version
   - Triggers template updates if needed (Framework 7)
   - Validates generated code compilation
4. **Continues with other dependencies** - All non-OpenAPI-Generator updates proceed normally

### Integration Example

```text
=== Dependency Updates (Phase 1.5) ===

Processing plugins...
  ✓ maven-compiler-plugin: 3.11.0 → 3.13.0
  ✓ maven-surefire-plugin: 3.0.0 → 3.2.5

  ⚙️  openapi-generator-maven-plugin: 7.17.0
      → Delegating to openapi-generator-plugin-updater

      Spring Framework: 7.0.0 detected
      Required plugin: ≥7.18.0
      Updating: 7.17.0 → 7.18.0

      Template check: Framework 7 templates needed
      Triggering: spring-framework-7-migrator --inject-templates

  ✓ openapi-generator-maven-plugin: 7.17.0 → 7.18.0

Continuing with dependencies...
  ✓ guava: 32.1.0 → 33.0.0
  ...
```

### Configuration

OpenAPI Generator delegation is enabled by default. To customize:

```yaml
# .migration-config.yaml
migration:
  dependencyUpdates:
    delegation:
      openapiGenerator:
        enabled: true  # Enable specialized handling
        skillName: "openapi-generator-plugin-updater"
        skipGenericUpdate: true  # Don't apply generic plugin update logic
```

### Skip Delegation (Not Recommended)

To disable delegation and use generic updates (may cause incompatibility):

```yaml
migration:
  dependencyUpdates:
    delegation:
      openapiGenerator:
        enabled: false  # Use generic plugin update (NOT RECOMMENDED)
```

**Warning**: Disabling delegation may result in incompatible plugin versions that break code generation or produce incorrect API patterns.

### State Tracking

When delegated, both skills record their updates:

```yaml
appliedTransformations:
  # dependency-updater records delegation
  - skill: dependency-updater
    version: '2.0.0'
    delegations:
      - plugin: "openapi-generator-maven-plugin"
        delegatedTo: "openapi-generator-plugin-updater"
        reason: "Requires Framework compatibility validation"

  # openapi-generator-plugin-updater records its work
  - skill: openapi-generator-plugin-updater
    version: '1.0.0'
    pluginUpdate:
      from: "7.17.0"
      to: "7.18.0"
      frameworkVersion: "7.0.0"
```

---

## Related Skills

| Skill                             | Purpose                                    | Integration                               |
| --------------------------------- | ------------------------------------------ | ----------------------------------------- |
| **build-tool-detector**           | Detect Maven vs Gradle                     | Used to determine build commands          |
| **version-detector**              | Identify current framework versions        | Used to track version changes             |
| **build-runner**                  | Validate builds and tests                  | Used for post-update validation           |
| **migration-state**               | Track applied transformations              | Used for idempotency checking             |
| **build-file-updater**            | Update build files for specific migrations | Complementary for targeted updates        |
| **dependency-scanner**            | Identify migration dependencies            | Complementary for migration planning      |
| **openrewrite-executor**          | Run OpenRewrite recipes                    | Alternative for complex migrations        |
| **openapi-generator-plugin-updater** | OpenAPI Generator plugin compatibility  | Delegated for OpenAPI Generator updates   |
