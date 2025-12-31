# Skills Reference

Reusable capabilities that agents invoke for specific migration tasks.

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

**Spring Boot 4 Requirement:** Spring AI 2.0.0-M1 is required due to autoconfigure module split.

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

## Skills by Category

| Category         | Skills                                                                                                                                                                              |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discovery        | build-tool-detector, build-tool-upgrader, version-detector, dependency-scanner, pattern-detector, github-actions-detector, deployment-java-detector                                 |
| Recipe Discovery | recipe-discovery                                                                                                                                                                    |
| Migration        | jackson-migrator, security-config-migrator, spring-ai-migrator, application-property-migrator, import-migrator, build-file-updater, github-actions-updater, deployment-java-updater |
| Execution        | build-runner, openrewrite-executor                                                                                                                                                  |
| GitHub           | github-workflow, pr-submitter                                                                                                                                                       |
