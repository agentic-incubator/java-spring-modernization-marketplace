---
name: post-merge-cleanup
description: Clean up migration state files after successful PR merge. Detects merge to main/master branch and archives or removes .migration-state.yaml. Use after migration PRs are merged.
allowed-tools: Read, Write, Bash, Grep, Glob
---

# Post-Merge Cleanup Skill

Automatically clean up migration state files after successful PR merge to main branch.

## Overview

This skill handles cleanup operations after a migration pull request has been successfully merged:

- Detects successful PR merge to main/master
- Removes `.migration-state.yaml` from main branch
- Optionally archives state for audit trail
- Ensures clean repository state post-migration

## When to Use

This skill should be invoked:

1. **Automatically** - Via git hooks (post-merge hook)
2. **Manually** - After manually merging a migration PR
3. **Scheduled** - As part of CI/CD cleanup jobs
4. **On-demand** - When cleaning up old migration artifacts

## Merge Detection

### Detect Successful Merge to Main

```bash
# Check current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Check if on main/master
if [[ "$CURRENT_BRANCH" != "main" && "$CURRENT_BRANCH" != "master" ]]; then
  echo "Not on main/master branch (current: $CURRENT_BRANCH)"
  echo "Cleanup only runs on main/master after merge"
  exit 0
fi

# Check if last commit was a merge
LAST_COMMIT_MESSAGE=$(git log -1 --pretty=%B)
IS_MERGE_COMMIT=$(git rev-list --parents -n 1 HEAD | awk '{print NF-1}')

if [ "$IS_MERGE_COMMIT" -eq 1 ]; then
  echo "Last commit is NOT a merge commit"
  echo "Cleanup only runs after merge commits"
  exit 0
fi

# Extract merged branch from commit message
# Typical format: "Merge pull request #123 from user/feature/spring-boot-4-migration"
MERGED_BRANCH=$(echo "$LAST_COMMIT_MESSAGE" | grep -oE "from [^/]+/[^/]+/[^ ]+" | sed 's/from //')

echo "Detected merge:"
echo "  Target branch: $CURRENT_BRANCH"
echo "  Source branch: $MERGED_BRANCH"
echo "  Merge commit:  $(git rev-parse HEAD)"
```

### Identify Migration Merge

Detect if the merge was for a migration branch:

```bash
# Check if merged branch was a migration branch
if [[ "$MERGED_BRANCH" =~ spring-boot.*migration ]] || \
   [[ "$MERGED_BRANCH" =~ sb4.*migration ]] || \
   [[ "$LAST_COMMIT_MESSAGE" =~ "migration" ]]; then
  echo "Migration merge detected"
  IS_MIGRATION_MERGE=true
else
  echo "Not a migration merge"
  IS_MIGRATION_MERGE=false
fi

# Alternative: Check if state file exists
if [ -f ".migration-state.yaml" ]; then
  echo "Migration state file found - cleanup needed"
  IS_MIGRATION_MERGE=true
fi
```

## State File Detection

Check for migration state files that need cleanup:

```bash
# Find all migration state files
STATE_FILES=$(find . -maxdepth 2 -name ".migration-state.yaml" -o -name ".migration-state.yml")

if [ -z "$STATE_FILES" ]; then
  echo "No migration state files found"
  exit 0
fi

echo "Found state files to clean up:"
echo "$STATE_FILES"
```

## Cleanup Operations

### 1. Archive State for Audit Trail

Before removing, create an archive copy:

```bash
# Create archive directory
ARCHIVE_DIR=".migration-archive"
mkdir -p "$ARCHIVE_DIR"

# Add to .gitignore if not already there
if ! grep -q "^\.migration-archive/$" .gitignore 2>/dev/null; then
  echo ".migration-archive/" >> .gitignore
  echo "Added $ARCHIVE_DIR to .gitignore"
fi

# Archive the state file
if [ -f ".migration-state.yaml" ]; then
  # Generate archive filename with timestamp
  TIMESTAMP=$(date +%Y%m%d_%H%M%S)
  MIGRATION_ID=$(yq eval '.migrationId' .migration-state.yaml 2>/dev/null || echo "unknown")
  ARCHIVE_FILE="$ARCHIVE_DIR/migration-state-${MIGRATION_ID}-${TIMESTAMP}.yaml"

  # Copy to archive
  cp .migration-state.yaml "$ARCHIVE_FILE"
  echo "Archived state file: $ARCHIVE_FILE"

  # Create summary file
  cat > "$ARCHIVE_DIR/migration-state-${MIGRATION_ID}-${TIMESTAMP}.summary.txt" << EOF
Migration Archive Summary
=========================

Migration ID: $MIGRATION_ID
Archived At: $(date -u +%Y-%m-%dT%H:%M:%SZ)
Merged Commit: $(git rev-parse HEAD)
Merged Branch: $MERGED_BRANCH
Target Branch: $CURRENT_BRANCH

Migration Details:
$(yq eval '.' .migration-state.yaml)

Commit History:
$(git log --oneline --grep="migration" -10)

EOF

  echo "Created summary: $ARCHIVE_DIR/migration-state-${MIGRATION_ID}-${TIMESTAMP}.summary.txt"
fi
```

