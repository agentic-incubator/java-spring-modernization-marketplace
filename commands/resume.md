---
description: Resume an interrupted or failed migration from the last checkpoint
argument-hint: [project-path]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Resume Migration

Resume a Spring Boot migration from a saved checkpoint, applying only new or updated transformations.

## Usage

```bash
/spring-m11n:resume [project-path]
```

**Arguments:**

- `project-path` (optional): Path to the project to resume. Defaults to current directory.

## Prerequisites

- `.migration-state.yaml` file must exist in the project
- Migration branch must exist (locally or remotely)
- Git repository must be initialized

## What It Does

The resume command:

1. **Loads State** - Reads `.migration-state.yaml` from the repository
2. **Checks Out Branch** - Switches to the recorded migration branch
3. **Detects Upgrades** - Compares marketplace versions to identify new skills
4. **Determines Work** - Analyzes what's been applied vs. what's available
5. **Applies Changes** - Executes only pending transformations
6. **Validates** - Runs compilation to verify success
7. **Reports** - Shows detailed summary of skipped vs. applied work

## When to Use

Resume a migration when:

- **Marketplace Upgraded**: New versions of migration skills are available
- **Build Failed**: Previous migration had compilation errors
- **Partial Success**: Some transformations succeeded, others didn't
- **Interrupted**: Migration was stopped before completion
- **Manual Fixes**: You manually fixed issues and want to continue
- **Test Failures**: Need to re-run validation after fixes

## Idempotent Operations

The resume command is **fully idempotent**:

- **Same transformation + same version** → Skipped automatically
- **Same transformation + newer version** → Re-applied with new logic
- **New transformations** → Applied for the first time
- **Older version** → Skipped with warning (no downgrades)

This means you can safely run `/spring-m11n:resume` multiple times without creating duplicates or conflicts.

## Example Scenarios

### Scenario 1: Marketplace Upgrade

```text
Day 1: Initial migration
  /spring-m11n:migrate
  ├── Applied jackson-migrator v1.0.0
  ├── Applied spring-security-migrator v1.0.0
  └── Build failed with 3 errors

Day 2: Marketplace updated
  Marketplace: 1.2.0 → 1.3.0
  jackson-migrator: 1.0.0 → 1.1.0 (+1 transformation)
  spring-ai-migrator: NEW (v1.1.0)

Day 3: Resume migration
  /spring-m11n:resume
  ✓ Skipped: jackson-migrator v1.0.0 (already applied)
  ✓ Skipped: spring-security-migrator v1.0.0 (already applied)
  ✅ Applied: jackson-migrator v1.1.0 (new exception-handling transformation)
  ✅ Applied: spring-ai-migrator v1.1.0 (all transformations)
  ✓ Build: SUCCESS
```

### Scenario 2: Build Failure Recovery

```text
Initial migration failed:
  ✅ jackson-migrator: Applied
  ✅ spring-security-migrator: Applied
  ❌ Build: FAILED (3 compilation errors)

Manual fixes applied:
  - Fixed SecurityConfig.java syntax errors
  - Updated import statements
  - Resolved deprecation warnings

Resume migration:
  /spring-m11n:resume
  ✓ Skipped: jackson-migrator (already applied)
  ✓ Skipped: spring-security-migrator (already applied)
  🔄 Running validation...
  ✅ Build: SUCCESS
  ✅ Tests: PASSED
```

### Scenario 3: Partial Migration

```text
Migration interrupted after 2 skills:
  ✅ jackson-migrator
  ✅ spring-security-migrator
  ⏸️  Stopped (user interrupted)
  ⏭️  spring-ai-migrator (pending)
  ⏭️  vaadin-migrator (pending)

Resume migration:
  /spring-m11n:resume
  ✓ Skipped: jackson-migrator (already applied)
  ✓ Skipped: spring-security-migrator (already applied)
  ✅ Applied: spring-ai-migrator
  ⏭️  Skipped: vaadin-migrator (not applicable - no Vaadin found)
  ✅ Build: SUCCESS
```

## Output Format

### Resume Report

