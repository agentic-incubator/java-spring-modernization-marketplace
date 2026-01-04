# Spring Boot 4.x Breaking Changes Detector Skill

**Skill ID:** `spring-boot-4-breaking-changes-detector`
**Version:** 1.0.0
**Category:** Detection & Analysis
**Priority:** CRITICAL (blocks migrations)

---

## Purpose

Identify all Spring Boot 4.x breaking changes in a project to prevent compilation and runtime failures during migration. This skill maintains a
comprehensive catalog of API removals, deprecations, and incompatibilities introduced in Spring Boot 4.0.x.

---

## Problem Statement

Spring Boot 4.x introduces numerous breaking changes that are not detected until migration is attempted. Key Spring Boot 4.x breaking changes include:

1. **RestClientCustomizer Removal** (Spring Boot 4.0.1) - Breaks custom HTTP client configurations
2. **HttpMessageConverters Removal** - Blocks custom message converter configurations
3. **Undertow Incompatibility** - Servlet 6.1 incompatibility causes runtime failures
4. **Web Starter Rename** - spring-boot-starter-web → spring-boot-starter-webmvc
5. **Spring Retry Dependency** - No longer transitively included

**Impact:** Undetected breaking changes cause most migrations to require manual intervention and troubleshooting.

---

## Breaking Changes Catalog

### 1. RestClientCustomizer Removal (Spring Boot 4.0.1)

**Status:** REMOVED
**Since:** 4.0.1
**Severity:** HIGH

**Old API:**

```java
import org.springframework.boot.web.client.RestClientCustomizer;

@Bean
public RestClientCustomizer restClientCustomizer() {
    return restClientBuilder -> {
        restClientBuilder.requestFactory(factory);
    };
}
```

**New API:**

```java
import org.springframework.web.client.RestClient;

@Bean
public RestClient.Builder restClientBuilder() {
    SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
    return RestClient.builder().requestFactory(factory);
}
```

**Detection Pattern:**

```regex
import org\.springframework\.boot\.web\.client\.RestClientCustomizer
@Bean.*RestClientCustomizer
public.*RestClientCustomizer.*\(
```

**Migration Path:** Customizer-based → Builder-based configuration

---

### 2. HttpMessageConverters API Removal

**Status:** REMOVED/MOVED
**Since:** 4.0.0
**Severity:** CRITICAL

**Old API:**

```java
import org.springframework.boot.autoconfigure.http.HttpMessageConverters;

ObjectFactory<HttpMessageConverters> objectFactory =
    () -> new HttpMessageConverters(converter);
```

**New API:**

```java
import org.springframework.boot.autoconfigure.http.client.ClientHttpMessageConvertersCustomizer;

@Bean
public ClientHttpMessageConvertersCustomizer jacksonCustomizer() {
    return builder -> builder.withCustomConverter(converter);
}
```

**Detection Pattern:**

```regex
import org\.springframework\.boot\.autoconfigure\.http\.HttpMessageConverters
ObjectFactory<HttpMessageConverters>
new HttpMessageConverters\(
```

**Migration Path:** HttpMessageConverters → ClientHttpMessageConvertersCustomizer

---

### 3. Spring Retry Dependency (No Longer Transitive)

**Status:** DEPENDENCY_REMOVED
**Since:** 4.0.0
**Severity:** MEDIUM

**Issue:**
`org.springframework.retry.support.RetryTemplate` is no longer automatically included

**Required Fix:**

```xml
<dependency>
    <groupId>org.springframework.retry</groupId>
    <artifactId>spring-retry</artifactId>
</dependency>
```

**Detection Pattern:**

```regex
import org\.springframework\.retry\.support\.RetryTemplate
import org\.springframework\.retry\.annotation\.Retryable
import org\.springframework\.retry\.annotation\.Backoff
@Retryable
```

**Trigger Conditions:**

- Project uses Spring AI 2.0.0-M1+ (requires retry)
- Any code using @Retryable annotation
- Any code using RetryTemplate class

---

### 4. Undertow Starter Incompatibility (Servlet 6.1)

**Status:** INCOMPATIBLE
**Since:** 4.0.0
**Severity:** CRITICAL (runtime blocker)

**Issue:**
spring-boot-starter-undertow is incompatible with Servlet 6.1

**Detection Pattern:**

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-undertow</artifactId>
</dependency>
```

```gradle
implementation 'org.springframework.boot:spring-boot-starter-undertow'
```

**Required Action:**

```xml
<!-- REMOVE spring-boot-starter-undertow -->
<!-- Use default Tomcat or switch to Jetty -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-jetty</artifactId>
</dependency>
```

---

### 5. Web Starter Rename

**Status:** RENAMED
**Since:** 4.0.0
**Severity:** LOW (transitional compatibility)

**Old Name:**

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```

