# Migration Tier Testing Guide

Comprehensive testing guide for the enhanced Spring Boot migration system with tier-based execution.

## Overview

The migration system now supports 6 migration tiers based on semantic version comparison:

1. **FULL_MIGRATION** - Major upgrade (2.x/3.x → 4.x)
2. **MINOR_UPGRADE** - Minor version bump (4.0.x → 4.1.x)
3. **PATCH_UPGRADE** - Patch version bump (4.0.0 → 4.0.1)
4. **COMPREHENSIVE_REFRESH** - Same version refresh (4.0.1 → 4.0.1)
5. **SKIP** - Already on target (4.0.1 → 4.0.1)
6. **SKIP_NEWER** - On newer than target (4.0.2 → 4.0.1)

## Test Scenarios

### Scenario 1: FULL_MIGRATION (3.5.7 → 4.0.1)

**Purpose**: Test complete migration from Spring Boot 3.x to 4.x

**Test Repo Setup**:

```json
{
  "name": "test-full-migration",
  "springBoot": "3.5.7",
  "springCloud": "2024.0.0",
  "java": "17",
  "features": ["jackson", "security", "vaadin", "spring-ai"]
}
```

**Expected Behavior**:

- Migration tier: `FULL_MIGRATION`
- All phases executed: wrapper, build-files, imports, properties, configs, deps, docs, ci, deployment, validation
- Version changes:
  - Spring Boot: 3.5.7 → 4.0.1
  - Jackson: 2.x → 3.x (groupId change)
  - Spring Security: 6.x → 7.x
  - Java: 17 → 21

**Validation**:

```bash
# Check migration tier in state file
cat .migration-state.yaml | grep migrationTier
# Expected: migrationTier: 'FULL_MIGRATION'

# Verify all transformations applied
cat .migration-state.yaml | grep -A 20 appliedTransformations
# Expected: build-tool-upgrader, build-file-updater, jackson-migrator,
#           security-config-migrator, dependency-updater, documentation-migrator,
#           github-actions-updater, deployment-java-updater

# Test build
./mvnw clean verify || ./gradlew clean build
```

---

### Scenario 2: MINOR_UPGRADE (4.0.1 → 4.1.0)

**Purpose**: Test minor version upgrade within Spring Boot 4.x

**Test Repo Setup**:

```json
{
  "name": "test-minor-upgrade",
  "springBoot": "4.0.1",
  "springCloud": "2025.1.0",
  "java": "21"
}
```

**Config**:

```json
{
  "config": {
    "targetSpringBootVersion": "4.1.0"
  }
}
```

**Expected Behavior**:

- Migration tier: `MINOR_UPGRADE`
- Phases executed: build-files, deps, docs, ci, deployment, validation
- Phases skipped: wrapper, imports, properties, configs
- Version changes:
  - Spring Boot: 4.0.1 → 4.1.0

**Validation**:

```bash
# Check migration tier
cat .migration-state.yaml | grep migrationTier
# Expected: migrationTier: 'MINOR_UPGRADE'

# Verify selective transformations
cat .migration-state.yaml | grep -A 20 appliedTransformations
# Expected: build-file-updater, dependency-updater, documentation-migrator,
#           github-actions-updater, deployment-java-updater
# NOT expected: jackson-migrator, security-config-migrator

# Verify version in build file
grep "4.1.0" pom.xml || grep "4.1.0" build.gradle*
```

---

### Scenario 3: PATCH_UPGRADE (4.0.0 → 4.0.1) **[PRIMARY USE CASE]**

**Purpose**: Test patch version upgrade - the main scenario this enhancement addresses

**Test Repo Setup**:

```json
{
  "name": "test-patch-upgrade",
  "springBoot": "4.0.0",
  "springCloud": "2025.1.0",
  "java": "21",
  "dependencies": {
    "guava": "32.1.0",
    "spring-ai": "1.0.0"
  }
}
```

**Config**:

