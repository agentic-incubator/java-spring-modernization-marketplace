---
name: spring-ai-mcp-client-package-migrator
description: >
  Migrate Spring AI MCP client autoconfigure imports from the old package
  (org.springframework.ai.mcp.client.autoconfigure.*) to the new package
  (org.springframework.ai.mcp.client.common.autoconfigure.*) introduced in Spring AI 1.1.2.
  Also migrates WebFluxSseClientTransport constructor from ObjectMapper to McpJsonMapper.
  Use when compilation fails with "cannot find symbol" errors on MCP client autoconfigure
  classes after upgrading Spring AI from 1.0.x / 1.1.0 to 1.1.2+.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Spring AI MCP Client Package Migration

Migrate MCP client autoconfigure classes from Spring AI 1.0.x / 1.1.0 to 1.1.2+.

## Problem

Between Spring AI 1.0.x–1.1.0 and 1.1.2, the MCP client autoconfigure classes were
moved from:

```text
org.springframework.ai.mcp.client.autoconfigure.*
```

to:

```text
org.springframework.ai.mcp.client.common.autoconfigure.*
```

Additionally, the `WebFluxSseClientTransport` constructor signature changed:

- **Before:** `new WebFluxSseClientTransport(WebClient.Builder, ObjectMapper)`
- **After:** `new WebFluxSseClientTransport(WebClient.Builder, McpJsonMapper)`

## Affected Classes

All four typically co-occur in MCP client configuration files:

| Class                       | Old Package                       | New Package                              |
| --------------------------- | --------------------------------- | ---------------------------------------- |
| `NamedClientMcpTransport`   | `o.s.ai.mcp.client.autoconfigure` | `o.s.ai.mcp.client.common.autoconfigure` |
| `McpAsyncClientConfigurer`  | `o.s.ai.mcp.client.autoconfigure` | `o.s.ai.mcp.client.common.autoconfigure` |
| `McpSyncClientConfigurer`   | `o.s.ai.mcp.client.autoconfigure` | `o.s.ai.mcp.client.common.autoconfigure` |
| `McpClientCommonProperties` | `o.s.ai.mcp.client.autoconfigure` | `o.s.ai.mcp.client.common.autoconfigure` |
| `McpSseClientProperties`    | `o.s.ai.mcp.client.autoconfigure` | `o.s.ai.mcp.client.common.autoconfigure` |

## Detection

```bash
# Check for old package imports (without .common.)
grep -r "org.springframework.ai.mcp.client.autoconfigure" src/main/java/
# If matches don't contain ".common.", this migration applies

# Check for WebFluxSseClientTransport with ObjectMapper
grep -r "WebFluxSseClientTransport" src/main/java/
grep -r "import com.fasterxml.jackson.databind.ObjectMapper" src/main/java/ | \
    xargs -I{} dirname {} | sort -u
# If found in same files as WebFluxSseClientTransport: constructor migration needed
```

**Applies when ANY of the following are true:**

1. Import contains `org.springframework.ai.mcp.client.autoconfigure` **without** `.common.`
2. Constructor call `new WebFluxSseClientTransport(builder, objectMapper)` where
   `objectMapper` is `com.fasterxml.jackson.databind.ObjectMapper`

## Migration Steps

### Step 1 — Update MCP autoconfigure imports

Add `.common.` after `mcp.client.` in all four class imports:

```java
// Before
import org.springframework.ai.mcp.client.autoconfigure.NamedClientMcpTransport;
import org.springframework.ai.mcp.client.autoconfigure.McpAsyncClientConfigurer;
import org.springframework.ai.mcp.client.autoconfigure.McpSyncClientConfigurer;
import org.springframework.ai.mcp.client.autoconfigure.McpClientCommonProperties;
import org.springframework.ai.mcp.client.autoconfigure.McpSseClientProperties;

// After
import org.springframework.ai.mcp.client.common.autoconfigure.NamedClientMcpTransport;
import org.springframework.ai.mcp.client.common.autoconfigure.McpAsyncClientConfigurer;
import org.springframework.ai.mcp.client.common.autoconfigure.McpSyncClientConfigurer;
import org.springframework.ai.mcp.client.common.autoconfigure.McpClientCommonProperties;
import org.springframework.ai.mcp.client.common.autoconfigure.McpSseClientProperties;
```

Sed one-liner for bulk replacement:

```bash
find src/main/java -name "*.java" -exec sed -i \
    's/org\.springframework\.ai\.mcp\.client\.autoconfigure\./org.springframework.ai.mcp.client.common.autoconfigure./g' {} +
```

### Step 2 — Migrate WebFluxSseClientTransport constructor

**Before:**

