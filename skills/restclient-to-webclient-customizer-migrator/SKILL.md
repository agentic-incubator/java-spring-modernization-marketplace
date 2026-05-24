---
name: restclient-to-webclient-customizer-migrator
description: >
  Migrate RestClientCustomizer to WebClientCustomizer on pure WebFlux / reactive stacks
  (Spring Boot 4). In Spring Boot 4, RestClientCustomizer moved to a new module that is
  NOT transitively provided by spring-boot-starter-webflux. On reactive-only stacks this
  class is also the wrong abstraction — WebClientCustomizer is the correct hook for WebClient
  configuration including SSE/MCP transport timeouts. Use when compilation fails with
  RestClientCustomizer import errors on a WebFlux module, or when configuring WebClient
  connect/response timeouts for Spring AI MCP SSE transport.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# RestClientCustomizer → WebClientCustomizer Migration

Migrate from `RestClientCustomizer` to `WebClientCustomizer` on pure WebFlux stacks
after upgrading to Spring Boot 4.

## Problem

In Spring Boot 4, `RestClientCustomizer` moved from:

- `org.springframework.boot.web.client.RestClientCustomizer`

to a new, separately-distributed module:

- `org.springframework.boot.restclient.RestClientCustomizer` (in `spring-boot-starter-restclient`)

This module is **NOT transitively provided** by `spring-boot-starter-webflux`. On a
pure WebFlux / reactive stack, `RestClientCustomizer` is also the **wrong abstraction** —
it configures the imperative `RestClient`, not `WebClient`.

**Why this matters for SSE / MCP:** Spring AI's MCP WebFlux client uses `WebClient` for
SSE transport. `WebClientCustomizer` is the correct hook to apply connect and response
timeouts that affect SSE keepalive behavior.

## Detection

```bash
# Check for old or new RestClientCustomizer import in a WebFlux module
grep -r "RestClientCustomizer" src/main/java/

# Confirm the module is WebFlux-only (no spring-boot-starter-web)
grep 'spring-boot-starter-webflux\|spring-boot-starter-web' pom.xml

# If webflux is present but NOT spring-boot-starter-web: this migration applies
```

**Applies when ALL of the following are true:**

1. Import contains `org.springframework.boot.web.client.RestClientCustomizer` OR
   `org.springframework.boot.restclient.RestClientCustomizer`
2. Module depends on `spring-boot-starter-webflux`
3. Module does NOT depend on `spring-boot-starter-web` (reactive-only)

## Migration Steps

### Step 1 — Add spring-boot-starter-webclient dependency

```xml
<!-- Add to pom.xml — NOT transitive from spring-boot-starter-webflux in Spring Boot 4 -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-webclient</artifactId>
</dependency>
```

### Step 2 — Replace the bean method

**Before:**

```java
import org.springframework.boot.web.client.RestClientCustomizer;  // old location
// OR: import org.springframework.boot.restclient.RestClientCustomizer;
import org.springframework.http.client.SimpleClientHttpRequestFactory;

@Bean
public RestClientCustomizer restClientCustomizer() {
    return restClientBuilder -> {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout((int) Duration.ofMinutes(2).toMillis());
        factory.setReadTimeout((int) Duration.ofMinutes(5).toMillis());
        restClientBuilder.requestFactory(factory);
        restClientBuilder.defaultHeader("X-App-Name", "my-service");
    };
}
```

**After:**

```java
import org.springframework.boot.webclient.WebClientCustomizer;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import io.netty.channel.ChannelOption;
import reactor.netty.http.client.HttpClient;

@Bean
public WebClientCustomizer webClientCustomizer() {
    return webClientBuilder -> {
        HttpClient httpClient = HttpClient.create()
            .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, (int) Duration.ofMinutes(2).toMillis())
            .responseTimeout(Duration.ofMinutes(5));
        webClientBuilder
            .defaultHeader("X-App-Name", "my-service")
            .clientConnector(new ReactorClientHttpConnector(httpClient));
    };
}
```

### Step 3 — Update imports

Remove old imports and add the required reactive imports:

```java
// Remove
import org.springframework.boot.web.client.RestClientCustomizer;
import org.springframework.http.client.SimpleClientHttpRequestFactory;

// Add
import org.springframework.boot.webclient.WebClientCustomizer;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import io.netty.channel.ChannelOption;
import reactor.netty.http.client.HttpClient;
import java.time.Duration;
```

