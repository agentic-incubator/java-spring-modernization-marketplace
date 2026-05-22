---
name: github-actions-updater
description: >
  Update GitHub Actions workflow files: bump action versions (checkout, setup-java,
  cache, codeql-action) to current stable releases AND align Java versions with build
  file configurations. Use standalone when only GH Actions updates are needed, or as
  Step 8 of the java-maintenance-workflow skill.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# GitHub Actions Updater

Update GitHub Actions workflow files: action versions **and** Java version alignment.

## Instructions

When invoked, update GitHub Actions workflow files in two passes:

**Pass 1 — Action version bumps** (always run first):

1. **Bump `actions/checkout`** to `v6`
2. **Bump `actions/setup-java`** to `v5`
3. **Bump `actions/cache`** to `v5`
4. **Bump `github/codeql-action/*`** to `v3`

**Pass 2 — Java version alignment** (skip if only action bumps are needed):

1. **Update Java versions** — in setup-java action steps
2. **Update matrix strategies** — multi-version build matrices
3. **Update GraalVM versions** — if using GraalVM
4. **Preserve formatting** — maintain YAML structure and comments

---

## Action Version Bump Patterns

Current stable versions (May 2026):

| Action                           | Latest tag |
| -------------------------------- | ---------- |
| `actions/checkout`               | `v6`       |
| `actions/setup-java`             | `v5`       |
| `actions/cache`                  | `v5`       |
| `github/codeql-action/init`      | `v3`       |
| `github/codeql-action/autobuild` | `v3`       |
| `github/codeql-action/analyze`   | `v3`       |

### Sed patterns for bulk update

```bash
# Find all workflow files
WORKFLOWS=$(find .github/workflows -name "*.yml" -o -name "*.yaml" 2>/dev/null | sort)

# Update action versions
for f in $WORKFLOWS; do
  sed -i \
    -e 's|actions/checkout@v[0-9]*|actions/checkout@v6|g' \
    -e 's|actions/setup-java@v[0-9]*|actions/setup-java@v5|g' \
    -e 's|actions/cache@v[0-9]*|actions/cache@v5|g' \
    -e 's|github/codeql-action/\([a-z-]*\)@v[0-9]*|github/codeql-action/\1@v3|g' \
    "$f"
done

# Verify YAML is still valid
python3 -c "
import yaml, sys
for f in sys.argv[1:]:
    yaml.safe_load(open(f))
    print(f'OK: {f}')
" $WORKFLOWS
```

### Report what changed

```bash
git diff .github/workflows/ | grep '^[+-].*uses:' | grep -v '^---\|^+++'
```

## Update Patterns

### Direct Java Version Update

```yaml
# Before
- uses: actions/setup-java@v4
  with:
    distribution: temurin
    java-version: '21'

# After
- uses: actions/setup-java@v4
  with:
    distribution: temurin
    java-version: '25'
```

### Matrix Version Update

```yaml
# Before
strategy:
  matrix:
    java: [ '17', '21' ]

# After
strategy:
  matrix:
    java: [ '21', '25' ]
```

### Environment Variable Update

```yaml
# Before
env:
  JAVA_VERSION: '21'

# After
env:
  JAVA_VERSION: '25'
```

### GraalVM Version Update

```yaml
# Before
- uses: graalvm/setup-graalvm@v1
  with:
    java-version: '21'

# After
- uses: graalvm/setup-graalvm@v1
  with:
    java-version: '25'
```

## Update Strategies

### Strategy 1: Single Version Update

When build file specifies a single Java version:

1. Find all `java-version:` entries
2. Update to new target version
3. Update any matrix entries if present

### Strategy 2: Minimum Version Bump

When only bumping minimum version in matrix:

1. Find matrix java arrays
2. Remove versions below new minimum
3. Add new target version if not present

### Strategy 3: Full Matrix Update

When aligning entire matrix with build file:

1. Replace entire java matrix array
2. Preserve other matrix dimensions (os, etc.)

## YAML Edit Patterns

### Using Edit Tool for Precision Updates

For `java-version: '21'` to `java-version: '25'`:

```text
old_string: "java-version: '21'"
new_string: "java-version: '25'"
```

For `java-version: 21` (unquoted) to `java-version: 25`:

```text
old_string: "java-version: 21"
new_string: "java-version: 25"
```

For matrix arrays:

```text
old_string: "java: [ '17', '21' ]"
new_string: "java: [ '21', '25' ]"
```

