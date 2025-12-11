---
name: github-actions-updater
description: Update Java versions in GitHub Actions workflow files to align with build file configurations. Use when migrating Java versions and ensuring CI/CD pipelines match project requirements.
allowed-tools: Read, Write, Edit, Glob, Grep
---

# GitHub Actions Updater

Update Java versions and related configurations in GitHub Actions workflow files.

## Instructions

When invoked, update GitHub Actions workflow files to align Java versions with build file configurations:

1. **Update Java versions** - In setup-java action steps
2. **Update matrix strategies** - Multi-version build matrices
3. **Update GraalVM versions** - If using GraalVM
4. **Preserve formatting** - Maintain YAML structure and comments

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

```
old_string: "java-version: '21'"
new_string: "java-version: '25'"
```

For `java-version: 21` (unquoted) to `java-version: 25`:

```
old_string: "java-version: 21"
new_string: "java-version: 25"
```

For matrix arrays:

```
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

```
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

Optionally update action versions:

```yaml
# Before
- uses: actions/setup-java@v3

# After (optional)
- uses: actions/setup-java@v4
```

Only update if requested and if newer version supports the target Java version.

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
