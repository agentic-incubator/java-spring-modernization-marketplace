---
name: documentation-migrator
description: Update cross-cutting documentation for Spring Boot 4.x migration. Updates README prerequisites, version references, getting-started guides, and generates aggregated documentation change reports. Use after code migrations to ensure documentation accuracy.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Documentation Migrator

Automatically update cross-cutting documentation to align with migrated code versions and generate aggregated reports of all documentation changes.

## What It Updates

This skill handles **cross-cutting** documentation updates that aren't specific to any single framework:

1. **Version Prerequisites** - Java, Spring Boot, framework version requirements
2. **Version References** - General version mentions in prose
3. **Getting Started Guides** - Installation and setup instructions
4. **Migration Guide Matrices** - Version compatibility tables
5. **Aggregated Reports** - Unified view of all documentation changes

## Integration with Migration Workflow

### Execution Order

```text
1. Code Migrations (parallel)
   ├─ jackson-migrator (includes jackson-docs)
   ├─ security-config-migrator (includes security-docs)
   ├─ spring-ai-migrator (includes spring-ai-docs)
   └─ vaadin-migrator (includes vaadin-docs)

2. Cross-Cutting Documentation ← THIS SKILL
   └─ documentation-migrator
      ├─ readme-prerequisites
      ├─ general-version-refs
      ├─ getting-started-guide
      ├─ migration-guide-versions
      └─ aggregate-doc-report

3. Validation & Commit
   └─ Atomic commit (code + docs + state)
```

### Reading Target Versions

This skill reads target versions from `.migration-state.yaml`:

```yaml
targetVersions:
  spring-boot: '4.0.0'
  jackson: '3.0.0'
  spring-security: '7.0.0'
  spring-ai: '2.0.0-M1'
  java: '21'
```

## Transformation Examples

### 1. README Prerequisites

**Before:**

```markdown
## Prerequisites

- Java 17 or higher
- Spring Boot 3.2.x
- Jackson 2.17+
- Maven 3.8+
```

**After:**

```markdown
## Prerequisites

- Java 21 or higher
- Spring Boot 4.0.x
- Jackson 3.0+
- Maven 3.9+
```

### 2. General Version References

**Before:**

```markdown
This application uses Spring Boot 3.2.1 with Java 17.
```

**After:**

```markdown
This application uses Spring Boot 4.0.0 with Java 21.
```

### 3. Getting Started Guide

**Before (docs/getting-started.md):**

```markdown
## Installation

1. Ensure you have Java 17 installed
2. Install Maven 3.8+
3. Clone the repository
```

**After:**

```markdown
## Installation

1. Ensure you have Java 21 installed
2. Install Maven 3.9+
3. Clone the repository
```

### 4. Migration Guide Version Matrix

**Before (docs/migrations.md):**

```markdown
| Component   | From   | To    |
| ----------- | ------ | ----- |
| Spring Boot | 3.2.1  | 3.5.x |
| Jackson     | 2.17.0 | TBD   |
```

**After:**

```markdown
| Component   | From   | To    |
| ----------- | ------ | ----- |
| Spring Boot | 3.2.1  | 4.0.0 |
| Jackson     | 2.17.0 | 3.0.2 |
```

## Supported File Types

- **Markdown** (.md) - README, docs, CONTRIBUTING, CHANGELOG
- **Text files** (.txt) - Plain text documentation
- **Documentation directories** - docs/, .github/, etc.

## Detection Patterns

Each transformation uses specific detection patterns:

| Transformation             | Detection Pattern                       |
| -------------------------- | --------------------------------------- | ----------------- | -------- |
| `readme-prerequisites`     | `README\.md.\*(Prerequisites?           | Requirements?)`   |
| `general-version-refs`     | `Spring Boot 3\.[0-9]+                  | Jackson 2\.[0-9]+ | Java 17` |
| `getting-started-guide`    | `docs/getting-started\.md.*Java 17`     |
| `migration-guide-versions` | `docs/migrations\.md.*Spring Boot.*3\.` |
| `aggregate-doc-report`     | `\.migration-state\.yaml`               |

