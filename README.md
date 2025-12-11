# Spring Modernization Marketplace

**Automate your Spring Boot 4.x migration at scale.**

A Claude Code plugin that upgrades entire portfolios—Jackson 3, Security 7, Vaadin 25, Spring AI 1.1—with parallel processing and automatic PR creation.

## Why This Exists

Upgrading Spring Boot means coordinating Jackson 3 groupId changes, Security 7 configuration rewrites, and countless import updates across dozens of repositories.
Manual migration is slow, error-prone, and doesn't scale.

This marketplace handles it: clone, analyze, migrate, validate, and submit PRs—automatically.

## What You Get

| Category | Count | Highlights                                                         |
| -------- | ----- | ------------------------------------------------------------------ |
| Commands | 10    | `/migrate`, `/analyze`, `/migrate-github`, `/check-github-actions` |
| Agents   | 9     | Orchestrator, parallel-orchestrator, validators                    |
| Skills   | 16    | Build tool upgrader, Jackson, Security, GitHub Actions             |

## Quick Start

```bash
# Install the marketplace
claude plugin marketplace add agentic-incubator/java-spring-modernization-marketplace
claude plugin install spring-m11n

# Analyze your project
/analyze /path/to/your/spring-app

# Run migration
/migrate /path/to/your/spring-app

# Validate
/validate /path/to/your/spring-app
```

## Migrate GitHub Repos at Scale

```bash
# Single repo
/migrate-github https://github.com/org/my-app

# Multiple repos in parallel with automatic PRs
/migrate-github https://github.com/org/app1,https://github.com/org/app2 --parallel

# From file with dependency ordering
/migrate-github repos.json --parallel
```

## Supported Migrations

| From              | To  | Key Changes                               |
| ----------------- | --- | ----------------------------------------- |
| Spring Boot 3.x   | 4.x | Parent, plugins, dependencies             |
| Jackson 2.x       | 3.x | GroupId `tools.jackson`, JacksonException |
| Spring Security 6 | 7   | Bean-based config, PathPatternMatcher     |
| Vaadin 24         | 25  | Lumo theme, security configurer           |
| Spring AI 1.0     | 1.1 | TextToSpeechModel, Double speed           |

## How It Works

```text
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   ANALYZE   │ ──▶ │   MIGRATE   │ ──▶ │  VALIDATE   │ ──▶ │  CREATE PR  │
│  discovery  │     │  transform  │     │ build+test  │     │   submit    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

For portfolios, the orchestrator:

1. Clones all repos in parallel
2. Discovers dependencies between projects
3. Migrates in tiers (libraries first)
4. Creates PRs for each successful migration

## Documentation

| Guide                                                  | Description                          |
| ------------------------------------------------------ | ------------------------------------ |
| [Getting Started](docs/getting-started.md)             | Installation and basic usage         |
| [Claude Code Workflows](docs/claude-code-workflows.md) | Interactive usage patterns           |
| [Commands](docs/commands.md)                           | All slash commands reference         |
| [Agents](docs/agents.md)                               | Specialized agents and orchestration |
| [Skills](docs/skills.md)                               | Migration skills catalog             |
| [Migrations](docs/migrations.md)                       | Detailed migration patterns          |
| [GitHub Workflows](docs/github-workflows.md)           | Parallel migrations with PRs         |
| [Troubleshooting](docs/troubleshooting.md)             | Common errors and solutions          |
| [Contributing](docs/contributing.md)                   | How to contribute                    |

## Build Tool Support

- **Maven**: Standard, multi-module, wrapper
- **Gradle**: Groovy DSL, Kotlin DSL, multi-module, wrapper

## Development

```bash
pnpm install
pnpm run check   # Verify formatting
pnpm run fix     # Auto-fix issues
```

## License

MIT
