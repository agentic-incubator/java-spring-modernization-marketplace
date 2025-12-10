---
description: Run OpenRewrite recipes for automated migration
argument-hint: [recipe] [project-path] [--dry-run]
allowed-tools: Read, Write, Edit, Bash, Glob
---

# Run OpenRewrite Recipe

Execute OpenRewrite recipe `$1` on project at `$2` (or current directory).

Available recipes:

- `spring-boot-4` - Upgrade to Spring Boot 4.0
- `jackson-3` - Upgrade Jackson 2.x to 3.x
- `security-7` - Upgrade Spring Security to 7.0
- `java-21` - Upgrade to Java 21

If `--dry-run` is specified, preview changes without applying.

## Recipe Commands

### Spring Boot 4

```bash
mvn -U org.openrewrite.maven:rewrite-maven-plugin:run \
  -Drewrite.recipeArtifactCoordinates=org.openrewrite.recipe:rewrite-spring:RELEASE \
  -Drewrite.activeRecipes=org.openrewrite.java.spring.boot4.UpgradeSpringBoot_4_0
```

### Jackson 3

```bash
mvn -U org.openrewrite.maven:rewrite-maven-plugin:run \
  -Drewrite.recipeArtifactCoordinates=org.openrewrite.recipe:rewrite-jackson:RELEASE \
  -Drewrite.activeRecipes=org.openrewrite.java.jackson.UpgradeJackson_2_3
```

### Spring Security 7

```bash
mvn -U org.openrewrite.maven:rewrite-maven-plugin:run \
  -Drewrite.recipeArtifactCoordinates=org.openrewrite.recipe:rewrite-spring:RELEASE \
  -Drewrite.activeRecipes=org.openrewrite.java.spring.security7.UpgradeSpringSecurity_7_0
```

## Dry Run

Add `dryRun` instead of `run`:

```bash
mvn -U org.openrewrite.maven:rewrite-maven-plugin:dryRun ...
```

## Best Practices

1. Always dry-run first
2. Run one recipe at a time
3. Commit between recipes
4. Review generated changes
5. Run tests after each recipe
