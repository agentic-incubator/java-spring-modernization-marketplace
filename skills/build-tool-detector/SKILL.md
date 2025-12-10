---
name: build-tool-detector
description: Detect build tool (Maven or Gradle) and variant (Groovy/Kotlin DSL) for Java projects. Use when analyzing a project's build system, determining wrapper presence, or identifying multi-module structures.
allowed-tools: Read, Glob, Grep, Bash
---

# Build Tool Detector

Detect the build system used by a Java project including Maven and Gradle variants.

## Instructions

When invoked, analyze the project at the specified path to determine:

1. **Build Tool Type**: Check for these files in order:
   - `build.gradle.kts` → Gradle with Kotlin DSL
   - `build.gradle` → Gradle with Groovy DSL
   - `pom.xml` → Maven
   - `settings.gradle.kts` or `settings.gradle` → Multi-module Gradle

2. **Wrapper Detection**: Check for:
   - Maven: `mvnw`, `mvnw.cmd`, `.mvn/wrapper/maven-wrapper.properties`
   - Gradle: `gradlew`, `gradlew.bat`, `gradle/wrapper/gradle-wrapper.properties`

3. **Multi-Module Detection**:
   - Maven: Parse `pom.xml` for `<modules>` section
   - Gradle: Parse `settings.gradle(.kts)` for `include` statements

## Output Format

Return a JSON object:

```json
{
  "buildTool": "maven|gradle",
  "variant": "standard|groovy-dsl|kotlin-dsl",
  "wrapperPresent": true|false,
  "wrapperVersion": "x.x.x",
  "multiModule": true|false,
  "modules": ["module-a", "module-b"]
}
```

## Detection Patterns

### Gradle Kotlin DSL

```kotlin
plugins {
    id("org.springframework.boot") version "4.0.0"
}
```

### Gradle Groovy DSL

```groovy
plugins {
    id 'org.springframework.boot' version '4.0.0'
}
```

### Maven

```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>4.0.0</version>
</parent>
```

## Commands by Build Tool

| Operation       | Maven                 | Gradle                   |
| --------------- | --------------------- | ------------------------ |
| Clean build     | `mvn clean package`   | `./gradlew clean build`  |
| Skip tests      | `-DskipTests`         | `-x test`                |
| Run tests       | `mvn test`            | `./gradlew test`         |
| Dependency tree | `mvn dependency:tree` | `./gradlew dependencies` |
