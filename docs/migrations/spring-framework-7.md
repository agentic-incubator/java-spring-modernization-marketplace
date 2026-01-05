# Spring Framework 7 Migration Guide

**Target Version**: Spring Framework 7.0.x
**From**: Spring Framework 6.x
**Automation Level**: 85% (API: 95%, Templates: 80%)

## Overview

Spring Framework 7 introduces breaking changes in the HTTP Interface client API that affect projects using:

- **HttpServiceProxyFactory** for declarative HTTP clients
- **WebClientAdapter** for WebClient integration
- **OpenAPI Generator** with `spring-http-interface` library

This guide covers:

1. Breaking API changes
2. Migration strategies
3. Template management for OpenAPI Generator
4. Troubleshooting

## Breaking Changes

### 1. HttpServiceProxyFactory API Change

The static factory method for creating HTTP interface proxies has changed.

#### Before (Framework 6)

```java
HttpServiceProxyFactory factory = HttpServiceProxyFactory
    .builder(WebClientAdapter.forClient(webClient))
    .build();
```

#### After (Framework 7)

```java
HttpServiceProxyFactory factory = HttpServiceProxyFactory
    .builderFor(WebClientAdapter.create(webClient))
    .build();
```

**Key Changes**:

- `.builder(adapter)` → `.builderFor(adapter)`
- Adapter is now a required parameter to `builderFor()`

### 2. WebClientAdapter API Change

The factory method for creating WebClient adapters has been renamed.

#### Before (Framework 6)

```java
WebClientAdapter adapter = WebClientAdapter.forClient(webClient);
```

#### After (Framework 7)

```java
WebClientAdapter adapter = WebClientAdapter.create(webClient);
```

**Key Changes**:

- `.forClient(webClient)` → `.create(webClient)`
- Clearer naming convention

### 3. Combined Example

#### Before (Framework 6)

```java
@Configuration
public class HttpInterfacesConfiguration {

    private final WebClient webClient;

    public HttpInterfacesConfiguration(WebClient webClient) {
        this.webClient = webClient;
    }

    @Bean
    public HttpServiceProxyFactory httpServiceProxyFactory() {
        return HttpServiceProxyFactory
            .builder(WebClientAdapter.forClient(webClient))
            .build();
    }

    @Bean
    public MyApiClient myApiClient(HttpServiceProxyFactory factory) {
        return factory.createClient(MyApiClient.class);
    }
}
```

#### After (Framework 7)

```java
@Configuration
public class HttpInterfacesConfiguration {

    private final WebClient webClient;

    public HttpInterfacesConfiguration(WebClient webClient) {
        this.webClient = webClient;
    }

    @Bean
    public HttpServiceProxyFactory httpServiceProxyFactory() {
        return HttpServiceProxyFactory
            .builderFor(WebClientAdapter.create(webClient))
            .build();
    }

    @Bean
    public MyApiClient myApiClient(HttpServiceProxyFactory factory) {
        return factory.createClient(MyApiClient.class);
    }
}
```

## Migration Strategies

### Automated Migration

Use the Spring Modernization Marketplace tools for automated migration:

```bash
# Option 1: Full Spring Boot 4 migration (includes Framework 7)
/migrate --target-version 4.0.0

# Option 2: Standalone Framework 7 API migration
/migrate-framework-7

# Option 3: With template injection for OpenAPI Generator
/migrate-framework-7 --inject-templates
```

**Automation Coverage**:

- ✅ 95% - API pattern migrations (HttpServiceProxyFactory, WebClientAdapter)
- ✅ 80% - Template injection (with user approval for custom templates)

### Manual Migration

If you prefer manual migration or need to understand the changes:

#### Step 1: Find Deprecated Patterns

```bash
# Find HttpServiceProxyFactory.builder() usage
grep -r "HttpServiceProxyFactory\.builder(" src/main/java/

# Find WebClientAdapter.forClient() usage
grep -r "WebClientAdapter\.forClient(" src/main/java/
```

#### Step 2: Replace API Patterns

For each occurrence, replace:

1. `HttpServiceProxyFactory.builder(` → `HttpServiceProxyFactory.builderFor(`
2. `WebClientAdapter.forClient(` → `WebClientAdapter.create(`

