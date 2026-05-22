# Skills Reference

Reusable capabilities that agents invoke for specific migration tasks.

## Shared Infrastructure

### migration-protocol

Canonical reference for the idempotent transformation protocol shared by all migration skills (new in v1.8.0).

**Defines:**

- Read-check-detect-apply-update loop with skip logic
- State file format (`.migration-state.yaml`) and version comparison rules
- Build verification commands for Maven and Gradle
- Spring Milestones repository configuration for milestone/snapshot releases

All migration skills delegate their boilerplate here instead of duplicating it.

**Dependencies:** `migration-state` >= 1.0.0, `build-runner` >= 1.0.0

### migration-state

Core YAML-based state management for idempotent migration operations.

**Capabilities:**

- Initialize, read, update, and atomically commit `.migration-state.yaml`
- Track applied transformations with version, timestamp, and commit SHA
- Record compilation and test validation results
- Detect corrupted state files and recover from git history or backup
- Documentation change tracking (v1.1.0+)

**Schema fields:** `migrationId`, `branch`, `marketplaceVersion`, `appliedTransformations`, `pendingTransformations`, `validationStatus`

### skill-registry

Central version catalog that tracks all migration skills and their versions.

**Capabilities:**

- Version tracking and upgrade detection across all skills
- Metadata lookup (transformations, dependencies) for orchestration
- Semantic version comparison and new-transformation discovery
- Integration with `.migration-state.yaml` for resume and upgrade flows

## Discovery Skills

### build-tool-detector

Identifies Maven vs Gradle build systems.

**Detects:**

- Maven (`pom.xml`)
- Gradle Groovy DSL (`build.gradle`)
- Gradle Kotlin DSL (`build.gradle.kts`)
- Wrapper presence (`mvnw`, `gradlew`)
- Multi-module structures

### build-tool-upgrader

Upgrades Maven/Gradle wrappers to versions compatible with Spring Boot 4.

**Requirements for Spring Boot 4:**

| Build Tool | Minimum | Recommended |
| ---------- | ------- | ----------- |
| Gradle     | 8.5     | 8.11        |
| Maven      | 3.9.0   | 3.9.9       |

**Commands:**

```bash
# Gradle upgrade
./gradlew wrapper --gradle-version 8.11

# Maven upgrade
./mvnw wrapper:wrapper -Dmaven=3.9.9
```

**Updates:**

- `gradle/wrapper/gradle-wrapper.properties`
- `.mvn/wrapper/maven-wrapper.properties`
- Wrapper scripts (`gradlew`, `mvnw`)

### version-detector

Extracts framework versions from build files.

**Extracts:**

- Spring Boot version
- Spring Cloud version
- Spring Security version
- Java version
- Jackson version
- Vaadin version
- Spring AI version

**Supports:** Maven properties, Gradle ext blocks, version catalogs

### dependency-scanner

Catalogs migration-relevant dependencies.

**Scans for:**

- Jackson dependencies (core, databind, datatype, module)
- Spring Security dependencies
- Vaadin dependencies
- Spring AI dependencies
- **Undertow** (BLOCKING - must be removed for Boot 4)
- **spring-boot-starter-web** (rename to webmvc)
- Milestone versions (require Spring Milestones repo)

**Identifies:**

- Direct dependencies
- Managed dependencies
- Transitive dependencies
- Plugin dependencies
- Repository requirements (Spring Milestones for -M1, -RC releases)

### dependency-updater

Upgrades all dependencies and plugins to their latest stable/milestone compatible versions. Supports Maven and Gradle with configurable filtering.

**Detects:**

- Outdated dependencies (direct, managed, transitive)
- Outdated plugins (Maven, Gradle)
- Property-based version declarations
- Gradle version catalogs (`libs.versions.toml`)

**Capabilities:**

- **Report mode**: Display available updates without changes
- **Update mode**: Apply updates with validation
- **Three filter strategies**:
  - `stable-only` (default): Excludes alpha, beta, RC, milestone, snapshot
  - `include-milestones`: Excludes alpha, beta, snapshot; includes RC and milestones
  - `aggressive`: Excludes snapshots only
- Handles Spring Boot BOM-managed dependencies (skips with INFO log)
- Auto-adds Spring Milestones repository for milestone versions
- Creates automatic backups for rollback (`pom.xml.versionsBackup`, `build.gradle.backup`)
- Validates builds and tests after updates
- Integrates with migration-state for idempotency

