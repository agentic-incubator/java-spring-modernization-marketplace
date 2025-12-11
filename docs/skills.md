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

**Identifies:**

- Direct dependencies
- Managed dependencies
- Transitive dependencies
- Plugin dependencies

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

Migrates Spring AI 1.0.x to 1.1.x.

**Changes:**

| Before                          | After                  |
| ------------------------------- | ---------------------- |
| `SpeechModel`                   | `TextToSpeechModel`    |
| Speed: `Float` (e.g., `1.0f`)   | `Double` (e.g., `1.0`) |
| `CHAT_MEMORY_RETRIEVE_SIZE_KEY` | `TOP_K`                |

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
- BOM additions
- GroupId changes
- Property updates
- Dependency additions/removals

**Supports:** Maven, Gradle Groovy, Gradle Kotlin DSL

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

| Category  | Skills                                                                                              |
| --------- | --------------------------------------------------------------------------------------------------- |
| Discovery | build-tool-detector, build-tool-upgrader, version-detector, dependency-scanner, pattern-detector    |
| Migration | jackson-migrator, security-config-migrator, spring-ai-migrator, import-migrator, build-file-updater |
| Execution | build-runner, openrewrite-executor                                                                  |
| GitHub    | github-workflow, pr-submitter                                                                       |