### 2. Remove State File

Remove the state file from the main branch:

```bash
# Remove state file
if [ -f ".migration-state.yaml" ]; then
  echo "Removing .migration-state.yaml from main branch"
  rm .migration-state.yaml

  # Commit removal
  git add .migration-state.yaml
  git commit -m "chore: clean up migration state after merge

Migration ID: $MIGRATION_ID
Merged from: $MERGED_BRANCH
Archived to: $ARCHIVE_FILE

[skip ci]" --no-verify

  echo "State file removed and committed"
else
  echo "No state file to remove"
fi
```

### 3. Clean Up Backup Branches (Optional)

Optionally remove backup/pre-migration branches:

```bash
# List backup branches
BACKUP_BRANCHES=$(git branch --list "backup/pre-migration*")

if [ -n "$BACKUP_BRANCHES" ]; then
  echo ""
  echo "Found backup branches:"
  echo "$BACKUP_BRANCHES"

  # Prompt user (in interactive mode)
  # Or auto-delete if in automated mode
  read -p "Delete backup branches? (y/N): " -n 1 -r
  echo

  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "$BACKUP_BRANCHES" | while read branch; do
      git branch -D "$branch"
      echo "Deleted: $branch"
    done
  fi
fi
```

### 4. Update .gitignore

Ensure state files are ignored on main:

```bash
# Check if .gitignore has migration state pattern
if ! grep -q "^\.migration-state\.ya*ml$" .gitignore 2>/dev/null; then
  echo "" >> .gitignore
  echo "# Migration state files (committed on migration branches only)" >> .gitignore
  echo ".migration-state.yaml" >> .gitignore
  echo ".migration-state.yml" >> .gitignore

  git add .gitignore
  git commit -m "chore: add migration state files to .gitignore [skip ci]" --no-verify

  echo "Updated .gitignore to ignore migration state files"
fi
```

## Git Hook Integration

### Post-Merge Hook

Install as a git hook for automatic cleanup:

```bash
# .git/hooks/post-merge

#!/bin/bash
# Post-merge hook for migration state cleanup

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Only run on main/master
if [[ "$CURRENT_BRANCH" != "main" && "$CURRENT_BRANCH" != "master" ]]; then
  exit 0
fi

# Check if state file exists
if [ ! -f ".migration-state.yaml" ]; then
  exit 0
fi

echo "Post-merge cleanup: Migration state file detected"

# Run cleanup skill
claude-code skill run post-merge-cleanup

exit 0
```

Make it executable:

```bash
chmod +x .git/hooks/post-merge
```

### GitHub Actions Cleanup

Automated cleanup in CI/CD:

```yaml
# .github/workflows/post-merge-cleanup.yml
name: Post-Merge Cleanup

on:
  push:
    branches:
      - main
      - master

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2 # Need parent commit

      - name: Check for migration state
        id: check_state
        run: |
          if [ -f ".migration-state.yaml" ]; then
            echo "state_exists=true" >> $GITHUB_OUTPUT
          else
            echo "state_exists=false" >> $GITHUB_OUTPUT
          fi

      - name: Archive and remove state
        if: steps.check_state.outputs.state_exists == 'true'
        run: |
          # Install yq
          wget https://github.com/mikefarah/yq/releases/latest/download/yq_linux_amd64 -O /usr/local/bin/yq
          chmod +x /usr/local/bin/yq

          # Run cleanup
          mkdir -p .migration-archive

          MIGRATION_ID=$(yq eval '.migrationId' .migration-state.yaml)
          TIMESTAMP=$(date +%Y%m%d_%H%M%S)

          cp .migration-state.yaml ".migration-archive/migration-state-${MIGRATION_ID}-${TIMESTAMP}.yaml"
          rm .migration-state.yaml

          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add .migration-state.yaml .migration-archive/
          git commit -m "chore: clean up migration state after merge [skip ci]"
          git push
```

