---
name: migration-state
description: Core state management for idempotent migration operations. Provides YAML-based state tracking for transformations, versions, and validation status. Use for initializing, reading, updating, and committing migration state.
allowed-tools: Read, Write, Edit, Bash, Grep
---

# Migration State Management

Core infrastructure for tracking migration state across retries, marketplace upgrades, and partial failures.

## Overview

This skill manages the `.migration-state.yaml` file that tracks:

- Which transformations have been applied
- Marketplace version at time of migration
- Branch-specific migration progress
- Validation status and errors
- Audit trail for debugging

## State File Schema

### YAML Schema Definition

```yaml
# .migration-state.yaml
migrationId: 'sb4-20260103-abc12345'
branch: 'feature/spring-boot-4-migration'
startedAt: '2026-01-03T10:30:00Z'
lastUpdatedAt: '2026-01-03T11:45:00Z'
marketplaceVersion: '1.2.0'

targetVersions:
  spring-boot: '4.0.0'
  jackson: '3.0.0'
  spring-security: '7.0.0'
  spring-cloud: '2025.1.0'
  spring-ai: '1.1.0'

appliedTransformations:
  - skill: jackson-migrator
    version: '1.0.0'
    transformations:
      - jackson-imports
      - jackson-groupid
    completedAt: '2026-01-03T10:35:00Z'
    commitSha: 'abc123def456'

  - skill: spring-security-migrator
    version: '1.0.0'
    transformations:
      - security-config
      - authorizations
    completedAt: '2026-01-03T10:42:00Z'
    commitSha: 'def456abc789'

pendingTransformations:
  - spring-ai-migrator
  - vaadin-migrator

validationStatus: 'FAILED' # NOT_RUN | PASSED | FAILED | PARTIAL

validationDetails:
  compile:
    success: false
    errors: 3
    errorSummary: '3 compilation errors in SecurityConfig.java'
  tests:
    skipped: true
    reason: 'Compilation failed'

lastError: '3 compilation errors in SecurityConfig.java'
```

### Enhanced Schema with Documentation Tracking (v1.1.0+)

Starting with version 1.1.0, the migration-state skill supports tracking documentation changes:

```yaml
# .migration-state.yaml (Enhanced with documentation tracking)
migrationId: 'sb4-20260103-abc12345'
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
    version: '1.1.0'
    transformations:
      - jackson-imports
      - jackson-groupid
      - jackson-docs # NEW: Documentation transformation
    completedAt: '2026-01-03T10:35:00Z'
    commitSha: 'abc123def456'
    documentationChanges: # NEW: Track documentation updates
      filesUpdated:
        - docs/migrations.md
        - README.md
      linesChanged: 45
      examplesUpdated: 8

  - skill: documentation-migrator
    version: '1.0.0'
    transformations:
      - readme-prerequisites
      - general-version-refs
    completedAt: '2026-01-03T11:00:00Z'
    commitSha: 'ghi789jkl012'
    documentationChanges:
      filesUpdated:
        - README.md
        - docs/getting-started.md
      linesChanged: 67
      examplesUpdated: 0

validationStatus: 'PASSED'

# NEW: Aggregated documentation state
documentationState:
  totalFilesUpdated: 4
  totalLinesChanged: 112
  skillsWithDocChanges:
    - jackson-migrator
    - documentation-migrator
  reportLocation: '.migration-summary/docs-changes.md'
```

## JSON Schema Validation

