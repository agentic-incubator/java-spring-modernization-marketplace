# Spring Modernization Marketplace

**Automate your Spring Boot 4.x migration at scale.**

A Claude Code plugin that upgrades entire portfolios—Jackson 3, Security 7, Vaadin 25, Spring AI 2.0—with parallel processing and automatic PR creation.

## Why This Exists

Upgrading Spring Boot means coordinating Jackson 3 groupId changes, Security 7 configuration rewrites, and countless import updates across dozens of repositories.
Manual migration is slow, error-prone, and doesn't scale.

This marketplace handles it: clone, analyze, migrate, validate, and submit PRs—automatically.

## What You Get

| Category | Count | Highlights                                                                                                                                                                                                                                                                                                                                           |
| -------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Commands | 20    | `/migrate`, `/analyze`, `/migrate-github`, `/update-openapi-generator`, `/migrate-openapi-library`, `/migrate-framework-7`, `/detect-breaking-changes`, `/migrate-spring-boot-41`, `/migrate-spring-ai-20`, `/detect-multi-provider-collision`, `/migrate-mcp-streamable-http`                                                                       |
| Agents   | 12    | Orchestrator, parallel-orchestrator, migration, discovery, validation, cleanup, analyzers, `spring-boot-41-rc-upgrade-agent`, `spring-ai-20-m7-upgrade-agent`                                                                                                                                                                                        |
| Skills   | 51    | Dependency updater, Jackson, Security, OpenAPI Generator, Spring Framework 7, Documentation migration, Build tools, GitHub Actions, Property migration, OpenFeign, Testing frameworks, **Spring AI model-selector enforcer**, **Spring Boot BOM override reconciler**, **Spring AI options-setter migrator**, **MCP SSE → Streamable HTTP migrator** |

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

| From                  | To             | Key Changes                                                                                                                                     |
| --------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Spring Boot 3.x       | 4.x            | Starter renames, Undertow removal, Spring Milestones repo                                                                                       |
| **Spring Boot 4.0.x** | **4.1.0-RC1**  | **pluginRepositories block, BOM override reconciliation, ReactorClientHttpRequestFactoryBuilder.withHttpClientDefaults(), Boot 4.1 opt-ins**    |
| Jackson 2.x           | 3.x            | GroupId `tools.jackson`, JacksonException, property namespace                                                                                   |
| Spring Security 6     | 7              | Bean-based config, PathPatternMatcher                                                                                                           |
| Vaadin 24             | 25             | Lumo theme, security configurer                                                                                                                 |
| Spring AI 1.x         | 2.0.0-M6       | TextToSpeechModel, provider selection, autoconfigure split, Jackson 2/3 coexistence                                                             |
| **Spring AI 2.0-M\*** | **2.0.0-M7**   | **Starter renames, spring-cloud-bindings removal, options-setter rewrite, SSE → Streamable HTTP, six-selector enforcement, M1-M6 API removals** |
| OpenFeign             | HTTP Interface | Library migration (spring-cloud → spring-http-interface), configPackage, URL cleanup                                                            |
| Spring Framework 6    | 7              | HttpServiceProxyFactory API, WebClientAdapter API, template path flexibility                                                                    |
| Properties            | Boot 4         | Kebab-case, logging packages, Jackson namespace                                                                                                 |
| **Documentation**     | **Aligned**    | **README, prerequisites, code examples, version references**                                                                                    |

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

| Guide                                                      | Description                                           |
| ---------------------------------------------------------- | ----------------------------------------------------- |
| [**Use Cases & Sample Prompts**](docs/use-cases/README.md) | **Start here — 32 use cases with copy-paste prompts** |
| [Getting Started](docs/getting-started.md)                 | Installation and basic usage                          |
| [Claude Code Workflows](docs/claude-code-workflows.md)     | Interactive usage patterns                            |
| [Commands](docs/commands.md)                               | All slash commands reference                          |
| [Agents](docs/agents.md)                                   | Specialized agents and orchestration                  |
| [Skills](docs/skills.md)                                   | Migration skills catalog                              |
| [Migrations](docs/migrations.md)                           | Detailed migration patterns                           |
| [GitHub Workflows](docs/github-workflows.md)               | Parallel migrations with PRs                          |
| [Troubleshooting](docs/troubleshooting.md)                 | Common errors and solutions                           |
| [Sample Workflows](docs/samples/)                          | Real migration workflow examples                      |
| [Project Historical](docs/project-historical.md)           | How this repo was built with AI                       |
| [Contributing](docs/contributing.md)                       | How to contribute                                     |

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
