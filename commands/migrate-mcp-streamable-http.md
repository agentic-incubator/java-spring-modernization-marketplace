---
description: Migrate Spring AI MCP clients from deprecated SSE transport to Streamable HTTP (M7+)
argument-hint: [project-path] [--preserve-sse-fallback] [--dry-run]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Migrate MCP SSE → Streamable HTTP

Standalone wrapper for `spring-ai-mcp-sse-to-streamable-http-migrator`. Use when you want
to perform only the SSE → Streamable HTTP transition without running the full
`/spring-m11n:migrate-spring-ai-20` workflow.

## Preconditions

- Spring AI version `>= 2.0.0-M7` (the new transports are not available before M7).
- MCP client package move (1.1.0 → 1.1.2+) already applied. If not, this command will
  delegate to `spring-ai-mcp-client-package-migrator` first.

## Usage

```bash
# Apply migration to current project
/spring-m11n:migrate-mcp-streamable-http

# Specific project, dry run
/spring-m11n:migrate-mcp-streamable-http /path/to/project --dry-run

# Keep SSE transport wired as @ConditionalOnProperty fallback (advanced)
/spring-m11n:migrate-mcp-streamable-http --preserve-sse-fallback
```

## What This Command Does

1. Rewrites code-level transport classes:
   - `WebFluxSseClientTransport` → `WebFluxStreamableHttpClientTransport`
   - `WebMvcSseClientTransport` → `WebMvcStreamableHttpClientTransport`
   - `HttpClientSseClientTransport` → `HttpClientStreamableHttpClientTransport`
   - `McpSseClientProperties` → `McpStreamableHttpClientProperties`
2. Translates property tree:
   `spring.ai.mcp.client.sse.*` → `spring.ai.mcp.client.streamable-http.*`
3. Adjusts connection URLs (drops the `/sse` suffix — Streamable HTTP probes endpoints
   automatically).
4. Inserts TODO comments where custom SSE event handlers need manual rewriting.
5. Optionally installs a `@ConditionalOnProperty` fallback if `--preserve-sse-fallback`.
6. Runs `build-runner` to verify compile + tests.

## Output

```text
MCP SSE → Streamable HTTP Migration

Detection:
  ✅ Spring AI version: 2.0.0-M7 (eligible)
  ✅ Package move applied (org.springframework.ai.mcp.client.common.autoconfigure.*)

Transformations:
  ✅ Transport classes rewritten: 1
       src/main/java/com/example/McpClientConfig.java
       WebFluxSseClientTransport → WebFluxStreamableHttpClientTransport

  ✅ Properties translated: 3
       spring.ai.mcp.client.sse.connections.default.url
         → spring.ai.mcp.client.streamable-http.connections.default.url
       spring.ai.mcp.client.sse.timeout
         → spring.ai.mcp.client.streamable-http.timeout

  ✅ URLs adjusted: 1
       https://mcp.example.com/sse → https://mcp.example.com

  ⚠️  TODOs inserted: 1 (custom SSE handler)

Validation:
  ✅ Compile: PASSED
  ✅ Tests:   PASSED

Migration complete!
```

## Related

- Skill: `spring-ai-mcp-sse-to-streamable-http-migrator`
- Skill: `spring-ai-mcp-client-package-migrator` v1.1.0+ (prerequisite)
- Command: `/spring-m11n:migrate-spring-ai-20` (full upgrade)