The YAML state file must conform to this JSON Schema equivalent:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["migrationId", "branch", "startedAt", "lastUpdatedAt", "marketplaceVersion"],
  "properties": {
    "migrationId": {
      "type": "string",
      "pattern": "^sb4-[0-9]{8}-[a-z0-9]{8}$",
      "description": "Unique migration identifier: sb4-YYYYMMDD-<8-char-hash>"
    },
    "branch": {
      "type": "string",
      "description": "Git branch name for this migration"
    },
    "startedAt": {
      "type": "string",
      "format": "date-time",
      "description": "ISO 8601 timestamp when migration started"
    },
    "lastUpdatedAt": {
      "type": "string",
      "format": "date-time",
      "description": "ISO 8601 timestamp of last state update"
    },
    "marketplaceVersion": {
      "type": "string",
      "pattern": "^[0-9]+\\.[0-9]+\\.[0-9]+$",
      "description": "Semantic version of marketplace at migration time"
    },
    "targetVersions": {
      "type": "object",
      "description": "Target framework versions",
      "additionalProperties": {
        "type": "string"
      }
    },
    "appliedTransformations": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["skill", "version", "transformations", "completedAt", "commitSha"],
        "properties": {
          "skill": { "type": "string" },
          "version": { "type": "string" },
          "transformations": {
            "type": "array",
            "items": { "type": "string" }
          },
          "completedAt": { "type": "string", "format": "date-time" },
          "commitSha": { "type": "string" },
          "documentationChanges": {
            "type": "object",
            "description": "Optional tracking of documentation updates (v1.1.0+)",
            "properties": {
              "filesUpdated": {
                "type": "array",
                "items": { "type": "string" }
              },
              "linesChanged": { "type": "integer" },
              "examplesUpdated": { "type": "integer" }
            }
          }
        }
      }
    },
    "pendingTransformations": {
      "type": "array",
      "items": { "type": "string" }
    },
    "validationStatus": {
      "type": "string",
      "enum": ["NOT_RUN", "PASSED", "FAILED", "PARTIAL"]
    },
    "validationDetails": {
      "type": "object",
      "properties": {
        "compile": {
          "type": "object",
          "properties": {
            "success": { "type": "boolean" },
            "errors": { "type": "integer" },
            "errorSummary": { "type": "string" }
          }
        },
        "tests": {
          "type": "object",
          "properties": {
            "skipped": { "type": "boolean" },
            "passed": { "type": "integer" },
            "failed": { "type": "integer" },
            "reason": { "type": "string" }
          }
        }
      }
    },
    "lastError": {
      "type": "string",
      "description": "Human-readable error message from last failure"
    },
    "documentationState": {
      "type": "object",
      "description": "Aggregated documentation change tracking (v1.1.0+)",
      "properties": {
        "totalFilesUpdated": { "type": "integer" },
        "totalLinesChanged": { "type": "integer" },
        "skillsWithDocChanges": {
          "type": "array",
          "items": { "type": "string" }
        },
        "reportLocation": { "type": "string" }
      }
    }
  }
}
```

## Core Functions

### 1. Initialize State File

Create a new `.migration-state.yaml` file when starting a migration.

```bash
#!/bin/bash
# Initialize migration state for a new migration branch

PROJECT_PATH="$1"
BRANCH_NAME="${2:-feature/spring-boot-4-migration}"
MARKETPLACE_VERSION="${3:-1.0.0}"

cd "$PROJECT_PATH" || exit 1

# Generate migration ID: sb4-YYYYMMDD-<8-char-hash>
MIGRATION_ID="sb4-$(date +%Y%m%d)-$(cat /dev/urandom | LC_ALL=C tr -dc 'a-z0-9' | fold -w 8 | head -n 1)"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Create state file
cat > .migration-state.yaml << EOF
migrationId: "${MIGRATION_ID}"
branch: "${BRANCH_NAME}"
startedAt: "${TIMESTAMP}"
lastUpdatedAt: "${TIMESTAMP}"
marketplaceVersion: "${MARKETPLACE_VERSION}"

targetVersions:
  spring-boot: "4.0.0"
  jackson: "3.0.0"
  spring-security: "7.0.0"
  spring-cloud: "2025.1.0"

appliedTransformations: []
pendingTransformations: []

validationStatus: "NOT_RUN"
validationDetails: {}
EOF

echo "✅ Initialized migration state: $MIGRATION_ID"
echo "📁 State file: $PROJECT_PATH/.migration-state.yaml"
```

**When to use:**

- Starting a new migration on a fresh branch
- First-time migration of a project
- After deleting old state to restart migration

**Output:**

```text
✅ Initialized migration state: sb4-20260103-abc12345
📁 State file: /path/to/project/.migration-state.yaml
```

### 2. Read Existing State

Load and validate the current migration state.

```bash
#!/bin/bash
# Read and validate migration state file

PROJECT_PATH="$1"
STATE_FILE="$PROJECT_PATH/.migration-state.yaml"

# Check if state file exists
if [ ! -f "$STATE_FILE" ]; then
  echo "❌ No migration state file found at: $STATE_FILE"
  exit 1
fi

# Read state using yq (YAML processor)
# Install with: brew install yq (on macOS) or apt-get install yq
if ! command -v yq &> /dev/null; then
  echo "⚠️  yq not found. Using Python as fallback..."
  python3 << 'PYEOF'
import sys
import yaml
try:
    with open(sys.argv[1], 'r') as f:
        state = yaml.safe_load(f)
    print(yaml.dump(state, default_flow_style=False))
