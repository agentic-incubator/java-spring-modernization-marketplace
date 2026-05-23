# Migration Guide

Detailed migration patterns for each supported upgrade path.

## Version Compatibility Matrix

| Spring Boot    | Spring Cloud     | Spring Security | Java  | Jackson | Spring AI     |
| -------------- | ---------------- | --------------- | ----- | ------- | ------------- |
| 3.3.x          | 2024.0.x         | 6.3.x           | 17-23 | 2.x     | 1.0.x         |
| 3.5.x          | 2025.0.x         | 6.4.x           | 17-24 | 2.x     | 1.0.x – 1.1.6 |
| **4.0.x**      | **2025.1.x**     | **7.0.x**       | 17-25 | **3.x** | **2.0.0-M6**  |
| **4.1.0-RC1+** | **2026.0.0-M\*** | **7.1.0-RC1**   | 17-25 | **3.x** | **2.0.0-M7**  |

**Important:**

- Spring AI 2.0.0-M6 is required for Spring Boot 4.0.x compatibility due to autoconfigure
  module split. The marketplace handles the Jackson 2 compatibility layer automatically.
- Spring AI 2.0.0-M7 pairs with Spring Boot 4.1.0-RC1. M7 removes
  `spring-ai-spring-cloud-bindings`, deprecates SSE MCP transport in favor of Streamable
  HTTP, and no longer needs the Jackson 2 compatibility layer.

## Spring Boot 3.x to 4.x

### Build File Updates

**Maven:**

```xml
<!-- Before -->
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.3.5</version>
</parent>

<!-- After -->
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>4.0.0</version>
</parent>
```

**Gradle:**

```kotlin
// Before
plugins {
    id("org.springframework.boot") version "3.3.5"
}

// After
plugins {
    id("org.springframework.boot") version "4.0.0"
}
```

### Key Changes

- Jackson 3 integration (see below)
- Spring Security 7 compatibility
- WebClient now requires explicit dependency
- Spring Cloud BOM update to 2025.1.x
- **Starter renames** - `spring-boot-starter-web` → `spring-boot-starter-webmvc`
- **Undertow removed** - Not compatible with Servlet 6.1
- **Spring AI 2.0** - Required for Boot 4 compatibility

### Starter Artifact Renames

```xml
<!-- Before -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>

<!-- After -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-webmvc</artifactId>
</dependency>
```

### Undertow Removal

Undertow is not compatible with Servlet 6.1 and was removed in Spring Boot 4.

```xml
<!-- REMOVE this dependency -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-undertow</artifactId>
</dependency>

<!-- Use Tomcat (default) or switch to Jetty -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-jetty</artifactId>
</dependency>
```

### Spring Milestones Repository

Required when using RC or milestone releases like Spring Boot 4.1.0-RC1 or
Spring AI 2.0.0-M7. **Both** `<repositories>` and `<pluginRepositories>` (Maven) must be
present — the `spring-boot-maven-plugin` for an RC parent lives in the Milestones repo
and won't resolve from Maven Central:

```xml
<repositories>
    <repository>
        <id>spring-milestones</id>
        <name>Spring Milestones</name>
        <url>https://repo.spring.io/milestone</url>
        <snapshots>
            <enabled>false</enabled>
        </snapshots>
    </repository>
</repositories>

<pluginRepositories>
    <pluginRepository>
        <id>spring-milestones</id>
        <name>Spring Milestones</name>
        <url>https://repo.spring.io/milestone</url>
        <snapshots>
            <enabled>false</enabled>
        </snapshots>
    </pluginRepository>
</pluginRepositories>
```

For Gradle, the equivalent is the `pluginManagement` block in `settings.gradle*`:

```kotlin
// settings.gradle.kts
pluginManagement {
    repositories {
        gradlePluginPortal()
        mavenCentral()
        maven { url = uri("https://repo.spring.io/milestone") }
    }
}
```

## Spring Boot 4.0.x to 4.1.0-RC1

The Boot 4.0 → 4.1 hop is a focused upgrade addressing a small set of new BOM-managed
versions and one behavior change. The marketplace ships a dedicated path:

```bash
/migrate-spring-boot-41 /path/to/project
```

### Key Changes

| Item                                                   | Boot 4.0           | Boot 4.1.0-RC1                                                                                                              |
| ------------------------------------------------------ | ------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `spring-boot-maven-plugin` resolution                  | Maven Central      | **Spring Milestones** (`<pluginRepositories>` required)                                                                     |
| Micrometer BOM                                         | 1.16.x             | **1.17.0-RC1**                                                                                                              |
| Spring Framework                                       | 7.0.x              | **7.0.7**                                                                                                                   |
| Spring Security                                        | 7.0.x              | **7.1.0-RC1**                                                                                                               |
| OpenTelemetry                                          | unmanaged          | **1.60.1**                                                                                                                  |
| Flyway                                                 | unmanaged          | **12.4.0**                                                                                                                  |
| `ReactorClientHttpRequestFactoryBuilder` proxy default | applied implicitly | **explicit `.withHttpClientDefaults()` required**                                                                           |
| New opt-in properties                                  | —                  | `spring.datasource.connection-fetch`, `spring.webflux.default-html-escape`, `spring.data.redis.listener.*`, `spring.grpc.*` |

### Workflow

The `spring-boot-41-rc-upgrade-agent` orchestrates:

1. `version-detector` confirms current Boot is 4.0.x.
2. `build-file-updater` (v1.2.0+) bumps parent and adds both `<repositories>` and
   `<pluginRepositories>` Spring Milestones blocks.
3. `spring-boot-bom-override-reconciler` (new) drops stale `<micrometer.version>`,
   `<spring-framework.version>`, etc. that would shadow the new BOM-managed versions.
4. `dependency-updater` (v2.1.0+) with `--target-rc=spring-boot:4.1.0-RC1` bumps
   non-Boot dependencies under the stable-only filter while permitting the targeted RC.
5. `restclient-to-webclient-customizer-migrator` (v1.1.0+) injects
   `.withHttpClientDefaults()` on any `ReactorClientHttpRequestFactoryBuilder` usage.
6. `application-property-migrator` (v1.2.0+) reports new Boot 4.1 opt-ins (no automatic
   transformation).
7. `build-runner` validates compile + tests.

## Jackson 2.x to 3.x

### Critical Rule

**DO NOT change `com.fasterxml.jackson.annotation.*` imports!**

Jackson annotations remain backward compatible. Only change core/databind imports.

### Annotation Rename

`@JsonComponent` is renamed to `@JacksonComponent` in Spring Boot 4:

```java
// Before
@JsonComponent
public class CustomSerializer { }

// After
@JacksonComponent
public class CustomSerializer { }
```

### Application Property Namespace Changes

```yaml
# Before (Spring Boot 3.x)
spring:
  jackson:
    read:
      FAIL_ON_UNKNOWN_PROPERTIES: false
    write:
      INDENT_OUTPUT: true

# After (Spring Boot 4.x)
spring:
  jackson:
    json:
      read:
        FAIL_ON_UNKNOWN_PROPERTIES: false
      write:
        INDENT_OUTPUT: true
```

### Logging Package Changes

```yaml
# Before (Jackson 2.x)
logging:
  level:
    com.fasterxml.jackson: DEBUG

# After (Jackson 3.x)
logging:
  level:
    tools.jackson: DEBUG
```

### GroupId Changes

| Before                             | After                      |
| ---------------------------------- | -------------------------- |
| `com.fasterxml.jackson.core`       | `tools.jackson.core`       |
| `com.fasterxml.jackson.databind`   | `tools.jackson.databind`   |
| `com.fasterxml.jackson.dataformat` | `tools.jackson.dataformat` |
| `com.fasterxml.jackson.datatype`   | `tools.jackson.datatype`   |
| `com.fasterxml.jackson.module`     | `tools.jackson.module`     |
| `com.fasterxml.jackson.annotation` | **NO CHANGE**              |

### Exception Changes

