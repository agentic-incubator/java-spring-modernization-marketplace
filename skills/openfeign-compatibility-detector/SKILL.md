# OpenFeign Compatibility Detector Skill

**Skill ID:** `openfeign-compatibility-detector`
**Version:** 1.0.0
**Category:** Detection & Analysis
**Priority:** CRITICAL (blocks migrations)

---

## Purpose

Identify Spring Cloud OpenFeign usage and detect compatibility issues with Spring Boot 4.x. This skill addresses the #1 blocker found in
migration-learnings.md where 50% of projects failed due to OpenFeign incompatibility with Spring Boot 4.x.

---

## Problem Statement

Spring Cloud OpenFeign 2025.0.0 has API breaking changes with Spring Boot 4.x, specifically:

1. **HttpMessageConverters Removal**: Spring Boot 4.x removed `org.springframework.boot.autoconfigure.http.HttpMessageConverters`
2. **Custom Decoder/Encoder Incompatibility**: Custom `SpringDecoder`/`SpringEncoder` configurations expect `HttpMessageConverters` which no longer exists
3. **Version Compatibility Gap**: No clear guidance on which Spring Cloud versions work with Spring Boot 4.x

**Impact:** Blocks projects using custom Feign configurations with Spring Boot 4.x (critical production blocker).

---

## Detection Patterns

### 1. FeignClient Interface Detection

**Pattern:**

```java
import org.springframework.cloud.openfeign.FeignClient;

@FeignClient(name = "user-service", url = "${api.user.url}")
public interface UserClient {
    // Methods using @GetMapping, @PostMapping, etc.
}
```

**Detection Logic:**

- Scan for `@FeignClient` annotation usage
- Extract client names and URLs
- Count total Feign clients in project

**Grep Pattern:**

```bash
grep -r "@FeignClient" --include="*.java"
```

---

### 2. EnableFeignClients Detection

**Pattern:**

```java
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients(basePackages = "com.example.api.clients")
public class Application {
    // ...
}
```

**Detection Logic:**

- Scan for `@EnableFeignClients` annotation
- Extract base packages configuration
- Detect component scanning configuration

**Grep Pattern:**

```bash
grep -r "@EnableFeignClients" --include="*.java"
```

---

### 3. Custom Decoder/Encoder Detection (CRITICAL)

**Pattern:**

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
        return new SpringDecoder(messageConverters); // BLOCKER: HttpMessageConverters removed in Boot 4.x
    }

    @Bean
    public Encoder feignEncoder(ObjectFactory<HttpMessageConverters> messageConverters) {
        return new SpringEncoder(messageConverters); // BLOCKER: HttpMessageConverters removed in Boot 4.x
    }
}
```

**Detection Logic:**

- Scan for `SpringDecoder` or `SpringEncoder` usage
- Scan for `HttpMessageConverters` import or usage
- Scan for `ObjectFactory<HttpMessageConverters>` type references
- Flag as CRITICAL blocker if found

**Grep Patterns:**

```bash
grep -r "import org.springframework.boot.autoconfigure.http.HttpMessageConverters" --include="*.java"
grep -r "ObjectFactory<HttpMessageConverters>" --include="*.java"
grep -r "SpringDecoder\|SpringEncoder" --include="*.java"
grep -r "new SpringDecoder\|new SpringEncoder" --include="*.java"
```

---

### 4. Feign Interceptor Detection

**Pattern:**

```java
import feign.RequestInterceptor;

@Bean
public RequestInterceptor authInterceptor() {
    return requestTemplate -> {
        requestTemplate.header("Authorization", "Bearer " + token);
    };
}
```

**Detection Logic:**

- Scan for `RequestInterceptor` bean definitions
- Count custom interceptors
- Assess migration complexity

**Grep Pattern:**

```bash
grep -r "RequestInterceptor" --include="*.java"
grep -r "@Bean.*RequestInterceptor\|public.*RequestInterceptor" --include="*.java"
```

---

### 5. Error Decoder Detection

**Pattern:**

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

**Detection Logic:**

- Scan for `ErrorDecoder` bean definitions
- Assess custom error handling complexity

**Grep Pattern:**

```bash
grep -r "ErrorDecoder" --include="*.java"
grep -r "@Bean.*ErrorDecoder\|public.*ErrorDecoder" --include="*.java"
```

---

### 6. Feign Configuration Classes

**Pattern:**

```java
@Configuration
public class CustomFeignConfiguration {
    // Custom beans: Decoder, Encoder, ErrorDecoder, RequestInterceptor, Retryer, etc.
}

