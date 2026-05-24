---
name: build-file-updater
description: Update Maven pom.xml or Gradle build files for Spring Boot 4 migrations including parent version, BOMs, and dependency groupId changes. Use when modifying build configurations for framework upgrades.
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Build File Updater

Update Maven and Gradle build files for Spring ecosystem migrations.

## Supported Build Tools

- Maven (`pom.xml`)
- Gradle Groovy DSL (`build.gradle`)
- Gradle Kotlin DSL (`build.gradle.kts`)

## Maven Updates

### Update Parent Version

```xml
<!-- Before -->
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.5.7</version>
</parent>

<!-- After -->
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>4.0.0</version>
</parent>
```

### Add Jackson BOM

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

### Update Spring Cloud BOM

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-dependencies</artifactId>
    <version>2025.1.0</version>
    <type>pom</type>
    <scope>import</scope>
</dependency>
```

### Update Jackson Dependencies

```xml
<!-- Before -->
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
</dependency>

<!-- After -->
<dependency>
    <groupId>tools.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
</dependency>
```

### Add WebClient Dependency (if using WebFlux)

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-webclient</artifactId>
</dependency>
```

## Gradle Groovy DSL Updates

### Update Spring Boot Plugin

```groovy
// Before
plugins {
    id 'org.springframework.boot' version '3.5.7'
}

// After
plugins {
    id 'org.springframework.boot' version '4.0.0'
}
```

### Add Jackson BOM

```groovy
dependencies {
    implementation platform('tools.jackson:jackson-bom:3.0.2')
}
```

### Update Jackson Dependencies

```groovy
// Before
implementation 'com.fasterxml.jackson.core:jackson-databind'

// After
implementation 'tools.jackson.core:jackson-databind'
```

### Update Spring Cloud

```groovy
ext {
    springCloudVersion = '2025.1.0'
}
```

## Gradle Kotlin DSL Updates

### Update Spring Boot Plugin

```kotlin
// Before
plugins {
    id("org.springframework.boot") version "3.5.7"
}

// After
plugins {
    id("org.springframework.boot") version "4.0.0"
}
```

### Add Jackson BOM

```kotlin
dependencies {
    implementation(platform("tools.jackson:jackson-bom:3.0.2"))
}
```

### Update Jackson Dependencies

```kotlin
// Before
implementation("com.fasterxml.jackson.core:jackson-databind")

// After
implementation("tools.jackson.core:jackson-databind")
```

### Update Spring Cloud

```kotlin
extra["springCloudVersion"] = "2025.1.0"
```

## Version Reference

| Component        | Old Version | New Version (Boot 4.0 line) | RC / Milestone line         |
| ---------------- | ----------- | --------------------------- | --------------------------- |
| Spring Boot      | 3.5.x       | 4.0.6                       | **4.1.0-RC1**               |
| Spring Cloud     | 2025.0.x    | 2025.1.1                    | 2026.0.0-M\* (when shipped) |
| Spring Framework | 6.x         | 7.0.x                       | 7.0.7                       |
| Spring Security  | 6.x         | 7.0.x                       | **7.1.0-RC1**               |
| Java             | 21          | 21 (25 available)           | 21 / 25                     |
| Jackson BOM      | -           | 3.1.3                       | 3.1.3                       |
| Micrometer BOM   | 1.16.x      | 1.16.x                      | **1.17.0-RC1**              |
| OpenTelemetry    | -           | -                           | 1.60.1                      |
| Flyway           | -           | -                           | 12.4.0                      |
| Vaadin           | 24.x        | 25.1.0                      | 25.1.x                      |
| Spring AI        | 1.0.x       | **2.0.0-M6**                | **2.0.0-M7**                |

## Starter Artifact Renames

Spring Boot 4 renames some starter artifacts:

### Web Starter

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

**Gradle:**

```kotlin
// Before
implementation("org.springframework.boot:spring-boot-starter-web")

// After
implementation("org.springframework.boot:spring-boot-starter-webmvc")
```

## Undertow Removal

Undertow is not compatible with Servlet 6.1 and was removed in Spring Boot 4.

### Detection

```xml
<!-- Remove this dependency -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-undertow</artifactId>
</dependency>
```

### Migration

Replace with Tomcat (default) or Jetty:

```xml
<!-- Option 1: Remove Undertow, use default Tomcat -->
<!-- Just delete the spring-boot-starter-undertow dependency -->

<!-- Option 2: Switch to Jetty -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-jetty</artifactId>
</dependency>
```

## Spring Milestones Repository

When using milestone or RC releases (e.g., Spring AI `2.0.0-M7`, Spring Boot `4.1.0-RC1`),
add the Spring Milestones repository to **both** `<repositories>` (for dependency resolution)
**and** `<pluginRepositories>` (for plugin resolution — required when the Spring Boot Maven
plugin itself is an RC/milestone version).

### Maven

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

> Omitting `<pluginRepositories>` for a Spring Boot RC/milestone parent causes:
> `Plugin org.springframework.boot:spring-boot-maven-plugin:<version> not found`

### Gradle Groovy DSL

`build.gradle` — for dependency resolution:

```groovy
repositories {
    maven { url 'https://repo.spring.io/milestone' }
}
```

`settings.gradle` — for **plugin** resolution:

```groovy
pluginManagement {
    repositories {
        gradlePluginPortal()
        mavenCentral()
        maven { url 'https://repo.spring.io/milestone' }
    }
}
```

### Gradle Kotlin DSL

`build.gradle.kts` — for dependency resolution:

```kotlin
repositories {
    maven { url = uri("https://repo.spring.io/milestone") }
}
```

