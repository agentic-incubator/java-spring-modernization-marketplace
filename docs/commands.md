# Commands Reference

All slash commands available in the Spring Modernization Marketplace.

## Analysis Commands

### /analyze

Analyze a project for migration requirements.

```bash
/analyze [project-path]
```

**Output:**

- Build tool detection (Maven/Gradle)
- Current framework versions
- Dependencies requiring migration
- Code patterns to update
- Recommended migration plan

### /version-check

Quick check of current framework versions.

```bash
/version-check [project-path]
```

**Output:**

- Spring Boot version
- Spring Cloud version
- Spring Security version
- Jackson version
- Java version

### /portfolio-scan

Scan multiple projects for migration status.

```bash
/portfolio-scan [portfolio-path]
```

**Output:**

- List of all projects found
- Current versions for each
- Migration status (up-to-date, needs migration, outdated)
- Inter-project dependencies
- Recommended migration order

### /check-github-actions

Check Java versions in GitHub Actions workflows.

```bash
/check-github-actions [project-path]
```

**Output:**

- Workflow files found
- Java versions in CI configurations
- Distribution settings
- Matrix build configurations
- Alignment status with build files

**Alignment Status:**

| Status     | Description                                        |
| ---------- | -------------------------------------------------- |
| ALIGNED    | Build file and workflows use same Java version     |
| MISALIGNED | Build file and workflows have different versions   |
| MIXED      | Workflows have different versions among themselves |
| NO_CI      | No GitHub Actions workflows found                  |

## Migration Commands

### /migrate

Execute Spring ecosystem migration.

```bash
/migrate [project-path] [--dry-run]
```

**Options:**

| Option      | Description                      |
| ----------- | -------------------------------- |
| `--dry-run` | Preview changes without applying |

**Phases:**

1. Pre-migration backup
2. Build file updates
3. Import migrations
4. Configuration migrations
5. Validation build

### /migrate-github

Clone and migrate GitHub repositories with parallel processing and automatic PR creation.

```bash
/migrate-github [repos] [options]
```

**Input Formats:**

```bash
# Comma-separated URLs
/migrate-github https://github.com/org/repo1,https://github.com/org/repo2

# From file
/migrate-github repos.txt --parallel

# From JSON with dependencies
/migrate-github repos.json --parallel
```

**Options:**

| Option               | Description                     | Default                           |
| -------------------- | ------------------------------- | --------------------------------- |
| `--parallel`         | Run independent ops in parallel | false                             |
| `--branch <name>`    | Feature branch name             | `feature/spring-boot-4-migration` |
| `--workspace <path>` | Local clone directory           | `/tmp/migration-workspace`        |
| `--dry-run`          | Show plan without executing     | false                             |
| `--skip-pr`          | Skip PR creation                | false                             |
| `--labels <list>`    | PR labels (comma-separated)     | `spring-boot-4,dependencies`      |

### /openrewrite

Run OpenRewrite automated recipes.

```bash
/openrewrite [recipe] [project-path] [--dry-run]
```

**Available Recipes:**

| Recipe          | Description            |
| --------------- | ---------------------- |
| `spring-boot-4` | Spring Boot 3.x to 4.x |
| `jackson-3`     | Jackson 2.x to 3.x     |
| `security-7`    | Spring Security 6 to 7 |
| `java-21`       | Java 17 to 21          |

**Examples:**

```bash
# Preview Spring Boot 4 upgrade
/openrewrite spring-boot-4 /path/to/project --dry-run

# Apply Jackson migration
/openrewrite jackson-3 /path/to/project
```

## Fix Commands

### /fix-jackson

Fix Jackson 3 migration issues.

```bash
/fix-jackson [project-path]
```

**Fixes:**

- GroupId changes (`com.fasterxml.jackson` to `tools.jackson`)
- Exception changes (`JsonProcessingException` to `JacksonException`)
- BOM addition for version management
- Import updates (preserves `annotation.*`)

### /fix-security

Fix Spring Security 7 issues.

```bash
/fix-security [project-path]
```

**Fixes:**

- `VaadinWebSecurity` to `VaadinSecurityConfigurer`
- `AntPathRequestMatcher` to `PathPatternRequestMatcher`
- Method override to `@Bean` configuration

## Validation Commands

### /validate

Validate migration with builds and tests.

```bash
/validate [project-path]
```

**Checks:**

1. Compilation without tests
2. Full build with tests
3. Deprecation warnings
4. Code formatting (Spotless)

**Output:**

- Build status (pass/fail)
- Test results
- Warning summary
- Recommendations

## Command Cheatsheet

| Task                   | Command                            |
| ---------------------- | ---------------------------------- |
| Check project state    | `/analyze /path`                   |
| Check versions only    | `/version-check /path`             |
| Check CI Java versions | `/check-github-actions /path`      |
| Scan portfolio         | `/portfolio-scan /path`            |
| Migrate single project | `/migrate /path`                   |
| Migrate with preview   | `/migrate /path --dry-run`         |
| Migrate GitHub repos   | `/migrate-github urls --parallel`  |
| Run OpenRewrite        | `/openrewrite spring-boot-4 /path` |
| Fix Jackson issues     | `/fix-jackson /path`               |
| Fix Security issues    | `/fix-security /path`              |
| Validate migration     | `/validate /path`                  |
