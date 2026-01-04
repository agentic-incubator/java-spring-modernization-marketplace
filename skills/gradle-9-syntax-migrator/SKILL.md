# Gradle 9.x Syntax Migrator Skill

**Skill ID:** `gradle-9-syntax-migrator`
**Version:** 1.0.0
**Category:** Transformation & Migration
**Priority:** HIGH (required for Gradle 9.x compatibility)

---

## Purpose

Migrate Gradle build files to Gradle 9.x syntax. Gradle 9.x introduces breaking changes requiring sourceCompatibility/targetCompatibility to be
defined inside `java {}` blocks and explicit JUnit5 platform configuration.

---

## Problem Statement

Gradle 9.x introduces the following syntax requirements:

1. **sourceCompatibility Deprecated at Project Level** - Must move to `java {}` block
2. **JUnit5 Platform Required** - Must add `test { useJUnitPlatform() }`
3. **Wrapper Version Precision** - Must use complete version numbers (9.1.0 not 9.1)

**Impact:** Build failures immediately after Gradle 9.x wrapper upgrade.

---

## Migration Patterns

### 1. sourceCompatibility Migration

**Before (Gradle 6.x-8.x):**

```gradle
group = 'com.example'
version = '1.0.0'
sourceCompatibility = 1.8
targetCompatibility = 1.8
```

**After (Gradle 9.x):**

```gradle
group = 'com.example'
version = '1.0.0'

java {
    sourceCompatibility = JavaVersion.VERSION_21
    targetCompatibility = JavaVersion.VERSION_21
}
```

**Detection:**

```bash
grep -E "^sourceCompatibility\s*=" build.gradle build.gradle.kts
grep -E "^targetCompatibility\s*=" build.gradle build.gradle.kts
```

---

### 2. JUnit5 Platform Configuration

**Before:**

```gradle
dependencies {
    testImplementation 'org.junit.jupiter:junit-jupiter'
}
```

**After:**

```gradle
dependencies {
    testImplementation 'org.junit.jupiter:junit-jupiter'
}

test {
    useJUnitPlatform()  // REQUIRED in Gradle 9.x
}
```

**Detection:**

```bash
grep -r "junit-jupiter" build.gradle build.gradle.kts
grep -r "useJUnitPlatform" build.gradle build.gradle.kts
```

---

### 3. Gradle Wrapper Version Validation

**Wrong:**

```properties
distributionUrl=https\://services.gradle.org/distributions/gradle-9.1-bin.zip
```

**Correct:**

```properties
distributionUrl=https\://services.gradle.org/distributions/gradle-9.1.0-bin.zip
```

**Validation:**

```regex
gradle-\d+\.\d+-bin\.zip         # INVALID (missing patch)
gradle-\d+\.\d+\.\d+-bin\.zip    # VALID (complete version)
```

---

## Transformation Algorithm

```text
1. READ build.gradle or build.gradle.kts

2. DETECT project-level sourceCompatibility
   - IF found outside java {} block:
     - EXTRACT current Java version
     - CREATE java {} block
     - MOVE sourceCompatibility/targetCompatibility inside
     - CONVERT to JavaVersion.VERSION_XX format

3. DETECT JUnit5 usage
   - SCAN for junit-jupiter dependency
   - CHECK for test { useJUnitPlatform() }
   - IF JUnit5 present AND no useJUnitPlatform():
     - ADD test { useJUnitPlatform() } block

4. VALIDATE wrapper version
   - READ gradle/wrapper/gradle-wrapper.properties
   - CHECK version format
   - IF incomplete version (e.g., 9.1):
     - FIX to complete version (e.g., 9.1.0)

5. WRITE updated files
```

---

## Detection Patterns

| Pattern                           | Regex                                   | Action                |
| --------------------------------- | --------------------------------------- | --------------------- |
| Project-level sourceCompatibility | `^sourceCompatibility\s*=`              | Move to java {} block |
| Project-level targetCompatibility | `^targetCompatibility\s*=`              | Move to java {} block |
| JUnit5 without platform config    | `junit-jupiter` + no `useJUnitPlatform` | Add test {} block     |
| Invalid wrapper version           | `gradle-\d+\.\d+-bin`                   | Fix to X.Y.Z format   |

---

## Output Format

```yaml
gradle9Migration:
  detected: true
  buildFilesAnalyzed: 1
  buildFilesModified: 1
  wrapperUpdated: true

  transformations:
    - type: 'JAVA_BLOCK_MIGRATION'
      file: 'build.gradle'
      before:
        - 'sourceCompatibility = 1.8'
        - 'targetCompatibility = 1.8'
      after:
        - 'java {'
        - '    sourceCompatibility = JavaVersion.VERSION_21'
        - '    targetCompatibility = JavaVersion.VERSION_21'
        - '}'

    - type: 'JUNIT_PLATFORM_CONFIG'
      file: 'build.gradle'
      added:
        - 'test {'
        - '    useJUnitPlatform()'
        - '}'

    - type: 'WRAPPER_VERSION_FIX'
      file: 'gradle/wrapper/gradle-wrapper.properties'
      before: 'gradle-9.1-bin.zip'
      after: 'gradle-9.1.0-bin.zip'

  summary:
    automationRate: '100%'
    estimatedEffort: '5 minutes'
    status: 'FULLY_AUTOMATED'
```

---

## Known Gradle Versions (Validation)

Valid Gradle 9.x versions:

- 9.0, 9.0.1, 9.0.2
- 9.1, 9.1.0, 9.1.1
- 9.2, 9.2.0

**Recommendation:** Use latest stable (e.g., 9.1.1)

---

## Integration Points

**Used by:** migration-agent (Phase 10: Build Tool Syntax Migration)
**Uses:** build-file-updater
**Triggers:** Auto-triggered when Gradle 9.x detected

---

## References

- **Migration Learnings:** docs/planning/migration-learnings.md (Section 4)
- **Gradle 9.0 Release Notes:** <https://docs.gradle.org/9.0/release-notes.html>

---

## Version History

- **1.0.0** (2026-01-04): Initial implementation for Gradle 9.x syntax migration
