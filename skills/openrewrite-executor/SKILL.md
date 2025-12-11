---
name: openrewrite-executor
description: Execute OpenRewrite recipes for automated Spring Boot, Jackson, and Spring Security migrations. Use when applying automated code transformations via OpenRewrite.
allowed-tools: Read, Write, Edit, Bash, Glob
---

# OpenRewrite Executor

Execute OpenRewrite recipes for automated code migrations.

## Recipe Catalog Reference

For comprehensive recipe discovery with version-based matching and composite tree walking, see:

- **Recipe Catalog:** `skills/recipe-discovery/recipe-catalog.yaml`
- **Recipe Discovery Skill:** `skills/recipe-discovery/SKILL.md`
- **OpenRewrite Documentation:** <https://docs.openrewrite.org/recipes>

## Available Recipes

### Spring Boot Recipes

```yaml
# Spring Boot 4.0 (composite - includes security, jackson, java upgrades)
spring-boot-4:
  recipe: org.openrewrite.java.spring.boot4.UpgradeSpringBoot_4_0
  artifact: org.openrewrite.recipe:rewrite-spring:RELEASE
  type: composite
  includes: [security-7, jackson-3, boot-3.5, java-21]

# Spring Boot 3.5
spring-boot-3.5:
  recipe: org.openrewrite.java.spring.boot3.UpgradeSpringBoot_3_5
  artifact: org.openrewrite.recipe:rewrite-spring:RELEASE

# Spring Boot 3.4
spring-boot-3.4:
  recipe: org.openrewrite.java.spring.boot3.UpgradeSpringBoot_3_4
  artifact: org.openrewrite.recipe:rewrite-spring:RELEASE
```

### Jackson Recipes

```yaml
# Jackson 2.x → 3.x (composite)
jackson-3:
  recipe: org.openrewrite.java.jackson.UpgradeJackson_2_3
  artifact: org.openrewrite.recipe:rewrite-jackson:RELEASE
  type: composite
  includes:
    - UpgradeJacksonDependencies_2_3
    - UpdateJacksonPackageNames_2_3
    - UpdateJacksonTypes_2_3
    - RemoveJacksonModulesIncludedInDatabind_3
```

### Spring Security Recipes

```yaml
# Spring Security 7.0
security-7:
  recipe: org.openrewrite.java.spring.security7.UpgradeSpringSecurity_7_0
  artifact: org.openrewrite.recipe:rewrite-spring:RELEASE
  type: composite
```

### Java Version Recipes

```yaml
# Java 21 (LTS)
java-21:
  recipe: org.openrewrite.java.migrate.UpgradeToJava21
  artifact: org.openrewrite.recipe:rewrite-migrate-java:RELEASE
  type: composite

# Java 25
java-25:
  recipe: org.openrewrite.java.migrate.UpgradeToJava25
  artifact: org.openrewrite.recipe:rewrite-migrate-java:RELEASE
```

### Spring Cloud Recipes

```yaml
# Spring Cloud 2025
spring-cloud-2025:
  recipe: org.openrewrite.java.spring.cloud2025.UpgradeSpringCloud_2025
  artifact: org.openrewrite.recipe:rewrite-spring:RELEASE

# Spring Cloud 2024
spring-cloud-2024:
  recipe: org.openrewrite.java.spring.cloud2024.UpgradeSpringCloud_2024
  artifact: org.openrewrite.recipe:rewrite-spring:RELEASE
```

### Testing Recipes

```yaml
# JUnit 5 best practices
junit5:
  recipe: org.openrewrite.java.testing.junit5.JUnit5BestPractices
  artifact: org.openrewrite.recipe:rewrite-testing-frameworks:RELEASE

# JUnit 4 → 5 migration
junit4-to-5:
  recipe: org.openrewrite.java.testing.junit5.JUnit4to5Migration
  artifact: org.openrewrite.recipe:rewrite-testing-frameworks:RELEASE
```

### Static Analysis Recipes

```yaml
# Common static analysis
static-analysis:
  recipe: org.openrewrite.staticanalysis.CommonStaticAnalysis
  artifact: org.openrewrite.recipe:rewrite-static-analysis:RELEASE
  type: composite
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

| Migration               | Recipe                        | Artifact                   | Type      |
| ----------------------- | ----------------------------- | -------------------------- | --------- |
| Spring Boot 3.x → 4.0   | `UpgradeSpringBoot_4_0`       | `rewrite-spring`           | composite |
| Spring Boot 3.4 → 3.5   | `UpgradeSpringBoot_3_5`       | `rewrite-spring`           | composite |
| Spring Boot 3.3 → 3.4   | `UpgradeSpringBoot_3_4`       | `rewrite-spring`           | composite |
| Spring Boot 3.2 → 3.3   | `UpgradeSpringBoot_3_3`       | `rewrite-spring`           | composite |
| Spring Boot 2.7 → 3.0   | `UpgradeSpringBoot_3_0`       | `rewrite-spring`           | composite |
| Jackson 2.x → 3.x       | `UpgradeJackson_2_3`          | `rewrite-jackson`          | composite |
| Security 6 → 7          | `UpgradeSpringSecurity_7_0`   | `rewrite-spring`           | composite |
| Security 6.3 → 6.4      | `UpgradeSpringSecurity_6_4`   | `rewrite-spring`           | composite |
| Cloud 2024 → 2025       | `UpgradeSpringCloud_2025`     | `rewrite-spring`           | composite |
| Cloud 2023 → 2024       | `UpgradeSpringCloud_2024`     | `rewrite-spring`           | composite |
| Java 17+ → 21           | `UpgradeToJava21`             | `rewrite-migrate-java`     | composite |
| Java 21+ → 25           | `UpgradeToJava25`             | `rewrite-migrate-java`     | composite |
| Java 11+ → 17           | `UpgradeToJava17`             | `rewrite-migrate-java`     | composite |
| JUnit 4 → 5             | `JUnit4to5Migration`          | `rewrite-testing-frameworks` | composite |
| JUnit 5 Best Practices  | `JUnit5BestPractices`         | `rewrite-testing-frameworks` | composite |
| Static Analysis         | `CommonStaticAnalysis`        | `rewrite-static-analysis`  | composite |
| javax → jakarta         | `JavaxToJakarta`              | `rewrite-migrate-java`     | composite |
| Hibernate 6.5 → 6.6     | `UpgradeHibernate_6_6`        | `rewrite-spring`           | composite |

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