## Cleanup Report

Generate a summary of cleanup operations:

```bash
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "              POST-MERGE CLEANUP REPORT"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Branch: $CURRENT_BRANCH"
echo "Merge Commit: $(git rev-parse --short HEAD)"
echo "Merged From: $MERGED_BRANCH"
echo ""
echo "CLEANUP OPERATIONS:"
echo ""

if [ -f "$ARCHIVE_FILE" ]; then
  echo "✓ Archived state file:"
  echo "    $ARCHIVE_FILE"
  echo ""
fi

if [ ! -f ".migration-state.yaml" ]; then
  echo "✓ Removed .migration-state.yaml from main branch"
  echo ""
fi

if grep -q "\.migration-state\.yaml" .gitignore 2>/dev/null; then
  echo "✓ Updated .gitignore (state files ignored on main)"
  echo ""
fi

echo "ARCHIVED MIGRATION SUMMARY:"
if [ -f "$ARCHIVE_FILE" ]; then
  echo ""
  echo "  Migration ID: $(yq eval '.migrationId' "$ARCHIVE_FILE")"
  echo "  Started:      $(yq eval '.startedAt' "$ARCHIVE_FILE")"
  echo "  Completed:    $(yq eval '.lastUpdatedAt' "$ARCHIVE_FILE")"
  echo "  Marketplace:  $(yq eval '.marketplaceVersion' "$ARCHIVE_FILE")"
  echo ""
  echo "  Applied Skills:"
  yq eval '.appliedTransformations[] | "    - " + .skill + " v" + .version' "$ARCHIVE_FILE"
  echo ""
  echo "  Validation:   $(yq eval '.validationStatus' "$ARCHIVE_FILE")"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "Cleanup complete. Main branch is clean."
echo "═══════════════════════════════════════════════════════════════"
```

## Branch-Specific State Handling

Handle state files on different branches:

```text
┌─────────────────────────────────────────────────────────────────┐
│                 BRANCH-SPECIFIC STATE HANDLING                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  MIGRATION BRANCH (feature/spring-boot-4-migration):            │
│    - .migration-state.yaml IS committed                         │
│    - State tracks progress during migration                     │
│    - Updated after each transformation                          │
│                                                                  │
│  MAIN/MASTER BRANCH:                                            │
│    - .migration-state.yaml is in .gitignore                     │
│    - State file cleaned up after PR merge                       │
│    - Archive kept in .migration-archive/ (gitignored)           │
│                                                                  │
│  MERGE FLOW:                                                    │
│    1. PR merged: feature/* → main                               │
│    2. Post-merge hook triggered                                 │
│    3. Detect state file in main                                 │
│    4. Archive to .migration-archive/                            │
│    5. Remove from main                                          │
│    6. Commit removal                                            │
│    7. Update .gitignore                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Cleanup Modes

Support different cleanup modes:

```bash
# Parse cleanup mode from arguments
MODE="${1:-archive}"  # Default: archive

case "$MODE" in
  archive)
    echo "Mode: ARCHIVE - State file will be archived before removal"
    ARCHIVE=true
    REMOVE=true
    ;;

  remove-only)
    echo "Mode: REMOVE ONLY - State file will be removed without archiving"
    ARCHIVE=false
    REMOVE=true
    ;;

  archive-only)
    echo "Mode: ARCHIVE ONLY - State file will be archived but not removed"
    ARCHIVE=true
    REMOVE=false
    ;;

  dry-run)
    echo "Mode: DRY RUN - Show what would be cleaned up"
    ARCHIVE=false
    REMOVE=false
    ;;

  *)
    echo "Unknown mode: $MODE"
    echo "Valid modes: archive, remove-only, archive-only, dry-run"
    exit 1
    ;;
esac
```

## Audit Trail

Maintain detailed audit trail of cleanups:

```bash
# Create audit log
AUDIT_LOG=".migration-archive/cleanup-audit.log"

