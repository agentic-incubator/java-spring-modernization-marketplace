# OpenFeign to Spring HTTP Interface Migrator Skill

**Skill ID:** `openfeign-to-httpinterface-migrator`
**Version:** 1.0.0
**Category:** Transformation & Migration
**Priority:** CRITICAL (unblocks Spring Boot 4.x migrations)
**Automation:** 85%

---

## Purpose

Automate migration from Spring Cloud OpenFeign to Spring's native HTTP Interface clients (`@HttpExchange`). This migration is essential for
Spring Boot 4.x projects due to OpenFeign's incompatibility with the removed `HttpMessageConverters` API and provides better architecture
alignment with Spring Boot 4.x.

---

## Problem Statement

Spring Cloud OpenFeign 2025.0.0 has breaking changes with Spring Boot 4.x:

1. **API Incompatibility:** Custom `SpringDecoder`/`SpringEncoder` expect `HttpMessageConverters` (removed in Boot 4.x)
2. **Maintenance Mode:** OpenFeign is feature-complete; Spring HTTP Interface is the future
3. **Native Integration:** HTTP Interface has native support for `ClientHttpMessageConvertersCustomizer`

**Migration Benefits:**

- Better Spring Boot 4.x alignment
- Simplified configuration (no third-party dependency management)
- Long-term support as part of Spring Framework core
- Active development and feature additions

---

## Migration Strategy

### Phased Approach

#### Phase 1: Analysis

1. Inventory all @FeignClient interfaces
2. Document custom configurations
3. Identify shared vs client-specific configurations
4. Plan testing strategy

#### Phase 2: Setup

1. Add spring-boot-starter-restclient dependency
2. Create base RestClient.Builder configuration
3. Migrate shared message converter configurations
4. Set up HttpServiceProxyFactory infrastructure

#### Phase 3: Incremental Migration

1. Migrate one Feign client at a time
2. Update interface annotations
3. Create HttpServiceProxyFactory bean
4. Test migrated client
5. Repeat

#### Phase 4: Cleanup

1. Remove spring-cloud-starter-openfeign dependency
2. Delete Feign-specific configuration classes
3. Update documentation

---

## Annotation Migration Patterns

### 1. Interface-Level Annotations

**Before (OpenFeign):**

```java
import org.springframework.cloud.openfeign.FeignClient;

@FeignClient(name = "user-service", url = "${api.user.url}")
public interface UserClient {
    // methods
}
```

**After (HTTP Interface):**

```java
import org.springframework.web.service.annotation.HttpExchange;

@HttpExchange(url = "${api.user.url}")
public interface UserClient {
    // methods
}
```

**Transformation:**

```text
REMOVE: import org.springframework.cloud.openfeign.FeignClient;
ADD:    import org.springframework.web.service.annotation.HttpExchange;

REPLACE: @FeignClient(name = "...", url = "${...}")
WITH:    @HttpExchange(url = "${...}")
```

### 2. Method-Level Annotations

**Mapping Table:**

| OpenFeign                 | HTTP Interface             |
| ------------------------- | -------------------------- |
| `@GetMapping("/path")`    | `@GetExchange("/path")`    |
| `@PostMapping("/path")`   | `@PostExchange("/path")`   |
| `@PutMapping("/path")`    | `@PutExchange("/path")`    |
| `@DeleteMapping("/path")` | `@DeleteExchange("/path")` |
| `@PatchMapping("/path")`  | `@PatchExchange("/path")`  |
| `@RequestMapping`         | `@HttpExchange`            |

**Parameter Annotations (UNCHANGED):**

- `@PathVariable` - No change
- `@RequestParam` - No change
- `@RequestBody` - No change
- `@RequestHeader` - No change
- `@RequestPart` - No change

**Example:**

```java
// Before
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;

@FeignClient(name = "users", url = "${api.url}")
public interface UserClient {
    @GetMapping("/users/{id}")
    UserDto getUser(@PathVariable Long id);

    @PostMapping("/users")
    UserDto createUser(@RequestBody CreateUserRequest request);
}

// After
import org.springframework.web.service.annotation.HttpExchange;
import org.springframework.web.service.annotation.GetExchange;
import org.springframework.web.service.annotation.PostExchange;

@HttpExchange(url = "${api.url}")
public interface UserClient {
    @GetExchange("/users/{id}")
    UserDto getUser(@PathVariable Long id);

    @PostExchange("/users")
    UserDto createUser(@RequestBody CreateUserRequest request);
}
```

---

## Configuration Migration Patterns

### 1. Custom ObjectMapper (Jackson Configuration)