except Exception as e:
    print(f"❌ Error reading state file: {e}", file=sys.stderr)
    sys.exit(1)
PYEOF
  exit $?
fi

# Validate state file structure
echo "📋 Reading migration state..."
yq eval '.' "$STATE_FILE"

# Extract key fields
MIGRATION_ID=$(yq eval '.migrationId' "$STATE_FILE")
BRANCH=$(yq eval '.branch' "$STATE_FILE")
MARKETPLACE_VERSION=$(yq eval '.marketplaceVersion' "$STATE_FILE")
VALIDATION_STATUS=$(yq eval '.validationStatus' "$STATE_FILE")
APPLIED_COUNT=$(yq eval '.appliedTransformations | length' "$STATE_FILE")

echo ""
echo "📌 Migration Summary:"
echo "   ID: $MIGRATION_ID"
echo "   Branch: $BRANCH"
echo "   Marketplace: v$MARKETPLACE_VERSION"
echo "   Applied Transformations: $APPLIED_COUNT"
echo "   Validation: $VALIDATION_STATUS"
```

**When to use:**

- Before resuming a migration
- Checking migration progress
- Debugging state issues
- Validating state file integrity

**Error Handling:**

```bash
# Handle corrupted state file
if ! yq eval '.' "$STATE_FILE" &> /dev/null; then
  echo "❌ Corrupted state file detected!"
  echo "🔧 Attempting to parse as YAML..."

  # Try to extract what we can
  python3 << 'PYEOF'
import yaml
try:
    with open('$STATE_FILE', 'r') as f:
        state = yaml.safe_load(f)
    # Validate required fields
    required = ['migrationId', 'branch', 'startedAt', 'marketplaceVersion']
    missing = [f for f in required if f not in state]
    if missing:
        print(f"❌ Missing required fields: {', '.join(missing)}")
        exit(1)
    print("✅ State file is valid")
except yaml.YAMLError as e:
    print(f"❌ YAML parsing error: {e}")
    exit(1)
except Exception as e:
    print(f"❌ Unexpected error: {e}")
    exit(1)
PYEOF
fi
```

### 3. Update Applied Transformations

Record a completed transformation in the state file.

```bash
#!/bin/bash
# Add a completed transformation to the state file

PROJECT_PATH="$1"
SKILL_NAME="$2"
SKILL_VERSION="$3"
TRANSFORMATIONS="$4"  # Comma-separated list
COMMIT_SHA="$5"

STATE_FILE="$PROJECT_PATH/.migration-state.yaml"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Convert comma-separated transformations to YAML array
IFS=',' read -ra TRANS_ARRAY <<< "$TRANSFORMATIONS"
TRANS_YAML=""
for trans in "${TRANS_ARRAY[@]}"; do
  TRANS_YAML+="      - $(echo "$trans" | xargs)\n"
done

# Create transformation entry
TRANSFORMATION_ENTRY=$(cat << EOF

  - skill: ${SKILL_NAME}
    version: ${SKILL_VERSION}
    transformations:
$(echo -e "$TRANS_YAML")    completedAt: ${TIMESTAMP}
    commitSha: ${COMMIT_SHA}
EOF
)

# Update state file using yq
if command -v yq &> /dev/null; then
  # Create array of transformations
  for trans in "${TRANS_ARRAY[@]}"; do
    trans_clean=$(echo "$trans" | xargs)
  done

  # Add new transformation using yq
  yq eval -i ".appliedTransformations += [{
    \"skill\": \"$SKILL_NAME\",
    \"version\": \"$SKILL_VERSION\",
    \"transformations\": [$(printf '"%s",' "${TRANS_ARRAY[@]}" | sed 's/,$//')],
    \"completedAt\": \"$TIMESTAMP\",
    \"commitSha\": \"$COMMIT_SHA\"
  }]" "$STATE_FILE"

  # Update lastUpdatedAt
  yq eval -i ".lastUpdatedAt = \"$TIMESTAMP\"" "$STATE_FILE"

  # Remove from pending if present
  yq eval -i ".pendingTransformations -= [\"$SKILL_NAME\"]" "$STATE_FILE"
else
  # Fallback to Python
  python3 << PYEOF
import yaml
from datetime import datetime

with open('$STATE_FILE', 'r') as f:
    state = yaml.safe_load(f)

# Add transformation
transformation = {
    'skill': '$SKILL_NAME',
    'version': '$SKILL_VERSION',
    'transformations': [t.strip() for t in '$TRANSFORMATIONS'.split(',')],
    'completedAt': '$TIMESTAMP',
    'commitSha': '$COMMIT_SHA'
}

