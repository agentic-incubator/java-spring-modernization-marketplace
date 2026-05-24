---
name: spring-ai-mcp-sse-to-streamable-http-migrator
description: >
  Migrate Spring AI MCP clients from the SSE (Server-Sent Events) transport,
  which was deprecated in Spring AI 2.0.0-M7, to the new Streamable HTTP
  transport introduced in M7 as its replacement. Rewrites transport classes,
  constructor calls, and property namespaces. Use when the project depends on
  Spring AI 2.0.0-M7+ and still references WebFluxSseClientTransport,
  WebMvcSseClientTransport, HttpClientSseClientTransport, or the
  `spring.ai.mcp.client.sse.*` property tree.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Spring AI MCP SSE → Streamable HTTP Migrator

Replace deprecated SSE-based MCP transports with the Streamable HTTP equivalents introduced
in Spring AI 2.0.0-M7.

## Problem

Spring AI 2.0.0-M7 deprecated all SSE-based MCP transports in favor of Streamable HTTP.
SSE will continue to work in 2.0.0-M7 but is slated for removal in a future milestone or
GA. Projects on M7 should migrate proactively.

The deprecated transport classes:

- `WebFluxSseClientTransport` (reactive)
- `WebMvcSseClientTransport` (servlet)
- `HttpClientSseClientTransport` (raw JDK HttpClient)

New Streamable HTTP transport classes (M7+):

- `WebFluxStreamableHttpClientTransport`
- `WebMvcStreamableHttpClientTransport`
- `HttpClientStreamableHttpClientTransport`

## Detection

```bash
# Code-level SSE transport usage
grep -rn "WebFluxSseClientTransport\|WebMvcSseClientTransport\|HttpClientSseClientTransport" src/main/java/

# SSE property tree
grep -rn "spring\.ai\.mcp\.client\.sse\b" src/main/resources/
grep -rn "spring\.ai\.mcp\.client\.sse\b" src/main/java/
grep -rn "McpSseClientProperties" src/main/java/
```

**Applies when ALL of the following are true:**

1. Spring AI version is `>= 2.0.0-M7`
2. At least one of the deprecated SSE transport classes is referenced in code, OR
3. The `spring.ai.mcp.client.sse.*` property block exists in configuration

## Inputs

| Parameter                 | Type    | Default   | Description                                                              |
| ------------------------- | ------- | --------- | ------------------------------------------------------------------------ |
| `--mode`                  | string  | `migrate` | `detect` (read-only) or `migrate` (apply edits)                          |
| `--preserve-sse-fallback` | boolean | `false`   | Keep the SSE transport as a `@ConditionalOnProperty` fallback (advanced) |
| `--dry-run`               | boolean | `false`   | Print planned changes without writing                                    |

## Class Mapping

| Old transport (SSE, deprecated M7) | New transport (Streamable HTTP, M7+)      |
| ---------------------------------- | ----------------------------------------- |
| `WebFluxSseClientTransport`        | `WebFluxStreamableHttpClientTransport`    |
| `WebMvcSseClientTransport`         | `WebMvcStreamableHttpClientTransport`     |
| `HttpClientSseClientTransport`     | `HttpClientStreamableHttpClientTransport` |

All three live in the same package as before:
`org.springframework.ai.mcp.client.*` (or `…common.autoconfigure.*` post-1.1.2 package move).

Constructor signatures match — both take `(WebClient.Builder, McpJsonMapper)` for the
WebFlux variant, `(RestClient.Builder, McpJsonMapper)` for the WebMvc variant, and
`(HttpClient, McpJsonMapper)` for the JDK variant.

## Property Mapping

| Old property tree                                              | New property tree                                                          |
| -------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `spring.ai.mcp.client.sse.connections.<name>.url`              | `spring.ai.mcp.client.streamable-http.connections.<name>.url`              |
| `spring.ai.mcp.client.sse.connections.<name>.sse-endpoint`     | _removed — Streamable HTTP discovers endpoints automatically_              |
| `spring.ai.mcp.client.sse.connections.<name>.message-endpoint` | `spring.ai.mcp.client.streamable-http.connections.<name>.message-endpoint` |
| `spring.ai.mcp.client.sse.timeout`                             | `spring.ai.mcp.client.streamable-http.timeout`                             |
| `spring.ai.mcp.client.sse.request-timeout`                     | `spring.ai.mcp.client.streamable-http.request-timeout`                     |

The `McpSseClientProperties` configuration class is replaced by
`McpStreamableHttpClientProperties` (same package location).

## Migration Steps

### Step 1 — Class rename in source

```bash
find src/main/java -name "*.java" -exec sed -i \
    -e 's|\bWebFluxSseClientTransport\b|WebFluxStreamableHttpClientTransport|g' \
    -e 's|\bWebMvcSseClientTransport\b|WebMvcStreamableHttpClientTransport|g' \
    -e 's|\bHttpClientSseClientTransport\b|HttpClientStreamableHttpClientTransport|g' \
    -e 's|\bMcpSseClientProperties\b|McpStreamableHttpClientProperties|g' \
    {} +
```