@FeignClient(name = "service", configuration = CustomFeignConfiguration.class)
public interface ServiceClient { }
```

**Detection Logic:**

- Scan for `@FeignClient(configuration = ...)`
- Identify referenced configuration classes
- Assess configuration complexity

**Grep Pattern:**

```bash
grep -r "@FeignClient.*configuration\s*=" --include="*.java"
```

---

### 7. Spring Cloud Version Detection

**Maven:**

```xml
<properties>
    <spring-cloud.version>2025.0.0</spring-cloud.version>
</properties>

<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-dependencies</artifactId>
</dependency>
```

**Gradle:**

```gradle
ext {
    set('springCloudVersion', "2025.0.0")
}

dependencyManagement {
    imports {
        mavenBom "org.springframework.cloud:spring-cloud-dependencies:${springCloudVersion}"
    }
}
```

**Detection Logic:**

- Parse Spring Cloud version from build files
- Cross-reference with Spring Boot version
- Determine compatibility status

---

## Version Compatibility Matrix

Based on Spring Boot and Spring Cloud compatibility:

| Spring Boot | Spring Cloud | OpenFeign Status | Compatibility  |
| ----------- | ------------ | ---------------- | -------------- |
| 3.3.x       | 2024.0.x     | Compatible       | ✅ GOOD        |
| 3.5.x       | 2025.0.x     | Partial          | ⚠️ WARNING     |
| **4.0.x**   | **2025.0.x** | **Incompatible** | ❌ **BLOCKER** |
| 4.0.x       | 2025.1.0+    | Compatible       | ✅ GOOD        |

**Critical Finding:** Spring Cloud 2025.0.x + Spring Boot 4.0.x has incompatibility with custom Feign configurations using `HttpMessageConverters`.
Spring Cloud 2025.1.0+ provides full Spring Boot 4.0 compatibility.

---

## Detection Algorithm

```text
1. SCAN for @FeignClient annotations
   - IF found: feignClientCount++
   - EXTRACT: client names, URLs, configuration classes

2. SCAN for @EnableFeignClients
   - IF found: feignEnabled = true
   - EXTRACT: base packages

3. SCAN for HttpMessageConverters usage (CRITICAL CHECK)
   - IF found with SpringDecoder/SpringEncoder:
     - blockerDetected = true
     - severity = CRITICAL
     - reason = "HttpMessageConverters removed in Spring Boot 4.x"

4. SCAN for custom configurations
   - Decoder/Encoder beans
   - ErrorDecoder beans
   - RequestInterceptor beans
   - Retryer beans

5. EXTRACT Spring Cloud version from build file

6. DETERMINE compatibility status:
   - IF Spring Boot 4.x AND Spring Cloud 2025.0.x:
     - compatibility = INCOMPATIBLE
   - IF blockerDetected:
     - compatibility = CRITICAL_BLOCKER

7. GENERATE report with:
   - Feign client count
   - Configuration complexity
   - Compatibility status
   - Blockers list
   - Recommended actions