```java
// Before
import com.fasterxml.jackson.core.JsonProcessingException;

try {
    mapper.writeValueAsString(obj);
} catch (JsonProcessingException e) { }

// After
import tools.jackson.core.JacksonException;

try {
    mapper.writeValueAsString(obj);
} catch (JacksonException e) { }
```

### Maven BOM

Add Jackson BOM before changing groupIds:

```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>tools.jackson</groupId>
            <artifactId>jackson-bom</artifactId>
            <version>3.0.2</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

### Gradle BOM

```kotlin
dependencies {
    implementation(platform("tools.jackson:jackson-bom:3.0.2"))
    implementation("tools.jackson.core:jackson-databind")
}
```

### Complete Example

```java
// Before
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.annotation.JsonProperty;  // Keep!

public class MyService {
    public String serialize(Object obj) throws JsonProcessingException {
        return new ObjectMapper().writeValueAsString(obj);
    }
}

// After
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.annotation.JsonProperty;  // Unchanged!

public class MyService {
    public String serialize(Object obj) throws JacksonException {
        return new ObjectMapper().writeValueAsString(obj);
    }
}
```

## Spring Security 6 to 7

### Configuration Pattern Change

Security 7 moves from inheritance to bean-based configuration.

```java
// Before (Security 6) - Inheritance
public class SecurityConfig extends VaadinWebSecurity {
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        super.configure(http);
        // custom config
    }
}

// After (Security 7) - Bean-based
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.with(VaadinSecurityConfigurer.vaadin(), Customizer.withDefaults());
        // custom config
        return http.build();
    }
}
```

### Request Matcher Changes

```java
// Before
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

new AntPathRequestMatcher("/api/**")

// After
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;

PathPatternRequestMatcher.withDefaults().matcher("/api/**")
```

### Import Updates

| Before                                                                | After                                                                             |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `com.vaadin.flow.spring.security.VaadinWebSecurity`                   | Use `VaadinSecurityConfigurer` bean                                               |
| `org.springframework.security.web.util.matcher.AntPathRequestMatcher` | `org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher` |

## Vaadin 24 to 25

### Theme Migration

```java
// Before (Material theme)
@Theme(themeClass = Material.class)
public class MainLayout extends AppLayout { }

// After (Lumo theme)
@Theme(themeClass = Lumo.class)
public class MainLayout extends AppLayout { }
```

### Security Configuration

See Spring Security section above - `VaadinWebSecurity` is replaced with `VaadinSecurityConfigurer`.

## Spring AI 1.x to 2.0

**Spring AI 2.0.0-M6 is required for Spring Boot 4 compatibility.**

Spring Boot 4.0 splits the monolithic autoconfigure JAR into modules. Spring AI 1.x references old class locations, causing:

```text
ClassNotFoundException: org.springframework.boot.autoconfigure.web.client.RestClientAutoConfiguration
```

### TTS API Changes

```java
// Before
import org.springframework.ai.audio.speech.SpeechModel;

SpeechModel model = ...;

// After
import org.springframework.ai.audio.tts.TextToSpeechModel;

TextToSpeechModel model = ...;
```

### Speed Parameter Type

```java
// Before (Float)
.withSpeed(1.0f)

// After (Double)
.withSpeed(1.0)
```

In YAML configuration, remove the `f` suffix:

```yaml
# Before (invalid for Double)
speed: 1.0f

# After
speed: 1.0
```

### Provider Selection (New in 2.0)

Replace autoconfigure excludes with `spring.ai.model.*`:

```yaml
# Before (Spring AI 1.x)
spring:
  autoconfigure:
    exclude: org.springframework.ai.autoconfigure.openai.OpenAiAutoConfiguration
  ai:
    ollama:
      base-url: http://localhost:11434

# After (Spring AI 2.0)
spring:
  ai:
    model:
      chat: ollama
      embedding: ollama
    ollama:
      base-url: http://localhost:11434