### Step 4 — Verify no RestClientCustomizer references remain

```bash
grep -r "RestClientCustomizer" src/main/java/
# Should return nothing
```

## Timeout Mapping

| Imperative (RestClient)                        | Reactive (WebClient)                                                           |
| ---------------------------------------------- | ------------------------------------------------------------------------------ |
| `factory.setConnectTimeout(millis)`            | `HttpClient.create().option(ChannelOption.CONNECT_TIMEOUT_MILLIS, millis)`     |
| `factory.setReadTimeout(millis)`               | `HttpClient.create().responseTimeout(Duration.ofMillis(millis))`               |
| `restClientBuilder.requestFactory(factory)`    | `webClientBuilder.clientConnector(new ReactorClientHttpConnector(httpClient))` |
| `restClientBuilder.defaultHeader(name, value)` | `webClientBuilder.defaultHeader(name, value)`                                  |

## Verification

```bash
# Compile check
./mvnw compile

# Confirm spring-boot-starter-webclient is resolved
./mvnw dependency:tree | grep webclient
```

## Spring Boot 4.1 — `ReactorClientHttpRequestFactoryBuilder` Behavior Change

**Version:** 1.1.0+

Spring Boot 4.1.0-RC1 changed the default behavior of `ReactorClientHttpRequestFactoryBuilder`:
it **no longer** applies `proxyWithSystemProperties()` automatically. Projects relying on
HTTP/HTTPS proxy auto-detection via system properties (`-Dhttp.proxyHost`,
`-Dhttps.proxyHost`) must now opt in explicitly using `.withHttpClientDefaults()`.

### Detection

```bash
# Find ReactorClientHttpRequestFactoryBuilder usages WITHOUT .withHttpClientDefaults()
grep -rn "ReactorClientHttpRequestFactoryBuilder" src/main/java/ | \
    grep -v "withHttpClientDefaults"
```

**Applies when:**

1. Code references `ReactorClientHttpRequestFactoryBuilder` directly (constructor or
   `.builder()`), AND
2. The chain does not include `.withHttpClientDefaults()`, AND
3. Target Spring Boot version is `4.1.0-RC1` or later

### Migration

**Before (Boot 4.0.x — implicit proxy support):**

```java
import org.springframework.boot.http.client.ReactorClientHttpRequestFactoryBuilder;

ReactorClientHttpRequestFactoryBuilder builder =
    ReactorClientHttpRequestFactoryBuilder.builder();
ClientHttpRequestFactory factory = builder.build();
```

**After (Boot 4.1.0-RC1+ — explicit defaults):**

```java
import org.springframework.boot.http.client.ReactorClientHttpRequestFactoryBuilder;

ReactorClientHttpRequestFactoryBuilder builder =
    ReactorClientHttpRequestFactoryBuilder.builder()
        .withHttpClientDefaults();   // re-enables proxyWithSystemProperties()
ClientHttpRequestFactory factory = builder.build();
```

### Behavior Reference

| Before Boot 4.1 (implicit)                          | After Boot 4.1 (explicit)                         |
| --------------------------------------------------- | ------------------------------------------------- |
| `proxyWithSystemProperties()` applied automatically | Must call `.withHttpClientDefaults()` to opt in   |
| `HttpClient.create()` default settings              | Bare `HttpClient.create()` — no auto-defaults     |
| System proxy properties honored                     | System proxy properties **ignored** unless opt-in |

### State Entry

```yaml
appliedTransformations:
  - skill: restclient-to-webclient-customizer-migrator
    version: 1.1.0
    transformations:
      - restclient-to-webclient
      - reactor-http-builder-defaults
    completedAt: 2026-05-23T12:00:00Z
    commitSha: abc123
```

## Related Skills

- `spring-ai-mcp-client-package-migrator` — MCP client package moves in Spring AI 1.1.2;
  also uses WebClient for SSE transport
- `spring-ai-mcp-sse-to-streamable-http-migrator` — SSE → Streamable HTTP transition
  (M7+); coordinates WebClient timeout setup with this skill
- `java-maintenance-workflow` — full dependency maintenance workflow; Spring Boot 4
  module disaggregation is documented in its Known Pitfalls section
- `spring-boot-4-breaking-changes-detector` — detects module splits and missing transitive dependencies
