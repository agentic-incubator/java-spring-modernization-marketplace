---
description: Execute Spring ecosystem migration on a project
argument-hint: [project-path] [--dry-run]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Migrate Spring Project

Execute migration on the project at `$ARGUMENTS` (or current directory).

If `--dry-run` is specified, only show what would be changed without making modifications.

## Migration Workflow

### Phase 0: Pre-Migration

1. Verify project analyzed
2. Create backup branch: `git checkout -b backup/pre-migration`
3. Confirm migration plan with user

### Phase 1: Build File Updates

1. Update Spring Boot version to 4.0.0
2. Add Jackson BOM 3.0.2
3. Update Spring Cloud BOM to 2025.1.0
4. Change Jackson groupIds (`com.fasterxml.jackson` → `tools.jackson`)
5. Add `spring-boot-starter-webclient` if using WebFlux

### Phase 1.5: Dependency Updates (Enhanced v2.0.0)

Automatically updates all dependencies and plugins to latest compatible versions with validation.

**Features**:

- ✅ **Compatibility validation** - Tests compilation + tests after updates
- ✅ **Incremental rollback** - Automatically rolls back incompatible updates
- ✅ **Migration skill suggestions** - Suggests related migrators when updates fail
- ✅ **Compatibility reporting** - Detailed success/failure/rollback summary

**Default Behavior**:

```bash
# Validates both compilation and tests
migrate --project /path/to/project
```

**Fast Mode** (skip test validation):

```bash
# Only validates compilation (faster)
migrate --project /path/to/project --skip-tests
```

**Filter Strategy**:

- Automatically selects based on target versions
- `include-milestones` for Spring AI 2.0.0-M* projects
- `stable-only` for production projects

**Example Output**:

```text
Phase 1.5: Dependency Updates
  Updated: 23/25 dependencies (92%)
  Rolled back: 2 (jackson-databind, spring-security-core)
  Suggested: Run jackson-migrator and security-config-migrator
  Compilation: ✅ PASSED
  Tests: ✅ PASSED (if not --skip-tests)
```

### Phase 2: Import Migrations

1. Update Jackson imports (preserve `annotation.*`)
2. Change `JsonProcessingException` → `JacksonException`
3. Update Spring Security imports
4. Update Spring AI TTS imports

### Phase 3: Configuration Migrations

1. Convert `VaadinWebSecurity` to `VaadinSecurityConfigurer`
2. Replace `AntPathRequestMatcher` with `PathPatternRequestMatcher`
3. Update Vaadin Material theme to Lumo
4. Update Spring AI speed params (Float → Double)

### Phase 4: Validation

1. Run `mvn clean package -DskipTests` or `./gradlew clean build -x test`
2. Fix any compilation errors
3. Run full build with tests
4. Format code with Spotless

## Critical Rules

- **DO NOT change** `com.fasterxml.jackson.annotation.*` imports
- **DO change** `JsonProcessingException` to `JacksonException`
- **DO add** Jackson BOM before changing dependency groupIds
