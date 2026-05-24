# Agents Reference

Specialized AI agents that coordinate migration workflows.

## Orchestration Agents

### orchestrator

Master coordinator for Spring ecosystem modernization.

**Purpose:** Manages the complete migration lifecycle across single or multiple projects.

**Workflow:**

```text
Research → Discovery → Migration → Validation
```

**Capabilities:**

- Coordinates multi-project migrations
- Manages dependency-aware ordering
- Tracks project state through pipeline
- Delegates to specialized agents

**When to use:** Complex migrations, portfolio upgrades, when you need full automation.

### parallel-orchestrator

Coordinates parallel migration of GitHub repositories.

**Purpose:** Clone, migrate, and create PRs for multiple GitHub repos with maximum parallelism.

**Workflow:**

```text
Clone (parallel) → Discovery (parallel) → Tiered Migration → PRs (parallel)
```

**Capabilities:**

- Parallel repository cloning
- Parallel discovery analysis
- Dependency graph construction
- Tiered migration (respects inter-repo deps)
- Automatic PR creation

**When to use:** Migrating portfolios of GitHub repositories at scale.

## Research Agents

### guide-fetcher

Fetches official Spring migration documentation.

**Purpose:** Gather migration knowledge from official sources.

**Sources:**

- Spring Boot GitHub wiki
- Spring Security migration guides
- Jackson release notes
- Vaadin upgrade documentation

**Model:** haiku (fast, lightweight)

### recipe-analyzer

Analyzes available OpenRewrite recipes.

**Purpose:** Recommend appropriate recipes for your migration needs.

**Capabilities:**

- Catalog available recipes
- Match recipes to project needs
- Identify coverage gaps
- Suggest manual steps

**Model:** haiku

### reference-learner

Learns from successfully migrated projects.

**Purpose:** Extract migration patterns from reference implementations.

**Capabilities:**

- Analyze git history of migrated projects
- Identify transformation patterns
- Learn from real-world migrations
- Apply learned patterns to new projects

## Execution Agents

### discovery-agent

Analyzes project structure and dependencies.

**Purpose:** Thorough analysis of Java/Spring projects.

**Skills used:**

- `build-tool-detector`
- `build-tool-upgrader`
- `version-detector`
- `dependency-scanner`
- `dependency-updater`
- `pattern-detector`
- `github-actions-detector`

**Output:**

```json
{
  "buildTool": "maven",
  "springBootVersion": "3.3.5",
  "migrations": ["jackson", "security"],
  "patterns": ["JsonProcessingException", "VaadinWebSecurity"]
}
```

**Model:** sonnet

### migration-agent

Applies code transformations.

**Purpose:** Execute migration changes in correct order.

**Skills used:**

- `build-tool-upgrader`
- `jackson-migrator`
- `security-config-migrator`
- `spring-ai-migrator`
- `application-property-migrator`
- `import-migrator`
- `build-file-updater`
- `openrewrite-executor`
- `github-actions-updater`

**Execution order:**

1. Build tool upgrade (wrapper versions)
2. Build file updates (BOMs, repos, starters, Undertow removal)
3. Import migrations
4. Application property migrations (kebab-case, namespaces, logging)
5. Configuration migrations
6. GitHub Actions updates
7. Validation

### validation-agent

Verifies migrations succeed.

**Purpose:** Ensure migration quality through builds and tests.

**Skills used:**

- `build-runner`

**Checks:**

- Compilation passes
- Tests pass
- No new deprecation warnings
- Code formatting valid

**Model:** sonnet

### cleanup-agent

Post-migration code cleanup.

**Purpose:** Polish code after migration.

**Tasks:**

- Code formatting (Spotless/Prettier)
- Import organization
- Remove unused imports
- Address deprecation warnings
- Static analysis fixes

**Model:** haiku (fast cleanup tasks)

## Focused Upgrade Agents (Boot 4.1 / Spring AI 2.0-M7)

### spring-boot-41-rc-upgrade-agent

Focused upgrade agent for Spring Boot 4.0.x → 4.1.0-RC1 (and future Boot 4.1 GA).

**Purpose:** Orchestrate RC/milestone repository setup, BOM override reconciliation,
parent bump, `ReactorClientHttpRequestFactoryBuilder.withHttpClientDefaults()` injection,
and the Boot 4.1 property awareness pass. Distinct from the generic `migration-agent`
because it explicitly opts into RC/milestone resolution.

**Workflow:**

```text
Detect → Build file updates → BOM override reconciliation
       → Dependency updates (--target-rc) → Code-level Boot 4.1 changes
       → Property awareness → Validate → Commit + PR
```

**Capabilities:**

- Boot 4.0.x → 4.1.0-RC1 parent bump with both `<repositories>` and `<pluginRepositories>`
- Drop stale `<micrometer.version>`, `<spring-framework.version>`, etc. overrides
- Opt into Boot RC without weakening the global stable-only filter for other deps
- Detect and migrate `ReactorClientHttpRequestFactoryBuilder` proxy default change

