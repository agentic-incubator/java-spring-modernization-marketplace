# Migration State Skill

**Version:** 1.0.0
**Status:** Phase 1 (Part A) - Core State Management
**Format:** YAML-based state tracking

## Overview

The `migration-state` skill provides core infrastructure for tracking Spring Boot migration progress across
retries, marketplace upgrades, and partial failures. It enables idempotent migration operations by
maintaining a persistent state file in YAML format.

## Key Features

- **YAML-based state files** - Human-readable, version-control friendly
- **Branch-specific tracking** - Each migration branch maintains independent state
- **Transformation tracking** - Records what has been applied and when
- **Version management** - Tracks marketplace and skill versions for upgrade detection
- **Validation status** - Records compile and test results
- **Corruption recovery** - Handles corrupted state files gracefully
- **Atomic commits** - Ensures state and code are always in sync
- **Idempotency support** - Prevents duplicate transformations

## Quick Start

### Initialize State

```bash
# When starting a new migration
initialize_state "/path/to/project" "feature/spring-boot-4-migration" "1.3.0"
```

### Read State

```bash
# Check current migration progress
read_state "/path/to/project"
```

### Update After Transformation

```bash
# Record completed transformation
update_applied_transformations \
  "/path/to/project" \
  "jackson-migrator" \
  "1.0.0" \
  "jackson-imports,jackson-groupid" \
  "$(git rev-parse HEAD)"
```

### Check If Already Applied

```bash
# Avoid duplicate transformations
if [ "$(is_transformation_applied "/path/to/project" "jackson-migrator")" = "true" ]; then
  echo "Already applied - skipping"
fi
```

## State File Structure

The `.migration-state.yaml` file is stored in the project root:

```yaml
migrationId: 'sb4-20260103-abc12345'
branch: 'feature/spring-boot-4-migration'
startedAt: '2026-01-03T10:30:00Z'
lastUpdatedAt: '2026-01-03T11:45:00Z'
marketplaceVersion: '1.3.0'

targetVersions:
  spring-boot: '4.0.0'
  jackson: '3.0.0'

appliedTransformations:
  - skill: jackson-migrator
    version: '1.0.0'
    transformations:
      - jackson-imports
      - jackson-groupid
    completedAt: '2026-01-03T10:35:00Z'
    commitSha: 'abc123def456'

pendingTransformations:
  - spring-ai-migrator

validationStatus: 'PASSED'
```

See `example-state.yaml` for a complete example.

## Core Functions

| Function                         | Purpose                   | Usage                    |
| -------------------------------- | ------------------------- | ------------------------ |
| `initialize_state`               | Create new state file     | Start of migration       |
| `read_state`                     | Load and validate state   | Resume or check progress |
| `update_applied_transformations` | Record completion         | After each skill         |
| `update_validation_status`       | Record build/test results | After validation         |
| `atomic_commit_state`            | Commit state + code       | Keep state in sync       |
| `is_transformation_applied`      | Check if applied          | Idempotency              |
| `get_applied_skill_version`      | Get applied version       | Upgrade detection        |

## Git Integration

### Branch-Specific State

Each migration branch maintains its own state:

```bash
# Branch: feature/spring-boot-4-migration
# State: .migration-state.yaml (tracked)

# Branch: feature/spring-boot-4-retry
# State: .migration-state.yaml (tracked, different content)

# Branch: main
# State: .migration-state.yaml (gitignored)
```

### Gitignore Configuration

Add to `.gitignore` on main branch:

```gitignore
# Migration state files (only tracked on migration branches)
.migration-state.yaml
.migration-state.yaml.backup
```

On migration branches, the state file IS committed and tracked.

## Error Handling

### Corrupted State Recovery

The skill automatically attempts recovery:

1. Try to parse with `yq`
2. Check for `.migration-state.yaml.backup`
3. Check git history for previous version
4. Report if recovery fails

### Validation

All state modifications are validated against the schema:

- Required fields present
- Correct data types
- Valid enum values
- Proper timestamp format
- Valid migration ID format

## Dependencies

### Required

- **git** (>=2.0.0) - Version control
- **python3** (>=3.7) - Fallback YAML processor
- **pyyaml** - Python YAML library

### Optional

- **yq** (>=4.0.0) - Preferred YAML processor
  - macOS: `brew install yq`
  - Linux: `apt-get install yq`

### Installation

```bash
# Install Python dependencies
pip3 install pyyaml

# Install yq (optional but recommended)
brew install yq  # macOS
# or
sudo apt-get install yq  # Linux
```

## Integration with Other Skills

### github-workflow

Checks for existing state when creating/checking out branches:

```bash
if [ -f ".migration-state.yaml" ]; then
  echo "Resuming existing migration"
fi
```

### Migrator Skills

Each migrator checks state before applying transformations:

```bash
# In jackson-migrator, spring-security-migrator, etc.
if [ "$(is_transformation_applied "$PATH" "$SKILL_NAME")" = "true" ]; then
  echo "Already applied - skipping"
fi
```