```text
═══════════════════════════════════════════════════════════════
                    MIGRATION RESUME REPORT
═══════════════════════════════════════════════════════════════

📂 Project: /path/to/project
🔀 Branch: feature/spring-boot-4-migration
📅 Started: 2026-01-03T10:30:00Z
🔄 Last Updated: 2026-01-03T11:45:00Z

📦 Marketplace: 1.2.0 → 1.3.0 (UPGRADED ✓)

✅ ALREADY APPLIED (skipped):
  - jackson-migrator v1.0.0 (2 transformations)
    • jackson-imports
    • jackson-groupid
  - spring-security-migrator v1.0.0 (2 transformations)
    • security-config
    • authorizations

🆕 NEW SINCE LAST RUN:
  - jackson-migrator v1.1.0: +1 transformation
  - spring-ai-migrator v1.1.0: 3 transformations (NEW SKILL)

🔄 APPLYING NEW TRANSFORMATIONS:
  ✅ jackson-migrator:exception-handling
  ✅ spring-ai-migrator:tts-model-rename
  ✅ spring-ai-migrator:speed-parameter
  ✅ spring-ai-migrator:advisor-constants

🔨 VALIDATION:
  ✅ Compile: SUCCESS (0 errors, 2 warnings)
  ✅ Tests: 150 passed, 0 failed

═══════════════════════════════════════════════════════════════
🎉 Migration resumed successfully!
═══════════════════════════════════════════════════════════════

Next steps:
  1. Review changes: git diff main
  2. Push branch: git push origin feature/spring-boot-4-migration
  3. Create PR: /spring-m11n:submit-pr
```

## State File Structure

The `.migration-state.yaml` file tracks all migration progress:

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

## Version Comparison Logic

The resume command uses semantic versioning to determine what to apply:

| Applied Version | Current Version | Action                         |
| --------------- | --------------- | ------------------------------ |
| Not applied     | Any version     | Apply all transformations      |
| 1.0.0           | 1.0.0           | Skip (already applied)         |
| 1.0.0           | 1.1.0           | Apply new transformations only |
| 1.1.0           | 1.0.0           | Skip (downgrade not supported) |
| 1.0.0           | 2.0.0           | Apply new transformations      |

### Transformation Diffing

For upgraded skills, only new transformations are applied:

```text
Skill: jackson-migrator
Applied: v1.0.0 → Current: v1.1.0

Applied transformations (v1.0.0):
  ✓ jackson-imports
  ✓ jackson-groupid

Available transformations (v1.1.0):
  ✓ jackson-imports (already applied)
  ✓ jackson-groupid (already applied)
  ✅ exception-handling (NEW - will be applied)

Result: Apply only exception-handling
```

## Workflow Integration

### After Manual Fixes

```bash
# You've manually fixed some issues
vim src/main/java/SecurityConfig.java
git add -A
git commit -m "fix: resolve security configuration issues"

# Resume migration to continue where you left off
/spring-m11n:resume
```

### After Marketplace Upgrade

```bash
# Update the marketplace
npm update -g @spring-modernization/marketplace

# Resume all in-progress migrations
cd /path/to/project1
/spring-m11n:resume

cd /path/to/project2
/spring-m11n:resume
```

### Batch Resume

Resume multiple projects:

```bash
# Resume all projects in a workspace
for project in /workspace/*/; do
  if [ -f "$project/.migration-state.yaml" ]; then
    echo "Resuming: $project"
    cd "$project"
    /spring-m11n:resume
  fi
done
```

## Error Handling

### State File Not Found

```text
Error: No migration state file found (.migration-state.yaml)

This project doesn't have an in-progress migration.

To start a new migration:
  /spring-m11n:migrate

To analyze without migrating:
  /spring-m11n:analyze
```

### Branch Not Found

```text
Error: Migration branch 'feature/spring-boot-4-migration' not found

The branch recorded in state doesn't exist locally or remotely.

Options:
  1. Recreate branch: git checkout -b feature/spring-boot-4-migration
  2. Update state file: Edit .migration-state.yaml with correct branch
  3. Start fresh: /spring-m11n:migrate
```

### Corrupted State File

```text
Error: Migration state file is corrupted

The .migration-state.yaml file has invalid YAML syntax.

Recovery options:
  1. Restore from backup: .migration-state.yaml.bak
  2. Check git history: git log --all --oneline .migration-state.yaml
  3. Start fresh migration: /spring-m11n:migrate
```

### Build Still Failing

```text
❌ Build: FAILED (5 compilation errors)

Migration applied successfully, but build still fails.

Errors:
  - SecurityConfig.java:45: cannot find symbol
  - UserService.java:123: incompatible types
  - ...

Next steps:
  1. Review errors: mvn clean compile
  2. Fix manually and commit
  3. Resume again: /spring-m11n:resume
```

## Comparison with Migrate Command