**When to use:** Targeted Boot 4.1.0-RC1 onboarding for an existing Boot 4.0.x project.

**Skills:** `migration-state`, `version-detector`, `spring-boot-4-breaking-changes-detector`,
`build-file-updater`, `spring-boot-bom-override-reconciler`, `dependency-updater`,
`restclient-to-webclient-customizer-migrator`, `application-property-migrator`, `build-runner`

### spring-ai-20-m7-upgrade-agent

Focused upgrade agent for Spring AI 1.1.x → 2.0.0-M7 (and from 2.0.0-M1..M6 → M7).

**Purpose:** Orchestrate starter renames, removed-module handling,
`spring-ai-spring-cloud-bindings` removal, MCP client package + customizer migrations,
SSE → Streamable HTTP transport transition, options-setter rewrites, Jackson 2 compat
layer removal, and — mandatorily — the multi-provider model selector enforcement that
prevents OpenAI auto-binding crashes.

**Workflow:**

```text
Detect + version validation → Build file updates → Core Spring AI migration
                            → MCP client migration → SSE → Streamable HTTP
                            → Options setter migration → Property migration
                            → MANDATORY selector enforcement → Validate → Commit + PR
```

**Capabilities:**

- Spring AI 1.x → 2.0 full transformation suite including M1-M7 API removals
- Mandatory `spring-ai-model-selector-enforcer` final step
- Refuses to finish if any Spring profile lacks one of the six `spring.ai.model.*` selectors
- Per-profile app-startup probe in validation phase

**When to use:** Any Spring AI 2.0 onboarding, especially with multiple providers on the classpath.

**Skills:** `migration-state`, `version-detector`, `spring-ai-version-validator`,
`build-file-updater`, `spring-ai-migrator`, `spring-ai-mcp-client-package-migrator`,
`spring-ai-mcp-sse-to-streamable-http-migrator`, `spring-ai-options-setter-migrator`,
`application-property-migrator`, `spring-ai-model-selector-enforcer`, `dependency-scanner`,
`build-runner`

**Composition:** If a project needs both Boot 4.1.0-RC1 AND Spring AI 2.0.0-M7, run
`spring-boot-41-rc-upgrade-agent` first, then this agent.

## Agent Architecture

```text
                    ┌─────────────────────────────────────────────┐
                    │              ORCHESTRATOR                   │
                    │   (or parallel-orchestrator for GitHub)     │
                    └─────────────────────────────────────────────┘
                                        │
        ┌───────────────────────────────┼───────────────────────────┐
        ▼                               ▼                           ▼
┌───────────────┐              ┌───────────────┐           ┌───────────────┐
│   RESEARCH    │              │   DISCOVERY   │           │   MIGRATION   │
│  guide-fetcher│              │ discovery-agent│           │migration-agent│
│ recipe-analyzer│              └───────────────┘           └───────────────┘
│reference-learner│                     │                           │
└───────────────┘                       ▼                           ▼
                               ┌───────────────┐           ┌───────────────┐
                               │  VALIDATION   │◀──────────│    CLEANUP    │
                               │validation-agent│           │ cleanup-agent │
                               └───────────────┘           └───────────────┘
```

## Agent Delegation

Agents delegate to skills for specific tasks:

| Agent                               | Skills                                                                                                                                                                                                                                                                                                                                  |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| discovery-agent                     | build-tool-detector, build-tool-upgrader, version-detector, dependency-scanner, dependency-updater, pattern-detector, github-actions-detector                                                                                                                                                                                           |
| migration-agent                     | build-tool-upgrader, jackson-migrator, security-config-migrator, spring-ai-migrator, application-property-migrator, import-migrator, build-file-updater, openrewrite-executor, github-actions-updater                                                                                                                                   |
| validation-agent                    | build-runner                                                                                                                                                                                                                                                                                                                            |
| parallel-orchestrator               | github-workflow, pr-submitter, build-tool-detector, version-detector, dependency-scanner, dependency-updater                                                                                                                                                                                                                            |
| **spring-boot-41-rc-upgrade-agent** | **migration-state, version-detector, spring-boot-4-breaking-changes-detector, build-file-updater, spring-boot-bom-override-reconciler, dependency-updater, restclient-to-webclient-customizer-migrator, application-property-migrator, build-runner**                                                                                   |
| **spring-ai-20-m7-upgrade-agent**   | **migration-state, version-detector, spring-ai-version-validator, build-file-updater, spring-ai-migrator, spring-ai-mcp-client-package-migrator, spring-ai-mcp-sse-to-streamable-http-migrator, spring-ai-options-setter-migrator, application-property-migrator, spring-ai-model-selector-enforcer, dependency-scanner, build-runner** |
