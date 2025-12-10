---
name: build-runner
description: Execute Maven or Gradle builds to validate migrations including clean builds, test execution, and error analysis. Use when verifying that migration changes compile and tests pass.
allowed-tools: Read, Bash, Glob
---

# Build Runner

Execute and validate builds for Maven and Gradle projects.

## Build Commands

### Maven

| Operation                | Command                          |
| ------------------------ | -------------------------------- |
| Clean build (skip tests) | `mvn clean package -DskipTests`  |
| Clean build (with tests) | `mvn clean package`              |
| Run tests only           | `mvn test`                       |
| Generate reports         | `mvn site -DskipTests`           |
| Check deprecations       | `mvn compile -Xlint:deprecation` |
| Format code              | `mvn spotless:apply`             |

### Gradle

| Operation                | Command                                            |
| ------------------------ | -------------------------------------------------- |
| Clean build (skip tests) | `./gradlew clean build -x test`                    |
| Clean build (with tests) | `./gradlew clean build`                            |
| Run tests only           | `./gradlew test`                                   |
| Check dependencies       | `./gradlew dependencyInsight --dependency jackson` |
| Check deprecations       | `./gradlew compileJava --warning-mode all`         |
| Format code              | `./gradlew spotlessApply`                          |
| Run all checks           | `./gradlew check`                                  |

## Validation Sequence

### Step 1: Compile Without Tests

```bash
# Maven
mvn clean package -DskipTests

# Gradle
./gradlew clean build -x test
```

**Purpose**: Verify code compiles with new dependencies.

### Step 2: Full Build With Tests

```bash
# Maven
mvn clean package

# Gradle
./gradlew clean build
```

**Purpose**: Verify tests pass after migration.

### Step 3: Check for Warnings

```bash
# Maven
mvn compile -Xlint:deprecation

# Gradle
./gradlew compileJava --warning-mode all
```

**Purpose**: Identify deprecated API usage.

### Step 4: Format Code

```bash
# Maven (with Spotless plugin)
mvn spotless:apply

# Gradle (with Spotless plugin)
./gradlew spotlessApply
```

**Purpose**: Clean up imports and formatting.

## Error Analysis

### Common Compilation Errors

| Error Pattern                                       | Likely Cause            | Solution                               |
| --------------------------------------------------- | ----------------------- | -------------------------------------- |
| `cannot find symbol: JsonProcessingException`       | Jackson 3 migration     | Change to `JacksonException`           |
| `cannot find symbol: AntPathRequestMatcher`         | Security 7 migration    | Use `PathPatternRequestMatcher`        |
| `cannot find symbol: VaadinWebSecurity`             | Vaadin 25 migration     | Use `VaadinSecurityConfigurer`         |
| `cannot find symbol: SpeechModel`                   | Spring AI 1.1 migration | Use `TextToSpeechModel`                |
| `package com.fasterxml.jackson.core does not exist` | Jackson 3 migration     | Update imports to `tools.jackson.core` |

### Common Test Failures

| Failure Pattern          | Likely Cause        | Solution                        |
| ------------------------ | ------------------- | ------------------------------- |
| `NoSuchMethodError`      | API incompatibility | Check method signatures changed |
| `ClassNotFoundException` | Missing dependency  | Add required dependency         |
| `BeanCreationException`  | Config issue        | Review security/app config      |

## Output Format

```json
{
  "project": "my-app",
  "buildTool": "maven",
  "validation": {
    "compile": {
      "success": true,
      "duration": "45s",
      "warnings": 3
    },
    "tests": {
      "success": true,
      "total": 150,
      "passed": 150,
      "failed": 0,
      "skipped": 0,
      "duration": "120s"
    }
  },
  "overallSuccess": true
}
```

## Troubleshooting

### Maven Issues

```bash
# Clear local repository cache
mvn dependency:purge-local-repository

# Force update dependencies
mvn clean package -U

# Debug dependency resolution
mvn dependency:tree -Dverbose
```

### Gradle Issues

```bash
# Clear Gradle cache
./gradlew clean --refresh-dependencies

# Debug dependency resolution
./gradlew dependencies --scan

# Check for dependency conflicts
./gradlew dependencyInsight --dependency jackson --configuration compileClasspath
```