```

---

## Output Format

The skill generates a YAML report with the following structure:

```yaml
feignDetection:
  detected: true
  feignClientCount: 3
  enableFeignClients: true
  basePackages:
    - 'com.example.api.clients'

  clients:
    - name: 'user-service'
      interface: 'com.example.api.UserClient'
      url: '${api.user.url}'
      configurationClass: 'com.example.config.FeignConfiguration'
    - name: 'product-service'
      interface: 'com.example.api.ProductClient'
      url: '${api.product.url}'
      configurationClass: null
    - name: 'order-service'
      interface: 'com.example.api.OrderClient'
      url: '${api.order.url}'
      configurationClass: 'com.example.config.FeignConfiguration'

  customConfigurations:
    - className: 'com.example.config.FeignConfiguration'
      location: 'src/main/java/com/example/config/FeignConfiguration.java'
      components:
        - type: 'Decoder'
          usesHttpMessageConverters: true # BLOCKER
        - type: 'Encoder'
          usesHttpMessageConverters: true # BLOCKER
        - type: 'ErrorDecoder'
          usesHttpMessageConverters: false
        - type: 'RequestInterceptor'
          count: 2

  versionInfo:
    springBoot: '4.0.1'
    springCloud: '2025.0.0' # Incompatible with Boot 4.x
    openFeign: '4.2.0' # Derived from Spring Cloud BOM

  compatibility:
    status: 'INCOMPATIBLE'
    severity: 'CRITICAL'
    blockers:
      - issue: 'HttpMessageConverters API removed'
        location: 'src/main/java/com/example/config/FeignConfiguration.java:15'
        pattern: 'ObjectFactory<HttpMessageConverters>'
        impact: 'SpringDecoder/SpringEncoder cannot be instantiated'
        remediation: 'Migrate to ClientHttpMessageConvertersCustomizer or migrate to Spring HTTP Interface'
      - issue: 'Spring Cloud 2025.0.x + Spring Boot 4.x incompatibility'
        impact: 'Custom Feign configurations may fail at runtime'
        remediation: 'Upgrade to Spring Cloud 2025.1.0+ or migrate to Spring HTTP Interface'

  migrationOptions:
    - option: 'UPGRADE_SPRING_CLOUD'
      description: 'Upgrade to Spring Cloud 2025.1.0+ for Spring Boot 4.x compatibility'
      risk: 'LOW - officially supported version'
      effort: 'LOW'

    - option: 'REMOVE_CUSTOM_CONFIG'
      description: 'Remove custom Decoder/Encoder and use default Feign configuration'
      risk: 'Loss of custom Jackson configuration'
      effort: 'MEDIUM'
      viability: 'Only if custom config is not critical'

    - option: 'MIGRATE_TO_HTTP_INTERFACE'
      description: 'Migrate from Spring Cloud OpenFeign to Spring HTTP Interface'
      risk: 'Significant code changes, requires testing'
      effort: 'HIGH'
      viability: 'RECOMMENDED - long-term Spring Boot 4.x solution'
      automationPotential: '85%'

  recommendedAction: 'MIGRATE_TO_HTTP_INTERFACE'
  estimatedEffort: '4-6 hours for 3 clients + custom configurations'