**New Name:**

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-webmvc</artifactId>
</dependency>
```

**Note:** spring-boot-starter-web still works in 4.0.x (transitional alias) but is recommended to migrate for clarity.

---

### 6. RestTemplate Deprecation (Soft)

**Status:** DEPRECATED (not removed)
**Since:** 4.0.0
**Severity:** LOW

**Deprecated API:**

```java
RestTemplate restTemplate = new RestTemplate();
```

**Recommended API:**

```java
RestClient restClient = RestClient.builder().build();
```

**Note:** RestTemplate still works but Spring recommends RestClient for new code.

---

### 7. Spring Security Configuration Changes

**Status:** API_CHANGED
**Since:** Spring Security 7.0 (included in Boot 4.x)
**Severity:** HIGH

**Detected by:** `security-config-migrator` skill (already exists)

Covered patterns:

- VaadinWebSecurity → VaadinSecurityConfigurer bean
- AntPathRequestMatcher → PathPatternRequestMatcher
- authorizeRequests() → authorizeHttpRequests()

---

### 8. Jackson 3.x Migration

**Status:** MAJOR_VERSION_CHANGE
**Since:** Spring Boot 4.0 uses Jackson 3.x
**Severity:** HIGH

**Detected by:** `jackson-migrator` skill (already exists)

Covered patterns:

- com.fasterxml.jackson → tools.jackson (groupId change)
- JsonProcessingException → JacksonException

---

## Detection Algorithm

```text
1. SCAN for RestClientCustomizer usage
   - Pattern: import org.springframework.boot.web.client.RestClientCustomizer
   - IF found AND Spring Boot 4.x:
     - REPORT: "RestClientCustomizer removed in Spring Boot 4.0.1"
     - Severity: HIGH
     - Remediation: Use RestClient.Builder bean

2. SCAN for HttpMessageConverters usage
   - Pattern: import org.springframework.boot.autoconfigure.http.HttpMessageConverters
   - IF found AND Spring Boot 4.x:
     - REPORT: "HttpMessageConverters removed/moved in Spring Boot 4.x"
     - Severity: CRITICAL
     - Remediation: Use ClientHttpMessageConvertersCustomizer

3. SCAN for Spring Retry usage without dependency
   - Pattern: import org.springframework.retry.*
   - IF found:
     - CHECK: Is spring-retry explicitly declared?
     - IF NOT declared AND Spring Boot 4.x:
       - REPORT: "Spring Retry no longer transitive"
       - Severity: MEDIUM
       - Remediation: Add spring-retry dependency

4. SCAN for Undertow starter
   - Pattern: spring-boot-starter-undertow in dependencies
   - IF found AND Spring Boot 4.x:
     - REPORT: "Undertow incompatible with Servlet 6.1"
     - Severity: CRITICAL
     - Remediation: Remove Undertow, use Tomcat or Jetty

5. SCAN for deprecated APIs
   - RestTemplate usage (informational warning)
   - Old Security configurations (delegate to security-config-migrator)
   - Old Jackson imports (delegate to jackson-migrator)

6. GENERATE comprehensive report with:
   - All detected breaking changes
   - Severity levels (CRITICAL, HIGH, MEDIUM, LOW)
   - Remediation guidance for each
   - Estimated migration effort