### Step 2 — Property tree rename

For YAML:

```yaml
# BEFORE
spring:
  ai:
    mcp:
      client:
        sse:
          connections:
            default:
              url: https://mcp.example.com/sse
              sse-endpoint: /sse
          timeout: 30s

# AFTER
spring:
  ai:
    mcp:
      client:
        streamable-http:
          connections:
            default:
              url: https://mcp.example.com
              # sse-endpoint removed — Streamable HTTP discovers endpoints
          timeout: 30s
```

For `.properties`:

```diff
- spring.ai.mcp.client.sse.connections.default.url=https://mcp.example.com/sse
- spring.ai.mcp.client.sse.connections.default.sse-endpoint=/sse
- spring.ai.mcp.client.sse.timeout=30s
+ spring.ai.mcp.client.streamable-http.connections.default.url=https://mcp.example.com
+ spring.ai.mcp.client.streamable-http.timeout=30s
```

### Step 3 — Endpoint URL adjustment

SSE configurations typically included `/sse` in the URL path or as `sse-endpoint`.
Streamable HTTP probes the base URL via standard MCP capability negotiation, so the
endpoint suffix is no longer needed in the URL. Update connection URLs to the base path:

| Old URL                       | New URL                   |
| ----------------------------- | ------------------------- |
| `https://mcp.example.com/sse` | `https://mcp.example.com` |
| `http://localhost:8080/sse`   | `http://localhost:8080`   |

### Step 4 — Add TODO comments for custom SSE handlers

If the codebase has custom `EventSource` or `Flux<ServerSentEvent>` handlers wired to
the SSE transport, the migration cannot be performed mechanically. Insert a TODO:

```java
// TODO(spring-ai-mcp-sse-to-streamable-http-migrator):
// Streamable HTTP uses bidirectional HTTP streaming, not SSE events.
// Custom EventSource handler at line N must be rewritten as a
// reactive WebClient body decoder. See:
// https://docs.spring.io/spring-ai/reference/api/mcp/transport-streamable-http.html
```

### Step 5 — Optional fallback (`--preserve-sse-fallback`)

For projects that need to switch transports per environment, keep both beans under
`@ConditionalOnProperty`:

```java
@Bean
@ConditionalOnProperty(name = "spring.ai.mcp.client.transport", havingValue = "streamable-http", matchIfMissing = true)
WebFluxStreamableHttpClientTransport streamableHttpTransport(WebClient.Builder builder) {
    return new WebFluxStreamableHttpClientTransport(builder, McpJsonMapper.getDefault());
}

@Bean
@ConditionalOnProperty(name = "spring.ai.mcp.client.transport", havingValue = "sse")
@Deprecated  // remove when SSE transport is removed in a future Spring AI release
WebFluxSseClientTransport sseTransport(WebClient.Builder builder) {
    return new WebFluxSseClientTransport(builder, McpJsonMapper.getDefault());
}
```

### Step 6 — Validate

```bash
# Compile + tests
./mvnw clean verify

# Confirm no SSE references remain (unless --preserve-sse-fallback)
grep -rn "Sse" src/main/java/ src/main/resources/
```

## Output Format

```yaml
mcpSseToStreamableHttpMigration:
  detected: true
  transportsRewritten:
    - type: WebFluxSseClientTransport
      file: src/main/java/com/example/McpClientConfig.java
      newType: WebFluxStreamableHttpClientTransport
  propertiesTranslated:
    - from: spring.ai.mcp.client.sse.connections.default.url
      to: spring.ai.mcp.client.streamable-http.connections.default.url
      file: src/main/resources/application.yml
  urlsAdjusted:
    - from: https://mcp.example.com/sse
      to: https://mcp.example.com
  todosCreated: 1 # custom SSE handlers requiring manual rewrite
  fallbackInstalled: false # only true when --preserve-sse-fallback
  summary:
    transports: 1
    properties: 3
    urls: 1
    todos: 1
```

## Composes With

| Skill                                         | When                                                          |
| --------------------------------------------- | ------------------------------------------------------------- |
| `spring-ai-mcp-client-package-migrator`       | Run **before** — package move is a prerequisite               |
| `spring-ai-migrator`                          | Run **before** — version validation, BOM, etc.                |
| `restclient-to-webclient-customizer-migrator` | Run **after** to wire WebClient timeouts to the new transport |
| `application-property-migrator`               | Run **after** for kebab-case normalization                    |
| `build-runner`                                | Final validation                                              |

## Transformation Protocol

Follows the standard migration protocol — see `migration-protocol` skill.

**Dependencies:** `migration-state` >= 1.0.0, `build-runner` >= 1.0.0,
`spring-ai-mcp-client-package-migrator` >= 1.1.0

### Skill State Entry

```yaml
appliedTransformations:
  - skill: spring-ai-mcp-sse-to-streamable-http-migrator
    version: 1.0.0
    transformations:
      - sse-to-streamable-http
    transportsRewritten: 1
    propertiesTranslated: 3
    todosCreated: 1
    fallbackInstalled: false
    completedAt: 2026-05-23T12:00:00Z
    commitSha: abc123
```
