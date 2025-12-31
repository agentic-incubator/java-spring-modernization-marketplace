---
name: application-property-migrator
description: Migrate application.yml and application.properties files for Spring Boot 4 including property renames, namespace changes, kebab-case convention, and logging package updates. Use when upgrading Spring Boot or fixing configuration issues.
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Application Property Migrator

Migrate Spring application configuration files (YAML and properties) for Spring Boot 4.

## Supported Files

- `application.yml` / `application.yaml`
- `application.properties`
- Profile-specific files (`application-{profile}.yml`, etc.)
- `bootstrap.yml` / `bootstrap.properties`

## Property Naming Convention

Spring Boot uses kebab-case (dash-separated) for property names.

### Underscore to Kebab-case Migration

```yaml
# Before (non-standard)
spring:
  ai:
    openai:
      base_url: https://api.openai.com
      api_key: ${OPENAI_API_KEY}

# After (standard kebab-case)
spring:
  ai:
    openai:
      base-url: https://api.openai.com
      api-key: ${OPENAI_API_KEY}
```

### Common Property Renames

| Before (underscore)  | After (kebab-case)   |
| -------------------- | -------------------- |
| `base_url`           | `base-url`           |
| `api_key`            | `api-key`            |
| `connection_timeout` | `connection-timeout` |
| `read_timeout`       | `read-timeout`       |
| `max_connections`    | `max-connections`    |

## Jackson Property Namespace Changes

Spring Boot 4 with Jackson 3 changes property namespaces:

### Read/Write Feature Properties

```yaml
# Before (Jackson 2.x / Spring Boot 3.x)
spring:
  jackson:
    read:
      FAIL_ON_UNKNOWN_PROPERTIES: false
    write:
      INDENT_OUTPUT: true

# After (Jackson 3.x / Spring Boot 4.x)
spring:
  jackson:
    json:
      read:
        FAIL_ON_UNKNOWN_PROPERTIES: false
      write:
        INDENT_OUTPUT: true
```

### Complete Jackson Property Migration

| Before                       | After                             |
| ---------------------------- | --------------------------------- |
| `spring.jackson.read.*`      | `spring.jackson.json.read.*`      |
| `spring.jackson.write.*`     | `spring.jackson.json.write.*`     |
| `spring.jackson.parser.*`    | `spring.jackson.json.parser.*`    |
| `spring.jackson.generator.*` | `spring.jackson.json.generator.*` |

## Logging Package Changes

Jackson 3 uses new package names, affecting logging configuration:

```yaml
# Before (Jackson 2.x)
logging:
  level:
    com.fasterxml.jackson: DEBUG
    com.fasterxml.jackson.databind: TRACE
    com.fasterxml.jackson.core: WARN

# After (Jackson 3.x)
logging:
  level:
    tools.jackson: DEBUG
    tools.jackson.databind: TRACE
    tools.jackson.core: WARN
```

### Logging Package Mapping

| Before (Jackson 2)               | After (Jackson 3)        |
| -------------------------------- | ------------------------ |
| `com.fasterxml.jackson`          | `tools.jackson`          |
| `com.fasterxml.jackson.core`     | `tools.jackson.core`     |
| `com.fasterxml.jackson.databind` | `tools.jackson.databind` |
| `com.fasterxml.jackson.datatype` | `tools.jackson.datatype` |
| `com.fasterxml.jackson.module`   | `tools.jackson.module`   |

**Note:** `com.fasterxml.jackson.annotation` logging remains unchanged (backward compatible).

## Spring AI Property Changes

### Provider Selection (New in 2.0)

```yaml
# Before (Spring AI 1.x - autoconfigure excludes)
spring:
  autoconfigure:
    exclude: org.springframework.ai.autoconfigure.openai.OpenAiAutoConfiguration
  ai:
    ollama:
      base-url: http://localhost:11434

# After (Spring AI 2.0 - model selection)
spring:
  ai:
    model:
      chat: ollama
      embedding: ollama
    ollama:
      base-url: http://localhost:11434
```

