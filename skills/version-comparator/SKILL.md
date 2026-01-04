# Version Comparator Skill

Semantic version comparison utilities for migration tier classification and version-aware decision making.

## Purpose

Provides pure bash functions for comparing semantic versions (e.g., "4.0.0" vs "4.0.1") to enable:

- Migration tier classification (FULL_MIGRATION, PATCH_UPGRADE, etc.)
- Version-aware skip logic (don't skip repos with outdated patch versions)
- Upgrade path determination

## Core Functions

### compare_versions

Compare two semantic versions.

**Signature**: `compare_versions <version1> <version2>`

**Returns**:

- `-1` if version1 < version2
- `0` if version1 == version2
- `1` if version1 > version2

**Example**:

```bash
result=$(compare_versions "4.0.0" "4.0.1")
echo $result  # -1 (4.0.0 < 4.0.1)

result=$(compare_versions "4.0.1" "4.0.1")
echo $result  # 0 (equal)

result=$(compare_versions "4.0.2" "4.0.1")
echo $result  # 1 (4.0.2 > 4.0.1)
```

**Implementation**:

```bash
compare_versions() {
  local v1="$1"
  local v2="$2"

  # Handle empty versions
  if [[ -z "$v1" || -z "$v2" ]]; then
    echo "0"
    return
  fi

  # Parse versions to remove suffixes (SNAPSHOT, M1, RC1, etc.)
  local v1_base=$(echo "$v1" | sed -E 's/(-SNAPSHOT|-M[0-9]+|-RC[0-9]+|-.*)$//')
  local v2_base=$(echo "$v2" | sed -E 's/(-SNAPSHOT|-M[0-9]+|-RC[0-9]+|-.*)$//')

  # Split into components
  IFS='.' read -r -a v1_parts <<< "$v1_base"
  IFS='.' read -r -a v2_parts <<< "$v2_base"

  # Pad arrays to same length
  local max_parts=3
  while [ ${#v1_parts[@]} -lt $max_parts ]; do
    v1_parts+=("0")
  done
  while [ ${#v2_parts[@]} -lt $max_parts ]; do
    v2_parts+=("0")
  done

  # Compare each component
  for i in {0..2}; do
    local part1=${v1_parts[$i]:-0}
    local part2=${v2_parts[$i]:-0}

    if [ "$part1" -lt "$part2" ]; then
      echo "-1"
      return
    elif [ "$part1" -gt "$part2" ]; then
      echo "1"
      return
    fi
  done

  # All components equal
  echo "0"
}
```

---

### needs_patch_upgrade

Check if a patch upgrade is needed (same major.minor, different patch).

**Signature**: `needs_patch_upgrade <current_version> <target_version>`

**Returns**:

- `true` if upgrade needed
- `false` otherwise

**Example**:

```bash
if needs_patch_upgrade "4.0.0" "4.0.1"; then
  echo "Patch upgrade needed: 4.0.0 → 4.0.1"
fi
```

**Implementation**:

```bash
needs_patch_upgrade() {
  local current="$1"
  local target="$2"

  # Parse versions
  local current_base=$(echo "$current" | sed -E 's/(-SNAPSHOT|-M[0-9]+|-RC[0-9]+|-.*)$//')
  local target_base=$(echo "$target" | sed -E 's/(-SNAPSHOT|-M[0-9]+|-RC[0-9]+|-.*)$//')

  IFS='.' read -r -a current_parts <<< "$current_base"
  IFS='.' read -r -a target_parts <<< "$target_base"

  local current_major=${current_parts[0]:-0}
  local current_minor=${current_parts[1]:-0}
  local current_patch=${current_parts[2]:-0}

  local target_major=${target_parts[0]:-0}
  local target_minor=${target_parts[1]:-0}
  local target_patch=${target_parts[2]:-0}

  # Check if same major.minor but different patch
  if [ "$current_major" -eq "$target_major" ] && \
     [ "$current_minor" -eq "$target_minor" ] && \
     [ "$current_patch" -lt "$target_patch" ]; then
    return 0  # true
  else
    return 1  # false
  fi
}
```

---

### needs_minor_upgrade

Check if a minor upgrade is needed (same major, different minor).

**Signature**: `needs_minor_upgrade <current_version> <target_version>`

**Returns**:

- `true` if upgrade needed
- `false` otherwise

**Example**:

```bash
if needs_minor_upgrade "4.0.1" "4.1.0"; then
  echo "Minor upgrade needed: 4.0.1 → 4.1.0"
fi
```

**Implementation**:

```bash
needs_minor_upgrade() {
  local current="$1"
  local target="$2"

  # Parse versions
  local current_base=$(echo "$current" | sed -E 's/(-SNAPSHOT|-M[0-9]+|-RC[0-9]+|-.*)$//')
  local target_base=$(echo "$target" | sed -E 's/(-SNAPSHOT|-M[0-9]+|-RC[0-9]+|-.*)$//')

  IFS='.' read -r -a current_parts <<< "$current_base"
  IFS='.' read -r -a target_parts <<< "$target_base"

  local current_major=${current_parts[0]:-0}
  local current_minor=${current_parts[1]:-0}

  local target_major=${target_parts[0]:-0}
  local target_minor=${target_parts[1]:-0}

  # Check if same major but different minor (and minor is higher)
  if [ "$current_major" -eq "$target_major" ] && \
     [ "$current_minor" -lt "$target_minor" ]; then
    return 0  # true
  else
    return 1  # false
  fi
}
```

---

### needs_major_upgrade

Check if a major upgrade is needed (different major version).

**Signature**: `needs_major_upgrade <current_version> <target_version>`

**Returns**:

- `true` if upgrade needed
- `false` otherwise

**Example**:

```bash
if needs_major_upgrade "3.5.7" "4.0.1"; then
  echo "Major upgrade needed: 3.5.7 → 4.0.1"
fi
```

**Implementation**:

```bash
needs_major_upgrade() {
  local current="$1"
  local target="$2"

  # Parse versions
  local current_base=$(echo "$current" | sed -E 's/(-SNAPSHOT|-M[0-9]+|-RC[0-9]+|-.*)$//')
  local target_base=$(echo "$target" | sed -E 's/(-SNAPSHOT|-M[0-9]+|-RC[0-9]+|-.*)$//')

  IFS='.' read -r -a current_parts <<< "$current_base"
  IFS='.' read -r -a target_parts <<< "$target_base"

  local current_major=${current_parts[0]:-0}
  local target_major=${target_parts[0]:-0}

  # Check if different major
  if [ "$current_major" -lt "$target_major" ]; then
    return 0  # true
  else
    return 1  # false
  fi
}
```

---

### parse_version

Parse a semantic version into components.

**Signature**: `parse_version <version>`

**Returns**: JSON object with components

**Example**:

```bash
parse_version "4.0.1-SNAPSHOT"
# Output:
# {
#   "version": "4.0.1-SNAPSHOT",
#   "base": "4.0.1",
#   "major": 4,
#   "minor": 0,
#   "patch": 1,
#   "suffix": "SNAPSHOT"
# }
```

**Implementation**:

```bash
parse_version() {
  local version="$1"

  # Extract suffix if present
  local base_version
  local suffix=""

  if [[ "$version" =~ ^([0-9]+\.[0-9]+\.[0-9]+)(-(.+))?$ ]]; then
    base_version="${BASH_REMATCH[1]}"
    suffix="${BASH_REMATCH[3]}"
  else
    base_version="$version"
  fi

  # Parse base version
  IFS='.' read -r -a parts <<< "$base_version"

  local major=${parts[0]:-0}
  local minor=${parts[1]:-0}
  local patch=${parts[2]:-0}

  # Output as JSON
  cat <<EOF
{
  "version": "$version",
  "base": "$base_version",
  "major": $major,
  "minor": $minor,
  "patch": $patch,
  "suffix": "$suffix"
}
EOF
}
```

---

## Migration Tier Classification

Use version comparison functions to classify migration tier.

### classify_migration_tier

Determine the appropriate migration tier based on version comparison.

**Signature**: `classify_migration_tier <current_version> <target_version>`

**Returns**: One of:

- `FULL_MIGRATION` - Major upgrade (2.x/3.x → 4.x)
- `MINOR_UPGRADE` - Minor version bump (4.0.x → 4.1.x)
- `PATCH_UPGRADE` - Patch version bump (4.0.0 → 4.0.1)
- `COMPREHENSIVE_REFRESH` - Same version, refresh ecosystem
- `SKIP` - Already on target version
- `SKIP_NEWER` - On newer version than target

**Example**:

```bash
tier=$(classify_migration_tier "4.0.0" "4.0.1")
echo $tier  # PATCH_UPGRADE

tier=$(classify_migration_tier "3.5.7" "4.0.1")
echo $tier  # FULL_MIGRATION

tier=$(classify_migration_tier "4.0.1" "4.0.1")
echo $tier  # SKIP

tier=$(classify_migration_tier "4.0.2" "4.0.1")
echo $tier  # SKIP_NEWER
```

**Implementation**:

```bash
classify_migration_tier() {
  local current="$1"
  local target="$2"

  # Check for major upgrade
  if needs_major_upgrade "$current" "$target"; then
    echo "FULL_MIGRATION"
    return
  fi

  # Already on same major version (4.x)
  local comparison=$(compare_versions "$current" "$target")

  if [ "$comparison" -eq 0 ]; then
    echo "SKIP"
    return
  elif [ "$comparison" -gt 0 ]; then
    echo "SKIP_NEWER"
    return
  fi

  # current < target, determine upgrade type
  if needs_minor_upgrade "$current" "$target"; then
    echo "MINOR_UPGRADE"
    return
  elif needs_patch_upgrade "$current" "$target"; then
    echo "PATCH_UPGRADE"
    return
  else
    # Same version but may need refresh
    echo "COMPREHENSIVE_REFRESH"
    return
  fi
}
```

---

## Usage in Migration Workflow

### Discovery Agent Integration

```bash
# In discovery-agent.md after version detection

# Get current Spring Boot version from build files
CURRENT_VERSION=$(detect_spring_boot_version)

# Read target version from config
TARGET_VERSION="${CONFIG_TARGET_VERSION:-4.0.1}"

# Classify migration tier
MIGRATION_TIER=$(classify_migration_tier "$CURRENT_VERSION" "$TARGET_VERSION")

# Output in discovery JSON
cat > discovery-output.json <<EOF
{
  "versions": {
    "spring-boot": "$CURRENT_VERSION"
  },
  "targetVersions": {
    "spring-boot": "$TARGET_VERSION"
  },
  "migrationTier": "$MIGRATION_TIER",
  "versionComparison": {
    "patchUpgrade": $(needs_patch_upgrade "$CURRENT_VERSION" "$TARGET_VERSION" && echo "true" || echo "false"),
    "minorUpgrade": $(needs_minor_upgrade "$CURRENT_VERSION" "$TARGET_VERSION" && echo "true" || echo "false"),
    "majorUpgrade": $(needs_major_upgrade "$CURRENT_VERSION" "$TARGET_VERSION" && echo "true" || echo "false")
  }
}
EOF
```

### Parallel Orchestrator Integration

```bash
# In parallel-orchestrator.md

# Read tier from discovery output
MIGRATION_TIER=$(jq -r '.migrationTier' discovery-output.json)

# Execute tier-specific migration
case "$MIGRATION_TIER" in
  FULL_MIGRATION)
    phases="wrapper build-files imports properties configs deps docs ci deployment validation"
    ;;
  PATCH_UPGRADE|MINOR_UPGRADE)
    phases="build-files deps docs ci deployment validation"
    ;;
  COMPREHENSIVE_REFRESH)
    phases="deps docs ci deployment validation"
    ;;
  SKIP|SKIP_NEWER)
    echo "Skipping migration: $MIGRATION_TIER"
    return
    ;;
esac
```

---

## Edge Case Handling

### Snapshot Versions

```bash
# Handle SNAPSHOT versions by comparing base versions
compare_versions "4.0.0-SNAPSHOT" "4.0.1"  # Returns: -1 (base 4.0.0 < 4.0.1)
classify_migration_tier "4.0.0-SNAPSHOT" "4.0.1"  # Returns: PATCH_UPGRADE
```

### Milestone/RC Versions

```bash
# Handle milestone versions
compare_versions "4.0.0-M1" "4.0.0"  # Returns: 0 (same base)
compare_versions "4.0.0-RC1" "4.0.1"  # Returns: -1 (base 4.0.0 < 4.0.1)
classify_migration_tier "4.0.0-M1" "4.0.1"  # Returns: PATCH_UPGRADE
```

### Missing Patch Version

```bash
# Handle versions without patch (e.g., "4.0" vs "4.0.1")
compare_versions "4.0" "4.0.1"  # Returns: -1 (4.0.0 < 4.0.1)
```

### Invalid Versions

```bash
# Handle invalid/empty versions gracefully
compare_versions "" "4.0.1"  # Returns: 0 (no comparison)
compare_versions "invalid" "4.0.1"  # Returns: 0 (no comparison)
```

---

## Testing

### Unit Tests

```bash
#!/bin/bash

# Test compare_versions
test_compare() {
  echo "Testing compare_versions..."

  # Test: v1 < v2
  result=$(compare_versions "4.0.0" "4.0.1")
  [ "$result" -eq -1 ] && echo "✓ 4.0.0 < 4.0.1" || echo "✗ Failed"

  # Test: v1 == v2
  result=$(compare_versions "4.0.1" "4.0.1")
  [ "$result" -eq 0 ] && echo "✓ 4.0.1 == 4.0.1" || echo "✗ Failed"

  # Test: v1 > v2
  result=$(compare_versions "4.0.2" "4.0.1")
  [ "$result" -eq 1 ] && echo "✓ 4.0.2 > 4.0.1" || echo "✗ Failed"

  # Test: snapshot handling
  result=$(compare_versions "4.0.0-SNAPSHOT" "4.0.1")
  [ "$result" -eq -1 ] && echo "✓ 4.0.0-SNAPSHOT < 4.0.1" || echo "✗ Failed"
}

# Test needs_patch_upgrade
test_patch_upgrade() {
  echo "Testing needs_patch_upgrade..."

  if needs_patch_upgrade "4.0.0" "4.0.1"; then
    echo "✓ 4.0.0 → 4.0.1 is patch upgrade"
  else
    echo "✗ Failed"
  fi

  if ! needs_patch_upgrade "4.0.1" "4.1.0"; then
    echo "✓ 4.0.1 → 4.1.0 is NOT patch upgrade"
  else
    echo "✗ Failed"
  fi
}

# Test classify_migration_tier
test_classify() {
  echo "Testing classify_migration_tier..."

  tier=$(classify_migration_tier "3.5.7" "4.0.1")
  [ "$tier" = "FULL_MIGRATION" ] && echo "✓ 3.5.7 → 4.0.1 = FULL_MIGRATION" || echo "✗ Failed: got $tier"

  tier=$(classify_migration_tier "4.0.0" "4.0.1")
  [ "$tier" = "PATCH_UPGRADE" ] && echo "✓ 4.0.0 → 4.0.1 = PATCH_UPGRADE" || echo "✗ Failed: got $tier"

  tier=$(classify_migration_tier "4.0.1" "4.1.0")
  [ "$tier" = "MINOR_UPGRADE" ] && echo "✓ 4.0.1 → 4.1.0 = MINOR_UPGRADE" || echo "✗ Failed: got $tier"

  tier=$(classify_migration_tier "4.0.1" "4.0.1")
  [ "$tier" = "SKIP" ] && echo "✓ 4.0.1 → 4.0.1 = SKIP" || echo "✗ Failed: got $tier"

  tier=$(classify_migration_tier "4.0.2" "4.0.1")
  [ "$tier" = "SKIP_NEWER" ] && echo "✓ 4.0.2 → 4.0.1 = SKIP_NEWER" || echo "✗ Failed: got $tier"
}

# Run all tests
test_compare
test_patch_upgrade
test_classify
```

---

## Version History

- **1.0.0** (2026-01-04) - Initial release
  - Core comparison functions
  - Migration tier classification
  - Snapshot/milestone handling
  - Edge case support