**Maven Tools:**

- `mvn versions:display-dependency-updates` (report)
- `mvn versions:use-latest-releases` (update dependencies)
- `mvn versions:update-plugins` (update plugins)
- `mvn versions:update-properties` (update property-based versions)
- `mvn versions:revert` (rollback)

**Gradle Tools:**

- `ben-manes/gradle-versions-plugin` (report via `dependencyUpdates` task)
- `patrikerdes/use-latest-versions-plugin` (apply updates via `useLatestVersions` task)

**Example:**

```bash
# Report mode shows available updates
guava: 32.1.0 → 33.0.0
maven-compiler-plugin: 3.11.0 → 3.13.0
spring-security-core: (managed by Spring Boot BOM - skipped)

# Update mode applies updates with validation
15 dependencies updated
Compilation: ✅ PASSED
Tests: ✅ PASSED (150 passed, 0 failed)
```

**Used by:** discovery-agent (project analysis phase)

**Depends on:** build-tool-detector, build-runner, migration-state

### pattern-detector

Finds code patterns requiring migration.

**Patterns detected:**

| Pattern                      | Migration     |
| ---------------------------- | ------------- |
| `JsonProcessingException`    | Jackson 3     |
| `com.fasterxml.jackson.core` | Jackson 3     |
| `VaadinWebSecurity`          | Vaadin 25     |
| `AntPathRequestMatcher`      | Security 7    |
| `SpeechModel`                | Spring AI 1.1 |

### github-actions-detector

Detects Java versions and configurations from GitHub Actions workflow files.

**Scans:**

- `.github/workflows/*.yml` and `.github/workflows/*.yaml`
- `actions/setup-java` steps
- `graalvm/setup-graalvm` steps
- Matrix strategy configurations

**Extracts:**

- Java versions (direct, matrix, environment variable)
- Distribution (temurin, liberica, corretto, zulu, etc.)
- Action versions

**Compares:**

- Build file Java version vs CI Java version
- Flags misalignment for remediation

### deployment-java-detector

Detects Java versions and distributions in deployment manifests.

**Supported Platforms:**

| Platform      | Files               | Version Location                  |
| ------------- | ------------------- | --------------------------------- |
| Docker        | `Dockerfile*`       | `FROM` image tags                 |
| Kubernetes    | `k8s/**/*.yaml`     | Container image specs             |
| Cloud Foundry | `manifest.yml`      | `JBP_CONFIG_OPEN_JDK_JRE` env var |
| Fly.io        | `fly.toml`          | `BP_JVM_VERSION` in build.args    |
| Paketo/CNB    | `project.toml`      | `BP_JVM_VERSION` env var          |
| Heroku        | `system.properties` | `java.runtime.version` property   |

**Distributions Detected:**

- BellSoft Liberica (preferred)
- Eclipse Temurin
- Azul Zulu
- Amazon Corretto
- GraalVM

### deployment-java-updater

Updates Java versions in deployment manifests, preferring **BellSoft Liberica** distribution.

**Update Patterns:**

```dockerfile
# Dockerfile: before
FROM eclipse-temurin:17-jdk

# Dockerfile: after (Liberica preferred)
FROM bellsoft/liberica-openjdk-alpine:21
```

```yaml
# Cloud Foundry manifest.yml
env:
  JBP_CONFIG_OPEN_JDK_JRE: '{ jre: { version: 21.+ } }'
```

```toml
# Fly.io fly.toml
[build.args]
BP_JVM_VERSION = "21"
```

**Image Size Reference:**

| Image                                                  | Size    |
| ------------------------------------------------------ | ------- |
| `bellsoft/liberica-openjdk-alpine:21`                  | ~200 MB |
| `bellsoft/liberica-openjre-alpine:21`                  | ~100 MB |
| `bellsoft/liberica-runtime-container:jre-21-slim-musl` | ~50 MB  |

### spring-boot-4-breaking-changes-detector

Comprehensive detector for Spring Boot 4.x breaking changes that would cause compilation or runtime failures.

**Detects:**