```

---

## Output Format

```yaml
breakingChanges:
  detected: true
  totalIssues: 5
  criticalIssues: 2
  highIssues: 1
  mediumIssues: 2
  lowIssues: 0

  issues:
    - id: 'BOOT4-001'
      category: 'API_REMOVAL'
      api: 'org.springframework.boot.web.client.RestClientCustomizer'
      status: 'REMOVED'
      since: '4.0.1'
      severity: 'HIGH'
      locations:
        - file: 'src/main/java/com/example/config/RestConfig.java'
          line: 15
          pattern: '@Bean public RestClientCustomizer restClientCustomizer()'
      impact: 'Compilation failure - Bean cannot be created'
      remediation:
        description: 'Migrate to RestClient.Builder bean pattern'
        example: |
          @Bean
          public RestClient.Builder restClientBuilder() {
              return RestClient.builder().requestFactory(factory);
          }
        automationPotential: '90%'
        estimatedEffort: '15 minutes per configuration'

    - id: 'BOOT4-002'
      category: 'API_REMOVAL'
      api: 'org.springframework.boot.autoconfigure.http.HttpMessageConverters'
      status: 'REMOVED'
      since: '4.0.0'
      severity: 'CRITICAL'
      locations:
        - file: 'src/main/java/com/example/config/FeignConfiguration.java'
          line: 23
          pattern: 'ObjectFactory<HttpMessageConverters> messageConverters'
      impact: 'Blocks custom Feign decoder/encoder configurations'
      remediation:
        description: 'Migrate to ClientHttpMessageConvertersCustomizer OR migrate to Spring HTTP Interface'
        options:
          - 'Use ClientHttpMessageConvertersCustomizer (if staying with Feign)'
          - 'Migrate to Spring HTTP Interface (RECOMMENDED)'
        automationPotential: '60%'
        estimatedEffort: '1-2 hours'

    - id: 'BOOT4-003'
      category: 'DEPENDENCY_INCOMPATIBILITY'
      api: 'spring-boot-starter-undertow'
      status: 'INCOMPATIBLE'
      since: '4.0.0'
      severity: 'CRITICAL'
      locations:
        - file: 'pom.xml'
          line: 45
          pattern: '<artifactId>spring-boot-starter-undertow</artifactId>'
      impact: 'Runtime failure - Servlet 6.1 incompatibility'
      remediation:
        description: 'Remove Undertow starter, use default Tomcat or switch to Jetty'
        example: |
          <!-- Remove this -->
          <!-- <dependency>
              <groupId>org.springframework.boot</groupId>
              <artifactId>spring-boot-starter-undertow</artifactId>
          </dependency> -->

          <!-- Optional: Use Jetty instead -->
          <dependency>
              <groupId>org.springframework.boot</groupId>
              <artifactId>spring-boot-starter-jetty</artifactId>
          </dependency>
        automationPotential: '100%'
        estimatedEffort: '5 minutes'

    - id: 'BOOT4-004'
      category: 'DEPENDENCY_MISSING'
      api: 'org.springframework.retry.support.RetryTemplate'
      status: 'DEPENDENCY_REMOVED'
      since: '4.0.0'
      severity: 'MEDIUM'
      locations:
        - file: 'src/main/java/com/example/service/UserService.java'
          line: 12
          pattern: 'import org.springframework.retry.support.RetryTemplate'
      impact: 'Runtime ClassNotFoundException when retry is invoked'
      remediation:
        description: 'Add explicit spring-retry dependency'
        example: |
          <dependency>
              <groupId>org.springframework.retry</groupId>
              <artifactId>spring-retry</artifactId>
          </dependency>
        automationPotential: '100%'
        estimatedEffort: '2 minutes'

    - id: 'BOOT4-005'
      category: 'STARTER_RENAME'
      api: 'spring-boot-starter-web'
      status: 'RENAMED'
      since: '4.0.0'
      severity: 'MEDIUM'
      locations:
        - file: 'pom.xml'
          line: 32
          pattern: '<artifactId>spring-boot-starter-web</artifactId>'
      impact: 'None (transitional alias still works)'
      remediation:
        description: 'Rename to spring-boot-starter-webmvc for clarity'
        example: |
          <dependency>
              <groupId>org.springframework.boot</groupId>
              <artifactId>spring-boot-starter-webmvc</artifactId>
          </dependency>
        automationPotential: '100%'
        estimatedEffort: '1 minute'

  summary:
    totalBreakingChanges: 5
    blockers: 2 # CRITICAL severity
    warnings: 3 # HIGH or MEDIUM severity
    estimatedTotalEffort: '2-4 hours'
    automationCoverage: '75%'
    manualReviewRequired:
      - 'HttpMessageConverters migration strategy (Feign vs HTTP Interface)'
      - 'RestClientCustomizer → Builder pattern validation'
```

---

## Execution Logic

### Phase 1: Code Scanning

**Tools Used:** Grep, Read

**Scans:**

1. RestClientCustomizer usage
2. HttpMessageConverters usage
3. Spring Retry imports
4. Undertow starter declarations
5. Web starter declarations
6. RestTemplate usage (informational)

**Grep Patterns:**

```bash
# RestClientCustomizer
grep -r "import org\.springframework\.boot\.web\.client\.RestClientCustomizer" --include="*.java"
grep -r "@Bean.*RestClientCustomizer\|public.*RestClientCustomizer" --include="*.java"

# HttpMessageConverters
grep -r "import org\.springframework\.boot\.autoconfigure\.http\.HttpMessageConverters" --include="*.java"
grep -r "ObjectFactory<HttpMessageConverters>" --include="*.java"

# Spring Retry
grep -r "import org\.springframework\.retry" --include="*.java"
grep -r "@Retryable\|RetryTemplate" --include="*.java"

# Undertow
grep -r "spring-boot-starter-undertow" --include="*.xml" --include="*.gradle"

