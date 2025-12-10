---
name: openrewrite-executor
description: Execute OpenRewrite recipes for automated Spring Boot, Jackson, and Spring Security migrations. Use when applying automated code transformations via OpenRewrite.
allowed-tools: Read, Write, Edit, Bash, Glob
---

# OpenRewrite Executor

Execute OpenRewrite recipes for automated code migrations.

## Available Recipes

### Spring Boot 4 Upgrade

```yaml
recipe: org.openrewrite.java.spring.boot4.UpgradeSpringBoot_4_0
artifact: org.openrewrite.recipe:rewrite-spring:RELEASE
```

### Jackson 2 → 3 Upgrade

```yaml
recipe: org.openrewrite.java.jackson.UpgradeJackson_2_3
artifact: org.openrewrite.recipe:rewrite-jackson:RELEASE
```

### Spring Security 7 Upgrade

```yaml
recipe: org.openrewrite.java.spring.security7.UpgradeSpringSecurity_7_0
artifact: org.openrewrite.recipe:rewrite-spring:RELEASE
```

## Maven Execution

### Single Recipe

```bash
mvn -U org.openrewrite.maven:rewrite-maven-plugin:run \
  -Drewrite.recipeArtifactCoordinates=org.openrewrite.recipe:rewrite-spring:RELEASE \
  -Drewrite.activeRecipes=org.openrewrite.java.spring.boot4.UpgradeSpringBoot_4_0
```

### Jackson Recipe

```bash
mvn -U org.openrewrite.maven:rewrite-maven-plugin:run \
  -Drewrite.recipeArtifactCoordinates=org.openrewrite.recipe:rewrite-jackson:RELEASE \
  -Drewrite.activeRecipes=org.openrewrite.java.jackson.UpgradeJackson_2_3
```

### Spring Security Recipe

```bash
mvn -U org.openrewrite.maven:rewrite-maven-plugin:run \
  -Drewrite.recipeArtifactCoordinates=org.openrewrite.recipe:rewrite-spring:RELEASE \
  -Drewrite.activeRecipes=org.openrewrite.java.spring.security7.UpgradeSpringSecurity_7_0
```

### Dry Run (Preview Changes)

```bash
mvn -U org.openrewrite.maven:rewrite-maven-plugin:dryRun \
  -Drewrite.recipeArtifactCoordinates=org.openrewrite.recipe:rewrite-spring:RELEASE \
  -Drewrite.activeRecipes=org.openrewrite.java.spring.boot4.UpgradeSpringBoot_4_0
```

## Gradle Configuration

### Add to build.gradle

```groovy
plugins {
    id("org.openrewrite.rewrite") version "7.3.0"
}

rewrite {
    activeRecipe("org.openrewrite.java.spring.boot4.UpgradeSpringBoot_4_0")
}

dependencies {
    rewrite("org.openrewrite.recipe:rewrite-spring:latest.release")
}
```

### Add to build.gradle.kts

```kotlin
plugins {
    id("org.openrewrite.rewrite") version "7.3.0"
}

rewrite {
    activeRecipe("org.openrewrite.java.spring.boot4.UpgradeSpringBoot_4_0")
}

dependencies {
    rewrite("org.openrewrite.recipe:rewrite-spring:latest.release")
}
```

### Execute Gradle Recipe

```bash
# Apply changes
./gradlew rewriteRun

# Dry run (preview)
./gradlew rewriteDryRun
```

## Recipe Combinations

### Full Spring Boot 4 Migration

```bash
# Step 1: Spring Boot upgrade
mvn -U org.openrewrite.maven:rewrite-maven-plugin:run \
  -Drewrite.recipeArtifactCoordinates=org.openrewrite.recipe:rewrite-spring:RELEASE \
  -Drewrite.activeRecipes=org.openrewrite.java.spring.boot4.UpgradeSpringBoot_4_0

# Step 2: Jackson upgrade (if needed)
mvn -U org.openrewrite.maven:rewrite-maven-plugin:run \
  -Drewrite.recipeArtifactCoordinates=org.openrewrite.recipe:rewrite-jackson:RELEASE \
  -Drewrite.activeRecipes=org.openrewrite.java.jackson.UpgradeJackson_2_3

# Step 3: Security upgrade (if needed)
mvn -U org.openrewrite.maven:rewrite-maven-plugin:run \
  -Drewrite.recipeArtifactCoordinates=org.openrewrite.recipe:rewrite-spring:RELEASE \
  -Drewrite.activeRecipes=org.openrewrite.java.spring.security7.UpgradeSpringSecurity_7_0
```

## Recipe Reference

| Migration             | Recipe                      | Artifact               |
| --------------------- | --------------------------- | ---------------------- |
| Spring Boot 3.x → 4.0 | `UpgradeSpringBoot_4_0`     | `rewrite-spring`       |
| Spring Boot 3.3 → 3.4 | `UpgradeSpringBoot_3_4`     | `rewrite-spring`       |
| Jackson 2.x → 3.x     | `UpgradeJackson_2_3`        | `rewrite-jackson`      |
| Security 6 → 7        | `UpgradeSpringSecurity_7_0` | `rewrite-spring`       |
| Java 17 → 21          | `UpgradeToJava21`           | `rewrite-migrate-java` |

## Best Practices

1. **Always dry run first** - Preview changes before applying
2. **Run one recipe at a time** - Easier to track changes
3. **Commit between recipes** - Maintain rollback points
4. **Review generated changes** - OpenRewrite may miss edge cases
5. **Run tests after each recipe** - Catch issues early

## Troubleshooting

### Recipe Not Found

```bash
# Update to latest recipe artifacts
mvn -U org.openrewrite.maven:rewrite-maven-plugin:run ...
```

### Memory Issues

```bash
# Increase Maven memory
export MAVEN_OPTS="-Xmx4g"
mvn org.openrewrite.maven:rewrite-maven-plugin:run ...
```

### Parse Errors

OpenRewrite may fail on non-standard Java code. Check:

- Lombok annotations (may need delombok)
- Generated code (may need to exclude)
- Non-standard syntax