| Change                                                        | Severity |
| ------------------------------------------------------------- | -------- |
| `RestClientCustomizer` removed (Boot 4.0.1)                   | HIGH     |
| `HttpMessageConverters` removed                               | CRITICAL |
| Spring Retry no longer transitive                             | MEDIUM   |
| Undertow starter incompatible with Servlet 6.1                | CRITICAL |
| `spring-boot-starter-web` renamed to `webmvc`                 | LOW      |
| `HttpHeaders` no longer extends `MultiValueMap` (Framework 7) | MEDIUM   |

Generates a YAML report with severity levels, file locations, and remediation guidance.

### spring-ai-version-validator

Validates Spring AI version format to prevent Maven dependency resolution failures.

**Problem:** `2.0-M1` is invalid; the correct format is `2.0.0-M6` (X.Y.Z-M#).

**Capabilities:**

- Detects invalid milestone/RC version formats in Maven and Gradle build files
- Auto-corrects missing patch version (`2.0-M1` → `2.0.0-M6`)
- Clears Maven artifact cache after correction (`rm -rf ~/.m2/repository/org/springframework/ai`)

**Version reference:** `2.0.0-M6` for Spring Boot 4.x; `1.1.6` for Spring Boot 3.5.x.

### openapi-generator-detector

Reusable detection logic for OpenAPI Generator plugin usage, library configuration, and template paths.

**Detects:**

- Maven (`openapi-generator-maven-plugin`) and Gradle (`org.openapi.generator`) plugin presence
- Library configuration (`spring-http-interface`, `spring-cloud`, etc.)
- Custom `templateDirectory` / `templateDir` configuration
- Mustache template files in project templates directory

**Used by:** `openapi-generator-plugin-updater`, `spring-framework-7-migrator`

### openfeign-compatibility-detector

Detects Spring Cloud OpenFeign usage and identifies compatibility blockers for Spring Boot 4.x.

**Detects:**

- `@FeignClient` interfaces and `@EnableFeignClients` usage
- Custom `SpringDecoder`/`SpringEncoder` using `HttpMessageConverters` (CRITICAL blocker)
- `RequestInterceptor` and `ErrorDecoder` bean definitions
- Spring Cloud version compatibility (2025.0.x is incompatible with Boot 4.x)

**Output:** YAML report with compatibility status, blockers list, and migration options (upgrade Spring Cloud vs migrate to HTTP Interface).

### dependency-conflict-analyzer

Detects transitive dependency conflicts, particularly Jackson 2.x vs 3.x version coexistence issues.

**Key scenarios:**

- Mixed Jackson versions in the same classpath
- Spring AI 2.0.0-M\* requires Jackson 2.x while Spring Boot 4 uses Jackson 3.x — **do not pin to Jackson 3** in this case
- Generates recommended BOM or compatibility-layer remediation

**Used by:** validation-agent (Phase 6)

### library-migration-classifier

Classifies dependency changes as version upgrade vs library migration to estimate effort accurately.

**Classifications:**

| Type                  | Effort | Example                                  |
| --------------------- | ------ | ---------------------------------------- |
| Version Upgrade Patch | LOW    | Boot 4.0.0 → 4.0.1                       |
| Version Upgrade Major | MEDIUM | Boot 3.x → 4.x                           |
| Library Migration     | HIGH   | `reactive-pg-client` → Spring Data R2DBC |

Includes a deprecated-library database with replacement mappings and effort estimates.

### multi-module-dependency-analyzer

Builds a dependency graph (DAG) for multi-module Maven/Gradle projects to determine optimal build order.

**Capabilities:**

- Parses `<modules>` (Maven) and `include()` (Gradle) to identify modules
- Performs topological sort to determine sequential and parallel build levels
- Identifies blocking modules whose failure propagates to dependents

**Output:** YAML with build order, parallelization opportunities, and blocking-module impact levels.

### testcontainers-module-validator

Ensures required Testcontainers modules are declared when container classes are used in tests.

**Detects:** `CassandraContainer`, `PostgreSQLContainer`, `MySQLContainer`, `KafkaContainer`, and others.

**Auto-adds** missing module dependencies (`testcontainers:cassandra`, etc.) to Maven or Gradle with `test` scope.

**Used by:** validation-agent, discovery-agent

### version-comparator

Semantic version comparison utilities for migration tier classification and version-aware decision making.

**Functions:** `compare_versions`, `needs_patch_upgrade`, `needs_minor_upgrade`, `needs_major_upgrade`, `parse_version`, `classify_migration_tier`

**Migration tiers:** `FULL_MIGRATION`, `MINOR_UPGRADE`, `PATCH_UPGRADE`, `COMPREHENSIVE_REFRESH`, `SKIP`, `SKIP_NEWER`

Handles SNAPSHOT, milestone, and RC version suffixes by comparing base versions.

## Migration Skills

### jackson-migrator

Handles Jackson 2.x to 3.x migration.

**Changes:**

| Before                           | After                    |
| -------------------------------- | ------------------------ |
| `com.fasterxml.jackson.core`     | `tools.jackson.core`     |
| `com.fasterxml.jackson.databind` | `tools.jackson.databind` |
| `JsonProcessingException`        | `JacksonException`       |

**Preserves:** `com.fasterxml.jackson.annotation.*` (backward compatible!)

**Adds:** Jackson BOM 3.0.2 for version management

### security-config-migrator

Converts Spring Security 6 to 7 patterns.

**Migrations:**

```java
// Before
public class Config extends VaadinWebSecurity {
    @Override
    protected void configure(HttpSecurity http) { }
}

// After
public class Config {
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) {
        http.with(VaadinSecurityConfigurer.vaadin(), c -> {});
        return http.build();
    }
}
```

**Also handles:**

- `AntPathRequestMatcher` to `PathPatternRequestMatcher`
- Import updates

### spring-ai-migrator

Migrates Spring AI 1.x to 2.0.x (required for Spring Boot 4 compatibility).

**Changes:**

| Before                            | After                        |
| --------------------------------- | ---------------------------- |
| `SpeechModel`                     | `TextToSpeechModel`          |
| Speed: `Float` (e.g., `1.0f`)     | `Double` (e.g., `1.0`)       |
| `CHAT_MEMORY_RETRIEVE_SIZE_KEY`   | `TOP_K`                      |
| `CHAT_MEMORY_CONVERSATION_ID_KEY` | `ChatMemory.CONVERSATION_ID` |
| Autoconfigure excludes            | `spring.ai.model.*` config   |

**Spring Boot 4 Requirement:** Spring AI 2.0.0-M6 is required due to autoconfigure module split.

### application-property-migrator

Migrates application.yml and application.properties files for Spring Boot 4.

**Changes:**

| Category           | Before                  | After                        |
| ------------------ | ----------------------- | ---------------------------- |
| Property naming    | `base_url`              | `base-url` (kebab-case)      |
| Jackson namespace  | `spring.jackson.read.*` | `spring.jackson.json.read.*` |
| Jackson logging    | `com.fasterxml.jackson` | `tools.jackson`              |
| Spring AI provider | Autoconfigure excludes  | `spring.ai.model.*`          |
| Float literals     | `speed: 1.0f`           | `speed: 1.0`                 |

### import-migrator

Bulk updates Java import statements.

**Capabilities:**

- Batch import replacement
- Pattern-based updates
- Preserves formatting
- Handles static imports

### build-file-updater

Updates Maven pom.xml and Gradle build files.

**Operations:**

- Version bumps (parent, plugins, dependencies)
- BOM additions (Jackson, Spring Cloud)
- Repository additions (Spring Milestones for milestone releases)
- GroupId changes (Jackson 2 → 3)
- Starter renames (`spring-boot-starter-web` → `spring-boot-starter-webmvc`)
- Undertow removal (not compatible with Servlet 6.1)
- Property updates
- Dependency additions/removals

**Supports:** Maven, Gradle Groovy, Gradle Kotlin DSL

### github-actions-updater

Updates Java versions in GitHub Actions workflow files.

**Updates:**

- `java-version` in `actions/setup-java` steps
- Matrix strategy Java arrays
- Environment variable definitions
- `graalvm/setup-graalvm` configurations

**Preserves:**

- Distribution settings (temurin, liberica, etc.)
- Other workflow configurations
- Comments and formatting

**Example:**

```yaml
# Before
- uses: actions/setup-java@v4
  with:
    distribution: liberica
    java-version: '21'

# After
- uses: actions/setup-java@v4
  with:
    distribution: liberica
    java-version: '25'
```

### vaadin-migrator

Migrates Vaadin Flow 23.x to 24.x and 24.x to 25.x including theme updates, component API changes, and Spring Security integration.

> **Important:** Vaadin Flow 24.x free maintenance ends **June 16, 2026**. New migrations should target Vaadin Flow 25.1.x directly.

**Version compatibility:**

| Spring Boot | Vaadin Flow | Notes                             |
| ----------- | ----------- | --------------------------------- |
| 3.3.x       | 23.x        | Legacy — upgrade required         |
| 4.0.x       | 24.x        | Boot 4 minimum (EOL Jun 16, 2026) |
| 4.0.x       | 25.1.x      | Current recommended               |

**Changes (23→24):** Lumo theme variant syntax, `setDataProvider` → `setItems`, `setCloseOnOutsideClick` → `setModal`

**Changes (24→25):** BOM update to 25.1.x, Webpack → Vite bundler, `@Theme` variant attribute removed (use CSS instead), Java 21 required.

**Depends on:** `security-config-migrator`, `migration-state`, `build-runner`

### spring-framework-7-migrator

Migrates Spring Framework 6.x API usage to 7.x and injects compatible OpenAPI Generator templates.

**API changes:**

| Framework 6.x                                        | Framework 7.x                       |
| ---------------------------------------------------- | ----------------------------------- |
| `HttpServiceProxyFactory.builder(adapter)`           | `.builderFor(adapter)`              |
| `WebClientAdapter.forClient(client)`                 | `.create(client)`                   |
| `MultiValueMap<String,String> h = new HttpHeaders()` | `HttpHeaders h = new HttpHeaders()` |
| `RestTemplate` (deprecated)                          | `RestClient` or `WebClient`         |

For projects using OpenAPI Generator with `spring-http-interface` library, injects a Framework 7 compatible
`httpInterfacesConfiguration.mustache` template. Shows diff and asks before modifying custom templates.

**Used by:** `openapi-generator-plugin-updater`

### openapi-generator-library-migrator

Migrates OpenAPI Generator plugin configuration from `spring-cloud` (Feign) to `spring-http-interface` for Spring Boot 4 compatibility.

**Applies to:** OpenAPI-generated clients only (not hand-written `@FeignClient` interfaces).

**Transformations:**

- Changes `<library>spring-cloud</library>` → `<library>spring-http-interface</library>`
- Adds required `configPackage` (inferred from `apiPackage`)
- Adds `templateDirectory` for Framework 7 template customization
- Removes Feign-specific options (`interfaceOnly`, `useTags`, `java8`, etc.)
- Cleans up per-client URL mappings from `application.yml`
- Removes `@EnableFeignClients` if no hand-written clients remain

**Coordinates with:** `openfeign-to-httpinterface-migrator` for mixed (OpenAPI + hand-written) scenarios.

### openapi-generator-plugin-updater

Intelligently updates OpenAPI Generator plugin versions based on Spring Framework compatibility.

**Compatibility matrix:**

| Spring Framework | Minimum Plugin | Recommended |
| ---------------- | -------------- | ----------- |
| 7.x              | 7.18.0         | 7.22.0      |
| 6.x              | 7.0.0          | 7.22.0      |

Only updates the plugin when the `spring-http-interface` library is in use and the current version is incompatible.
Triggers `spring-framework-7-migrator` to update templates when Framework 7 is detected.

### openfeign-to-httpinterface-migrator

Automates migration from Spring Cloud OpenFeign (`@FeignClient`) to Spring HTTP Interface (`@HttpExchange`) clients.

**Annotation mapping:**

| OpenFeign                     | HTTP Interface                          |
| ----------------------------- | --------------------------------------- |
| `@FeignClient`                | `@HttpExchange`                         |
| `@GetMapping`                 | `@GetExchange`                          |
| `@PostMapping`                | `@PostExchange`                         |
| `@DeleteMapping`              | `@DeleteExchange`                       |
| `SpringDecoder/SpringEncoder` | `ClientHttpMessageConvertersCustomizer` |
| `RequestInterceptor`          | `ClientHttpRequestInterceptor`          |

Generates `HttpServiceProxyFactory` configuration beans per client. Removes `spring-cloud-starter-openfeign`
dependency and `@EnableFeignClients`. Automation: 85%.

### gradle-9-syntax-migrator

Migrates Gradle build files to Gradle 9.x syntax requirements.

**Changes:**

- Moves `sourceCompatibility`/`targetCompatibility` from project level into `java {}` block
- Adds `test { useJUnitPlatform() }` when JUnit 5 is used but the block is absent
- Fixes wrapper version format (`gradle-9.1-bin.zip` → `gradle-9.1.0-bin.zip`)

**Triggered:** Auto-triggered when Gradle 9.x wrapper is detected.

### junit4-to-junit5-migrator

Automates JUnit 4 to JUnit 5 (Jupiter) migration including imports, annotations, runners, and build configuration.

**Import mapping (selection):**

| JUnit 4                        | JUnit 5                              |
| ------------------------------ | ------------------------------------ |
| `org.junit.Test`               | `org.junit.jupiter.api.Test`         |
| `@RunWith(SpringRunner.class)` | `@ExtendWith(SpringExtension.class)` |
| `@Before` / `@After`           | `@BeforeEach` / `@AfterEach`         |
| `@BeforeClass` / `@AfterClass` | `@BeforeAll` / `@AfterAll`           |
| `@Ignore`                      | `@Disabled`                          |

Optionally delegates to the OpenRewrite recipe `JUnit4to5Migration` for AST-based transformations.
Flags `@Test(expected=...)` for manual `assertThrows()` conversion. Automation: 95%.

### documentation-migrator

Updates cross-cutting documentation for Spring Boot 4.x migration and generates aggregated change reports.

**Updates:**

- README prerequisites (Java, Spring Boot, Maven/Gradle versions)
- General version references in prose
- Getting-started guides and installation instructions
- Version compatibility tables in migration guides

Reads target versions from `.migration-state.yaml` and runs **after** code migrators to keep documentation
aligned with actual changes. Generates `.migration-summary/docs-changes.md` as an aggregated report across all
skills.

**Depends on:** `migration-state` >= 1.1.0

### label-manager

Manages GitHub repository labels — discovery, comparison, and creation — before PR submission.

**Operations:**

- Lists existing labels (`gh label list`)
- Compares against required labels and identifies missing ones
- Creates missing labels with standard colors and descriptions
- Supports batch creation across multiple repositories

Includes a standard label set for migration PRs: `spring-boot-4`, `automated`, `needs-review`, `migration`, `jackson-3`, `spring-security-7`.

## Recipe Discovery Skills

### recipe-discovery

Dynamically discovers OpenRewrite recipes from online documentation with version-based matching and composite recipe tree walking.

**Capabilities:**

- Version-based recipe discovery from <https://docs.openrewrite.org/recipes>
- Composite recipe tree walking to understand coverage
- Latest version targeting
- Transitive dependency handling

**Recipe Catalog:** `skills/recipe-discovery/recipe-catalog.yaml`

**Discovery Process:**

1. Parse detected versions from project analysis
2. Consult recipe catalog for known upgrade paths
3. Search OpenRewrite docs for recipes not in catalog
4. Walk composite recipe trees to understand sub-recipes
5. Identify coverage gaps and manual migration needs

**Example Output:**

```json
{
  "recommendedRecipes": [
    {
      "name": "UpgradeSpringBoot_4_0",
      "type": "composite",
      "upgradesCovered": {
        "spring-boot": "3.x → 4.0.x",
        "spring-security": "6.x → 7.0.x",
        "jackson": "2.x → 3.x"
      },
      "subRecipes": ["SpringBoot4Properties", "UpdateJackson2ToJackson3", "..."]
    }
  ]
}
```

**Categories Covered:**

| Category        | Documentation URL                |
| --------------- | -------------------------------- |
| Spring Boot     | `/recipes/java/spring/boot4`     |
| Spring Security | `/recipes/java/spring/security7` |
| Spring Cloud    | `/recipes/java/spring/cloud2025` |
| Jackson         | `/recipes/java/jackson`          |
| Java Migration  | `/recipes/java/migrate`          |
| Testing         | `/recipes/java/testing`          |
| Static Analysis | `/recipes/staticanalysis`        |

## Execution Skills

### build-runner

Executes Maven/Gradle builds.

**Commands:**

```bash
# Maven
./mvnw clean verify
./mvnw clean package -DskipTests

# Gradle
./gradlew clean build
./gradlew clean build -x test
```

**Analyzes:**

- Compilation errors
- Test failures
- Deprecation warnings
- Build time

### openrewrite-executor

Runs OpenRewrite recipes for automated transformations.

**Available recipes:**

| Recipe                      | Artifact             |
| --------------------------- | -------------------- |
| `UpgradeSpringBoot_4_0`     | rewrite-spring       |
| `UpgradeJackson_2_3`        | rewrite-jackson      |
| `UpgradeSpringSecurity_7_0` | rewrite-spring       |
| `UpgradeToJava21`           | rewrite-migrate-java |

**Modes:**

- `--dry-run`: Preview changes
- Default: Apply changes

## GitHub Skills

### github-workflow

Clone repos, create branches, commit, and push.

**Operations:**

```bash
# Clone
gh repo clone owner/repo /workspace/repo

# Branch
git checkout -b feature/spring-boot-4-migration

# Commit
git add -A && git commit -m "chore: migrate to Spring Boot 4.x"

# Push
git push -u origin feature/spring-boot-4-migration
```

**Supports:** Parallel cloning, batch operations

### pr-submitter

Creates pull requests with migration summaries.

**Features:**

- Standardized PR templates
- Migration change summary
- Validation results
- Label support
- Reviewer assignment

**Template includes:**

- Changes applied (build config, code changes)
- Validation status
- Testing instructions

## Workflow Skills

### java-maintenance-workflow

End-to-end dependency maintenance workflow for Spring Boot 4 / Java 21+ Maven and Gradle projects.

**Workflow steps:**

1. Create `maintenance/dependency-upgrades-and-security` branch
2. Consolidate open Dependabot PRs into the build file
3. Run dependency update report and apply stable updates
4. Fix breaking API changes introduced by upgrades
5. Bootstrap SpotBugs exclusion file if absent
6. Run quality gates: Spotless → compile → test → SpotBugs
7. Commit with a detailed version-change message
8. Push and open a PR with a version-change table

**Reuses:** `dependency-updater`, `build-runner`, `pr-submitter`

### resume-migration

Resumes an interrupted or failed migration from the last checkpoint in `.migration-state.yaml`.

**Capabilities:**

- Loads existing state, detects marketplace version upgrades
- Skips already-applied transformations
- Identifies new/updated transformations added since the last run
- Re-runs only pending work, preserving previous commits

**Requires:** `.migration-state.yaml` present on a migration branch.

### post-merge-cleanup

Cleans up migration state files after a successful PR merge to main/master.

**Operations:**

- Detects that HEAD is a merge commit on main/master
- Removes `.migration-state.yaml` from the main branch (state is only tracked on migration branches)
- Optionally archives the state file for audit trail before deletion

**Triggers:** Post-merge git hook, manual invocation, or CI/CD cleanup job.

## Skills by Category

| Category              | Skills                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shared Infrastructure | migration-protocol, migration-state, skill-registry                                                                                                                                                                                                                                                                                                                                                                                      |
| Discovery             | build-tool-detector, build-tool-upgrader, version-detector, dependency-scanner, dependency-updater, pattern-detector, github-actions-detector, deployment-java-detector                                                                                                                                                                                                                                                                  |
| Detection & Analysis  | spring-boot-4-breaking-changes-detector, spring-ai-version-validator, openapi-generator-detector, openfeign-compatibility-detector, dependency-conflict-analyzer, library-migration-classifier, multi-module-dependency-analyzer, testcontainers-module-validator, version-comparator                                                                                                                                                    |
| Recipe Discovery      | recipe-discovery                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Migration             | jackson-migrator, security-config-migrator, spring-ai-migrator, application-property-migrator, import-migrator, build-file-updater, github-actions-updater, deployment-java-updater, vaadin-migrator, spring-framework-7-migrator, openapi-generator-library-migrator, openapi-generator-plugin-updater, openfeign-to-httpinterface-migrator, gradle-9-syntax-migrator, junit4-to-junit5-migrator, documentation-migrator, label-manager |
| Execution             | build-runner, openrewrite-executor                                                                                                                                                                                                                                                                                                                                                                                                       |
| GitHub                | github-workflow, pr-submitter                                                                                                                                                                                                                                                                                                                                                                                                            |
| Workflow              | java-maintenance-workflow, resume-migration, post-merge-cleanup                                                                                                                                                                                                                                                                                                                                                                          |