if 'appliedTransformations' not in state:
    state['appliedTransformations'] = []
state['appliedTransformations'].append(transformation)

# Update timestamp
state['lastUpdatedAt'] = '$TIMESTAMP'

# Remove from pending
if 'pendingTransformations' in state and '$SKILL_NAME' in state['pendingTransformations']:
    state['pendingTransformations'].remove('$SKILL_NAME')

# Write back
with open('$STATE_FILE', 'w') as f:
    yaml.dump(state, f, default_flow_style=False, sort_keys=False)

print("✅ Updated state: applied $SKILL_NAME v$SKILL_VERSION")
PYEOF
fi

echo "✅ Recorded transformation: $SKILL_NAME v$SKILL_VERSION"
echo "   Transformations: $TRANSFORMATIONS"
echo "   Commit: $COMMIT_SHA"
```

**When to use:**

- Immediately after successfully applying a transformation
- Before committing code changes
- As part of the transformation workflow

**Example usage:**

```bash
# After applying Jackson migration
update_applied_transformations \
  "/path/to/project" \
  "jackson-migrator" \
  "1.0.0" \
  "jackson-imports,jackson-groupid,jackson-exceptions" \
  "abc123def456"
```

### 4. Update Validation Status

Record validation results (compile, test).

```bash
#!/bin/bash
# Update validation status in state file

PROJECT_PATH="$1"
VALIDATION_STATUS="$2"  # NOT_RUN | PASSED | FAILED | PARTIAL
COMPILE_SUCCESS="$3"    # true/false
COMPILE_ERRORS="$4"     # number
ERROR_SUMMARY="$5"      # description
TESTS_PASSED="$6"       # number (optional)
TESTS_FAILED="$7"       # number (optional)

STATE_FILE="$PROJECT_PATH/.migration-state.yaml"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

if command -v yq &> /dev/null; then
  # Update using yq
  yq eval -i ".validationStatus = \"$VALIDATION_STATUS\"" "$STATE_FILE"
  yq eval -i ".lastUpdatedAt = \"$TIMESTAMP\"" "$STATE_FILE"

  # Update compile details
  yq eval -i ".validationDetails.compile.success = $COMPILE_SUCCESS" "$STATE_FILE"
  yq eval -i ".validationDetails.compile.errors = $COMPILE_ERRORS" "$STATE_FILE"

  if [ -n "$ERROR_SUMMARY" ]; then
    yq eval -i ".validationDetails.compile.errorSummary = \"$ERROR_SUMMARY\"" "$STATE_FILE"
    yq eval -i ".lastError = \"$ERROR_SUMMARY\"" "$STATE_FILE"
  fi

  # Update test details if provided
  if [ -n "$TESTS_PASSED" ]; then
    yq eval -i ".validationDetails.tests.passed = $TESTS_PASSED" "$STATE_FILE"
    yq eval -i ".validationDetails.tests.failed = $TESTS_FAILED" "$STATE_FILE"
    yq eval -i ".validationDetails.tests.skipped = false" "$STATE_FILE"
  else
    yq eval -i ".validationDetails.tests.skipped = true" "$STATE_FILE"
    yq eval -i ".validationDetails.tests.reason = \"Compilation failed\"" "$STATE_FILE"
  fi
else
  # Fallback to Python
  python3 << PYEOF
import yaml

with open('$STATE_FILE', 'r') as f:
    state = yaml.safe_load(f)

# Update validation
state['validationStatus'] = '$VALIDATION_STATUS'
state['lastUpdatedAt'] = '$TIMESTAMP'

# Initialize validationDetails if missing
if 'validationDetails' not in state:
    state['validationDetails'] = {}

# Update compile details
state['validationDetails']['compile'] = {
    'success': $COMPILE_SUCCESS,
    'errors': $COMPILE_ERRORS
}

if '$ERROR_SUMMARY':
    state['validationDetails']['compile']['errorSummary'] = '$ERROR_SUMMARY'
    state['lastError'] = '$ERROR_SUMMARY'

# Update test details
if '$TESTS_PASSED':
    state['validationDetails']['tests'] = {
        'passed': $TESTS_PASSED,
        'failed': $TESTS_FAILED,
        'skipped': False
    }
else:
    state['validationDetails']['tests'] = {
        'skipped': True,
        'reason': 'Compilation failed'
    }

with open('$STATE_FILE', 'w') as f:
    yaml.dump(state, f, default_flow_style=False, sort_keys=False)

