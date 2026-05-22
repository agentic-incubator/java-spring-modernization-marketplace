---
name: version-detector
description: Detect Spring Boot, Spring Cloud, Spring Security, Java, Jackson, Vaadin, and Spring AI versions from Maven pom.xml or Gradle build files. Use when analyzing project dependencies or planning migrations.
allowed-tools: Read, Glob, Grep
---

# Version Detector

Detect framework versions from Maven or Gradle project configuration files.

## Instructions

When invoked, parse the project's build files to extract version information for:

1. **Spring Boot** - From parent POM or Gradle plugin
2. **Spring Cloud** - From BOM in dependency management
3. **Spring Security** - From explicit dependency or Spring Boot BOM
4. **Java Version** - From properties or toolchain config
5. **Jackson** - From explicit dependencies or BOM
6. **Vaadin** - From BOM or explicit dependencies
7. **Spring AI** - From BOM or explicit dependencies

## Maven Detection

### Spring Boot from Parent

```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>4.0.0</version>
</parent>
```

### Spring Cloud from BOM

```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-dependencies</artifactId>
            <version>2025.1.1</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

### Java Version

```xml
<properties>
    <java.version>25</java.version>
</properties>
```

## Gradle Detection

### Spring Boot Plugin (Kotlin DSL)

```kotlin
plugins {
    id("org.springframework.boot") version "4.0.6"
}
```

### Spring Boot Plugin (Groovy DSL)

```groovy
plugins {
    id 'org.springframework.boot' version '4.0.6'
}
```

### Spring Cloud Version

```kotlin
extra["springCloudVersion"] = "2025.1.1"
```

### Java Version

```kotlin
java {
    sourceCompatibility = JavaVersion.VERSION_25
}
```

## Output Format

```json
{
  "project": "my-app",
  "buildTool": "maven|gradle",
  "buildToolVariant": "standard|groovy-dsl|kotlin-dsl",
  "currentVersions": {
    "spring-boot": "3.5.7",
    "spring-cloud": "2025.0.0",
    "spring-security": "6.4.x",
    "java": "21",
    "jackson": "2.x",
    "vaadin": "24.9.6",
    "spring-ai": "1.1.6"
  },
  "targetVersions": {
    "spring-boot": "4.0.6",
    "spring-cloud": "2025.1.1",
    "spring-security": "7.0.5",
    "java": "21",
    "jackson": "3.1.3",
    "vaadin": "25.1.x",
    "spring-ai": "2.0.0-M6"
  },
  "migrationRequired": true
}
```

## Version Compatibility Matrix

| Spring Boot | Spring Cloud | Spring Security | Java  | Jackson   | Spring AI                 |
| ----------- | ------------ | --------------- | ----- | --------- | ------------------------- |
| 3.3.x       | 2024.0.x     | 6.3.x           | 17-23 | 2.x       | 1.0.x                     |
| 3.5.x       | 2025.0.x     | 6.4.x           | 17-24 | 2.x       | 1.0.x – 1.1.x             |
| 3.5.x       | 2025.0.2     | 6.4.x           | 17-24 | 2.x       | **1.1.6** (latest stable) |
| 4.0.x       | 2025.1.x     | 7.0.x           | 17-25 | 3.x       | 2.0.0-M6+ (milestone)     |
| **4.0.6**   | **2025.1.1** | **7.0.5**       | 21-25 | **3.1.3** | **2.0.0-M6** (current)    |

## Version Notes (May 2026)

### Spring Boot

- Current GA: **4.0.6**
- Next: `4.1.0-RC1` exists (not yet GA)
- Recommended LTS Java for Boot 4: **Java 21**

### Spring Cloud

- Boot 4.x: use `spring-cloud-dependencies:2025.1.1`
- Boot 3.5.x: use `spring-cloud-dependencies:2025.0.2`

### Spring AI

- Boot 3.5.x: `spring-ai-bom:1.1.6` (latest stable)
  - `PromptChatMemoryAdvisor` deprecated in 1.1.6; explicit `conversationId` now required
  - MCP SDK bumped to 0.18.2; MCP annotations to 0.9.0
- Boot 4.x: `spring-ai-bom:2.0.0-M6` (latest milestone; no GA yet)

### Vaadin

- Current: **25.1.x** (Vaadin 25 is the active line)
- Vaadin 24: EOL June 16, 2026
- Vaadin 25.x requires Spring Boot 4+ and Java 21+
- Detection: check for `com.vaadin:vaadin-bom` version `24.x` vs `25.x`

### Jackson

- Jackson 3 latest: **3.1.3** (used by Spring Boot 4 via `tools.jackson.*` packages)
- Jackson 2 is still required as a compatibility shim for Spring AI 2.0.0-M\* milestones

### Java

- Java 25 is now available
- **Java 21 remains the recommended LTS** for production Spring Boot 4 projects
- Java 17 still supported by Boot 3.x; Boot 4 minimum is Java 17 but 21 strongly recommended
