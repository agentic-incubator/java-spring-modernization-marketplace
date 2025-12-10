---
description: Execute Spring ecosystem migration on a project
argument-hint: [project-path] [--dry-run]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Migrate Spring Project

Execute migration on the project at `$ARGUMENTS` (or current directory).

If `--dry-run` is specified, only show what would be changed without making modifications.

## Migration Workflow

### Phase 1: Pre-Migration

1. Verify project analyzed
2. Create backup branch: `git checkout -b backup/pre-migration`
3. Confirm migration plan with user

### Phase 2: Build File Updates

1. Update Spring Boot version to 4.0.0
2. Add Jackson BOM 3.0.2
3. Update Spring Cloud BOM to 2025.1.0
4. Change Jackson groupIds (`com.fasterxml.jackson` → `tools.jackson`)
5. Add `spring-boot-starter-webclient` if using WebFlux

### Phase 3: Import Migrations

1. Update Jackson imports (preserve `annotation.*`)
2. Change `JsonProcessingException` → `JacksonException`
3. Update Spring Security imports
4. Update Spring AI TTS imports

### Phase 4: Configuration Migrations

1. Convert `VaadinWebSecurity` to `VaadinSecurityConfigurer`
2. Replace `AntPathRequestMatcher` with `PathPatternRequestMatcher`
3. Update Vaadin Material theme to Lumo
4. Update Spring AI speed params (Float → Double)

### Phase 5: Validation

1. Run `mvn clean package -DskipTests` or `./gradlew clean build -x test`
2. Fix any compilation errors
3. Run full build with tests
4. Format code with Spotless

## Critical Rules

- **DO NOT change** `com.fasterxml.jackson.annotation.*` imports
- **DO change** `JsonProcessingException` to `JacksonException`
- **DO add** Jackson BOM before changing dependency groupIds
