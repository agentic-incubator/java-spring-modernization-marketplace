# Getting Started

Get up and running with Spring Modernization Marketplace in minutes.

## Prerequisites

- [Claude Code](https://claude.ai/code) CLI installed
- GitHub CLI (`gh`) for GitHub workflows (optional)
- Java 17+ project(s) to migrate

## Installation

### Add the Marketplace

```bash
claude plugin marketplace add owner/spring-modernization-marketplace
```

### Install the Plugin

```bash
claude plugin install spring-modernization
```

### Verify Installation

```bash
claude plugin list
```

You should see `spring-modernization` in the output.

## Quick Start

### 1. Analyze Your Project

```bash
/analyze /path/to/your/spring-app
```

This discovers:

- Build tool (Maven/Gradle)
- Current Spring Boot version
- Dependencies requiring migration
- Code patterns to update

### 2. Run Migration

```bash
/migrate /path/to/your/spring-app
```

The migration agent will:

- Update build files (pom.xml or build.gradle)
- Migrate imports
- Update configurations
- Validate the build

### 3. Validate Results

```bash
/validate /path/to/your/spring-app
```

Runs the full build with tests to ensure everything works.

## Common Workflows

### Single Project

```bash
/analyze /path/to/project
/migrate /path/to/project
/validate /path/to/project
```

### Portfolio of Projects

```bash
# Scan all projects first
/portfolio-scan /path/to/portfolio

# Migrate in dependency order (libraries first)
/migrate /path/to/portfolio/common-lib
/migrate /path/to/portfolio/app-service
/migrate /path/to/portfolio/api-gateway
```

### GitHub Repositories (Parallel)

```bash
# Migrate multiple GitHub repos with automatic PRs
/migrate-github https://github.com/org/repo1,https://github.com/org/repo2 --parallel
```

### Using OpenRewrite

```bash
# Preview changes first
/openrewrite spring-boot-4 /path/to/project --dry-run

# Apply the recipe
/openrewrite spring-boot-4 /path/to/project
```

## Next Steps

- [Commands Reference](commands.md) - All available slash commands
- [Migration Guide](migrations.md) - Detailed migration patterns
- [GitHub Workflows](github-workflows.md) - Parallel migrations with PRs
- [Troubleshooting](troubleshooting.md) - Common issues and fixes