`settings.gradle.kts` — for **plugin** resolution:

```kotlin
pluginManagement {
    repositories {
        gradlePluginPortal()
        mavenCentral()
        maven { url = uri("https://repo.spring.io/milestone") }
    }
}
```

### When to Add

Add Spring Milestones repository (both repositories AND pluginRepositories / settings
pluginManagement) when:

- Using Spring AI 2.0.0-M\* (any milestone release)
- Using Spring Boot 4.x-M\* / 4.x-RC\*
- Using any `-M1`, `-M2`, `-RC1`, etc. version of any artifact
- Repository / pluginManagement not already present in build file

## Spring AI Starter Artifact Renames (1.x → 2.0)

Spring AI 2.0 renamed every model-starter artifact to a unified pattern:
`spring-ai-starter-model-{provider}`. Update GAV coordinates in addition to imports.

| Provider     | Old artifactId (1.x)                             | New artifactId (2.0)                                             |
| ------------ | ------------------------------------------------ | ---------------------------------------------------------------- |
| OpenAI       | `spring-ai-openai-spring-boot-starter`           | `spring-ai-starter-model-openai`                                 |
| Ollama       | `spring-ai-ollama-spring-boot-starter`           | `spring-ai-starter-model-ollama`                                 |
| Anthropic    | `spring-ai-anthropic-spring-boot-starter`        | `spring-ai-starter-model-anthropic`                              |
| MistralAI    | `spring-ai-mistral-ai-spring-boot-starter`       | `spring-ai-starter-model-mistral-ai`                             |
| Bedrock      | `spring-ai-bedrock-converse-spring-boot-starter` | `spring-ai-starter-model-bedrock-converse`                       |
| HuggingFace  | `spring-ai-huggingface-spring-boot-starter`      | `spring-ai-starter-model-huggingface`                            |
| Stability AI | `spring-ai-stability-ai-spring-boot-starter`     | `spring-ai-starter-model-stability-ai`                           |
| MiniMax      | `spring-ai-minimax-spring-boot-starter`          | `spring-ai-starter-model-minimax`                                |
| Moonshot     | `spring-ai-moonshot-spring-boot-starter`         | `spring-ai-starter-model-moonshot`                               |
| QianFan      | `spring-ai-qianfan-spring-boot-starter`          | `spring-ai-starter-model-qianfan`                                |
| ZhipuAI      | `spring-ai-zhipuai-spring-boot-starter`          | _REMOVED in M4 — see below_                                      |
| Azure OpenAI | `spring-ai-azure-openai-spring-boot-starter`     | _MERGED into `spring-ai-starter-model-openai` in M4 — see below_ |
| Vertex AI    | `spring-ai-vertex-ai-gemini-spring-boot-starter` | _REMOVED in M5 — see below_                                      |
| OCI GenAI    | `spring-ai-oci-genai-spring-boot-starter`        | _REMOVED in M5 — see below_                                      |

### Removed Modules (Spring AI 2.0.0-M4 / M5)

- `spring-ai-azure-openai` — merged into `spring-ai-openai`. Use
  `spring-ai-starter-model-openai` and configure `spring.ai.openai.base-url` to point at
  the Azure endpoint.
- `spring-ai-vertex-ai-gemini` — removed (non-embedding modules dropped).
- `spring-ai-zhipuai` — removed.
- `spring-ai-oci-genai` — removed.

For removed integrations, projects must either switch providers (via the unified
`spring.ai.model.*` selector — see `spring-ai-model-selector-enforcer` skill) or pin Spring
AI to the 1.x line.

### Spring AI Cloud Bindings Removal (M7)

The artifact `org.springframework.ai:spring-ai-spring-cloud-bindings` was removed in
Spring AI 2.0.0-M7. **Remove it.** Do **not** confuse it with the separate
`org.springframework.cloud:spring-cloud-bindings` (Cloud Foundry bindings) — that one
**must remain** intact.

## Spring AI Version Update

```xml
<!-- Before -->
<spring-ai.version>1.1.6</spring-ai.version>  <!-- Boot 3.5.x -->

<!-- After (Boot 4.0 line) -->
<spring-ai.version>2.0.0-M6</spring-ai.version>

<!-- After (Boot 4.1.0-RC1 line) -->
<spring-ai.version>2.0.0-M7</spring-ai.version>
```

**Important:**

- Spring AI 2.0.0-M6 is required for Spring Boot 4.0.x compatibility due to autoconfigure module split.
- Spring AI 2.0.0-M7 pairs with Spring Boot 4.1.0-RC1; M7 also removes
  `spring-ai-spring-cloud-bindings` (see above) and deprecates SSE MCP transport in favor of
  Streamable HTTP (see `spring-ai-mcp-sse-to-streamable-http-migrator` skill).

## Migration Steps

1. **Identify build tool** - Check for pom.xml or build.gradle(.kts)
2. **Update parent/plugin** - Spring Boot version to 4.0.0
3. **Add repositories** - Spring Milestones if using milestone versions
4. **Add BOMs** - Jackson BOM, update Spring Cloud BOM
5. **Update dependencies** - Change groupIds (Jackson, etc.)
6. **Rename starters** - spring-boot-starter-web → spring-boot-starter-webmvc
7. **Remove Undertow** - Replace with Tomcat (default) or Jetty
8. **Update Spring AI** - Upgrade to 2.0.0-M6 for Boot 4 compatibility
9. **Add missing deps** - WebClient if using WebFlux
10. **Update Java version** - If upgrading Java
11. **Run build** - Verify configuration works
