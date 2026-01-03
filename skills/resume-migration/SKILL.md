---
name: resume-migration
description: Resume an interrupted or failed migration from the last checkpoint using .migration-state.yaml. Use when continuing a migration after marketplace upgrades, partial failures, or user intervention.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Resume Migration Skill

Resume a Spring Boot migration from a saved state, applying only new or updated transformations.

## Overview

This skill enables idempotent migration operations by:

- Loading state from `.migration-state.yaml`
- Detecting marketplace version upgrades
- Identifying new/updated transformations
- Skipping already-applied work
- Executing only pending transformations

## Prerequisites

- `.migration-state.yaml` file must exist in the repository
- Git repository must be initialized
- Migration branch must exist (locally or remotely)

## State File Format

The skill expects a `.migration-state.yaml` file (YAML format, not JSON) in the repository root:

```yaml
migrationId: 'sb4-20260103-abc123'
branch: 'feature/spring-boot-4-migration'
startedAt: '2026-01-03T10:30:00Z'
lastUpdatedAt: '2026-01-03T11:45:00Z'
marketplaceVersion: '1.2.0'

targetVersions:
  spring-boot: '4.0.0'
  jackson: '3.0.0'
  spring-security: '7.0.0'

appliedTransformations:
  - skill: jackson-migrator
    version: '1.0.0'
    transformations:
      - jackson-imports
      - jackson-groupid
    completedAt: '2026-01-03T10:35:00Z'
    commitSha: abc123

  - skill: spring-security-migrator
    version: '1.0.0'
    transformations:
      - security-config
      - authorizations
    completedAt: '2026-01-03T10:42:00Z'
    commitSha: def456

pendingTransformations:
  - spring-ai-migrator

validationStatus: 'FAILED'
validationDetails:
  compile:
    success: false
    errors: 3
  tests:
    skipped: true

lastError: '3 compilation errors in SecurityConfig.java'
```

## Resume Workflow

### 1. Load and Validate State

```bash
# Check if state file exists
if [ ! -f ".migration-state.yaml" ]; then
  echo "Error: No migration state file found (.migration-state.yaml)"
  echo "Run /spring-m11n:migrate first to start a new migration"
  exit 1
fi

# Read state file
BRANCH=$(yq eval '.branch' .migration-state.yaml)
MARKETPLACE_VERSION=$(yq eval '.marketplaceVersion' .migration-state.yaml)
MIGRATION_ID=$(yq eval '.migrationId' .migration-state.yaml)

echo "Found migration state:"
echo "  ID: $MIGRATION_ID"
echo "  Branch: $BRANCH"
echo "  Marketplace: $MARKETPLACE_VERSION"
```

### 2. Checkout Migration Branch

```bash
# Check if branch exists locally
if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
  echo "Checking out local branch: $BRANCH"
  git checkout "$BRANCH"

  # Pull latest from remote if exists
  if git ls-remote --heads origin "$BRANCH" | grep -q .; then
    echo "Pulling latest changes from remote..."
    git pull origin "$BRANCH" --rebase
  fi

# Check if branch exists on remote
elif git ls-remote --heads origin "$BRANCH" | grep -q .; then
  echo "Fetching remote branch: $BRANCH"
  git fetch origin "$BRANCH"
  git checkout -b "$BRANCH" "origin/$BRANCH"

else
  echo "Error: Migration branch '$BRANCH' not found (locally or remotely)"
  exit 1
fi
```

### 3. Compare Marketplace Versions

```bash
# Get current marketplace version (from marketplace metadata or VERSION file)
CURRENT_VERSION=$(cat VERSION 2>/dev/null || echo "1.0.0")

echo ""
echo "Marketplace Version Check:"
echo "  State file: $MARKETPLACE_VERSION"
echo "  Current:    $CURRENT_VERSION"

if [ "$MARKETPLACE_VERSION" != "$CURRENT_VERSION" ]; then
  echo "  Status:     UPGRADED"
  MARKETPLACE_UPGRADED=true
else
  echo "  Status:     UP TO DATE"
  MARKETPLACE_UPGRADED=false
fi
```

### 4. Build Transformation Inventory

Load skill metadata and compare with applied transformations:

```bash
# Get list of applied transformations from state
APPLIED_SKILLS=$(yq eval '.appliedTransformations[].skill' .migration-state.yaml)

# For each migration skill, load its metadata
for SKILL_DIR in skills/*-migrator; do
  SKILL_NAME=$(basename "$SKILL_DIR")

  if [ ! -f "$SKILL_DIR/metadata.yaml" ]; then
    continue
  fi

  # Get skill version from metadata
  SKILL_VERSION=$(yq eval '.skill.version' "$SKILL_DIR/metadata.yaml")

  # Get applied version from state (if exists)
  APPLIED_VERSION=$(yq eval ".appliedTransformations[] | select(.skill == \"$SKILL_NAME\") | .version" .migration-state.yaml)

  # Get transformations from metadata
  TRANSFORMATIONS=$(yq eval '.skill.transformations[].id' "$SKILL_DIR/metadata.yaml")

  # Compare versions
  if [ -z "$APPLIED_VERSION" ]; then
    echo ""
    echo "NEW SKILL: $SKILL_NAME v$SKILL_VERSION"
    echo "  Transformations: $(echo $TRANSFORMATIONS | tr '\n' ' ')"
  elif [ "$APPLIED_VERSION" != "$SKILL_VERSION" ]; then
    echo ""
    echo "UPDATED SKILL: $SKILL_NAME $APPLIED_VERSION → $SKILL_VERSION"

    # Find new transformations
    APPLIED_TRANSFORMS=$(yq eval ".appliedTransformations[] | select(.skill == \"$SKILL_NAME\") | .transformations[]" .migration-state.yaml)

    for TRANSFORM in $TRANSFORMATIONS; do
      if ! echo "$APPLIED_TRANSFORMS" | grep -q "^$TRANSFORM$"; then
        echo "  + New transformation: $TRANSFORM"
      fi
    done
  else
    echo ""
    echo "UP TO DATE: $SKILL_NAME v$SKILL_VERSION"
    echo "  Skipping (already applied)"
  fi
done
```

### 5. Determine Pending Work

Create a list of transformations to apply:

```text
Decision Matrix:

┌─────────────────────┬──────────────────┬──────────────────────────────┐
│ Applied Version     │ Current Version  │ Action                       │
├─────────────────────┼──────────────────┼──────────────────────────────┤
│ None (not applied)  │ Any              │ Apply all transformations    │
│ 1.0.0               │ 1.0.0            │ Skip (same version)          │
│ 1.0.0               │ 1.1.0            │ Apply new transformations    │
│ 1.1.0               │ 1.0.0            │ Skip (downgrade detected)    │
└─────────────────────┴──────────────────┴──────────────────────────────┘

For each transformation:
1. Check if transformation ID exists in appliedTransformations
2. If NOT applied → Add to pending
3. If applied but skill version upgraded → Check if transformation version is new
4. If transformation version <= applied version → Skip
```

### 6. Execute Pending Transformations

Apply each pending transformation using the appropriate skill:

```bash
# Example: Apply pending jackson-migrator transformations
echo ""
echo "Applying pending transformations..."

# For jackson-migrator with new exception-handling transformation
echo ""
echo "[1/3] jackson-migrator:exception-handling"

# Use the jackson-migrator skill
# This would typically call the skill with specific transformation ID

# Detect if transformation needed
if grep -r "JsonProcessingException" --include="*.java" .; then
  echo "  Detection: JsonProcessingException found"
  echo "  Applying: Replace with JacksonException"

  # Apply transformation
  # ... skill-specific logic here ...

  # Commit changes
  git add -A
  git commit -m "migration(jackson-migrator): update exception handling [v1.1.0]

Applied transformations:
- exception-handling

Marketplace: 1.3.0"

  COMMIT_SHA=$(git rev-parse HEAD)

  # Update state file
  yq eval -i ".appliedTransformations += [{
    \"skill\": \"jackson-migrator\",
    \"version\": \"1.1.0\",
    \"transformations\": [\"exception-handling\"],
    \"completedAt\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
    \"commitSha\": \"$COMMIT_SHA\"
  }]" .migration-state.yaml

  yq eval -i ".lastUpdatedAt = \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"" .migration-state.yaml

  # Commit state file
  git add .migration-state.yaml
  git commit -m "chore: update migration state"

  echo "  ✓ Applied successfully"
else
  echo "  Detection: Not applicable (no matches found)"
  echo "  ✓ Skipped"
fi
```

### 7. Run Validation

Validate that the migration is successful:

```bash
echo ""
echo "Running validation..."

# Determine build tool
if [ -f "pom.xml" ]; then
  BUILD_TOOL="maven"
  BUILD_CMD="mvn clean compile"
elif [ -f "build.gradle" ] || [ -f "build.gradle.kts" ]; then
  BUILD_TOOL="gradle"
  BUILD_CMD="./gradlew clean compileJava"
else
  echo "Error: No build file found"
  exit 1
fi

# Run compilation
echo "  Running: $BUILD_CMD"
$BUILD_CMD > /tmp/build-output.log 2>&1

if [ $? -eq 0 ]; then
  echo "  ✓ Compilation: SUCCESS"

  # Update state
  yq eval -i ".validationStatus = \"PASSED\"" .migration-state.yaml
  yq eval -i ".validationDetails.compile.success = true" .migration-state.yaml
  yq eval -i ".validationDetails.compile.errors = 0" .migration-state.yaml
else
  echo "  ✗ Compilation: FAILED"

  # Extract error count
  ERROR_COUNT=$(grep -c "error:" /tmp/build-output.log || echo "unknown")

  # Update state
  yq eval -i ".validationStatus = \"FAILED\"" .migration-state.yaml
  yq eval -i ".validationDetails.compile.success = false" .migration-state.yaml
  yq eval -i ".validationDetails.compile.errors = $ERROR_COUNT" .migration-state.yaml

  echo ""
  echo "Build errors:"
  grep "error:" /tmp/build-output.log | head -10
fi
```

### 8. Generate Resume Report

Provide a detailed summary of what was done:

```bash
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "                    MIGRATION RESUME REPORT"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Migration ID: $MIGRATION_ID"
echo "Branch: $BRANCH"
echo "Started: $(yq eval '.startedAt' .migration-state.yaml)"
echo "Last Updated: $(yq eval '.lastUpdatedAt' .migration-state.yaml)"
echo ""
echo "Marketplace: $MARKETPLACE_VERSION → $CURRENT_VERSION"
if [ "$MARKETPLACE_UPGRADED" = true ]; then
  echo "  Status: UPGRADED ✓"
else
  echo "  Status: UP TO DATE"
fi
echo ""
echo "ALREADY APPLIED (skipped):"
yq eval '.appliedTransformations[] | "  - " + .skill + " v" + .version + " (" + (.transformations | length | tostring) + " transformations)"' .migration-state.yaml
echo ""
echo "NEWLY APPLIED:"
# This would show transformations applied in this session
echo "  - jackson-migrator v1.1.0: exception-handling"
echo "  - spring-ai-migrator v1.1.0: tts-model-rename, speed-parameter, advisor-constants"
echo ""
echo "VALIDATION:"
echo "  Compile: $(yq eval '.validationDetails.compile.success' .migration-state.yaml && echo 'PASSED ✓' || echo 'FAILED ✗')"
echo "  Errors: $(yq eval '.validationDetails.compile.errors' .migration-state.yaml)"
echo ""
echo "═══════════════════════════════════════════════════════════════"
```

## Upgrade Detection Logic

When marketplace is upgraded, detect new and updated skills:

```text
┌─────────────────────────────────────────────────────────────────┐
│              MARKETPLACE UPGRADE DETECTION FLOW                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Read marketplaceVersion from .migration-state.yaml          │
│  2. Compare with current marketplace version                    │
│  3. If different → UPGRADE DETECTED                             │
│                                                                  │
│  FOR EACH SKILL:                                                │
│    a. Load skill metadata (skills/*/metadata.yaml)              │
│    b. Get current skill version                                 │
│    c. Compare with applied skill version in state               │
│                                                                  │
│  COMPARISON RESULTS:                                            │
│    ┌─────────────────────────────────────────────────────────┐  │
│    │ Skill NOT in state → NEW SKILL                          │  │
│    │   Action: Apply all transformations                     │  │
│    ├─────────────────────────────────────────────────────────┤  │
│    │ Applied version == Current version → UP TO DATE         │  │
│    │   Action: Skip                                          │  │
│    ├─────────────────────────────────────────────────────────┤  │
│    │ Applied version < Current version → UPGRADED            │  │
│    │   Action: Find new transformations, apply delta         │  │
│    ├─────────────────────────────────────────────────────────┤  │
│    │ Applied version > Current version → DOWNGRADE           │  │
│    │   Action: Skip (warn user)                              │  │
│    └─────────────────────────────────────────────────────────┘  │
│                                                                  │
│  TRANSFORMATION DIFF:                                           │
│    For upgraded skills:                                         │
│      - Load transformations from metadata                       │
│      - Compare with applied transformations in state            │
│      - New transformation IDs → Add to pending                  │
│      - Existing transformation IDs → Check version              │
│        - If transformation version > applied → Add to pending   │
│        - Else → Skip                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Version Comparison

Use semantic versioning comparison:

```bash
# Compare two semantic versions
# Returns: 0 if equal, 1 if v1 > v2, 2 if v1 < v2
compare_versions() {
  local v1=$1
  local v2=$2

  if [ "$v1" = "$v2" ]; then
    return 0  # Equal
  fi

  local IFS=.
  local i ver1=($v1) ver2=($v2)

  # Fill empty positions with zeros
  for ((i=${#ver1[@]}; i<${#ver2[@]}; i++)); do
    ver1[i]=0
  done

  for ((i=0; i<${#ver1[@]}; i++)); do
    if [[ -z ${ver2[i]} ]]; then
      ver2[i]=0
    fi
    if ((10#${ver1[i]} > 10#${ver2[i]})); then
      return 1  # v1 > v2
    fi
    if ((10#${ver1[i]} < 10#${ver2[i]})); then
      return 2  # v1 < v2
    fi
  done

  return 0  # Equal
}

# Usage
compare_versions "1.1.0" "1.0.0"
if [ $? -eq 1 ]; then
  echo "Skill upgraded"
fi
```

## State File Update

After each successful transformation, update the state file atomically:

```bash
# Update state file
update_state() {
  local SKILL=$1
  local VERSION=$2
  local TRANSFORM_ID=$3
  local COMMIT_SHA=$4

  # Check if skill already has an entry in appliedTransformations
  EXISTING=$(yq eval ".appliedTransformations[] | select(.skill == \"$SKILL\" and .version == \"$VERSION\")" .migration-state.yaml)

  if [ -n "$EXISTING" ]; then
    # Append transformation to existing entry
    yq eval -i "(.appliedTransformations[] | select(.skill == \"$SKILL\" and .version == \"$VERSION\") | .transformations) += [\"$TRANSFORM_ID\"]" .migration-state.yaml
  else
    # Create new entry
    yq eval -i ".appliedTransformations += [{
      \"skill\": \"$SKILL\",
      \"version\": \"$VERSION\",
      \"transformations\": [\"$TRANSFORM_ID\"],
      \"completedAt\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
      \"commitSha\": \"$COMMIT_SHA\"
    }]" .migration-state.yaml
  fi

  # Update lastUpdatedAt
  yq eval -i ".lastUpdatedAt = \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"" .migration-state.yaml

  # Update marketplaceVersion
  CURRENT_VERSION=$(cat VERSION 2>/dev/null || echo "1.0.0")
  yq eval -i ".marketplaceVersion = \"$CURRENT_VERSION\"" .migration-state.yaml

  # Commit state file
  git add .migration-state.yaml
  git commit -m "chore: update migration state [skip ci]" --no-verify
}
```

## Integration with Migration Skills

Each migration skill should:

1. Check state file for already-applied transformations
2. Skip transformations already in state with same or newer version
3. Apply only new/pending transformations
4. Update state after each successful transformation

Example integration in `jackson-migrator`:

```bash
# Before applying transformations, check state
APPLIED_TRANSFORMS=$(yq eval '.appliedTransformations[] | select(.skill == "jackson-migrator") | .transformations[]' .migration-state.yaml 2>/dev/null)

# Check if jackson-imports already applied
if echo "$APPLIED_TRANSFORMS" | grep -q "jackson-imports"; then
  echo "Skipping jackson-imports (already applied)"
else
  echo "Applying jackson-imports..."
  # ... apply transformation ...
  update_state "jackson-migrator" "1.1.0" "jackson-imports" "$COMMIT_SHA"
fi
```

## Error Handling

### State File Corruption

```bash
# Validate state file
if ! yq eval '.' .migration-state.yaml > /dev/null 2>&1; then
  echo "Error: Migration state file is corrupted"
  echo "Creating backup: .migration-state.yaml.bak"
  cp .migration-state.yaml .migration-state.yaml.bak

  # Attempt recovery or prompt user
  exit 1
fi
```

### Missing Metadata

```bash
# Check if skill has metadata
if [ ! -f "skills/$SKILL_NAME/metadata.yaml" ]; then
  echo "Warning: No metadata found for $SKILL_NAME"
  echo "Skipping version comparison (assuming v1.0.0)"
  SKILL_VERSION="1.0.0"
fi
```

### Branch Conflicts

```bash
# Handle merge conflicts on pull
if ! git pull origin "$BRANCH" --rebase; then
  echo "Error: Merge conflict detected"
  echo "Please resolve conflicts manually:"
  echo "  git rebase --continue  (after resolving)"
  echo "  git rebase --abort     (to cancel)"
  exit 1
fi
```

## Critical Rules

1. **YAML Format**: State file is `.migration-state.yaml` (YAML), not JSON
2. **Branch Checkout**: Always checkout the branch from state file before resuming
3. **Version Comparison**: Use semantic versioning to compare skill versions
4. **Atomic Updates**: Commit state file after each transformation
5. **Skip Logic**: Never re-apply transformations with same or older version
6. **Marketplace Detection**: Always compare marketplace versions to detect upgrades
7. **Validation**: Run compilation after all transformations applied
8. **Report Generation**: Provide detailed summary of skipped vs applied work
9. **Error Recovery**: Preserve state file on errors for future resume attempts
10. **Integration**: Resume works with all migration skills that have metadata.yaml
