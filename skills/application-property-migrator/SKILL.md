---
name: application-property-migrator
description: >
  Migrate application.yml and application.properties files for Spring Boot 4
  including property renames, namespace changes, kebab-case convention, logging
  package updates, the six Spring AI 2.0 `spring.ai.model.*` selectors, and Spring
  Boot 4.1 opt-in property awareness. Use when upgrading Spring Boot or fixing
  configuration issues.
allowed-tools: Read, Write, Edit, Glob, Grep
---

**Version:** 1.2.0

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

### Provider Selection — All Six Selectors (New in 2.0)

Spring AI 2.0 introduces six `spring.ai.model.<type>` selectors. **All six must be set
explicitly** when more than one provider starter is on the classpath, or
`@ConditionalOnProperty(havingValue="openai", matchIfMissing=true)` on the OpenAI
autoconfiguration classes silently defaults to OpenAI for unset types and crashes the app
with `At least one credential source must be specified`.

```yaml
# Before (Spring AI 1.x - autoconfigure excludes)
spring:
  autoconfigure:
    exclude: org.springframework.ai.autoconfigure.openai.OpenAiAutoConfiguration
  ai:
    ollama:
      base-url: http://localhost:11434

# After (Spring AI 2.0 - the six model selectors)
spring:
  ai:
    model:
      chat: ollama
      embedding: ollama
      image: none
      moderation: none
      audio:
        speech: none
        transcription: none
    ollama:
      base-url: http://localhost:11434
```

#### Detection patterns

| Pattern                                                                  | Action                                                                |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| `spring.ai.model.chat` set, but `spring.ai.model.image` missing          | Add `image: none` (and all other missing of the six)                  |
| `spring.ai.openai.api-key` set + `spring.ai.ollama.*` config             | Multi-provider classpath — invoke `spring-ai-model-selector-enforcer` |
| Multiple `spring-ai-starter-model-*` deps + no `spring.ai.model.*` block | Run `spring-ai-model-selector-enforcer` to inject all six             |

Valid selector values per profile:

- `openai`, `ollama`, `anthropic`, `mistral-ai`, `bedrock-converse`, `huggingface`,
  `stability-ai`, `minimax`, `moonshot`, `qianfan`
- `none` — disables autoconfiguration for that model type

For automatic injection with intelligent inference per profile, delegate to the
**`spring-ai-model-selector-enforcer`** skill.

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

## Spring Boot 4.1 New Opt-in Properties (Reference)

Spring Boot 4.1.0-RC1 introduces several new properties. They are **opt-in** — no
migration transformation is required, but document them so developers can adopt them
deliberately.

| Property                             | Type             | Notes                                                           |
| ------------------------------------ | ---------------- | --------------------------------------------------------------- |
| `spring.datasource.connection-fetch` | `eager` / `lazy` | Eager pre-warms the connection pool at startup; lazy defers     |
| `spring.webflux.default-html-escape` | boolean          | Default HTML escaping for WebFlux template engines              |
| `spring.data.redis.listener.*`       | various          | New listener-container tuning knobs (concurrency, error policy) |
| `spring.grpc.*`                      | various          | First-class Spring gRPC configuration namespace                 |

These do not require transformation. Skill version 1.2.0+ surfaces them in `--report` mode
so projects can review opt-in opportunities after upgrading to Boot 4.1.

## IDE Warnings

After migration, IDEs may show warnings about unknown properties. This is often because:

- IDE plugins haven't updated to Spring Boot 4 / Spring AI 2.0 metadata
- New properties like `spring.ai.model` may not have schema support yet

These warnings can typically be ignored if the application runs correctly.