print("✅ Updated validation status: $VALIDATION_STATUS")
PYEOF
fi

echo "✅ Updated validation: $VALIDATION_STATUS"
echo "   Compile: $([ "$COMPILE_SUCCESS" = "true" ] && echo "✅ PASSED" || echo "❌ FAILED ($COMPILE_ERRORS errors)")"
if [ -n "$TESTS_PASSED" ]; then
  echo "   Tests: ✅ $TESTS_PASSED passed, ❌ $TESTS_FAILED failed"
fi
```

**When to use:**

- After running build validation
- After running tests
- When recording partial success

**Example usage:**

```bash
# After successful compilation and tests
update_validation_status \
  "/path/to/project" \
  "PASSED" \
  "true" \
  "0" \
  "" \
  "150" \
  "0"

# After compilation failure
update_validation_status \
  "/path/to/project" \
  "FAILED" \
  "false" \
  "3" \
  "3 compilation errors in SecurityConfig.java"
```

### 5. Atomic Commit of State with Code

Commit state file atomically with code changes to prevent drift.

```bash
#!/bin/bash
# Commit migration state atomically with code changes

PROJECT_PATH="$1"
SKILL_NAME="$2"
SKILL_VERSION="$3"
TRANSFORMATIONS="$4"  # Comma-separated
COMMIT_MESSAGE="$5"

cd "$PROJECT_PATH" || exit 1

STATE_FILE=".migration-state.yaml"

# Ensure state file exists
if [ ! -f "$STATE_FILE" ]; then
  echo "❌ State file not found. Initialize state first."
  exit 1
fi

# Get current commit SHA (before committing)
COMMIT_SHA=$(git rev-parse HEAD)

# Stage all changes including state file
git add -A

# Check if there are changes to commit
if git diff --cached --quiet; then
  echo "⚠️  No changes to commit"
  exit 0
fi

# Create transformation list for commit message
TRANS_LIST=$(echo "$TRANSFORMATIONS" | tr ',' '\n' | sed 's/^/- /' | tr '\n' '|' | sed 's/|$//')
TRANS_LIST=$(echo "$TRANS_LIST" | tr '|' '\n')

# Read marketplace version from state
if command -v yq &> /dev/null; then
  MARKETPLACE_VERSION=$(yq eval '.marketplaceVersion' "$STATE_FILE")
  MIGRATION_ID=$(yq eval '.migrationId' "$STATE_FILE")
else
  MARKETPLACE_VERSION=$(python3 -c "import yaml; print(yaml.safe_load(open('$STATE_FILE'))['marketplaceVersion'])")
  MIGRATION_ID=$(python3 -c "import yaml; print(yaml.safe_load(open('$STATE_FILE'))['migrationId'])")
fi

# Commit with structured message
git commit -m "migration($SKILL_NAME): $COMMIT_MESSAGE [v$SKILL_VERSION]

Applied transformations:
$TRANS_LIST

Migration ID: $MIGRATION_ID
Marketplace: $MARKETPLACE_VERSION
State: $(git hash-object "$STATE_FILE")"

# Get new commit SHA
NEW_COMMIT_SHA=$(git rev-parse HEAD)

echo "✅ Committed migration changes"
echo "   Skill: $SKILL_NAME v$SKILL_VERSION"
echo "   Commit: $NEW_COMMIT_SHA"
echo "   Transformations: $TRANSFORMATIONS"

# Return commit SHA for state update
echo "$NEW_COMMIT_SHA"
```

**When to use:**

- After applying transformations and before updating state
- To ensure code and state are always in sync
- As part of the transformation workflow

**Commit Message Format:**

```text
migration(<skill>): <description> [v<version>]

Applied transformations:
- transformation-id-1
- transformation-id-2
- transformation-id-3

Migration ID: sb4-20260103-abc12345
Marketplace: 1.2.0
State: abc123def456
```

### 6. Check If Transformation Already Applied

Determine if a transformation has already been applied to avoid duplicates.

```bash
#!/bin/bash
# Check if a transformation has already been applied

PROJECT_PATH="$1"
SKILL_NAME="$2"
TRANSFORMATION_ID="$3"  # Optional - if empty, checks if skill applied at all

STATE_FILE="$PROJECT_PATH/.migration-state.yaml"

if [ ! -f "$STATE_FILE" ]; then
  echo "false"
  exit 0
fi