**Before (OpenFeign with HttpMessageConverters):**

```java
import org.springframework.boot.autoconfigure.http.HttpMessageConverters;
import feign.codec.Decoder;
import feign.codec.Encoder;
import org.springframework.cloud.openfeign.support.SpringDecoder;
import org.springframework.cloud.openfeign.support.SpringEncoder;

@Configuration
public class FeignConfiguration {

    @Bean
    public Decoder feignDecoder(ObjectFactory<HttpMessageConverters> messageConverters) {
        return new SpringDecoder(messageConverters);
    }

    @Bean
    public Encoder feignEncoder(ObjectFactory<HttpMessageConverters> messageConverters) {
        return new SpringEncoder(messageConverters);
    }

    @Bean
    public HttpMessageConverters customConverters() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

        MappingJackson2HttpMessageConverter converter =
            new MappingJackson2HttpMessageConverter(mapper);

        return new HttpMessageConverters(converter);
    }
}
```

**After (HTTP Interface with ClientHttpMessageConvertersCustomizer):**

```java
import org.springframework.boot.autoconfigure.http.client.ClientHttpMessageConvertersCustomizer;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;

@Configuration
public class HttpClientConfiguration {

    @Bean
    public ClientHttpMessageConvertersCustomizer jacksonCustomizer() {
        return builder -> {
            ObjectMapper mapper = new ObjectMapper();
            mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

            MappingJackson2HttpMessageConverter converter =
                new MappingJackson2HttpMessageConverter(mapper);

            builder.withCustomConverter(converter);
        };
    }
}
```

---

### 2. Request Interceptor Migration

**Before (Feign RequestInterceptor):**

```java
import feign.RequestInterceptor;

@Bean
public RequestInterceptor authInterceptor() {
    return requestTemplate -> {
        requestTemplate.header("Authorization", "Bearer " + token);
    };
}
```

**After (ClientHttpRequestInterceptor):**

```java
import org.springframework.http.client.ClientHttpRequestInterceptor;

@Bean
public RestClient.Builder restClientBuilder() {
    return RestClient.builder()
        .defaultHeader("Authorization", "Bearer " + token);
}

// OR as interceptor for dynamic tokens
@Bean
public ClientHttpRequestInterceptor authInterceptor() {
    return (request, body, execution) -> {
        request.getHeaders().add("Authorization", "Bearer " + getToken());
        return execution.execute(request, body);
    };
}
```

---

### 3. Error Decoder Migration

**Before (Feign ErrorDecoder):**

```java
import feign.codec.ErrorDecoder;

@Bean
public ErrorDecoder errorDecoder() {
    return (methodKey, response) -> {
        if (response.status() == 404) {
            return new NotFoundException();
        }
        return new FeignException.Default(methodKey, response);
    };
}
```

**After (RestClient Error Handler):**

```java
import org.springframework.web.client.DefaultResponseErrorHandler;

@Bean
public RestClient.Builder restClientBuilder() {
    return RestClient.builder()
        .defaultStatusHandler(new CustomResponseErrorHandler());
}

public static class CustomResponseErrorHandler extends DefaultResponseErrorHandler {
    @Override
    public void handleError(ClientHttpResponse response) throws IOException {
        if (response.getStatusCode().value() == 404) {
            throw new NotFoundException();
        }
        super.handleError(response);
    }
}
```

---

### 4. HttpServiceProxyFactory Bean Creation

**For Each Feign Client, Create:**

```java
import org.springframework.web.client.RestClient;
import org.springframework.web.client.support.RestClientAdapter;
import org.springframework.web.service.invoker.HttpServiceProxyFactory;

@Configuration
public class UserClientConfiguration {

    @Value("${api.user.url}")
    private String userApiUrl;

    @Bean
    public UserClient userClient(RestClient.Builder restClientBuilder) {
        RestClient restClient = restClientBuilder
            .baseUrl(userApiUrl)
            .build();

        HttpServiceProxyFactory factory = HttpServiceProxyFactory
            .builderFor(RestClientAdapter.create(restClient))
            .build();

        return factory.createClient(UserClient.class);
    }
}
```

---

### 5. Dependency Migration

**Before (pom.xml):**

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-openfeign</artifactId>
</dependency>
```

**After (pom.xml):**

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-restclient</artifactId>
</dependency>
```

**Before (build.gradle):**

```gradle
implementation 'org.springframework.cloud:spring-cloud-starter-openfeign'
```

**After (build.gradle):**

```gradle
implementation 'org.springframework.boot:spring-boot-starter-restclient'
```

---

### 6. Enable Annotation Removal

**Before:**

