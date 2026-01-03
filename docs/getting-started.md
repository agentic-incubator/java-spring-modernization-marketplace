# Getting Started

Get up and running with Spring Modernization Marketplace in minutes.

## Prerequisites

- [Claude Code](https://claude.ai/code) CLI installed
- GitHub CLI (`gh`) for GitHub workflows (optional)
- Java 17+ project(s) to migrate

## Installation

### Add the Marketplace

```bash
claude plugin marketplace add agentic-incubator/java-spring-modernization-marketplace
```

### Install the Plugin

```bash
claude plugin install spring-m11n
```

> **📍 Where do plugins get installed?**
>
> Plugins are installed at the **user level** in a Claude Code managed cache, not in your project directory.
> The plugin configuration (which plugins to use) is stored in `.claude/settings.json` files that can be
> committed to git for team sharing.
>
> - **Plugin files**: User-level cache (managed by Claude Code)
> - **Configuration**: `.claude/settings.json` (project level, git-committed)
> - **Personal overrides**: `.claude/settings.local.json` (gitignored)
>
> When team members clone your repo, they'll be prompted to install the marketplace and plugins locally.
> The actual plugin files stay in their user cache, while your team shares the configuration via git.
>
> _Source: [Claude Code Plugin Documentation](https://docs.anthropic.com/claude/docs/claude-code)_

### Verify Installation

```bash
# Inside a Claude code shell
/plugin list
```

You should see `spring-m11n` in the output.

## Updating

When new features or fixes are released, update your installation:

### Update the Marketplace

```bash
claude plugin marketplace update spring-m11n-marketplace
```

### Reinstall the Plugin

```bash
claude plugin uninstall spring-m11n
claude plugin install spring-m11n
```

### Verify the Update

Check the plugin list:

```bash
/plugin list
```

**Tip:** If you experience issues after updating, try removing and re-adding the marketplace:

```bash
claude plugin marketplace remove agentic-incubator/java-spring-modernization-marketplace
claude plugin marketplace add agentic-incubator/java-spring-modernization-marketplace
claude plugin install spring-m11n
```

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

### Check CI/CD Alignment

```bash
# Verify GitHub Actions Java versions match build files
/check-github-actions /path/to/project
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

### Check for Dependency Updates

Before or during migration, check for available dependency updates:

```text
# Ask Claude to check for updates
"Check for available dependency updates in this project"

# Review the report
Available Updates:
- Dependencies: 15 updates
- Plugins: 3 updates
- BOM-managed (skipped): 8

# Apply stable updates with validation
"Apply stable dependency updates and validate the build"

# Result
✅ 15 dependencies updated
✅ Compilation: PASSED
✅ Tests: PASSED (150 passed, 0 failed)
```

**Note**: The dependency-updater skill supports three filter strategies:

- `stable-only` (default): Only stable releases
- `include-milestones`: Includes RC and milestone versions (for Spring Boot 4 early adoption)
- `aggressive`: All versions except snapshots

## Next Steps

- [Commands Reference](commands.md) - All available slash commands
- [Migration Guide](migrations.md) - Detailed migration patterns
- [GitHub Workflows](github-workflows.md) - Parallel migrations with PRs
- [Troubleshooting](troubleshooting.md) - Common issues and fixes