### TTS Speed Parameter Type

In YAML, remove the `f` suffix for Float literals (Java syntax, not valid YAML):

```yaml
# Before (invalid YAML for Double property)
spring:
  ai:
    openai:
      audio:
        speech:
          speed: 1.0f

# After (valid YAML)
spring:
  ai:
    openai:
      audio:
        speech:
          speed: 1.0
```

## Annotation Renames

`@JsonComponent` is renamed to `@JacksonComponent` in Spring Boot 4:

This affects documentation and understanding, not property files directly. However, if you have comments referencing this annotation:

```yaml
# Before
# Custom serializer registered via @JsonComponent

# After
# Custom serializer registered via @JacksonComponent
```

## Properties File Migration

For `.properties` files, the same rules apply:

```properties
# Before
spring.jackson.read.FAIL_ON_UNKNOWN_PROPERTIES=false
spring.ai.openai.base_url=https://api.openai.com
logging.level.com.fasterxml.jackson=DEBUG

# After
spring.jackson.json.read.FAIL_ON_UNKNOWN_PROPERTIES=false
spring.ai.openai.base-url=https://api.openai.com
logging.level.tools.jackson=DEBUG
```

## Complete Migration Example

### Before (Spring Boot 3.x)

```yaml
spring:
  autoconfigure:
    exclude: org.springframework.ai.autoconfigure.openai.OpenAiAutoConfiguration
  jackson:
    read:
      FAIL_ON_UNKNOWN_PROPERTIES: false
    write:
      INDENT_OUTPUT: true
  ai:
    ollama:
      base_url: http://localhost:11434
      chat:
        model: llama3.2
        options:
          temperature: 0.7f

logging:
  level:
    com.fasterxml.jackson: WARN
    com.fasterxml.jackson.databind: DEBUG
```

### After (Spring Boot 4.x)

```yaml
spring:
  jackson:
    json:
      read:
        FAIL_ON_UNKNOWN_PROPERTIES: false
      write:
        INDENT_OUTPUT: true
  ai:
    model:
      chat: ollama
      embedding: ollama
    ollama:
      base-url: http://localhost:11434
      chat:
        model: llama3.2
        options:
          temperature: 0.7

logging:
  level:
    tools.jackson: WARN
    tools.jackson.databind: DEBUG
```

## Detection Patterns

Use these patterns to find properties needing migration:

### Grep Patterns

```bash
# Underscore properties
grep -r "base_url\|api_key\|_timeout\|_connections" --include="*.yml" --include="*.yaml" --include="*.properties"

# Jackson 2.x logging
grep -r "com\.fasterxml\.jackson" --include="*.yml" --include="*.yaml" --include="*.properties"

# Old Jackson namespace
grep -r "spring\.jackson\.(read|write|parser|generator)\." --include="*.yml" --include="*.yaml" --include="*.properties"

# Spring AI autoconfigure excludes
grep -r "OpenAiAutoConfiguration" --include="*.yml" --include="*.yaml" --include="*.properties"

# Float suffix in YAML
grep -r "[0-9]\.0f" --include="*.yml" --include="*.yaml"
```

## Migration Steps

1. **Find all config files** - Locate application*.yml, application*.properties, bootstrap\*
2. **Fix property naming** - Convert underscores to kebab-case
3. **Update Jackson namespace** - `spring.jackson.read/write` → `spring.jackson.json.read/write`
4. **Update logging packages** - `com.fasterxml.jackson` → `tools.jackson`
5. **Migrate Spring AI config** - Autoconfigure excludes → `spring.ai.model.*`
6. **Fix type literals** - Remove `f` suffix from Float values
7. **Validate syntax** - Ensure YAML/properties parse correctly
8. **Test application** - Verify configuration loads successfully

## IDE Warnings

After migration, IDEs may show warnings about unknown properties. This is often because:

- IDE plugins haven't updated to Spring Boot 4 / Spring AI 2.0 metadata
- New properties like `spring.ai.model` may not have schema support yet

These warnings can typically be ignored if the application runs correctly.
