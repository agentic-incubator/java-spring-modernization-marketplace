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

| Spring Boot | Spring Cloud | Spring Security | Java  | Jackson |
| ----------- | ------------ | --------------- | ----- | ------- |
| 3.3.x       | 2024.0.x     | 6.3.x           | 17-23 | 2.x     |
| 3.5.x       | 2025.0.x     | 6.4.x           | 17-24 | 2.x     |
| 4.0.x       | 2025.1.x     | 7.0.x           | 17-25 | 3.x     |

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
  Spring Boot: 4.0.0
  Spring Cloud: 2025.1.0
  Spring Security: 7.0.0
  Java: 25 (optional)
  Jackson: 3.0.2

Migration Required: Yes
```