```java
@SpringBootApplication
@EnableFeignClients(basePackages = "com.example.api.clients")
public class Application {
    // ...
}
```

**After:**

```java
@SpringBootApplication
// @EnableFeignClients removed - HTTP Interface uses standard bean registration
public class Application {
    // ...
}
```

---

## Migration Algorithm

```text
1. ANALYZE Phase
   a. Scan for @FeignClient interfaces
   b. Count total clients
   c. Identify custom configurations:
      - Decoder/Encoder beans
      - ErrorDecoder beans
      - RequestInterceptor beans
      - Timeout configurations
   d. Assess complexity
   e. Generate migration plan

2. SETUP Phase
   a. Add spring-boot-starter-restclient dependency
   b. Create shared RestClient.Builder bean
   c. Migrate shared message converters
   d. Set up base configuration

3. INTERFACE MIGRATION Phase
   For each @FeignClient interface:

   a. Update imports:
      - Remove: org.springframework.cloud.openfeign.FeignClient
      - Add: org.springframework.web.service.annotation.HttpExchange
      - Add: org.springframework.web.service.annotation.*Exchange (Get, Post, etc.)

   b. Update interface annotation:
      - Extract url from @FeignClient
      - Replace with @HttpExchange(url = "...")

   c. Update method annotations:
      - @GetMapping → @GetExchange
      - @PostMapping → @PostExchange
      - @PutMapping → @PutExchange
      - @DeleteMapping → @DeleteExchange
      - @PatchMapping → @PatchExchange

   d. Keep parameter annotations unchanged:
      - @PathVariable, @RequestParam, @RequestBody, @RequestHeader, @RequestPart

4. CONFIGURATION MIGRATION Phase

   a. Migrate Decoder/Encoder:
      - Replace SpringDecoder/SpringEncoder beans
      - Create ClientHttpMessageConvertersCustomizer bean
      - Transfer ObjectMapper configuration

   b. Migrate ErrorDecoder:
      - Create ResponseErrorHandler class
      - Transfer error handling logic
      - Add to RestClient.Builder

   c. Migrate RequestInterceptor:
      - Convert to ClientHttpRequestInterceptor
      - Transfer header/logging logic
      - Add to RestClient.Builder

   d. Migrate timeouts:
      - Extract from Request.Options
      - Create SimpleClientHttpRequestFactory
      - Set connect/read timeouts

5. BEAN CREATION Phase
   For each Feign client:

   a. Create configuration class (e.g., UserClientConfiguration)
   b. Create HttpServiceProxyFactory bean:
      - Configure RestClient with base URL
      - Apply custom settings
      - Create and return client proxy
   c. Name bean appropriately (userClient, productClient, etc.)

6. CLEANUP Phase
   a. Remove @EnableFeignClients annotation
   b. Remove spring-cloud-starter-openfeign dependency
   c. Delete unused Feign configuration classes
   d. Remove unused Feign-specific beans

7. VALIDATION Phase
   a. Compile project
   b. Run tests
   c. Verify HTTP calls still work
   d. Check for runtime errors

8. DOCUMENTATION Phase
   a. Update README with new HTTP Interface setup
   b. Document configuration changes
   c. Add migration notes
```

---

## Automation Capabilities

### Fully Automated (85% of migrations)

✅ Interface annotation changes (@FeignClient → @HttpExchange)
✅ Method annotation changes (@GetMapping → @GetExchange)
✅ Dependency replacement
✅ @EnableFeignClients removal
✅ Simple HttpServiceProxyFactory bean generation
✅ Basic Jackson configuration migration

### Requires Validation (15%)

⚠️ Custom ErrorDecoder with complex logic
⚠️ Custom RequestInterceptor with stateful behavior
⚠️ Retry/fallback logic (use Resilience4j instead)
⚠️ Custom Feign client implementations
⚠️ Dynamic URL construction

---

## Detection Phase Output

```yaml
feignAnalysis:
  clients:
    - interface: 'com.example.api.UserClient'
      name: 'user-service'
      url: '${api.user.url}'
      methods: 5
      customConfiguration: 'com.example.config.FeignConfiguration'
    - interface: 'com.example.api.ProductClient'
      name: 'product-service'
      url: '${api.product.url}'
      methods: 8
      customConfiguration: null

  configurations:
    - class: 'com.example.config.FeignConfiguration'
      components:
        decoders: 1
        encoders: 1
        errorDecoders: 1
        interceptors: 2
        complexityScore: 75

  complexity:
    total: 'MODERATE'
    clientCount: 2
    customConfigurationCount: 1
    totalMethods: 13
    estimatedEffort: '4-6 hours'
    automationPotential: '85%'

  migrationPlan:
    approach: 'INCREMENTAL'
    order:
      - 'UserClient (simpler, no custom config)'
      - 'ProductClient (uses custom config)'
```