if command -v yq &> /dev/null; then
  # Check if skill exists in appliedTransformations
  APPLIED=$(yq eval ".appliedTransformations[] | select(.skill == \"$SKILL_NAME\")" "$STATE_FILE")

  if [ -z "$APPLIED" ]; then
    echo "false"
    exit 0
  fi

  # If checking specific transformation
  if [ -n "$TRANSFORMATION_ID" ]; then
    HAS_TRANS=$(yq eval ".appliedTransformations[] | select(.skill == \"$SKILL_NAME\") | .transformations[] | select(. == \"$TRANSFORMATION_ID\")" "$STATE_FILE")
    if [ -z "$HAS_TRANS" ]; then
      echo "false"
      exit 0
    fi
  fi

  echo "true"
else
  # Python fallback
  python3 << PYEOF
import yaml
import sys

with open('$STATE_FILE', 'r') as f:
    state = yaml.safe_load(f)

applied = state.get('appliedTransformations', [])

# Find skill
skill_entry = next((t for t in applied if t['skill'] == '$SKILL_NAME'), None)

if not skill_entry:
    print("false")
    sys.exit(0)

# Check specific transformation if provided
if '$TRANSFORMATION_ID':
    if '$TRANSFORMATION_ID' in skill_entry.get('transformations', []):
        print("true")
    else:
        print("false")
else:
    print("true")
PYEOF
fi
```

**When to use:**

- Before applying a transformation
- During resume operations
- To implement idempotency checks

**Example usage:**

```bash
# Check if jackson-migrator was applied
if [ "$(is_transformation_applied "/path/to/project" "jackson-migrator")" = "true" ]; then
  echo "✅ Jackson migration already applied - skipping"
  exit 0
fi

# Check specific transformation
if [ "$(is_transformation_applied "/path/to/project" "jackson-migrator" "jackson-imports")" = "true" ]; then
  echo "✅ Jackson imports already updated - skipping"
else
  echo "🔄 Applying Jackson import updates..."
fi
```

### 7. Get Applied Skill Version

Retrieve the version of a skill that was previously applied.

```bash
#!/bin/bash
# Get the version of an applied skill

PROJECT_PATH="$1"
SKILL_NAME="$2"

STATE_FILE="$PROJECT_PATH/.migration-state.yaml"

if [ ! -f "$STATE_FILE" ]; then
  echo ""
  exit 0
fi

if command -v yq &> /dev/null; then
  VERSION=$(yq eval ".appliedTransformations[] | select(.skill == \"$SKILL_NAME\") | .version" "$STATE_FILE")
  echo "$VERSION"
else
  python3 << PYEOF
import yaml
with open('$STATE_FILE', 'r') as f:
    state = yaml.safe_load(f)
applied = state.get('appliedTransformations', [])
skill_entry = next((t for t in applied if t['skill'] == '$SKILL_NAME'), None)
if skill_entry:
    print(skill_entry['version'])
else:
    print('')
PYEOF
fi
```

**When to use:**

- Comparing applied version vs current skill version
- Detecting marketplace upgrades
- Determining if re-running is needed

**Example usage:**

```bash
APPLIED_VERSION=$(get_applied_skill_version "/path/to/project" "jackson-migrator")
CURRENT_VERSION="1.1.0"

if [ -z "$APPLIED_VERSION" ]; then
  echo "🆕 Jackson migrator not yet applied"
elif [ "$APPLIED_VERSION" != "$CURRENT_VERSION" ]; then
  echo "⬆️  Jackson migrator upgrade detected: $APPLIED_VERSION → $CURRENT_VERSION"
else
  echo "✅ Jackson migrator up to date: v$CURRENT_VERSION"
fi
```

## State File Location and Git Integration

### Location Strategy

**.migration-state.yaml location:** Project root (same directory as `.git/`)

**Git tracking rules:**

- **Migration branch:** State file IS committed and tracked
- **Main branch:** State file IS gitignored (add to `.gitignore`)

### Gitignore Configuration

Add to `.gitignore` on main branch:

```gitignore
# Migration state files (only tracked on migration branches)
.migration-state.yaml
```

### Branch-Specific State

Each migration branch maintains its own state file:

```bash
# Branch: feature/spring-boot-4-migration
# State file: .migration-state.yaml (tracked)
# migrationId: sb4-20260103-abc12345
# branch: feature/spring-boot-4-migration

# Branch: feature/spring-boot-4-retry
# State file: .migration-state.yaml (tracked)
# migrationId: sb4-20260105-xyz98765
# branch: feature/spring-boot-4-retry
```

**Benefits:**

- Each branch tracks its own progress independently
- Switching branches preserves individual migration state
- No conflicts when running parallel migrations

### Initialize State on Branch Creation

```bash
#!/bin/bash
# Create migration branch with state file

