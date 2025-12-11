---
name: github-actions-detector
description: Detect Java versions and build configurations from GitHub Actions workflow files (.github/workflows/*.yml). Use when analyzing CI/CD pipelines for version alignment with build files.
allowed-tools: Read, Glob, Grep
---

# GitHub Actions Detector

Detect Java versions and build configurations from GitHub Actions workflow files.

## Instructions

When invoked, scan the `.github/workflows/` directory for workflow files and extract:

1. **Java Version** - From `actions/setup-java` steps
2. **Java Distribution** - temurin, liberica, corretto, zulu, etc.
3. **Build Commands** - Maven/Gradle commands being executed
4. **Matrix Configurations** - Multiple Java versions in strategy matrix

## Detection Locations

Search for workflow files recursively:

- `.github/workflows/*.yml` (root level)
- `.github/workflows/*.yaml` (root level)
- `**/.github/workflows/*.yml` (nested projects)
- `**/.github/workflows/*.yaml` (nested projects)

**Multi-Project Detection:**

For monorepos or portfolio directories, scan all subdirectories for `.github/workflows/` folders. Each project may have its own CI configuration.

## Detection Patterns

### Java Version from setup-java Action

```yaml
- uses: actions/setup-java@v4
  with:
    distribution: temurin
    java-version: '21'
```

### Java Version from Matrix Strategy

```yaml
strategy:
  matrix:
    java: ['17', '21', '25']
steps:
  - uses: actions/setup-java@v4
    with:
      java-version: ${{ matrix.java }}
```

### Java Version as Environment Variable

```yaml
env:
  JAVA_VERSION: '21'

steps:
  - uses: actions/setup-java@v4
    with:
      java-version: ${{ env.JAVA_VERSION }}
```

### GraalVM Setup

```yaml
- uses: graalvm/setup-graalvm@v1
  with:
    java-version: '21'
    distribution: 'graalvm'
```

## Version Extraction Patterns

### Direct Version

```yaml
java-version: '21'      # Extracts: 21
java-version: 21        # Extracts: 21
java-version: "17"      # Extracts: 17
```

### Matrix Reference

```yaml
java-version: ${{ matrix.java }} # Look up in strategy.matrix.java
```

### Environment Reference

```yaml
java-version: ${{ env.JAVA_VERSION }} # Look up in env block
```

## Output Format

```json
{
  "githubActions": {
    "present": true,
    "workflowsFound": [
      ".github/workflows/build.yml",
      ".github/workflows/codeql.yml",
      ".github/workflows/release.yml"
    ],
    "javaConfigurations": [
      {
        "workflow": ".github/workflows/build.yml",
        "workflowName": "Java CI",
        "jobs": [
          {
            "jobName": "build",
            "action": "actions/setup-java@v4",
            "distribution": "liberica",
            "javaVersions": ["25"],
            "isMatrix": true
          }
        ]
      },
      {
        "workflow": ".github/workflows/codeql.yml",
        "workflowName": "CodeQL",
        "jobs": [
          {
            "jobName": "analyze",
            "action": "actions/setup-java@v4",
            "distribution": "liberica",
            "javaVersions": ["25"],
            "isMatrix": false
          }
        ]
      },
      {
        "workflow": ".github/workflows/release.yml",
        "workflowName": "Publish package to GitHub Packages",
        "jobs": [
          {
            "jobName": "publish-jars",
            "action": "actions/setup-java@v4",
            "distribution": "liberica",
            "javaVersions": ["25"],
            "isMatrix": false
          }
        ]
      }
    ],
    "summary": {
      "totalWorkflows": 3,
      "workflowsWithJava": 3,
      "javaVersionsFound": ["25"],
      "distributions": ["liberica"],
      "setupJavaActions": ["actions/setup-java@v4"]
    },
    "versionAlignment": {
      "buildFileJavaVersion": "21",
      "githubActionsJavaVersions": ["25"],
      "aligned": false,
      "recommendation": "Update build file Java version from 21 to 25, or update GitHub Actions to use Java 21"
    }
  }
}
```

## Build File Comparison

When comparing with build files, extract Java version from:

### Maven (pom.xml)

```xml
<properties>
    <java.version>21</java.version>
</properties>
```

Or:

```xml
<maven.compiler.source>21</maven.compiler.source>
<maven.compiler.target>21</maven.compiler.target>
```

### Gradle

```kotlin
java {
    sourceCompatibility = JavaVersion.VERSION_21
}
```

Or:

```kotlin
java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(21))
    }
}
```

## Workflow Analysis Steps

1. **Find Workflows**: Glob for `.github/workflows/*.yml`, `.github/workflows/*.yaml`, and recursively `**/.github/workflows/*.yml` / `**/.github/workflows/*.yaml`
2. **Find Build Files**: Glob for `pom.xml`, `**/pom.xml`, `build.gradle`, `build.gradle.kts`, `**/build.gradle`, `**/build.gradle.kts`
3. **Parse Each Workflow**: Read and extract workflow name, jobs, and steps
4. **Extract Java Config**: Find `setup-java` or `setup-graalvm` actions
5. **Resolve Variables**: Expand matrix and env references
6. **Associate with Projects**: Match workflows to their corresponding build files (in same directory or parent)
7. **Compare Versions**: Check alignment with each project's build file Java version
8. **Report Findings**: Generate structured output with recommendations per project

## Nested Project Detection

For portfolio directories containing multiple projects:

```
portfolio/
├── project-a/
│   ├── .github/workflows/build.yml  # Java 21
│   └── pom.xml                       # Java 21
├── project-b/
│   ├── .github/workflows/ci.yml     # Java 25
│   └── build.gradle.kts              # Java 25
└── project-c/
    └── submodule/
        ├── .github/workflows/test.yml # Java 17
        └── pom.xml                     # Java 21 (MISALIGNED!)
```

The detector will:

1. Find all `.github/workflows/` directories at any depth
2. Find all build files (`pom.xml`, `build.gradle(.kts)`) at any depth
3. Associate each workflow with its closest build file (same directory or nearest parent)
4. Report alignment status for each project independently

## Common Workflow Patterns

### CI Build Workflow

```yaml
name: Java CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '21'
      - run: ./mvnw verify
```

### Multi-Version Matrix

```yaml
strategy:
  matrix:
    java: ['17', '21', '25']
steps:
  - uses: actions/setup-java@v4
    with:
      java-version: ${{ matrix.java }}
```

### Release Workflow

```yaml
name: Release
on:
  release:
    types: [created]
jobs:
  publish:
    steps:
      - uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
```

## Action Version Reference

| Action                | Latest Version | Notes                 |
| --------------------- | -------------- | --------------------- |
| actions/setup-java    | v4             | Supports Java 8-25    |
| graalvm/setup-graalvm | v1             | GraalVM distributions |
| actions/checkout      | v4             | Repository checkout   |
| actions/cache         | v4             | Maven/Gradle cache    |
