---
description: Validate migration by running builds and tests
argument-hint: [project-path]
allowed-tools: Read, Glob, Grep, Bash
---

# Validate Migration

Validate the migration at `$ARGUMENTS` (or current directory).

## Validation Steps

### Step 1: Compile Without Tests

```bash
# Maven
mvn clean package -DskipTests

# Gradle
./gradlew clean build -x test
```

Verify: Exit code 0, no compilation errors.

### Step 2: Run Tests

```bash
# Maven
mvn clean package

# Gradle
./gradlew clean build
```

Verify: All tests pass.

### Step 3: Check Deprecations

```bash
# Maven
mvn compile -Xlint:deprecation

# Gradle
./gradlew compileJava --warning-mode all
```

### Step 4: Code Cleanup

```bash
# Maven
mvn spotless:apply

# Gradle
./gradlew spotlessApply
```

## Error Handling

If validation fails, analyze errors:

| Error Pattern                                       | Likely Cause | Fix                             |
| --------------------------------------------------- | ------------ | ------------------------------- |
| `cannot find symbol: JsonProcessingException`       | Jackson 3    | Use `JacksonException`          |
| `package com.fasterxml.jackson.core does not exist` | Jackson 3    | Update imports                  |
| `cannot find symbol: AntPathRequestMatcher`         | Security 7   | Use `PathPatternRequestMatcher` |
| `cannot find symbol: VaadinWebSecurity`             | Vaadin 25    | Use `VaadinSecurityConfigurer`  |

## Output

Report validation results:

- Compilation status
- Test results (passed/failed/skipped)
- Warnings found
- Recommendations
