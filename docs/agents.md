# Agents Reference

Specialized AI agents that coordinate migration workflows.

## Orchestration Agents

### orchestrator

Master coordinator for Spring ecosystem modernization.

**Purpose:** Manages the complete migration lifecycle across single or multiple projects.

**Workflow:**

```
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

```
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
- `import-migrator`
- `build-file-updater`
- `openrewrite-executor`
- `github-actions-updater`

**Execution order:**

1. Build file updates
2. Import migrations
3. Configuration migrations
4. Validation

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

## Agent Architecture

```
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

| Agent                 | Skills                                                                                                                                                                 |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| discovery-agent       | build-tool-detector, build-tool-upgrader, version-detector, dependency-scanner, pattern-detector, github-actions-detector                                              |
| migration-agent       | build-tool-upgrader, jackson-migrator, security-config-migrator, spring-ai-migrator, import-migrator, build-file-updater, openrewrite-executor, github-actions-updater |
| validation-agent      | build-runner                                                                                                                                                           |
| parallel-orchestrator | github-workflow, pr-submitter, build-tool-detector, version-detector, dependency-scanner                                                                               |
