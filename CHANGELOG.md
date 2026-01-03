# Changelog

All notable changes to the Spring Modernization Marketplace will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-01-03

### Added

#### Idempotent Migration Operations

- **State Management System**: YAML-based migration state tracking with `.migration-state.yaml` files
  - Branch-specific state files committed to migration branches
  - Tracks applied transformations, marketplace version, and validation status
  - Atomic state commits with code changes to prevent drift
  - Backup and recovery mechanisms for corrupted state files

- **Resume Capability**: Resume interrupted or failed migrations from last checkpoint
  - `/spring-m11n:resume` command to continue from where you left off
  - Marketplace upgrade detection (e.g., 1.0.0 → 1.1.0)
  - Incremental transformation application (only apply new/missing transformations)
  - Safe retry on same branch without losing progress

- **New Skills**:
  - `migration-state`: YAML-based state management utilities with 7 core functions
  - `skill-registry`: Central version catalog for all migration skills
  - `resume-migration`: Resume interrupted migrations with upgrade detection
  - `post-merge-cleanup`: Automatic state file cleanup on successful PR merge
  - `vaadin-migrator`: Complete Vaadin 23.x → 24.x migration skill

- **Skill Metadata System**:
  - `metadata.yaml` files for all migrator skills
  - Version tracking for individual transformations
  - Detection patterns for idempotent transformation checks
  - Dependency resolution between skills

#### Enhanced Skills

- **github-workflow**: Branch reuse detection and state initialization
  - Detects existing migration branches (local and remote)
  - Reuses branches instead of deleting and recreating
  - Initializes state file when creating new migration branches
  - Pull with rebase for updating existing branches

- **migration-agent**: State tracking throughout migration lifecycle
  - Records transformations in all 6 migration phases
  - Updates validation status after build/test runs
  - Structured commit messages with transformation metadata
  - Atomic state file commits

- **Idempotent Transformations**: All core migrators now support idempotent operations
  - `jackson-migrator`: Detection patterns and skip logic for 4 transformations
  - `spring-ai-migrator`: Idempotent handling of 6 transformations (Spring AI 2.0)
  - `security-config-migrator`: Smart transformation application with verification
  - `vaadin-migrator`: Complete skill with idempotent theme and security migrations

#### Documentation

- **Commands**: `commands/resume.md` - Complete resume command documentation
- **Architecture**: Comprehensive architecture documentation for state management
- **Examples**: Complete example state files showing migration lifecycle

### Changed

- **Migration Workflow**: Now supports resumable, idempotent operations
- **Branch Management**: Non-destructive branch reuse instead of delete-and-recreate
- **Transformation Tracking**: Per-transformation tracking instead of skill-level only

### Fixed

- **Duplicate Transformations**: Prevented through state-based skip logic
- **Lost Work on Retry**: Eliminated through branch reuse and state persistence
- **Marketplace Upgrades**: Automatic detection and incremental application

## [1.0.0] - 2025-12-XX

### Added

#### Core Migration Framework

- **Commands** (10 total):
  - `/spring-m11n:migrate` - Full migration orchestration
  - `/spring-m11n:analyze` - Project analysis and migration planning
  - `/spring-m11n:validate` - Build and test validation
  - `/spring-m11n:migrate-github` - Parallel GitHub repository migrations
  - `/spring-m11n:check-github-actions` - GitHub Actions workflow detection
  - `/spring-m11n:version-check` - Framework version detection
  - `/spring-m11n:fix-jackson` - Jackson 3 specific fixes
  - `/spring-m11n:fix-security` - Spring Security 7 specific fixes
  - `/spring-m11n:openrewrite` - OpenRewrite recipe execution
  - `/spring-m11n:portfolio-scan` - Portfolio-wide migration status

- **Agents** (9 total):
  - `migration-agent` - Orchestrates full migration lifecycle
  - `parallel-orchestrator` - Parallel multi-repo migrations
  - `discovery-agent` - Framework and dependency detection
  - `validation-agent` - Build and test validation
  - `cleanup-agent` - Post-migration cleanup
  - `guide-fetcher` - Spring migration guide retrieval
  - `reference-learner` - Pattern learning from reference projects
  - `recipe-analyzer` - OpenRewrite recipe cataloging