#### Step 3: Update OpenAPI Generator Templates (if applicable)

If using OpenAPI Generator with `spring-http-interface`:

1. Locate template directory (usually `src/main/resources/templates/`)
2. Update `httpInterfacesConfiguration.mustache` or equivalent
3. Apply the same API changes as above

#### Step 4: Validate

```bash
# Maven
mvn clean compile

# Gradle
./gradlew clean compileJava
```

## OpenAPI Generator Integration

### Background

OpenAPI Generator's `spring-http-interface` library generates HTTP client interfaces using Spring's declarative HTTP interface
feature. The generated code must use Framework 7 APIs when running on Spring Framework 7.

### Plugin Version Compatibility

| Spring Framework | Minimum OpenAPI Generator | Recommended |
| ---------------- | ------------------------- | ----------- |
| 6.0.x - 6.x.x    | 7.0.0                     | 7.17.0      |
| 7.0.x+           | 7.18.0                    | 7.18.0+     |

### Updating Plugin Version

```bash
# Auto-detect and update
/update-openapi-generator

# Conservative strategy (recommended)
/update-openapi-generator --strategy conservative

# Latest version
/update-openapi-generator --strategy latest
```

### Template Management

#### Scenario 1: No Custom Templates

**Situation**: Using default OpenAPI Generator templates.

**Solution**:

1. Update OpenAPI Generator plugin to 7.18.0+
2. Regenerate code: `mvn clean generate-sources` or `./gradlew openApiGenerate`
3. Generated code will use Framework 7 APIs automatically

#### Scenario 2: Custom Templates

**Situation**: Custom template in `src/main/resources/templates/` or custom `templateDirectory`.

**Solution**:

```bash
# Use migrate-framework-7 with template injection
/migrate-framework-7 --inject-templates
```

This will:

1. Detect custom templates
2. Show diff of required changes
3. Ask for approval to apply changes
4. Update template while preserving customizations

**Manual Template Update**:

If you prefer to update manually:

```mustache
{{>licenseInfo}}
package {{configPackage}};

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.support.WebClientAdapter;
import org.springframework.web.service.invoker.HttpServiceProxyFactory;

@Configuration
public abstract class HttpInterfacesAbstractConfigurator {

    protected HttpInterfacesAbstractConfigurator(WebClient webClient) {
        this.webClient = webClient;
    }

    private final WebClient webClient;

    @Bean
    public HttpServiceProxyFactory httpServiceProxyFactory() {
        return HttpServiceProxyFactory
            .builderFor(WebClientAdapter.create(webClient))  // Framework 7 API
            .build();
    }

{{#apiInfo}}
{{#apis}}
    @Bean
    public {{classname}} {{#lambda.camelcase}}{{classname}}{{/lambda.camelcase}}(HttpServiceProxyFactory factory) {
        return factory.createClient({{classname}}.class);
    }

{{/apis}}
{{/apiInfo}}
}
```

## Troubleshooting

### Compilation Error: Cannot Find Symbol

**Error**:

```text
[ERROR] cannot find symbol
  symbol:   method builder(WebClientAdapter)
  location: class HttpServiceProxyFactory
```

**Cause**: Using deprecated Framework 6 API with Framework 7.

**Solution**:

1. Replace `builder(adapter)` with `builderFor(adapter)`
2. Or run `/migrate-framework-7` for automated fix

### Generated Code Uses Old API

**Error**:

```text
[ERROR] cannot find symbol
  symbol:   method builder(WebClientAdapter)
  location: class HttpServiceProxyFactory
```

In generated code (e.g., `target/generated-sources/`).

**Cause**: OpenAPI Generator plugin version too old or custom template not updated.

**Solution**:

```bash
# Update plugin
/update-openapi-generator

# Update templates
/migrate-framework-7 --inject-templates

# Regenerate code
mvn clean generate-sources  # or ./gradlew openApiGenerate
```

### Template Merge Conflicts

**Situation**: Custom template has significant modifications that conflict with Framework 7 changes.

**Solution**:

1. Run `/migrate-framework-7 --inject-templates`
2. Choose "Manually edit the template" when prompted
3. Review the diff shown in the output
4. Apply changes manually while preserving your customizations
5. Key changes to make:
   - `HttpServiceProxyFactory.builder(` → `.builderFor(`
   - `WebClientAdapter.forClient(` → `.create(`

### Mixed Framework Versions (Multi-Module)

**Situation**: Multi-module project with some modules on Framework 6, others on Framework 7.

**Solution**:

Migrate each module independently:

```bash
# Module with Framework 7
cd module-a
/migrate-framework-7

# Module with Framework 6 (skip)
cd module-b
# No migration needed
```

## Testing After Migration

### Unit Tests

Ensure HTTP interface clients still work:

```java
@SpringBootTest
class HttpInterfacesConfigurationTest {

    @Autowired
    private HttpServiceProxyFactory factory;

    @Autowired
    private MyApiClient apiClient;

    @Test
    void factoryBeanExists() {
        assertNotNull(factory);
    }

    @Test
    void clientBeanExists() {
        assertNotNull(apiClient);
    }

    @Test
    void clientCanMakeRequests() {
        // Test actual API calls if possible
        // Or use MockWebServer for integration tests
    }
}
```

### Integration Tests

Test with real or mocked HTTP endpoints:

```java
@SpringBootTest
@AutoConfigureMockMvc
class ApiClientIntegrationTest {

    @Autowired
    private MyApiClient apiClient;

    @Test
    void getResource() {
        MyResource resource = apiClient.getResource("123");
        assertNotNull(resource);
        assertEquals("123", resource.getId());
    }
}
```

## Migration Checklist

- [ ] Verify Spring Framework 7.x in dependencies
- [ ] Run `/migrate-framework-7` or manually update API patterns
- [ ] If using OpenAPI Generator:
  - [ ] Update plugin to 7.18.0+ with `/update-openapi-generator`
  - [ ] Update templates if custom with `/migrate-framework-7 --inject-templates`
  - [ ] Regenerate code with `mvn generate-sources` or `./gradlew openApiGenerate`
- [ ] Compile project: `mvn clean compile` or `./gradlew compileJava`
- [ ] Run tests: `mvn test` or `./gradlew test`
- [ ] Check for remaining deprecated patterns:

  ```bash
  grep -r "HttpServiceProxyFactory\.builder(" src/
  grep -r "WebClientAdapter\.forClient(" src/
  ```

- [ ] Review generated code (if OpenAPI Generator) for correct API usage
- [ ] Commit changes

## Additional Resources

### Official Documentation

- [Spring Framework 7.0 Reference - WebClient](https://docs.spring.io/spring-framework/reference/7.0/web/webflux-webclient.html)
- [Spring Framework 7.0 - HTTP Interface](https://docs.spring.io/spring-framework/reference/7.0/integration/rest-clients.html#rest-http-interface)
- [Spring Framework 7.0 Upgrade Guide](https://github.com/spring-projects/spring-framework/wiki/Upgrading-to-Spring-Framework-7.x)

### OpenAPI Generator

- [OpenAPI Generator - Spring HTTP Interface](https://openapi-generator.tech/docs/generators/spring/)
- [OpenAPI Generator Templates](https://github.com/OpenAPITools/openapi-generator/tree/master/modules/openapi-generator/src/main/resources/JavaSpring)

### Spring Modernization Marketplace

- [Spring Framework 7 Migrator Skill](../../skills/spring-framework-7-migrator/SKILL.md)
- [OpenAPI Generator Plugin Updater Skill](../../skills/openapi-generator-plugin-updater/SKILL.md)
- [OpenAPI Generator Detector Skill](../../skills/openapi-generator-detector/SKILL.md)

## Version History

### 1.0.0 (2026-01-05)

**Initial Release**:

- HttpServiceProxyFactory API migration guide
- WebClientAdapter API migration guide
- OpenAPI Generator integration guide
- Template management guide
- Troubleshooting guide

## Related Guides

- [Spring Boot 4 Migration Guide](../spring-boot-4-migration.md)
- [Jackson 3 Migration Guide](../jackson-3-migration.md)
- [Spring Security 7 Migration Guide](../spring-security-7-migration.md)