### Handling Different Quote Styles

Workflows may use different quote styles:

```yaml
java-version: '21'     # Single quotes
java-version: "21"     # Double quotes
java-version: 21       # Unquoted
```

Preserve the original style when updating.

## Workflow File Locations

Update files in:

- `.github/workflows/*.yml` (root level)
- `.github/workflows/*.yaml` (root level)
- `**/.github/workflows/*.yml` (nested projects)
- `**/.github/workflows/*.yaml` (nested projects)

**Multi-Project Updates:**

For portfolio directories, update each project's workflows based on that project's build file Java version:

```text
portfolio/
├── project-a/
│   ├── .github/workflows/build.yml  # Update to match project-a's pom.xml
│   └── pom.xml                       # Java 25
├── project-b/
│   ├── .github/workflows/ci.yml     # Update to match project-b's build.gradle.kts
│   └── build.gradle.kts              # Java 21
```

## Update Order

1. **Read workflow files** - Parse all workflow YAML files
2. **Identify Java configs** - Find all setup-java steps
3. **Create backup** - Document original values
4. **Apply updates** - Edit each file
5. **Verify syntax** - Ensure valid YAML
6. **Report changes** - List all modifications

## Version Mapping

| Build File Java | GitHub Actions Target |
| --------------- | --------------------- |
| 17              | '17'                  |
| 21              | '21'                  |
| 22              | '22'                  |
| 23              | '23'                  |
| 24              | '24'                  |
| 25              | '25'                  |

## Distribution Preservation

When updating Java version, preserve the distribution:

```yaml
# Keep distribution unchanged
distribution: liberica # Don't change
java-version: '25' # Update this
```

Supported distributions:

- `temurin` (Eclipse Temurin, default)
- `liberica` (BellSoft Liberica)
- `corretto` (Amazon Corretto)
- `zulu` (Azul Zulu)
- `microsoft` (Microsoft OpenJDK)
- `oracle` (Oracle JDK)
- `dragonwell` (Alibaba Dragonwell)

## Action Version Updates

See **Action Version Bump Patterns** above for the full list of current stable versions
and the bulk-update sed commands. Action version bumps are now a primary capability of
this skill, not optional.

## Output Format

```json
{
  "updates": {
    "filesModified": [
      ".github/workflows/build.yml",
      ".github/workflows/codeql.yml",
      ".github/workflows/release.yml"
    ],
    "changes": [
      {
        "file": ".github/workflows/build.yml",
        "updates": [
          {
            "location": "jobs.build.steps[1].with.java-version",
            "from": "21",
            "to": "25"
          },
          {
            "location": "jobs.build.strategy.matrix.java",
            "from": ["17", "21"],
            "to": ["21", "25"]
          }
        ]
      },
      {
        "file": ".github/workflows/codeql.yml",
        "updates": [
          {
            "location": "jobs.analyze.steps[1].with.java-version",
            "from": "21",
            "to": "25"
          }
        ]
      },
      {
        "file": ".github/workflows/release.yml",
        "updates": [
          {
            "location": "jobs.publish-jars.steps[1].with.java-version",
            "from": "21",
            "to": "25"
          }
        ]
      }
    ],
    "totalChanges": 4
  },
  "validation": {
    "yamlValid": true,
    "allFilesUpdated": true
  }
}
```

## Error Handling

### Syntax Preservation

Maintain original YAML formatting:

- Preserve comments
- Maintain indentation style
- Keep blank lines where present

### Rollback Strategy

If update fails:

1. Document which files were modified
2. Provide original values for manual rollback
3. Report specific error location

## Common Update Scenarios

### Scenario 1: Spring Boot 4 Migration

Updating Java 21 to Java 25:

```yaml
# All workflows updated from
java-version: '21'
# To
java-version: '25'
```

### Scenario 2: Matrix Expansion

Adding new Java version to test matrix:

```yaml
# From
java: [ '21' ]
# To
java: [ '21', '25' ]
```

### Scenario 3: Minimum Version Bump

Removing old Java version from matrix:

```yaml
# From
java: [ '17', '21', '25' ]
# To
java: [ '21', '25' ]
```

## Integration with Build File Updates

After updating build files with build-file-updater:

1. **Read new Java version** from build file
2. **Detect current** GitHub Actions Java version
3. **Compare versions** and determine updates needed
4. **Apply updates** to all workflow files
5. **Verify alignment** between build and CI