---

## Transformation Examples

### Example 1: Simple GET Request

**Before:**

```java
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "user-service", url = "${api.user.url}")
public interface UserClient {
    @GetMapping("/users/{id}")
    UserDto getUser(@PathVariable("id") Long id);
}
```

**After:**

```java
import org.springframework.web.service.annotation.HttpExchange;
import org.springframework.web.service.annotation.GetExchange;
import org.springframework.web.bind.annotation.PathVariable;

@HttpExchange(url = "${api.user.url}")
public interface UserClient {
    @GetExchange("/users/{id}")
    UserDto getUser(@PathVariable("id") Long id);
}

// Plus required bean:
@Configuration
public class UserClientConfiguration {
    @Bean
    public UserClient userClient(RestClient.Builder builder) {
        RestClient client = builder.baseUrl(userApiUrl).build();
        return HttpServiceProxyFactory
            .builderFor(RestClientAdapter.create(client))
            .build()
            .createClient(UserClient.class);
    }
}
```

---

### Example 2: POST with Request Body

**Before:**

```java
@PostMapping("/users")
UserDto createUser(@RequestBody CreateUserRequest request);
```

**After:**

```java
import org.springframework.web.service.annotation.PostExchange;

@PostExchange("/users")
UserDto createUser(@RequestBody CreateUserRequest request);
```

---

### Example 3: Query Parameters

**Before:**

```java
@GetMapping("/users")
List<UserDto> searchUsers(@RequestParam("name") String name,
                          @RequestParam(value = "page", defaultValue = "0") int page);
```

**After:**

```java
@GetExchange("/users")
List<UserDto> searchUsers(@RequestParam("name") String name,
                          @RequestParam(value = "page", defaultValue = "0") int page);
```

---

## Configuration Bean Generation

### Template for HttpServiceProxyFactory

```java
package {{package}};

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.support.RestClientAdapter;
import org.springframework.web.service.invoker.HttpServiceProxyFactory;

@Configuration
public class {{ClientName}}Configuration {

    @Value("{{urlProperty}}")
    private String baseUrl;

    @Bean
    public {{ClientInterface}} {{clientBeanName}}(RestClient.Builder restClientBuilder) {
        RestClient restClient = restClientBuilder
            .baseUrl(baseUrl)
            .build();

        HttpServiceProxyFactory factory = HttpServiceProxyFactory
            .builderFor(RestClientAdapter.create(restClient))
            .build();

        return factory.createClient({{ClientInterface}}.class);
    }
}
```

**Variable Mapping:**

- `{{package}}` → Client package + ".config"
- `{{ClientName}}` → Interface name (e.g., "UserClient" → "UserClient")
- `{{ClientInterface}}` → Full interface name
- `{{clientBeanName}}` → Uncapitalized (e.g., "userClient")
- `{{urlProperty}}` → Extracted from @FeignClient url attribute

---

## Integration Points

### Used by Agents

- **migration-agent** (Phase 11: OpenFeign Migration - optional, user-approved)

### Uses Skills

- **openfeign-compatibility-detector** - Identify clients to migrate
- **build-file-updater** - Update dependencies

### Triggers

- Manual invocation via `/migrate-openfeign` command
- Optional phase in migration-agent when OpenFeign incompatibility detected

---

## Execution Workflow

### Step 1: Pre-Migration Analysis

```bash
# Use openfeign-compatibility-detector
# Generate list of clients and configurations
# Assess migration complexity
# Get user approval
```

### Step 2: Dependency Update

```bash
# Remove OpenFeign
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-restclient</artifactId>
</dependency>

# Commit dependency changes
git add pom.xml build.gradle
git commit -m "migration(openfeign-migrator): replace OpenFeign with HTTP Interface dependency"
```

### Step 3: Migrate Interfaces (Incremental)

```bash
# For each Feign client:
FOR_EACH client IN feignClients:
    # 1. Update interface file
    - Replace imports
    - Replace @FeignClient with @HttpExchange
    - Replace method annotations

    # 2. Create configuration class
    - Generate HttpServiceProxyFactory bean
    - Configure RestClient.Builder

    # 3. Test individual client
    - Compile
    - Run tests for this client

    # 4. Commit if successful
    git add src/
    git commit -m "migration(openfeign-migrator): migrate ${client} to HTTP Interface"
DONE
```

### Step 4: Migrate Shared Configurations