```java
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.ai.mcp.client.WebFluxSseClientTransport;
import org.springframework.beans.factory.ObjectProvider;

@Configuration
public class McpClientConfig {

    private final ObjectProvider<ObjectMapper> objectMapperProvider;

    public McpClientConfig(ObjectProvider<ObjectMapper> objectMapperProvider) {
        this.objectMapperProvider = objectMapperProvider;
    }

    @Bean
    public WebFluxSseClientTransport mcpTransport(WebClient.Builder webClientBuilder) {
        ObjectMapper objectMapper = objectMapperProvider.getObject();
        return new WebFluxSseClientTransport(webClientBuilder, objectMapper);
    }
}
```

**After:**

```java
import io.modelcontextprotocol.json.McpJsonMapper;
import org.springframework.ai.mcp.client.WebFluxSseClientTransport;

@Configuration
public class McpClientConfig {

    @Bean
    public WebFluxSseClientTransport mcpTransport(WebClient.Builder webClientBuilder) {
        return new WebFluxSseClientTransport(webClientBuilder, McpJsonMapper.getDefault());
    }
}
```

### Step 3 — Remove unused ObjectMapper injection

If `ObjectProvider<ObjectMapper>` was only used for the transport constructor, remove it:

- Remove the constructor parameter
- Remove the field declaration
- Remove the `import org.springframework.beans.factory.ObjectProvider`
- Remove the `import com.fasterxml.jackson.databind.ObjectMapper`

### Step 4 — Verify

```bash
# Confirm old imports are gone
grep -r "mcp.client.autoconfigure\." src/main/java/ | grep -v "\.common\."
# Should return nothing

# Confirm ObjectMapper injection for transport is gone
grep -r "ObjectMapper.*mcpTransport\|WebFluxSseClientTransport.*ObjectMapper" src/main/java/
# Should return nothing

# Build
./mvnw compile
```

## Full Before/After Example

### Before (Spring AI 1.1.0)

```java
package com.example.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.ai.mcp.client.WebFluxSseClientTransport;
import org.springframework.ai.mcp.client.autoconfigure.McpClientCommonProperties;
import org.springframework.ai.mcp.client.autoconfigure.McpSseClientProperties;
import org.springframework.ai.mcp.client.autoconfigure.NamedClientMcpTransport;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class McpClientConfig {

    private final McpClientCommonProperties commonProperties;
    private final McpSseClientProperties sseProperties;
    private final ObjectProvider<ObjectMapper> objectMapperProvider;

    public McpClientConfig(
            McpClientCommonProperties commonProperties,
            McpSseClientProperties sseProperties,
            ObjectProvider<ObjectMapper> objectMapperProvider) {
        this.commonProperties = commonProperties;
        this.sseProperties = sseProperties;
        this.objectMapperProvider = objectMapperProvider;
    }

    @Bean
    public NamedClientMcpTransport mcpTransport(WebClient.Builder webClientBuilder) {
        ObjectMapper objectMapper = objectMapperProvider.getObject();
        WebFluxSseClientTransport transport =
            new WebFluxSseClientTransport(webClientBuilder, objectMapper);
        return new NamedClientMcpTransport("default", transport);
    }
}
```

### After (Spring AI 1.1.2+)

```java
package com.example.config;

import io.modelcontextprotocol.json.McpJsonMapper;
import org.springframework.ai.mcp.client.WebFluxSseClientTransport;
import org.springframework.ai.mcp.client.common.autoconfigure.McpClientCommonProperties;
import org.springframework.ai.mcp.client.common.autoconfigure.McpSseClientProperties;
import org.springframework.ai.mcp.client.common.autoconfigure.NamedClientMcpTransport;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class McpClientConfig {

    private final McpClientCommonProperties commonProperties;
    private final McpSseClientProperties sseProperties;

    public McpClientConfig(
            McpClientCommonProperties commonProperties,
            McpSseClientProperties sseProperties) {
        this.commonProperties = commonProperties;
        this.sseProperties = sseProperties;
    }

    @Bean
    public NamedClientMcpTransport mcpTransport(WebClient.Builder webClientBuilder) {
        WebFluxSseClientTransport transport =
            new WebFluxSseClientTransport(webClientBuilder, McpJsonMapper.getDefault());
        return new NamedClientMcpTransport("default", transport);
    }
}
```

## Related Skills

- `spring-ai-migrator` — broader Spring AI 1.x → 2.x migration including TTS API,
  advisor constants, and autoconfigure provider selection
- `restclient-to-webclient-customizer-migrator` — WebClient timeout configuration
  for SSE/MCP transport; the WebClientCustomizer is the correct hook for connect
  and response timeouts affecting SSE keepalive
- `openfeign-compatibility-detector` — if the project also uses OpenFeign alongside
  Spring AI MCP, check for OpenFeign Spring Cloud 2025.0.x incompatibility with Boot 4
