# Migration Guide

Detailed migration patterns for each supported upgrade path.

## Version Compatibility Matrix

| Spring Boot | Spring Cloud | Spring Security | Java  | Jackson | Spring AI |
| ----------- | ------------ | --------------- | ----- | ------- | --------- |
| 3.3.x       | 2024.0.x     | 6.3.x           | 17-23 | 2.x     | 1.0.x     |
| 3.5.x       | 2025.0.x     | 6.4.x           | 17-24 | 2.x     | 1.0.x     |
| **4.0.x**   | **2025.1.x** | **7.0.x**       | 17-25 | **3.x** | **1.1.x** |

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

## Jackson 2.x to 3.x

### Critical Rule

**DO NOT change `com.fasterxml.jackson.annotation.*` imports!**

Jackson annotations remain backward compatible. Only change core/databind imports.

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

## Spring AI 1.0 to 1.1

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

### Memory Advisor Constants

| Before                          | After   |
| ------------------------------- | ------- |
| `CHAT_MEMORY_RETRIEVE_SIZE_KEY` | `TOP_K` |

## Migration Order

When migrating a project with multiple changes, follow this order:

1. **Build files first** - Add BOMs, update versions
2. **Imports second** - Update package names
3. **Configurations third** - Security, themes, etc.
4. **Validate last** - Build and test

This order prevents compilation errors during migration.

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