```

### Autoconfigure Class Split

The monolithic `OpenAiAutoConfiguration` was split into 6 classes:

- `OpenAiAudioSpeechAutoConfiguration`
- `OpenAiAudioTranscriptionAutoConfiguration`
- `OpenAiChatAutoConfiguration`
- `OpenAiEmbeddingAutoConfiguration`
- `OpenAiImageAutoConfiguration`
- `OpenAiModerationAutoConfiguration`

### Memory Advisor Constants

| Before                            | After                        |
| --------------------------------- | ---------------------------- |
| `CHAT_MEMORY_RETRIEVE_SIZE_KEY`   | `TOP_K`                      |
| `CHAT_MEMORY_CONVERSATION_ID_KEY` | `ChatMemory.CONVERSATION_ID` |

### Property Naming Convention

Use kebab-case for Spring properties:

```yaml
# Before (non-standard)
base_url: http://localhost:11434

# After (standard)
base-url: http://localhost:11434
```

## Spring AI 2.0.0-M1..M6 to 2.0.0-M7

The Spring AI 2.0 milestone series has accumulated significant API churn through M1-M7.
The marketplace ships a dedicated path that covers every milestone delta in one pass:

```bash
/migrate-spring-ai-20 /path/to/project
```

### Critical: Multi-Provider Classpath Collision

All six OpenAI autoconfiguration classes use
`@ConditionalOnProperty(havingValue="openai", matchIfMissing=true)`. When the classpath
has `spring-ai-starter-model-openai` plus any other provider starter (e.g., Ollama),
**every unset `spring.ai.model.<type>` selector silently defaults to OpenAI** and the
app crashes at startup with:

```text
At least one credential source must be specified
```

The fix is to set **all six selectors explicitly** in every Spring profile:

```yaml
spring:
  ai:
    model:
      chat: ollama
      embedding: openai
      image: none
      moderation: none
      audio:
        speech: none
        transcription: none
```

The `spring-ai-model-selector-enforcer` skill handles this automatically by inferring
the correct provider per type from existing config and code references, falling back to
`none` for unused model types.

To diagnose only (no changes), run `/detect-multi-provider-collision`.

### Key Changes Across M1-M7

| Item                                                                                      | Since | Action                                                                                    |
| ----------------------------------------------------------------------------------------- | ----- | ----------------------------------------------------------------------------------------- |
| Starter artifact rename — `spring-ai-*-spring-boot-starter` → `spring-ai-starter-model-*` | M1    | `build-file-updater` v1.2.0 + `spring-ai-migrator` v2.4.0 (`spring-ai-starter-rename`)    |
| Default temperature constants removed                                                     | M1    | `spring-ai-migrator` v2.4.0 (`spring-ai-default-temperature-constants`)                   |
| `McpAsyncClientCustomizer` / `McpSyncClientCustomizer` → `McpClientCustomizer<B>`         | M3    | `spring-ai-mcp-client-package-migrator` v1.1.0 (`mcp-client-customizer-unification`)      |
| `disableMemory()` → `disableInternalConversationHistory()`                                | M3    | `spring-ai-migrator` v2.4.0 (`spring-ai-api-removals-m1-m6`)                              |
| Claude 3 enum constants removed (`CLAUDE_3_OPUS`, etc.)                                   | M3    | `spring-ai-migrator` v2.4.0 (`spring-ai-claude-3-enum-removal`)                           |
| Spring AI uses `tools.jackson` natively (Jackson 3 namespace)                             | M3+   | `application-property-migrator` v1.2.0 (logging package update)                           |
| `spring-ai-azure-openai` merged into `spring-ai-openai`                                   | M4    | `spring-ai-migrator` v2.4.0 (`spring-ai-removed-modules`)                                 |
| `spring-ai-vertex-ai-gemini` / ZhipuAI / OCI GenAI removed                                | M5    | `spring-ai-migrator` v2.4.0 (`spring-ai-removed-modules`)                                 |
| `ModelOptionsUtils[.merge]` removed                                                       | M5    | `spring-ai-migrator` v2.4.0 (`spring-ai-api-removals-m1-m6`)                              |
| All `*Options` setters removed                                                            | M6    | `spring-ai-options-setter-migrator` (rewrite to builder)                                  |
| `PromptChatMemoryAdvisor` removed                                                         | M6    | `spring-ai-migrator` v2.4.0 — use explicit `ChatMemory.CONVERSATION_ID` pattern           |
| `OpenAiConnectionProperties` → `OpenAiCommonProperties`                                   | M6    | `spring-ai-migrator` v2.4.0                                                               |
| Jackson 2 compat layer required for ChromaVectorStore                                     | M6    | `spring-ai-migrator` v2.4.0 (`jackson-2-compatibility-layer`, gated to M6 ONLY)           |
| `spring-ai-spring-cloud-bindings` removed                                                 | M7    | `spring-ai-migrator` v2.4.0 (`spring-ai-cloud-bindings-removal`)                          |
| SSE MCP transport deprecated                                                              | M7    | `spring-ai-mcp-sse-to-streamable-http-migrator` (transport class + property tree rewrite) |
| Jackson 2 compat layer no longer needed                                                   | M7+   | `spring-ai-migrator` v2.4.0 (`jackson-2-compatibility-layer-removal`)                     |

### Six Mandatory Selectors

The `spring-ai-20-m7-upgrade-agent` mandates that `spring-ai-model-selector-enforcer`
runs as the final step. The six selectors per Spring profile:

```yaml
spring:
  ai:
    model:
      chat: <provider|none> # ChatClient / ChatModel
      embedding: <provider|none> # EmbeddingModel
      image: <provider|none> # ImageModel
      moderation: <provider|none> # ModerationModel
      audio:
        speech: <provider|none> # TextToSpeechModel
        transcription: <provider|none> # AudioTranscriptionModel
