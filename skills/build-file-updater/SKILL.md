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

| Component    | Old Version | New Version  |
| ------------ | ----------- | ------------ |
| Spring Boot  | 3.5.x       | 4.0.0        |
| Spring Cloud | 2025.0.x    | 2025.1.0     |
| Java         | 21          | 25           |
| Jackson BOM  | -           | 3.0.2        |
| Vaadin       | 24.x        | 25.0.0       |
| Spring AI    | 1.0.x       | **2.0.0-M1** |

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

When using milestone releases (e.g., Spring AI 2.0.0-M1), add the Spring Milestones repository:

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
```

### Gradle Groovy DSL

```groovy
repositories {
    maven { url 'https://repo.spring.io/milestone' }
}
```

### Gradle Kotlin DSL

```kotlin
repositories {
    maven { url = uri("https://repo.spring.io/milestone") }
}
```

### When to Add

Add Spring Milestones repository when:

- Using Spring AI 2.0.0-M1 (or any milestone release)
- Using any `-M1`, `-M2`, `-RC1`, etc. version
- Repository not already present in build file

## Spring AI Version Update

```xml
<!-- Before -->
<spring-ai.version>1.1.2</spring-ai.version>

<!-- After -->
<spring-ai.version>2.0.0-M1</spring-ai.version>
```

**Important:** Spring AI 2.0.0-M1 is required for Spring Boot 4 compatibility due to autoconfigure module split.

## Migration Steps

1. **Identify build tool** - Check for pom.xml or build.gradle(.kts)
2. **Update parent/plugin** - Spring Boot version to 4.0.0
3. **Add repositories** - Spring Milestones if using milestone versions
4. **Add BOMs** - Jackson BOM, update Spring Cloud BOM
5. **Update dependencies** - Change groupIds (Jackson, etc.)
6. **Rename starters** - spring-boot-starter-web → spring-boot-starter-webmvc
7. **Remove Undertow** - Replace with Tomcat (default) or Jetty
8. **Update Spring AI** - Upgrade to 2.0.0-M1 for Boot 4 compatibility
9. **Add missing deps** - WebClient if using WebFlux
10. **Update Java version** - If upgrading Java
11. **Run build** - Verify configuration works