PROJECT_PATH="$1"
BRANCH_NAME="${2:-feature/spring-boot-4-migration}"

cd "$PROJECT_PATH" || exit 1

# Check if branch already exists
if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
  echo "✅ Branch '$BRANCH_NAME' already exists"
  git checkout "$BRANCH_NAME"

  # Check if state file exists
  if [ -f ".migration-state.yaml" ]; then
    echo "✅ Migration state found - resuming migration"
  else
    echo "⚠️  Branch exists but no state file - initializing..."
    # Call initialize_state function
  fi
else
  echo "🔀 Creating new migration branch: $BRANCH_NAME"
  git checkout -b "$BRANCH_NAME"

  # Initialize state file
  # Call initialize_state function

  # Ensure state file is NOT in .gitignore on this branch
  if grep -q "^\.migration-state\.yaml$" .gitignore 2>/dev/null; then
    echo "⚠️  Removing .migration-state.yaml from .gitignore on migration branch"
    sed -i.bak '/^\.migration-state\.yaml$/d' .gitignore
    rm .gitignore.bak
  fi
fi
```

## Error Handling

### Corrupted State File Recovery

```bash
#!/bin/bash
# Attempt to recover from corrupted state file

PROJECT_PATH="$1"
STATE_FILE="$PROJECT_PATH/.migration-state.yaml"
BACKUP_FILE="$PROJECT_PATH/.migration-state.yaml.backup"

# Try to parse state file
if ! yq eval '.' "$STATE_FILE" &> /dev/null 2>&1; then
  echo "❌ State file is corrupted!"

  # Check for backup
  if [ -f "$BACKUP_FILE" ]; then
    echo "🔧 Found backup file - attempting recovery..."
    cp "$BACKUP_FILE" "$STATE_FILE"

    if yq eval '.' "$STATE_FILE" &> /dev/null 2>&1; then
      echo "✅ State file recovered from backup"
    else
      echo "❌ Backup file is also corrupted"
      exit 1
    fi
  else
    echo "🔍 Checking git history for previous version..."

    # Try to get state file from previous commit
    if git show HEAD:.migration-state.yaml > "$STATE_FILE.recovered" 2>/dev/null; then
      if yq eval '.' "$STATE_FILE.recovered" &> /dev/null 2>&1; then
        mv "$STATE_FILE.recovered" "$STATE_FILE"
        echo "✅ Recovered state file from git history"
      else
        echo "❌ Previous version is also corrupted"
        rm "$STATE_FILE.recovered"
        exit 1
      fi
    else
      echo "❌ No previous version found in git"
      echo "💡 Manual intervention required - consider reinitializing state"
      exit 1
    fi
  fi
fi
```

### Backup State Before Updates

```bash
#!/bin/bash
# Create backup before modifying state

PROJECT_PATH="$1"
STATE_FILE="$PROJECT_PATH/.migration-state.yaml"
BACKUP_FILE="$PROJECT_PATH/.migration-state.yaml.backup"

# Create backup
cp "$STATE_FILE" "$BACKUP_FILE"
echo "💾 Created state backup: $BACKUP_FILE"

# Backup is excluded from git
echo ".migration-state.yaml.backup" >> .gitignore
```

### Validate State After Modification

```bash
#!/bin/bash
# Validate state file after any modification

PROJECT_PATH="$1"
STATE_FILE="$PROJECT_PATH/.migration-state.yaml"

# Schema validation using Python
python3 << 'PYEOF'
import yaml
import sys
from datetime import datetime

required_fields = [
    'migrationId', 'branch', 'startedAt',
    'lastUpdatedAt', 'marketplaceVersion'
]

try:
    with open(sys.argv[1], 'r') as f:
        state = yaml.safe_load(f)

    # Check required fields
    missing = [f for f in required_fields if f not in state]
    if missing:
        print(f"❌ Missing required fields: {', '.join(missing)}")
        sys.exit(1)

    # Validate migrationId format
    import re
    if not re.match(r'^sb4-\d{8}-[a-z0-9]{8}$', state['migrationId']):
        print(f"❌ Invalid migrationId format: {state['migrationId']}")
        sys.exit(1)

    # Validate timestamps
    for ts_field in ['startedAt', 'lastUpdatedAt']:
        try:
            datetime.fromisoformat(state[ts_field].replace('Z', '+00:00'))
        except:
            print(f"❌ Invalid timestamp format in {ts_field}: {state[ts_field]}")
            sys.exit(1)

    # Validate validationStatus enum
    valid_statuses = ['NOT_RUN', 'PASSED', 'FAILED', 'PARTIAL']
    if 'validationStatus' in state and state['validationStatus'] not in valid_statuses:
        print(f"❌ Invalid validationStatus: {state['validationStatus']}")
        print(f"   Must be one of: {', '.join(valid_statuses)}")
        sys.exit(1)

    print("✅ State file is valid")