```

## GitHub Actions Workflows

When migrating Java versions, update your CI/CD pipelines to match.

### Check Current Configuration

```bash
/check-github-actions /path/to/project
```

### Update Java Version

```yaml
# Before
- uses: actions/setup-java@v4
  with:
    distribution: temurin
    java-version: '21'

# After
- uses: actions/setup-java@v4
  with:
    distribution: temurin
    java-version: '25'
```

### Update Matrix Builds

```yaml
# Before
strategy:
  matrix:
    java: ['17', '21']

# After
strategy:
  matrix:
    java: ['21', '25']
```

### Preserve Distribution Settings

When updating Java versions, keep the distribution unchanged:

| Distribution | Provider          |
| ------------ | ----------------- |
| `temurin`    | Eclipse Temurin   |
| `liberica`   | BellSoft Liberica |
| `corretto`   | Amazon Corretto   |
| `zulu`       | Azul Zulu         |

### GraalVM Workflows

```yaml
# Before
- uses: graalvm/setup-graalvm@v1
  with:
    java-version: '21'

# After
- uses: graalvm/setup-graalvm@v1
  with:
    java-version: '25'
```

## Migration Order

When migrating a project with multiple changes, follow this order:

1. **Dependency analysis** - Check current versions and available updates
   - Run version-detector to identify current framework versions
   - Run dependency-scanner to catalog migration-relevant dependencies
   - Run dependency-updater (optional) to check for available updates
2. **Pre-migration dependency updates (optional)** - Update non-breaking dependencies
   - Apply stable dependency updates to create a clean baseline
   - Validate builds between updates
   - Helps isolate migration issues from dependency update issues
3. **Build files** - Add BOMs, update versions, add repositories
4. **Imports** - Update package names (Jackson, Spring Security, etc.)
5. **Configurations** - Security configs, theme configs, property migrations
6. **Validate** - Build and test

This order prevents compilation errors during migration.

**Note**: Dependency updates can be done before migration (to establish a stable baseline) or after
migration (once breaking changes are resolved). For Spring Boot 4 migration, you may need
`include-milestones` filter strategy to get milestone dependencies.

## OpenRewrite Recipes

For automated migrations, use OpenRewrite:

```bash
# Spring Boot 4
/openrewrite spring-boot-4 /path/to/project

# Jackson 3
/openrewrite jackson-3 /path/to/project

# Spring Security 7
/openrewrite security-7 /path/to/project

# Java 21
/openrewrite java-21 /path/to/project
```

Always run with `--dry-run` first to preview changes.