- **Skills** (20 total):
  - `build-tool-detector` - Maven/Gradle detection
  - `build-tool-upgrader` - Build tool version upgrades
  - `build-file-updater` - Dependency and plugin updates
  - `version-detector` - Framework version detection
  - `dependency-scanner` - Dependency analysis
  - `pattern-detector` - Migration pattern detection
  - `jackson-migrator` - Jackson 2.x → 3.x migrations
  - `spring-ai-migrator` - Spring AI 1.x → 2.0 migrations
  - `security-config-migrator` - Spring Security 6 → 7 migrations
  - `import-migrator` - Import statement updates
  - `application-property-migrator` - application.properties/yaml updates
  - `github-actions-detector` - GitHub Actions workflow detection
  - `github-actions-updater` - Java version updates in CI/CD
  - `deployment-java-detector` - Deployment Java version detection
  - `deployment-java-updater` - Deployment configuration updates
  - `github-workflow` - Branch and PR management
  - `pr-submitter` - Pull request creation
  - `label-manager` - GitHub issue/PR label management
  - `build-runner` - Build execution and validation
  - `openrewrite-executor` - OpenRewrite recipe execution
  - `recipe-discovery` - OpenRewrite recipe catalog

#### Framework Support

- **Spring Boot**: 3.x → 4.x migrations
  - Starter dependency renames
  - Undertow removal handling
  - Spring Milestones repository configuration
  - Property namespace updates

- **Jackson**: 2.x → 3.x migrations
  - GroupId changes (`com.fasterxml.jackson` → `tools.jackson`)
  - Exception class updates
  - Property namespace migration
  - BOM dependency management

- **Spring Security**: 6.x → 7.x migrations
  - Bean-based configuration migration
  - PathPatternMatcher adoption
  - Authorization expression updates
  - CSRF and session management updates

- **Spring AI**: 1.x → 2.0.0-M1 migrations
  - TTS model renames (SpeechModel → TextToSpeechModel)
  - Speed parameter type changes (Float → Double)
  - Advisor constant renames
  - Autoconfigure provider selection
  - Autoconfigure class split handling

- **Vaadin**: Basic detection and theme migration

#### Build Tool Support

- **Maven**: Standard, multi-module, wrapper support
- **Gradle**: Groovy DSL, Kotlin DSL, multi-module, wrapper support
- **OpenRewrite**: Integration for automated transformations

#### GitHub Integration

- **Parallel Repository Migration**: Clone and migrate multiple repos simultaneously
- **Automatic PR Creation**: Submit pull requests with migration changes
- **Fork Detection**: Identify and handle forked repositories
- **Dependency Ordering**: Migrate libraries before applications
- **CI/CD Updates**: Java version updates in GitHub Actions workflows

#### Documentation

- **Getting Started**: Installation and basic usage
- **Claude Code Workflows**: Interactive usage patterns
- **Commands Reference**: Complete slash command documentation
- **Agents Guide**: Specialized agents and orchestration
- **Skills Catalog**: Migration skills reference
- **Migrations Guide**: Detailed migration patterns
- **GitHub Workflows**: Parallel migration setup
- **Troubleshooting**: Common errors and solutions
- **Sample Workflows**: Real migration examples
- **Project Historical**: AI-assisted development tracing

### Initial Release Features

- Automated Spring Boot 4.x migration at scale
- Parallel processing for portfolio migrations
- Automatic PR creation and submission
- Framework version detection and compatibility checking
- Build tool auto-detection and upgrading
- Comprehensive migration validation (build + tests)
- OpenRewrite integration for automated transformations
- GitHub Actions Java version detection and updates

---

## Version History

- **1.1.0** (2026-01-03) - Idempotent migration operations, state management, resume capability
- **1.0.0** (2025-12-XX) - Initial release with full migration framework

## Upgrade Guide

### From 1.0.0 to 1.1.0

**Backward Compatible**: No breaking changes. All 1.0.0 migrations continue to work.

**New Features Available**:

1. **State Tracking**: New migrations automatically create `.migration-state.yaml` files
2. **Resume**: Use `/spring-m11n:resume` to continue interrupted migrations
3. **Branch Reuse**: Migration branches are now reused instead of recreated
4. **Idempotent Skills**: All migrators now support safe re-execution

**Migration Path**:

```bash
# Existing 1.0.0 migrations continue to work as-is
/spring-m11n:migrate /path/to/project

# New migrations get state tracking automatically
/spring-m11n:migrate /path/to/new-project

# Resume interrupted migrations
/spring-m11n:resume /path/to/project
```

**State File Management**:

- State files are branch-specific (`.migration-state.yaml`)
- Automatically committed to migration branches
- Cleaned up on successful PR merge (via `post-merge-cleanup` skill)
- Gitignored from main branch

## Links

- [Documentation](docs/)
- [GitHub Repository](https://github.com/agentic-incubator/java-spring-modernization-marketplace)
- [Issues](https://github.com/agentic-incubator/java-spring-modernization-marketplace/issues)
- [Releases](https://github.com/agentic-incubator/java-spring-modernization-marketplace/releases)