```

---

## Execution Logic

### Phase 1: Detection

**Input:** Project root directory

**Steps:**

1. Use `Grep` tool to scan for Feign annotations:

   ```text
   pattern: "@FeignClient"
   output_mode: "files_with_matches"
   ```

2. Use `Read` tool to parse detected files and extract:
   - Client interface names
   - URLs and service names
   - Configuration class references

3. Scan for custom configuration classes:

   ```text
   pattern: "import feign\\.codec\\.Decoder|import feign\\.codec\\.Encoder"
   output_mode: "files_with_matches"
   ```

4. Read configuration files and detect `HttpMessageConverters` usage

5. Use `version-detector` skill to extract:
   - Spring Boot version
   - Spring Cloud version

### Phase 2: Compatibility Analysis

**Steps:**

1. Cross-reference versions with compatibility matrix
2. Determine compatibility status
3. Identify blockers (HttpMessageConverters usage)
4. Calculate severity level

### Phase 3: Migration Assessment

**Steps:**

1. Count total Feign clients
2. Assess configuration complexity
3. Estimate migration effort
4. Recommend migration strategy

### Phase 4: Report Generation

**Steps:**

1. Generate comprehensive YAML report
2. Include all detected patterns
3. Provide remediation guidance
4. Suggest migration options with effort estimates

---

## Integration Points

### Used by Agents

- **discovery-agent** (Phase 8: OpenFeign Analysis)
- **breaking-changes-analyzer** (Spring Boot 4.x blocker detection)

### Uses Skills

- **version-detector** - Extract Spring Boot and Spring Cloud versions
- **pattern-detector** - Detect Feign-related patterns

### Triggers

- Auto-triggered during discovery phase when migrating to Spring Boot 4.x
- Manual invocation via `/detect-breaking-changes` command

---

## Validation Rules

### CRITICAL Blockers

- ❌ `HttpMessageConverters` usage with Spring Boot 4.x
- ❌ `ObjectFactory<HttpMessageConverters>` type references
- ❌ Spring Cloud 2025.0.x with Spring Boot 4.x (custom configs)

### HIGH Warnings

- ⚠️ Custom Decoder/Encoder without HttpMessageConverters
- ⚠️ Multiple custom configuration classes
- ⚠️ 5+ Feign clients (higher migration effort)

### MEDIUM Warnings

- ⚠️ Custom ErrorDecoder (requires migration validation)
- ⚠️ Custom RequestInterceptor (requires migration to ClientHttpRequestInterceptor)

---

## Exit Criteria

The skill completes successfully when:

1. All Java files scanned for Feign patterns
2. All custom configuration classes analyzed
3. Version compatibility determined
4. Blockers identified and documented
5. Migration options assessed and prioritized
6. Comprehensive report generated

---

## Error Handling

### File Access Errors

- If Java files cannot be read: Log warning, skip file, continue scan
- If build file cannot be read: Use fallback version detection

### Version Detection Failures

- If Spring Cloud version not found: Mark compatibility as UNKNOWN
- If Spring Boot version not found: Cannot determine compatibility

### Pattern Matching Errors

- If grep fails: Fallback to file-by-file scanning
- If regex fails: Log error, use simpler patterns

---

## Examples

### Example 1: Critical Blocker Detected

**Input:** Project with 3 Feign clients using custom SpringDecoder

**Detection:**

```bash
# Found in src/main/java/com/example/config/FeignConfiguration.java
import org.springframework.boot.autoconfigure.http.HttpMessageConverters;
import org.springframework.cloud.openfeign.support.SpringDecoder;

@Bean
public Decoder feignDecoder(ObjectFactory<HttpMessageConverters> messageConverters) {
    return new SpringDecoder(messageConverters);
}
```

**Output:**

```yaml
compatibility:
  status: 'INCOMPATIBLE'
  severity: 'CRITICAL'
  blockers:
    - issue: 'HttpMessageConverters API removed'
      location: 'FeignConfiguration.java:15'
  recommendedAction: 'MIGRATE_TO_HTTP_INTERFACE'
```

---

### Example 2: Simple Feign Usage (No Blockers)

**Input:** Project with 2 Feign clients, no custom configuration

**Detection:**

```java
@FeignClient(name = "user-service", url = "${api.url}")
public interface UserClient {
    @GetMapping("/users/{id}")
    UserDto getUser(@PathVariable Long id);
}
```

**Output:**

```yaml
compatibility:
  status: 'COMPATIBLE_WITH_MIGRATION'
  severity: 'LOW'
  blockers: []
  migrationOptions:
    - option: 'MIGRATE_TO_HTTP_INTERFACE'
      effort: 'LOW'
      automationPotential: '95%'
```

---

## References

- **Spring Cloud Compatibility:** <https://spring.io/projects/spring-cloud#overview>
- **Spring Boot 4.0 Release Notes:** <https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Release-Notes>
- **Spring Framework HTTP Interface:** <https://docs.spring.io/spring-framework/reference/integration/rest-clients.html#rest-http-interface>
- **Related Skills:** openfeign-to-httpinterface-migrator, spring-boot-4-breaking-changes-detector

---

## Version History

- **1.0.0** (2026-01-04): Initial implementation addressing critical OpenFeign compatibility gap