| Feature             | `/spring-m11n:migrate` | `/spring-m11n:resume`       |
| ------------------- | ---------------------- | --------------------------- |
| **When to use**     | Start new migration    | Continue existing migration |
| **Branch**          | Creates new branch     | Uses existing branch        |
| **State file**      | Creates new state      | Reads existing state        |
| **Transformations** | Applies all            | Applies only new/pending    |
| **Idempotency**     | Not idempotent         | Fully idempotent            |
| **Prerequisites**   | None                   | Requires .migration-state   |

## Advanced Usage

### Resume with Validation Only

Skip transformations and just re-run validation:

```bash
# If all transformations are already applied
/spring-m11n:resume --validate-only
```

### Resume Specific Skill

Resume only a specific skill:

```bash
# Apply only jackson-migrator updates
/spring-m11n:resume --skill jackson-migrator
```

### Dry Run

Preview what would be applied without making changes:

```bash
/spring-m11n:resume --dry-run
```

**Note**: These advanced options require skill implementation updates.

## CI/CD Integration

### GitHub Actions

```yaml
name: Resume Migration

on:
  workflow_dispatch: # Manual trigger
  schedule:
    - cron: '0 0 * * *' # Daily check

jobs:
  resume:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Check for migration state
        id: check
        run: |
          if [ -f ".migration-state.yaml" ]; then
            echo "has_state=true" >> $GITHUB_OUTPUT
          fi

      - name: Resume migration
        if: steps.check.outputs.has_state == 'true'
        run: |
          /spring-m11n:resume

      - name: Push updates
        if: steps.check.outputs.has_state == 'true'
        run: |
          git push origin $(git rev-parse --abbrev-ref HEAD)
```

### Jenkins Pipeline

```groovy
pipeline {
  agent any

  triggers {
    cron('H H * * *')  // Daily
  }

  stages {
    stage('Check for Migration') {
      steps {
        script {
          if (fileExists('.migration-state.yaml')) {
            env.HAS_MIGRATION = 'true'
          }
        }
      }
    }

    stage('Resume Migration') {
      when {
        expression { env.HAS_MIGRATION == 'true' }
      }
      steps {
        sh '/spring-m11n:resume'
      }
    }

    stage('Push Updates') {
      when {
        expression { env.HAS_MIGRATION == 'true' }
      }
      steps {
        sh 'git push origin $(git rev-parse --abbrev-ref HEAD)'
      }
    }
  }
}
```

## Best Practices

1. **Commit Before Resume**: Always commit manual fixes before resuming
2. **Review State File**: Check `.migration-state.yaml` to understand current status
3. **Test Incrementally**: Run tests after resume to catch issues early
4. **Keep Marketplace Updated**: Regularly update to get latest fixes
5. **Archive Old State**: Keep backups of state files for audit trail
6. **Branch Hygiene**: Delete old migration branches after successful merge
7. **Monitor Logs**: Review resume reports for skipped transformations
8. **Validate Often**: Run validation after each manual fix

## Troubleshooting

### Resume Does Nothing

```text
Problem: Resume runs but skips everything

Check:
  - Marketplace version in state matches current version
  - All transformations already applied
  - No new skills available

Solution:
  - Update marketplace: npm update
  - Check for new skills: ls skills/*-migrator/metadata.yaml
```

### Transformations Re-Applied

```text
Problem: Same transformations applied twice

Cause:
  - State file not committed
  - Branch mismatch
  - State file corrupted

Solution:
  - Ensure state file is committed after each transformation
  - Verify correct branch checked out
  - Check state file integrity: yq eval '.' .migration-state.yaml
```

### Version Mismatch

```text
Problem: Downgrade warning appears

Cause:
  - Marketplace downgraded
  - State file from newer marketplace

Solution:
  - Update marketplace to latest version
  - Review state file for correct versions
  - Consider starting fresh if major version mismatch
```

## Related Commands

- [`/spring-m11n:migrate`](./migrate.md) - Start a new migration
- [`/spring-m11n:validate`](./validate.md) - Run validation only
- [`/spring-m11n:analyze`](./analyze.md) - Analyze project for migration needs
- [`/spring-m11n:version-check`](./version-check.md) - Check current versions

## See Also

- [Resume Migration Skill](../skills/resume-migration/SKILL.md)
- [Migration State Skill](../skills/migration-state/SKILL.md)
- [Post-Merge Cleanup Skill](../skills/post-merge-cleanup/SKILL.md)
