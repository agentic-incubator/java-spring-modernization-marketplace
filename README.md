# Spring Modernization Marketplace

A Claude Code plugin marketplace for automating Spring ecosystem modernization. Upgrade Spring Boot 3.x to 4.x, Jackson 2 to 3, Spring Security 6 to 7, Vaadin 24 to 25, and Spring AI 1.0 to 1.1 with AI-powered agents and skills.

## Quick Start

### Installation

Add this marketplace to Claude Code:

```bash
/plugin marketplace add owner/spring-modernization-marketplace
```

Then install the plugin:

```bash
/plugin install spring-modernization
```

### Basic Usage

Analyze a project:

```
/analyze /path/to/your/project
```

Run migration:

```
/migrate /path/to/your/project
```

Validate results:

```
/validate /path/to/your/project
```

---

## What's Included

### Slash Commands

| Command                  | Description                                 |
| ------------------------ | ------------------------------------------- |
| `/analyze [path]`        | Analyze project for migration requirements  |
| `/migrate [path]`        | Execute Spring ecosystem migration          |
| `/validate [path]`       | Validate migration with builds and tests    |
| `/openrewrite [recipe]`  | Run OpenRewrite automated recipes           |
| `/portfolio-scan [path]` | Scan multiple projects for migration status |
| `/version-check [path]`  | Check framework versions                    |
| `/fix-jackson [path]`    | Fix Jackson 3 migration issues              |
| `/fix-security [path]`   | Fix Spring Security 7 issues                |

### Sub-Agents

| Agent               | Purpose                                     |
| ------------------- | ------------------------------------------- |
| `orchestrator`      | Coordinates multi-project migrations        |
| `guide-fetcher`     | Fetches official migration documentation    |
| `recipe-analyzer`   | Analyzes OpenRewrite recipes                |
| `reference-learner` | Learns from successfully migrated projects  |
| `discovery-agent`   | Analyzes project structure and dependencies |
| `migration-agent`   | Applies code transformations                |
| `validation-agent`  | Verifies migrations succeed                 |
| `cleanup-agent`     | Post-migration code cleanup                 |

### Skills

| Skill                      | Purpose                                |
| -------------------------- | -------------------------------------- |
| `build-tool-detector`      | Detect Maven/Gradle and variants       |
| `version-detector`         | Extract framework versions             |
| `dependency-scanner`       | Find migration-relevant dependencies   |
| `pattern-detector`         | Locate code patterns needing migration |
| `jackson-migrator`         | Jackson 2.x → 3.x migration            |
| `security-config-migrator` | Spring Security 6 → 7 migration        |
| `spring-ai-migrator`       | Spring AI 1.0 → 1.1 migration          |
| `import-migrator`          | Bulk import statement updates          |
| `build-file-updater`       | Update pom.xml/build.gradle            |
| `build-runner`             | Execute and validate builds            |
| `openrewrite-executor`     | Run OpenRewrite recipes                |

---

## Supported Migrations

### Spring Boot 3.x → 4.x

- Parent/plugin version updates
- Jackson 3 integration (groupId changes)
- Spring Security 7 compatibility
- WebClient dependency separation

### Jackson 2.x → 3.x

- GroupId: `com.fasterxml.jackson` → `tools.jackson`
- Exception: `JsonProcessingException` → `JacksonException`
- **Preserved**: `com.fasterxml.jackson.annotation.*` (backward compatible)
- BOM: `tools.jackson:jackson-bom:3.0.2`

### Spring Security 6 → 7

- `VaadinWebSecurity` → `VaadinSecurityConfigurer`
- `AntPathRequestMatcher` → `PathPatternRequestMatcher`
- Method override → `@Bean SecurityFilterChain`

### Vaadin 24 → 25

- Material theme → Lumo theme
- Security configuration updates

### Spring AI 1.0 → 1.1

- TTS API: `SpeechModel` → `TextToSpeechModel`
- Speed param: `Float` → `Double`
- Memory constants renamed

---

## Usage Examples

### Single Project Migration

```bash
# Step 1: Analyze
/analyze /path/to/my-spring-app

# Step 2: Review analysis and proceed
/migrate /path/to/my-spring-app

# Step 3: Validate
/validate /path/to/my-spring-app
```

### Using OpenRewrite

```bash
# Preview changes
/openrewrite spring-boot-4 /path/to/project --dry-run

# Apply Spring Boot 4 upgrade
/openrewrite spring-boot-4 /path/to/project

# Apply Jackson upgrade
/openrewrite jackson-3 /path/to/project
```

### Portfolio Migration

```bash
# Scan all projects
/portfolio-scan /path/to/projects

# Migrate projects in order
/migrate /path/to/projects/lib-common
/migrate /path/to/projects/app-service
/migrate /path/to/projects/app-web
```

### Fixing Issues

```bash
# Fix Jackson-specific issues
/fix-jackson /path/to/project

# Fix Security-specific issues
/fix-security /path/to/project
```

---

## Version Compatibility Matrix

| Spring Boot | Spring Cloud | Spring Security | Java  | Jackson | Spring AI |
| ----------- | ------------ | --------------- | ----- | ------- | --------- |
| 3.3.x       | 2024.0.x     | 6.3.x           | 17-23 | 2.x     | 1.0.x     |
| 3.5.x       | 2025.0.x     | 6.4.x           | 17-24 | 2.x     | 1.0.x     |
| **4.0.x**   | **2025.1.x** | **7.0.x**       | 17-25 | **3.x** | **1.1.x** |

---

## Build Tool Support

This marketplace supports both **Maven** and **Gradle** projects:

### Maven

- Standard `pom.xml` projects
- Multi-module projects
- Maven wrapper support

