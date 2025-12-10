---
name: jackson-migrator
description: Migrate Jackson 2.x to 3.x including groupId changes, import updates, and exception handling. Use when upgrading Jackson dependencies or fixing Jackson-related compilation errors after Spring Boot 4 upgrade.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Jackson Migrator

Migrate Jackson 2.x to Jackson 3.x with proper import and dependency updates.

## Critical Rules

1. **Jackson annotations STAY at `com.fasterxml.jackson.annotation`** - They are backward compatible!
2. **Jackson core moves to `tools.jackson`**
3. **`JsonProcessingException` becomes `JacksonException`**
4. **Add Jackson BOM for version management**

## Import Mappings

| Category    | Old Import                                           | New Import                            |
| ----------- | ---------------------------------------------------- | ------------------------------------- |
| Exception   | `com.fasterxml.jackson.core.JsonProcessingException` | `tools.jackson.core.JacksonException` |
| Core        | `com.fasterxml.jackson.core.*`                       | `tools.jackson.core.*`                |
| Databind    | `com.fasterxml.jackson.databind.*`                   | `tools.jackson.databind.*`            |
| Dataformat  | `com.fasterxml.jackson.dataformat.*`                 | `tools.jackson.dataformat.*`          |
| Datatype    | `com.fasterxml.jackson.datatype.*`                   | `tools.jackson.datatype.*`            |
| Module      | `com.fasterxml.jackson.module.*`                     | `tools.jackson.module.*`              |
| Annotations | `com.fasterxml.jackson.annotation.*`                 | **NO CHANGE**                         |

## Maven Migration

### Before

```xml
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
</dependency>
```

### After

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

<dependency>
    <groupId>tools.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
</dependency>
```

## Gradle Migration

### Groovy DSL - Before

```groovy
dependencies {
    implementation 'com.fasterxml.jackson.core:jackson-databind'
}
```

### Groovy DSL - After

```groovy
dependencies {
    implementation platform('tools.jackson:jackson-bom:3.0.2')
    implementation 'tools.jackson.core:jackson-databind'
}
```

### Kotlin DSL - Before

```kotlin
dependencies {
    implementation("com.fasterxml.jackson.core:jackson-databind")
}
```

### Kotlin DSL - After

```kotlin
dependencies {
    implementation(platform("tools.jackson:jackson-bom:3.0.2"))
    implementation("tools.jackson.core:jackson-databind")
}
```

## Java Code Migration

### Before

```java
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.annotation.JsonProperty;

public class MyService {
    private final ObjectMapper mapper = new ObjectMapper();

    public String serialize(Object obj) throws JsonProcessingException {
        return mapper.writeValueAsString(obj);
    }
}
```

### After

```java
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.annotation.JsonProperty; // UNCHANGED!

public class MyService {
    private final ObjectMapper mapper = new ObjectMapper();

    public String serialize(Object obj) throws JacksonException {
        return mapper.writeValueAsString(obj);
    }
}
```

## Migration Steps

1. **Update build file** - Add Jackson BOM, change groupIds
2. **Update imports** - Change `com.fasterxml.jackson.core/databind` to `tools.jackson`
3. **Update exceptions** - `JsonProcessingException` → `JacksonException`
4. **Keep annotations** - Do NOT change `com.fasterxml.jackson.annotation.*`
5. **Run build** - Verify compilation
6. **Run tests** - Verify functionality
