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
            <version>2025.1.0</version>
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
    id("org.springframework.boot") version "4.0.0"
}
```

### Spring Boot Plugin (Groovy DSL)

```groovy
plugins {
    id 'org.springframework.boot' version '4.0.0'
}
```

### Spring Cloud Version

```kotlin
extra["springCloudVersion"] = "2025.1.0"
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
    "spring-ai": "1.0.x"
  },
  "targetVersions": {
    "spring-boot": "4.0.0",
    "spring-cloud": "2025.1.0",
    "spring-security": "7.0.x",
    "java": "25",
    "jackson": "3.x",
    "vaadin": "25.0.0",
    "spring-ai": "1.1.x"
  },
  "migrationRequired": true
}
```

## Version Compatibility Matrix

| Spring Boot | Spring Cloud | Spring Security | Java  | Jackson | Spring AI |
| ----------- | ------------ | --------------- | ----- | ------- | --------- |
| 3.3.x       | 2024.0.x     | 6.3.x           | 17-23 | 2.x     | 1.0.x     |
| 3.5.x       | 2025.0.x     | 6.4.x           | 17-24 | 2.x     | 1.0.x     |
| 4.0.x       | 2025.1.x     | 7.0.x           | 17-25 | 3.x     | 1.1.x     |