### Gradle

- Groovy DSL (`build.gradle`)
- Kotlin DSL (`build.gradle.kts`)
- Multi-module projects (`settings.gradle`)
- Gradle wrapper support

---

## Directory Structure

```
spring-modernization-marketplace/
│
├── .claude-plugin/                        # Plugin configuration
│   ├── marketplace.json                   #   Marketplace definition
│   └── plugin.json                        #   Plugin manifest
│
├── agents/                                # Sub-agents
│   ├── cleanup-agent.md                   #   Post-migration cleanup
│   ├── discovery-agent.md                 #   Project structure analysis
│   ├── guide-fetcher.md                   #   Migration docs fetcher
│   ├── migration-agent.md                 #   Code transformation
│   ├── orchestrator.md                    #   Multi-project coordination
│   ├── recipe-analyzer.md                 #   OpenRewrite analysis
│   ├── reference-learner.md               #   Learn from migrated projects
│   └── validation-agent.md                #   Migration verification
│
├── commands/                              # Slash commands
│   ├── analyze.md                         #   /analyze
│   ├── fix-jackson.md                     #   /fix-jackson
│   ├── fix-security.md                    #   /fix-security
│   ├── migrate.md                         #   /migrate
│   ├── openrewrite.md                     #   /openrewrite
│   ├── portfolio-scan.md                  #   /portfolio-scan
│   ├── validate.md                        #   /validate
│   └── version-check.md                   #   /version-check
│
├── skills/                                # Agent skills
│   ├── build-file-updater/
│   │   └── SKILL.md                       #   Update pom.xml/build.gradle
│   ├── build-runner/
│   │   └── SKILL.md                       #   Execute and validate builds
│   ├── build-tool-detector/
│   │   └── SKILL.md                       #   Detect Maven/Gradle
│   ├── dependency-scanner/
│   │   └── SKILL.md                       #   Find migration dependencies
│   ├── import-migrator/
│   │   └── SKILL.md                       #   Bulk import updates
│   ├── jackson-migrator/
│   │   └── SKILL.md                       #   Jackson 2.x → 3.x
│   ├── openrewrite-executor/
│   │   └── SKILL.md                       #   Run OpenRewrite recipes
│   ├── pattern-detector/
│   │   └── SKILL.md                       #   Locate code patterns
│   ├── security-config-migrator/
│   │   └── SKILL.md                       #   Spring Security 6 → 7
│   ├── spring-ai-migrator/
│   │   └── SKILL.md                       #   Spring AI 1.0 → 1.1
│   └── version-detector/
│       └── SKILL.md                       #   Extract framework versions
│
├── .archives/                             # Archived documents
│   ├── prompts.md                         #   Development prompts
│   └── spring-modernization-plan.md       #   Original planning doc
│
├── .markdownlint.json                     # Markdown linting rules
├── .prettierignore                        # Prettier ignore patterns
├── .prettierrc                            # Prettier configuration
├── LICENSE                                # MIT License
├── package.json                           # Node.js dependencies
└── README.md                              # This file
```

---

## Critical Migration Rules

### Jackson Annotations

**DO NOT** change `com.fasterxml.jackson.annotation.*` imports - they are backward compatible!

```java
// CORRECT - Keep as-is
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonIgnore;

// Only change core/databind imports
import tools.jackson.core.JacksonException;      // Changed
import tools.jackson.databind.ObjectMapper;      // Changed
```

### Spring Security Configuration

Convert inheritance to bean-based configuration:

```java
// Before (Security 6)
public class SecurityConfig extends VaadinWebSecurity { ... }

// After (Security 7)
public class SecurityConfig {
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) {
        http.with(VaadinSecurityConfigurer.vaadin(), c -> {});
        return http.build();
    }
}
```

---

## Troubleshooting

### Common Errors

| Error                                               | Cause      | Solution                        |
| --------------------------------------------------- | ---------- | ------------------------------- |
| `cannot find symbol: JsonProcessingException`       | Jackson 3  | Use `JacksonException`          |
| `package com.fasterxml.jackson.core does not exist` | Jackson 3  | Update to `tools.jackson.core`  |
| `cannot find symbol: VaadinWebSecurity`             | Vaadin 25  | Use `VaadinSecurityConfigurer`  |
| `cannot find symbol: AntPathRequestMatcher`         | Security 7 | Use `PathPatternRequestMatcher` |

### Getting Help

1. Run `/analyze` to understand project state
2. Check the archived plan: `.archives/spring-modernization-plan.md`
3. Use fix commands: `/fix-jackson`, `/fix-security`

---

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/) (v9+)

### Setup

Install dependencies:

```bash
pnpm install
```

### Markdown Formatting & Linting

This project uses [Prettier](https://prettier.io/) for formatting and [markdownlint](https://github.com/DavidAnson/markdownlint) for linting all markdown files.

| Command                 | Description                       |
| ----------------------- | --------------------------------- |
| `pnpm run format`       | Format all markdown files         |
| `pnpm run format:check` | Check formatting without changes  |
| `pnpm run lint`         | Lint all markdown files           |
| `pnpm run lint:fix`     | Lint and auto-fix issues          |
| `pnpm run check`        | Run both format check and lint    |
| `pnpm run fix`          | Format and fix all markdown files |

**Quick usage:**

```bash
# Check everything before committing
pnpm run check

# Auto-fix all formatting and lint issues
pnpm run fix
```

---

## Contributing

This marketplace is open for contributions. To add new skills, agents, or commands:

1. Fork the repository
2. Add your component to the appropriate directory
3. Follow the existing file format conventions
4. Submit a pull request

---

## License

MIT
