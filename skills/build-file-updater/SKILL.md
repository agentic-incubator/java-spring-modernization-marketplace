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

| Component    | Old Version | New Version |
| ------------ | ----------- | ----------- |
| Spring Boot  | 3.5.x       | 4.0.0       |
| Spring Cloud | 2025.0.x    | 2025.1.0    |
| Java         | 21          | 25          |
| Jackson BOM  | -           | 3.0.2       |
| Vaadin       | 24.x        | 25.0.0      |
| Spring AI    | 1.0.x       | 1.1.x       |

## Migration Steps

1. **Identify build tool** - Check for pom.xml or build.gradle(.kts)
2. **Update parent/plugin** - Spring Boot version
3. **Add BOMs** - Jackson BOM, update Spring Cloud BOM
4. **Update dependencies** - Change groupIds
5. **Add missing deps** - WebClient if using WebFlux
6. **Update Java version** - If upgrading Java
7. **Run build** - Verify configuration works
