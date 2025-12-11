---
description: Check Java versions in GitHub Actions workflows and compare with build files
argument-hint: [project-path]
allowed-tools: Read, Glob, Grep
---

# Check GitHub Actions

Check Java versions in GitHub Actions workflows at `$ARGUMENTS` (or current directory) and compare with build file configurations.

## What to Check

1. **Workflow Files** - Scan `.github/workflows/*.yml` and `.github/workflows/*.yaml` (including nested directories)
2. **Java Versions** - Extract from `actions/setup-java` steps
3. **Matrix Configurations** - Multi-version build strategies
4. **Build File Java** - Compare with `pom.xml` or `build.gradle(.kts)`
5. **Version Alignment** - Flag mismatches between CI and build files
6. **Nested Projects** - Scan subdirectories for additional projects with their own workflows

## Detection Patterns

### Direct Java Version

```yaml
- uses: actions/setup-java@v4
  with:
    distribution: temurin
    java-version: '21'
```

### Matrix Strategy

```yaml
strategy:
  matrix:
    java: ['17', '21', '25']
steps:
  - uses: actions/setup-java@v4
    with:
      java-version: ${{ matrix.java }}
```

### Environment Variable

```yaml
env:
  JAVA_VERSION: '21'
steps:
  - uses: actions/setup-java@v4
    with:
      java-version: ${{ env.JAVA_VERSION }}
```

### GraalVM

```yaml
- uses: graalvm/setup-graalvm@v1
  with:
    java-version: '21'
```

## Build File Java Version

### Maven (pom.xml)

```xml
<properties>
    <java.version>21</java.version>
</properties>
```

### Gradle (build.gradle.kts)

```kotlin
java {
    sourceCompatibility = JavaVersion.VERSION_21
}
```

## Output

Report GitHub Actions Java configurations and alignment status:

```
GitHub Actions Java Version Report
==================================

Project: my-app
Build Tool: Maven
Build File Java Version: 21

GitHub Actions Workflows Found: 3

Workflow: .github/workflows/build.yml
  Name: Java CI
  Job: build
    Action: actions/setup-java@v4
    Distribution: liberica
    Java Versions: [25] (matrix)

Workflow: .github/workflows/codeql.yml
  Name: CodeQL
  Job: analyze
    Action: actions/setup-java@v4
    Distribution: liberica
    Java Version: 25

Workflow: .github/workflows/release.yml
  Name: Publish package
  Job: publish-jars
    Action: actions/setup-java@v4
    Distribution: liberica
    Java Version: 25

Version Alignment Check
-----------------------
Build File Java: 21
GitHub Actions Java: 25

Status: MISALIGNED

Recommendation: Update build file to Java 25 or update GitHub Actions to Java 21
```

## Alignment Status

| Status     | Description                                        |
| ---------- | -------------------------------------------------- |
| ALIGNED    | Build file and all workflows use same Java version |
| MISALIGNED | Build file and workflows have different versions   |
| MIXED      | Workflows have different versions among themselves |
| NO_CI      | No GitHub Actions workflows found                  |

## Common Issues

1. **Version Mismatch** - Build specifies Java 21, CI uses Java 17
2. **Outdated Matrix** - Matrix doesn't include latest Java version
3. **Inconsistent Workflows** - Different workflows use different versions
4. **Missing Distribution** - setup-java without explicit distribution