```json
{
  "config": {
    "targetSpringBootVersion": "4.0.1",
    "dependencyMode": "include-milestones"
  }
}
```

**Expected Behavior**:

- Migration tier: `PATCH_UPGRADE`
- Phases executed: build-files, deps, docs, ci, deployment, validation
- Phases skipped: wrapper, imports, properties, configs
- Version changes:
  - Spring Boot: 4.0.0 → 4.0.1
  - Dependencies: guava 32.1.0 → 33.2.0, spring-ai 1.0.0 → 2.0.0-M1
- Spring Milestones repository auto-added (for Spring AI 2.0.0-M1)

**Validation**:

```bash
# Check migration tier
cat .migration-state.yaml | grep migrationTier
# Expected: migrationTier: 'PATCH_UPGRADE'

# Verify Spring Boot version
grep "4.0.1" pom.xml || grep "4.0.1" build.gradle*

# Verify dependency updates
grep "33.2.0" pom.xml build.gradle* # guava updated
grep "2.0.0-M1" pom.xml build.gradle* # spring-ai updated

# Verify Spring Milestones repository added
grep "spring-milestones" pom.xml build.gradle*
grep "https://repo.spring.io/milestone" pom.xml build.gradle*

# Verify documentation updated
grep "4.0.1" README.md
grep "Java 21" README.md

# Verify GitHub Actions updated
grep "21" .github/workflows/*.yml

# Test build with milestones
./mvnw clean verify || ./gradlew clean build
```

**This is the key test case** - previously this repo would be skipped with "Already on Spring Boot 4.x", now it gets upgraded.

---

### Scenario 4: COMPREHENSIVE_REFRESH (4.0.1 → 4.0.1)

**Purpose**: Test refreshing dependencies/docs/CI without version change

**Test Repo Setup**:

```json
{
  "name": "test-comprehensive-refresh",
  "springBoot": "4.0.1",
  "springCloud": "2025.1.0",
  "java": "21",
  "dependencies": {
    "guava": "31.0.0" // Outdated
  },
  "readme": "Prerequisites: Java 17" // Outdated docs
}
```

**Config**:

```json
{
  "config": {
    "targetSpringBootVersion": "4.0.1",
    "dependencyMode": "include-milestones"
  }
}
```

**Expected Behavior**:

- Migration tier: `COMPREHENSIVE_REFRESH`
- Phases executed: deps, docs, ci, deployment, validation
- Phases skipped: wrapper, build-files, imports, properties, configs
- Spring Boot version: Unchanged (4.0.1)
- Dependencies: Updated to latest (guava 31.0.0 → 33.2.0)
- Documentation: Updated (Java 17 → Java 21)

**Validation**:

```bash
# Check migration tier
cat .migration-state.yaml | grep migrationTier
# Expected: migrationTier: 'COMPREHENSIVE_REFRESH'

# Verify Spring Boot version unchanged
cat .migration-state.yaml | grep -A 5 currentVersion
cat .migration-state.yaml | grep -A 5 targetVersions
# Both should show: spring-boot: '4.0.1'

# Verify dependencies updated
grep "33.2.0" pom.xml build.gradle* # guava updated

# Verify docs updated
grep "Java 21" README.md # Not Java 17

# Verify NO version bump in build files
# Spring Boot should still be 4.0.1 (not changed)
```

---

### Scenario 5: SKIP (4.0.1 → 4.0.1, exact match)

**Purpose**: Test skipping when already on exact target version

**Test Repo Setup**:

```json
{
  "name": "test-skip",
  "springBoot": "4.0.1",
  "java": "21",
  "dependencies": {
    "guava": "33.2.0" // Already latest
  }
}
```

**Expected Behavior**:

- Migration tier: `SKIP`
- No phases executed
- No PR created
- Logged as "Already on target version"

**Validation**:

```bash
# Check discovery output
cat discovery-output.json | jq '.migrationTier'
# Expected: "SKIP"

# Verify no migration-state file created
[ ! -f .migration-state.yaml ] && echo "Correctly skipped"

# Check orchestrator logs
grep "Already on target version 4.0.1" migration.log
```

---

### Scenario 6: SKIP_NEWER (4.0.2 → 4.0.1)

**Purpose**: Test warning when repo is on newer version than target

**Test Repo Setup**:

```json
{
  "name": "test-skip-newer",
  "springBoot": "4.0.2",
  "java": "21"
}
```

**Config**:

```json
{
  "config": {
    "targetSpringBootVersion": "4.0.1"
  }
}
```

**Expected Behavior**:

- Migration tier: `SKIP_NEWER`
- No phases executed
- Warning logged: "On newer version 4.0.2 > target 4.0.1"
- No PR created

**Validation**:

```bash
# Check discovery output
cat discovery-output.json | jq '.migrationTier'
# Expected: "SKIP_NEWER"

# Check for warning in logs
grep "On newer version 4.0.2" migration.log
grep "target 4.0.1" migration.log
```

---

## Edge Case Testing

### Edge Case 1: Snapshot Versions (4.0.0-SNAPSHOT → 4.0.1)

**Test Repo Setup**:

```xml
<version>4.0.0-SNAPSHOT</version>
```

**Expected Behavior**:

- Base version extracted: 4.0.0
- Migration tier: `PATCH_UPGRADE`
- Warning: "Migrating from SNAPSHOT to stable release"

**Validation**:

```bash
cat .migration-state.yaml | grep currentVersion -A 3
# Should show: spring-boot: '4.0.0-SNAPSHOT'

cat .migration-state.yaml | grep migrationTier
# Expected: migrationTier: 'PATCH_UPGRADE'

grep "SNAPSHOT" migration.log
# Should contain warning about snapshot
```

---

### Edge Case 2: Milestone Versions (4.0.0-M1 → 4.0.1)

**Test Repo Setup**:

```xml
<version>4.0.0-M1</version>
```

**Expected Behavior**:

- Base version extracted: 4.0.0
- Migration tier: `PATCH_UPGRADE`

**Validation**:

```bash
cat discovery-output.json | jq '.versionComparison.patchUpgrade'
# Expected: true
```

---

### Edge Case 3: Multi-Module with Version Inconsistencies

**Test Repo Setup**:

```text
parent/pom.xml: Spring Boot 4.0.0
module-a/pom.xml: Spring Boot 4.0.1
module-b/pom.xml: Spring Boot 3.5.7
```

**Expected Behavior**:

- Migration tier based on parent version: `PATCH_UPGRADE`
- Warning: "Version inconsistencies detected across modules"
- Recommendation: "Standardize all modules to 4.0.1"

**Validation**:

```bash
# Check for inconsistency warning
grep "inconsistencies" migration.log

# Verify all modules updated to 4.0.1
grep -r "4.0.1" */pom.xml
```

---

### Edge Case 4: Spring AI 2.0 with include-milestones Mode

**Test Repo Setup**:

```json
{
  "springBoot": "4.0.0",
  "springAi": "1.0.0",
  "dependencyMode": "include-milestones"
}
```

**Expected Behavior**:

- Spring AI updated: 1.0.0 → 2.0.0-M1
- Spring Milestones repository auto-added
- Build succeeds with milestone dependencies

**Validation**:

```bash
# Verify Spring AI version
grep "2.0.0-M1" pom.xml build.gradle*

# Verify milestones repo added
grep "spring-milestones" pom.xml
grep "https://repo.spring.io/milestone" pom.xml

# Test dependency resolution
./mvnw dependency:tree | grep "spring-ai.*2.0.0-M1"
```

---

## Integration Testing

### Test: Parallel Migration of Mixed Tiers

**repos.json**:

```json
{
  "config": {
    "targetSpringBootVersion": "4.0.1",
    "dependencyMode": "include-milestones"
  },
  "repos": [
    { "url": "https://github.com/test/repo-full-migration" }, // 3.5.7
    { "url": "https://github.com/test/repo-patch-upgrade" }, // 4.0.0
    { "url": "https://github.com/test/repo-comprehensive" }, // 4.0.1
    { "url": "https://github.com/test/repo-skip" }, // 4.0.1
    { "url": "https://github.com/test/repo-skip-newer" } // 4.0.2
  ]
}
```

**Expected Summary**:

```json
{
  "summary": {
    "total": 5,
    "migrated": 3,
    "skipped": 2,
    "byMigrationTier": {
      "FULL_MIGRATION": 1,
      "PATCH_UPGRADE": 1,
      "COMPREHENSIVE_REFRESH": 1,
      "SKIP": 1,
      "SKIP_NEWER": 1
    }
  }
}
```

**Validation**:

```bash
# Run migration
/spring-m11n:migrate-github repos.json --parallel

# Check final report
cat /tmp/migration-workspace/migration-summary.json | jq '.summary.byMigrationTier'
# Should show count for each tier

# Verify PRs created only for migrated repos (3)
cat /tmp/migration-workspace/migration-summary.json | jq '.summary.prsCreated'
# Expected: 3
```

---

## Regression Testing

Ensure existing migrations still work:

### Test: Existing FULL_MIGRATION still works

**Before Enhancement**:

```text
3.5.7 → 4.0.0 = FULL_MIGRATION
```

**After Enhancement**:

```text
3.5.7 → 4.0.1 = FULL_MIGRATION (still works, just targets 4.0.1)
```

**Validation**: All phases executed, no behavioral changes

---

### Test: Repos already on 4.0.1 are handled correctly

**Before Enhancement**:

```text
4.0.0 → 4.0.0 = SKIPPED (major version check)
4.0.1 → 4.0.0 = SKIPPED (major version check)
```

**After Enhancement**:

```text
4.0.0 → 4.0.1 = PATCH_UPGRADE (NEW BEHAVIOR)
4.0.1 → 4.0.1 = SKIP (exact match)
```

**This is the critical regression test** - ensure the new behavior is what we want.

---

## Performance Testing

Test parallel execution efficiency:

```bash
# Measure time for 12 repos with mixed tiers
time /spring-m11n:migrate-github repos-12.json --parallel

# Expected: ~30-60 seconds for clone + discovery + migration + PR creation
# (depends on network and repo sizes)
```

---

## Success Criteria

All tests must pass:

✅ FULL_MIGRATION executes all phases
✅ PATCH_UPGRADE executes selective phases (no imports/configs)
✅ MINOR_UPGRADE executes selective phases
✅ COMPREHENSIVE_REFRESH updates deps/docs/CI only
✅ SKIP properly skips exact matches
✅ SKIP_NEWER warns and skips
✅ Edge cases handled (snapshot, milestone, multi-module, Spring AI 2.0)
✅ Parallel migration of mixed tiers works
✅ Existing FULL_MIGRATION behavior preserved
✅ Previously skipped repos (4.0.0) now upgraded

---

## Test Execution

```bash
# 1. Create test repositories for each scenario
# 2. Run migrations with config targeting 4.0.1
# 3. Validate state files, PR creation, and build success
# 4. Check final reports for correct tier classification
# 5. Verify no regressions in existing functionality
```

---

## Automated Test Suite

Future enhancement: Create automated tests using this guide.

```bash
#!/bin/bash
# test-migration-tiers.sh

run_test_scenario() {
  local scenario=$1
  echo "Testing: $scenario"
  # Setup test repo
  # Run migration
  # Validate results
  # Cleanup
}

run_test_scenario "FULL_MIGRATION"
run_test_scenario "PATCH_UPGRADE"
run_test_scenario "SKIP"
# ... etc
```

---

**Version**: 1.0.0 (2026-01-04)
**Author**: Spring Modernization Marketplace Team