cat >> "$AUDIT_LOG" << EOF
---
Cleanup Event: $(date -u +%Y-%m-%dT%H:%M:%SZ)
Migration ID: $MIGRATION_ID
Merged Branch: $MERGED_BRANCH
Merge Commit: $(git rev-parse HEAD)
Cleanup Mode: $MODE
Archived To: $ARCHIVE_FILE
Performed By: $(git config user.name) <$(git config user.email)>

Migration Summary:
$(yq eval '.appliedTransformations[] | .skill + " v" + .version + " (" + (.transformations | join(", ")) + ")"' "$ARCHIVE_FILE")

---

EOF

echo "Logged cleanup event to: $AUDIT_LOG"
```

## Error Handling

### State File Not Found

```bash
if [ ! -f ".migration-state.yaml" ]; then
  echo "Info: No migration state file found"
  echo "Nothing to clean up"
  exit 0
fi
```

### Archive Directory Issues

```bash
if [ ! -d "$ARCHIVE_DIR" ]; then
  echo "Creating archive directory: $ARCHIVE_DIR"
  mkdir -p "$ARCHIVE_DIR"

  if [ $? -ne 0 ]; then
    echo "Error: Failed to create archive directory"
    echo "Skipping archive step"
    ARCHIVE=false
  fi
fi
```

### Git Commit Failures

```bash
# Attempt cleanup commit
git add .migration-state.yaml
if ! git commit -m "chore: clean up migration state after merge [skip ci]" --no-verify; then
  echo "Warning: Failed to commit state file removal"
  echo "You may need to commit manually:"
  echo "  git add .migration-state.yaml"
  echo "  git commit -m 'chore: clean up migration state'"
fi
```

### Permission Issues

```bash
# Check write permissions
if [ ! -w "." ]; then
  echo "Error: No write permission in current directory"
  echo "Cannot perform cleanup"
  exit 1
fi
```

## Integration Points

### With Resume Migration

The cleanup skill complements the resume migration skill:

- **Resume Migration**: Loads `.migration-state.yaml` to continue work
- **Post-Merge Cleanup**: Removes `.migration-state.yaml` after successful merge

### With Migration Orchestrator

Cleanup can be triggered automatically by the orchestrator:

```bash
# In migrate-github skill, after successful PR merge:
if [ "$PR_MERGED" = true ]; then
  echo "Running post-merge cleanup..."
  # Switch to main branch
  git checkout main
  git pull

  # Run cleanup
  claude-code skill run post-merge-cleanup
fi
```

## Critical Rules

1. **Main Branch Only**: Cleanup only runs on main/master branches
2. **Merge Detection**: Only cleanup after merge commits
3. **Archive First**: Always archive before removing (unless mode=remove-only)
4. **Atomic Operations**: Commit state removal separately from other changes
5. **Audit Trail**: Maintain detailed log of all cleanup operations
6. **No Force Delete**: Never force-delete without archiving
7. **Gitignore Update**: Ensure state files ignored on main after cleanup
8. **Hook Installation**: Install git hooks for automated cleanup
9. **CI/CD Integration**: Support cleanup in automated workflows
10. **Error Recovery**: Gracefully handle missing files or permissions issues

## Usage Examples

### Manual Cleanup

```bash
# After merging a migration PR
git checkout main
git pull

# Run cleanup with archive (default)
claude-code skill run post-merge-cleanup

# Or specify mode
claude-code skill run post-merge-cleanup archive-only
```

### Automated Cleanup (Git Hook)

```bash
# Install post-merge hook
cat > .git/hooks/post-merge << 'EOF'
#!/bin/bash
if [ -f ".migration-state.yaml" ]; then
  claude-code skill run post-merge-cleanup
fi
EOF

chmod +x .git/hooks/post-merge
```

### Batch Cleanup

Clean up multiple repositories:

```bash
# For each repository
for repo in repo1 repo2 repo3; do
  cd "$repo"
  git checkout main
  git pull

  if [ -f ".migration-state.yaml" ]; then
    echo "Cleaning up: $repo"
    claude-code skill run post-merge-cleanup
  fi

  cd ..
done
```

## Future Enhancements

Potential improvements for future versions:

1. **Remote Archive**: Upload archived states to S3/artifact storage
2. **Metrics Collection**: Track migration success rates and durations
3. **Notification**: Send alerts when cleanup completes
4. **Verification**: Verify migration was successful before cleanup
5. **Rollback Support**: Keep state for N days before permanent deletion
6. **Multi-Branch**: Support cleaning up multiple migration branches at once