### build-runner

Updates validation status after builds/tests:

```bash
update_validation_status "$PATH" "PASSED" "true" "0" "" "150" "0"
```

### resume-migration

Reads state to determine what work remains:

```bash
read_state "$PATH"
# Identify pending transformations
# Apply only what's needed
```

## Workflow Example

### First Migration Attempt

```bash
# 1. Create branch
git checkout -b feature/spring-boot-4-migration

# 2. Initialize state
initialize_state "." "feature/spring-boot-4-migration" "1.3.0"

# 3. Apply jackson migration
# ... jackson transformations ...
update_applied_transformations "." "jackson-migrator" "1.0.0" "jackson-imports,jackson-groupid" "$(git rev-parse HEAD)"

# 4. Apply security migration
# ... security transformations ...
update_applied_transformations "." "spring-security-migrator" "1.0.0" "security-config" "$(git rev-parse HEAD)"

# 5. Validate
mvn clean compile
# Build fails with 3 errors
update_validation_status "." "FAILED" "false" "3" "SecurityConfig errors"
```

### Resume After Fixing Issues

```bash
# 1. Checkout existing branch
git checkout feature/spring-boot-4-migration

# 2. Read state
read_state "."
# Shows: jackson-migrator ✅, spring-security-migrator ✅, validation ❌

# 3. Fix code issues manually
# ... fix SecurityConfig.java ...

# 4. Re-validate
mvn clean test
# Tests pass!
update_validation_status "." "PASSED" "true" "0" "" "150" "0"

# 5. Continue with pending transformations
# State shows: pendingTransformations: [spring-ai-migrator]
```

### Marketplace Upgrade

```bash
# Day 1: Marketplace v1.2.0
# Applied jackson-migrator v1.0.0

# Day 2: Upgrade to Marketplace v1.3.0
# jackson-migrator now v1.1.0 (new transformations)

# Resume migration
read_state "."
APPLIED_VERSION=$(get_applied_skill_version "." "jackson-migrator")
# Returns: "1.0.0"

CURRENT_VERSION="1.1.0"
if [ "$APPLIED_VERSION" != "$CURRENT_VERSION" ]; then
  echo "Jackson migrator upgraded: $APPLIED_VERSION → $CURRENT_VERSION"
  # Apply only new transformations
fi
```

## Best Practices

1. **Initialize state early** - Before any transformations
2. **Validate after reading** - Detect corruption immediately
3. **Backup before updates** - Prevent data loss
4. **Commit atomically** - State + code together
5. **Check before applying** - Implement idempotency
6. **Update timestamps** - Track progress accurately
7. **Record commit SHAs** - Create audit trail
8. **Handle errors gracefully** - Attempt recovery

## Troubleshooting

### State File Not Found

```bash
# Check if on migration branch
git branch --show-current

# Check if state was initialized
ls -la .migration-state.yaml
```

### Corrupted State File

```bash
# Manually validate
yq eval '.' .migration-state.yaml

# Check backup
ls -la .migration-state.yaml.backup

# Check git history
git log --all --full-history -- .migration-state.yaml
```

### State/Code Drift

```bash
# Verify state commit matches code
LAST_COMMIT=$(yq eval '.appliedTransformations[-1].commitSha' .migration-state.yaml)
CURRENT_COMMIT=$(git rev-parse HEAD)

if [ "$LAST_COMMIT" != "$CURRENT_COMMIT" ]; then
  echo "State/code drift detected!"
fi
```

## Schema Reference

See `SKILL.md` for the complete JSON Schema definition.

Required fields:

- `migrationId` - Unique identifier
- `branch` - Git branch name
- `startedAt` - ISO 8601 timestamp
- `lastUpdatedAt` - ISO 8601 timestamp
- `marketplaceVersion` - Semantic version

Optional fields:

- `targetVersions` - Framework version targets
- `appliedTransformations` - Completed transformations
- `pendingTransformations` - Remaining work
- `validationStatus` - Build/test status
- `validationDetails` - Detailed results
- `lastError` - Error message

## Future Enhancements

Phase 1 (Part A) provides core state management. Future phases will add:

- **Phase 1 (Part B)**: Branch reuse logic in github-workflow
- **Phase 2**: Skill version metadata and registry
- **Phase 3**: Resume command and upgrade detection
- **Phase 4**: Idempotent transformations in all migrator skills

## Related Documentation

- [Idempotent Migration Plan](../../../docs/planning/idempotent-migration-plan.md) - Overall strategy
- [SKILL.md](./SKILL.md) - Detailed implementation guide
- [metadata.yaml](./metadata.yaml) - Skill metadata and dependencies
- [example-state.yaml](./example-state.yaml) - Complete state file example

## Support

For issues or questions:

1. Check `SKILL.md` for detailed function documentation
2. Review `example-state.yaml` for state structure examples
3. Consult `docs/planning/idempotent-migration-plan.md` for design rationale