```bash
# Migrate shared Decoder/Encoder
# Create ClientHttpMessageConvertersCustomizer
# Migrate shared interceptors
# Commit
```

### Step 5: Cleanup

```bash
# Remove @EnableFeignClients
# Delete Feign configuration classes
# Commit cleanup
```

### Step 6: Validation

```bash
# Full compilation
mvn clean compile

# Full test suite
mvn test

# Integration tests
# Manual API testing if needed
```

---

## Output Format

```yaml
openfeignMigration:
  analyzed: true
  clientsMigrated: 3
  configurationsMigrated: 1

  migrations:
    - client: 'UserClient'
      interface: 'com.example.api.UserClient'
      methods: 5
      configurationGenerated: 'UserClientConfiguration.java'
      testsPassed: true

    - client: 'ProductClient'
      interface: 'com.example.api.ProductClient'
      methods: 8
      configurationGenerated: 'ProductClientConfiguration.java'
      testsPassed: true

  sharedConfigurations:
    - type: 'ClientHttpMessageConvertersCustomizer'
      migrated: true
      source: 'FeignConfiguration.customConverters()'

  cleanup:
    annotationsRemoved: ['@EnableFeignClients']
    dependenciesRemoved: ['spring-cloud-starter-openfeign']
    configurationsDeleted: ['FeignConfiguration.java']

  validation:
    compileSuccess: true
    testsRun: 45
    testsPassed: 45
    testsFailed: 0

  summary:
    totalFiles Modified: 7
    linesAdded: 120
    linesRemoved: 85
    automationRate: '90%'
    manualReviewRequired: false
    estimatedEffort: '4 hours'
    actualEffort: '45 minutes'
```

---

## Advanced Patterns

### Timeout Configuration

**Before:**

```java
@Bean
public Request.Options options() {
    return new Request.Options(10, TimeUnit.SECONDS, 60, TimeUnit.SECONDS);
}
```

**After:**

```java
@Bean
public RestClient.Builder restClientBuilder() {
    SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
    factory.setConnectTimeout(Duration.ofSeconds(10));
    factory.setReadTimeout(Duration.ofSeconds(60));

    return RestClient.builder().requestFactory(factory);
}
```

---

### Logging Configuration

**Before:**

```java
@Bean
Logger.Level feignLoggerLevel() {
    return Logger.Level.FULL;
}
```

**After:**

```java
@Bean
public ClientHttpRequestInterceptor loggingInterceptor() {
    return (request, body, execution) -> {
        log.info("HTTP Request: {} {}", request.getMethod(), request.getURI());
        ClientHttpResponse response = execution.execute(request, body);
        log.info("HTTP Response: {}", response.getStatusCode());
        return response;
    };
}
```

---

## Exit Criteria

The skill completes successfully when:

1. All @FeignClient interfaces migrated to @HttpExchange
2. All custom configurations converted
3. HttpServiceProxyFactory beans created for each client
4. Dependencies updated
5. @EnableFeignClients removed
6. Compilation successful
7. Tests passing
8. Documentation updated

---

## Error Handling

### Interface Migration Failures

- If annotation replacement fails: Log error, skip client, continue
- If method annotation unknown: Flag for manual review

### Configuration Migration Failures

- If Decoder/Encoder too complex: Flag for manual migration
- If ErrorDecoder has multiple exception types: Generate template, require validation

### Bean Creation Failures

- If URL property extraction fails: Use placeholder, flag for manual config
- If bean name conflicts: Use qualified name

### Validation Failures

- If tests fail: Rollback specific client, report error
- If compilation fails: Provide detailed error message with fix suggestions

---

## Rollback Strategy

### Git-Based Rollback

```bash
# Each client migrated in separate commit
# Rollback specific client:
git revert <commit-sha>

# Rollback entire migration:
git reset --hard HEAD~N  # Where N = number of migration commits
```

### Incremental Rollback

- Migration done incrementally (one client at a time)
- Failed client doesn't affect successful ones
- Can keep successful migrations, fix failed ones

---

## References

- **Spring Framework HTTP Interface:** <https://docs.spring.io/spring-framework/reference/integration/rest-clients.html#rest-http-interface>
- **Spring Boot RestClient:** <https://docs.spring.io/spring-boot/reference/io/rest-client.html>
- **Spring Cloud OpenFeign:** <https://docs.spring.io/spring-cloud-openfeign/docs/current/reference/html/>
- **Related Skills:** openfeign-compatibility-detector, spring-boot-4-breaking-changes-detector

---

## Version History

- **1.0.0** (2026-01-04): Initial comprehensive implementation for OpenFeign → HTTP Interface migration
