---
description: Check framework versions in a Spring project
argument-hint: [project-path]
allowed-tools: Read, Glob, Grep
---

# Version Check

Check framework versions in `$ARGUMENTS` (or current directory).

## Frameworks to Check

- Spring Boot
- Spring Cloud
- Spring Security
- Spring AI
- Java
- Jackson
- Vaadin

## Detection Methods

### Maven (pom.xml)

**Spring Boot:**

```xml
<parent>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>X.X.X</version>
</parent>
```

**Spring Cloud:**

```xml
<artifactId>spring-cloud-dependencies</artifactId>
<version>XXXX.X.X</version>
```

**Java:**

```xml
<java.version>XX</java.version>
```

### Gradle (build.gradle.kts)

**Spring Boot:**

```kotlin
id("org.springframework.boot") version "X.X.X"
```

**Spring Cloud:**

```kotlin
extra["springCloudVersion"] = "XXXX.X.X"
```

**Java:**

```kotlin
java {
    sourceCompatibility = JavaVersion.VERSION_XX
}
```

## Version Compatibility Matrix

| Spring Boot | Spring Cloud | Spring Security | Java  | Jackson | Spring AI | Vaadin |
| ----------- | ------------ | --------------- | ----- | ------- | --------- | ------ |
| 3.3.x       | 2024.0.x     | 6.3.x           | 17-23 | 2.x     | —         | —      |
| 3.5.x       | 2025.0.2     | 6.4.x           | 17-24 | 2.x     | 1.1.6     | —      |
| 4.0.x       | 2025.1.1     | 7.0.x           | 17-25 | 3.x     | 2.0.0-M6  | 25.1.x |

### Additional Version Notes (May 2026)

| Component          | Stable Version | Notes                                      |
| ------------------ | -------------- | ------------------------------------------ |
| Spring Boot        | 4.0.6          | Current GA; 4.1.0-RC1 available            |
| Spring Framework   | 7.0.7          | Bundled with Spring Boot 4.0.6             |
| Spring Security    | 7.0.5          | Bundled with Spring Boot 4.0.6             |
| Spring Cloud       | 2025.1.1       | Boot 4.x BOM                               |
| Spring Cloud       | 2025.0.2       | Boot 3.5.x BOM                             |
| Spring Cloud       | 2024.0.3       | Boot 3.4.x BOM                             |
| Spring Data BOM    | 2025.1.5       | Boot 4.x BOM                               |
| Spring AI          | 2.0.0-M6       | Boot 4.x milestone                         |
| Spring AI          | 1.1.6          | Boot 3.5.x stable                          |
| Jackson 3          | 3.1.3          | Boot 4.x default                           |
| Jackson 2 compat   | 2.18.2         | Boot 3.x                                   |
| OpenAPI Generator  | 7.22.0         | Released 2026-04-28; 7.23.0 due 2026-05-28 |
| Springdoc (Boot 4) | 3.0.3          | springdoc-openapi-starter-webmvc-ui        |
| Vaadin (Boot 4)    | 25.1.x         | Recommended for Boot 4.x                   |

## Output

Report current versions and target versions:

```text
Framework Version Report
========================

Project: my-app
Build Tool: Maven

Current Versions:
  Spring Boot: 3.5.7
  Spring Cloud: 2025.0.0
  Spring Security: 6.4.0
  Java: 21
  Jackson: 2.17.0

Target Versions (Spring Boot 4.0):
  Spring Boot: 4.0.6
  Spring Cloud: 2025.1.1
  Spring Security: 7.0.5
  Java: 25 (optional)
  Jackson: 3.1.3

Migration Required: Yes
```