## Aggregated Reporting

The `aggregate-doc-report` transformation generates a unified report showing all documentation changes:

### Report Structure

**File:** `.migration-summary/docs-changes.md`

```markdown
# Documentation Migration Summary

Migration ID: sb4-20260103-abc12345
Generated: 2026-01-03T11:00:00Z

## Overview

- Total files updated: 4
- Total lines changed: 134
- Skills with doc changes: 3

## Changes by Skill

### jackson-migrator (v1.2.0)

Files: docs/migrations.md, README.md
Lines: 45
Examples updated: 8 Jackson import/exception patterns

### security-config-migrator (v1.1.0)

Files: docs/migrations.md
Lines: 22
Examples updated: 3 Security config patterns

### documentation-migrator (v1.0.0)

Files: README.md, docs/getting-started.md
Lines: 67
General updates: Prerequisites, version references

## Files Modified

| File                    | Skills                 | Lines | Examples |
| ----------------------- | ---------------------- | ----- | -------- |
| README.md               | jackson, docs-migrator | 28    | 2        |
| docs/getting-started.md | docs-migrator          | 30    | 0        |
| docs/migrations.md      | jackson, security      | 76    | 9        |
```

### Data Sources

The aggregated report reads from:

1. **Migration state file** (`.migration-state.yaml`):

   ```yaml
   appliedTransformations:
     - skill: jackson-migrator
       documentationChanges:
         filesUpdated: [docs/migrations.md, README.md]
         linesChanged: 45
         examplesUpdated: 8
   ```

2. **Individual skill states**: Collects data from all skills with documentation changes

3. **File system**: Verifies which files were actually modified

## State Tracking

Documentation changes are tracked in the state file:

```yaml
appliedTransformations:
  - skill: documentation-migrator
    version: 1.0.0
    transformations:
      - readme-prerequisites
      - general-version-refs
      - getting-started-guide
      - migration-guide-versions
      - aggregate-doc-report
    completedAt: '2026-01-03T11:00:00Z'
    commitSha: 'ghi789jkl012'
    documentationChanges:
      filesUpdated:
        - README.md
        - docs/getting-started.md
        - docs/migrations.md
      linesChanged: 67
      examplesUpdated: 0

# Aggregated state across all skills
documentationState:
  totalFilesUpdated: 4
  totalLinesChanged: 134
  skillsWithDocChanges:
    - jackson-migrator
    - security-config-migrator
    - documentation-migrator
  reportLocation: '.migration-summary/docs-changes.md'
```

## Coordination with Skill-Specific Documentation Updates

### Responsibility Matrix

To prevent duplication, clear boundaries are established:

| File/Section                      | Responsible Skill        | Detection Pattern     |
| --------------------------------- | ------------------------ | --------------------- |
| **README.md**                     |                          |                       |
| Prerequisites section             | documentation-migrator   | Prerequisites header  |
| General version refs              | documentation-migrator   | Version mentions      |
| Jackson examples                  | jackson-migrator         | com.fasterxml.jackson |
| Security examples                 | security-config-migrator | VaadinWebSecurity     |
| **docs/migrations.md**            |                          |                       |
| Version matrix                    | documentation-migrator   | Version table         |
| ## Jackson 2.x to 3.x section     | jackson-migrator         | Section header        |
| ## Spring Security 6 to 7 section | security-config-migrator | Section header        |
| **docs/getting-started.md**       |                          |                       |
| All content                       | documentation-migrator   | General version refs  |

### Section-Based Updates

Skills update documentation within their domain sections:

```markdown
# docs/migrations.md

## Version Compatibility Matrix

← Updated by documentation-migrator

## Jackson 2.x to 3.x Migration

← Updated by jackson-migrator

### Import Changes

...code examples...

## Spring Security 6 to 7 Migration

← Updated by security-config-migrator

### Configuration Changes

...code examples...
```

## Idempotent Operations

Like all migrator skills, documentation-migrator is idempotent:

1. **Check State** - Load `.migration-state.yaml`
2. **Detect Changes** - Use regex patterns to find outdated docs
3. **Read Target Versions** - From `targetVersions` in state
4. **Apply Updates** - Transform documentation
5. **Record State** - Update `appliedTransformations`
6. **Validate** - Check markdown syntax

### Skip Logic

```bash
# Check if transformation already applied
if transformation_applied "documentation-migrator" "readme-prerequisites"; then
  echo "✅ README prerequisites already updated - skipping"
  exit 0
fi

# Check if detection pattern matches
if ! grep -q "Java 17" README.md; then
  echo "✅ No Java 17 references found - skipping"
  exit 0
fi

# Apply transformation
echo "🔄 Updating README prerequisites..."
```

## When to Use

- **After code migration** - Keep docs aligned with migrated code
- **During PR review** - Ensure documentation is updated
- **Portfolio migrations** - Consistent docs across repos
- **Documentation audits** - Find version mismatches

## Integration with Migration State Skill

This skill depends on the `migration-state` skill (v1.1.0+) for:

- Reading `.migration-state.yaml`
- Checking applied transformations
- Reading target versions
- Updating state after successful transformation
- Tracking documentation changes separately

See `skills/migration-state/SKILL.md` for state management details.

## Critical Rules

1. **Read target versions from state** - Never hardcode versions
2. **Run after code migrators** - Ensure code is migrated first
3. **Preserve markdown formatting** - Don't break syntax
4. **Update general content only** - Don't touch skill-specific sections
5. **Track all changes** - Record in state file
6. **Validate before commit** - Check markdown syntax
7. **Generate aggregated report** - Unified view of all changes
8. **Idempotent by default** - Safe to rerun multiple times

## Dependencies

### Required Skills

- `migration-state` (v1.1.0+) - State management with documentation tracking

### Optional Skills

All skill-specific migrators are optional dependencies:

- `jackson-migrator` (v1.2.0+) - For Jackson transformations
- `security-config-migrator` (v1.1.0+) - For Security transformations
- `spring-ai-migrator` (v2.1.0+) - For Spring AI transformations
- `vaadin-migrator` (v1.1.0+) - For Vaadin transformations

The documentation-migrator runs whether or not these skills executed, aggregating whatever documentation changes exist in the state file.

## Example Workflow

```bash
# 1. Code migrations run first (automatic)
# jackson-migrator, security-config-migrator, etc.

# 2. Documentation migrator runs (automatic)
# Reads target versions from state
# Updates cross-cutting documentation
# Generates aggregated report

# 3. Review changes
git diff README.md docs/

# 4. Verify aggregated report
cat .migration-summary/docs-changes.md

# 5. Commit (atomic with code)
# State file committed with changes
```

## Output Report Example

```text
📚 Documentation Migration Complete

Cross-Cutting Updates:
  ✅ readme-prerequisites: 15 version references
  ✅ general-version-refs: 23 mentions across 5 files
  ✅ getting-started-guide: 8 prerequisite updates
  ✅ migration-guide-versions: 2 tables updated

Aggregated Report Generated:
  📄 .migration-summary/docs-changes.md

Files Updated: 4
  - README.md (28 lines)
  - docs/getting-started.md (30 lines)
  - docs/migrations.md (76 lines across multiple skills)
  - docs/prerequisites.md (6 lines)

Total Documentation Changes:
  📊 Skills with changes: 3
  📝 Total lines changed: 134
  🔧 Total code examples: 11
  ✅ Version consistency verified
```

## Validation

After applying transformations:

1. **Markdown Syntax** - Ensure no syntax errors introduced
2. **Version Consistency** - Verify all versions match `targetVersions`
3. **Broken Links** - Check internal links still resolve (optional)
4. **Report Generation** - Ensure aggregated report created successfully

## Best Practices

1. **Always run after code migrations** - Documentation should reflect actual code state
2. **Review the aggregated report** - Provides overview of all documentation changes
3. **Check for manual edits** - Some docs may need human review
4. **Preserve custom content** - Only update version-specific information
5. **Test markdown rendering** - Ensure docs render correctly after updates