# Web starter
grep -r "spring-boot-starter-web" --include="*.xml" --include="*.gradle"
```

### Phase 2: Dependency Analysis

**Tools Used:** Read (pom.xml / build.gradle)

**Checks:**

1. Undertow starter presence
2. Spring Retry explicit dependency
3. Web starter naming

### Phase 3: Version Context

**Tools Used:** version-detector skill

**Extracts:**

- Spring Boot version
- Spring Cloud version (if applicable)
- Java version

**Applies Rules:**

- Breaking changes only apply to Spring Boot 4.x+
- Severity adjusted based on version combinations

### Phase 4: Impact Assessment

**For Each Detection:**

1. Determine severity (CRITICAL, HIGH, MEDIUM, LOW)
2. Assess impact (compilation failure, runtime failure, warning)
3. Provide remediation guidance
4. Estimate automation potential
5. Estimate manual effort

### Phase 5: Report Generation

**Outputs:**

- Comprehensive YAML report
- Grouped by severity
- Includes remediation examples
- Estimates total migration effort

---

## Integration Points

### Used by Agents

- **discovery-agent** (Phase 8: Breaking Changes Analysis)
- **breaking-changes-analyzer** (Primary consumer)

### Uses Skills

- **version-detector** - Extract Spring Boot version
- **pattern-detector** - Generic pattern matching fallback

### Triggers

- Auto-triggered when migrating to Spring Boot 4.x
- Manual invocation via `/detect-breaking-changes` command

---

## Validation Rules

### CRITICAL Severity (Blockers)

- ❌ HttpMessageConverters usage with Spring Boot 4.x
- ❌ Undertow starter with Spring Boot 4.x

### HIGH Severity

- ⚠️ RestClientCustomizer usage with Spring Boot 4.0.1+
- ⚠️ Custom Feign decoder/encoder without migration plan

### MEDIUM Severity

- ⚠️ Spring Retry usage without explicit dependency
- ⚠️ Web starter using old name (transitional)

### LOW Severity (Informational)

- ℹ️ RestTemplate usage (deprecation warning)
- ℹ️ Outdated Security configurations (handled by other skills)

---

## Auto-Remediation Capabilities

The skill can automatically fix:

✅ **Undertow Removal** (100% automation)

- Remove spring-boot-starter-undertow dependency

✅ **Spring Retry Dependency** (100% automation)

- Add spring-retry dependency to pom.xml/build.gradle

✅ **Web Starter Rename** (100% automation)

- Rename spring-boot-starter-web → spring-boot-starter-webmvc

⚠️ **Partial Automation:**

- RestClientCustomizer → RestClient.Builder (90% - requires validation)
- HttpMessageConverters migration (60% - requires strategy decision)

---

## Exit Criteria

The skill completes successfully when:

1. All breaking change patterns scanned
2. All matches cataloged with locations
3. Severity levels assigned
4. Remediation guidance provided
5. Effort estimates calculated
6. Comprehensive report generated

---

## Error Handling

### File Access Errors

- If Java files cannot be read: Log warning, skip file, continue
- If build files cannot be read: Report partial results

### Version Detection Failures

- If Spring Boot version unknown: Assume 4.x and report all potential issues
- If dependency analysis fails: Mark as UNKNOWN, recommend manual review

### Pattern Matching Errors

- If grep fails: Fallback to Read tool with line-by-line scanning
- If regex fails: Use simpler literal string matching

---

## Examples

### Example 1: Multiple Breaking Changes Detected

**Project Context:**

- Spring Boot 4.0.1
- Custom RestClientCustomizer
- Custom Feign configuration with HttpMessageConverters
- Undertow starter

**Output:**

```yaml
breakingChanges:
  detected: true
  totalIssues: 3
  criticalIssues: 2
  blockers:
    - 'HttpMessageConverters removed'
    - 'Undertow incompatible'
  estimatedTotalEffort: '3-5 hours'
  recommendedActions:
    - 'IMMEDIATE: Remove Undertow starter'
    - 'IMMEDIATE: Decide Feign migration strategy'
    - 'HIGH: Migrate RestClientCustomizer to Builder'
```

---

### Example 2: Clean Project (No Breaking Changes)

**Project Context:**

- Spring Boot 4.0.1
- Uses default Spring Boot configurations
- No custom HTTP client setup
- No Feign usage

**Output:**

```yaml
breakingChanges:
  detected: false
  totalIssues: 0
  summary: 'No Spring Boot 4.x breaking changes detected. Project is clean.'
```

---

## References

- **Migration Learnings:** docs/planning/migration-learnings.md (Sections 1, 2, 5)
- **Spring Boot 4.0 Release Notes:** <https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Release-Notes>
- **Related Skills:** openfeign-compatibility-detector, jackson-migrator, security-config-migrator

---

## Version History

- **1.0.0** (2026-01-04): Initial implementation covering top 8 Spring Boot 4.x breaking changes