except yaml.YAMLError as e:
    print(f"❌ YAML parsing error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Validation error: {e}")
    sys.exit(1)
PYEOF "$STATE_FILE"
```

## Integration with Other Skills

### Integration with github-workflow

The `github-workflow` skill should check for existing state when checking out branches:

```bash
# In github-workflow skill
BRANCH_NAME="feature/spring-boot-4-migration"

# Check if branch exists
if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
  git checkout "$BRANCH_NAME"

  # Check for migration state
  if [ -f ".migration-state.yaml" ]; then
    echo "✅ Found existing migration state - resuming"
    # Read migration ID and progress
  fi
else
  git checkout -b "$BRANCH_NAME"
  # Initialize new state via migration-state skill
fi
```

### Integration with Migrator Skills

Each migrator skill should check state before applying transformations:

```bash
# In jackson-migrator skill
SKILL_NAME="jackson-migrator"
SKILL_VERSION="1.0.0"

# Check if already applied
if [ "$(is_transformation_applied "$PROJECT_PATH" "$SKILL_NAME")" = "true" ]; then
  APPLIED_VERSION=$(get_applied_skill_version "$PROJECT_PATH" "$SKILL_NAME")

  if [ "$APPLIED_VERSION" = "$SKILL_VERSION" ]; then
    echo "✅ $SKILL_NAME v$SKILL_VERSION already applied - skipping"
    exit 0
  else
    echo "⬆️  $SKILL_NAME upgrade detected: v$APPLIED_VERSION → v$SKILL_VERSION"
    echo "🔍 Checking for new transformations..."
  fi
fi

# Apply transformations...

# Update state
update_applied_transformations \
  "$PROJECT_PATH" \
  "$SKILL_NAME" \
  "$SKILL_VERSION" \
  "jackson-imports,jackson-groupid,jackson-exceptions" \
  "$(git rev-parse HEAD)"
```

## Critical Rules

1. **Always validate state after reading** - Detect corruption early
2. **Backup before updates** - Prevent data loss
3. **Commit atomically** - State and code together, never separately
4. **Branch-specific state** - Each migration branch has its own state
5. **Use YAML format** - More human-readable than JSON
6. **Schema validation** - Enforce required fields and formats
7. **Handle corrupted files gracefully** - Attempt recovery from backup/git
8. **Track marketplace version** - Enable upgrade detection
9. **Record commit SHAs** - Create audit trail
10. **Never force state updates** - If validation fails, fix the issue

## Dependencies

### Required Tools

- `yq` - YAML processor (preferred)
  - macOS: `brew install yq`
  - Linux: `apt-get install yq` or download from <https://github.com/mikefarah/yq>
- `python3` with `pyyaml` - Fallback YAML processor
  - Install: `pip3 install pyyaml`
- `git` - Version control

### Python YAML Utilities

If `yq` is not available, Python with PyYAML serves as fallback:

```bash
# Install PyYAML
pip3 install pyyaml

# Verify installation
python3 -c "import yaml; print('PyYAML installed')"
```

## Output Examples

### Successful Initialization

```text
✅ Initialized migration state: sb4-20260103-abc12345
📁 State file: /path/to/project/.migration-state.yaml
```

### Reading State

```text
📋 Reading migration state...

📌 Migration Summary:
   ID: sb4-20260103-abc12345
   Branch: feature/spring-boot-4-migration
   Marketplace: v1.2.0
   Applied Transformations: 2
   Validation: FAILED
```

### Updating State

```text
✅ Recorded transformation: jackson-migrator v1.0.0
   Transformations: jackson-imports,jackson-groupid,jackson-exceptions
   Commit: abc123def456
```

### Validation Update

```text
✅ Updated validation: FAILED
   Compile: ❌ FAILED (3 errors)
```

### Atomic Commit

```text
✅ Committed migration changes
   Skill: jackson-migrator v1.0.0
   Commit: abc123def456789
   Transformations: jackson-imports,jackson-groupid,jackson-exceptions
```
