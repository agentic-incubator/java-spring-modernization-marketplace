---
name: pattern-detector
description: Find code patterns that need migration including Jackson imports, Spring Security configurations, Vaadin themes, and Spring AI TTS usage. Use when identifying specific code that requires transformation.
allowed-tools: Read, Glob, Grep
---

# Pattern Detector

Find code patterns that require migration transformations.

## Instructions

Search the codebase for patterns that need migration attention. Group findings by category and provide specific transformation actions.

## Detection Patterns

### Jackson 2 → 3 Patterns

| Pattern                                     | Action                               |
| ------------------------------------------- | ------------------------------------ |
| `import com.fasterxml.jackson.core.*`       | Update to `tools.jackson.core.*`     |
| `import com.fasterxml.jackson.databind.*`   | Update to `tools.jackson.databind.*` |
| `JsonProcessingException`                   | Rename to `JacksonException`         |
| `import com.fasterxml.jackson.annotation.*` | **KEEP AS-IS** (backward compatible) |

### Spring Security 6 → 7 Patterns

| Pattern                        | Action                                       |
| ------------------------------ | -------------------------------------------- |
| `extends VaadinWebSecurity`    | Replace with `VaadinSecurityConfigurer` bean |
| `AntPathRequestMatcher`        | Replace with `PathPatternRequestMatcher`     |
| `configure(HttpSecurity http)` | Convert to `SecurityFilterChain @Bean`       |

### Vaadin 24 → 25 Patterns

| Pattern                                   | Action                                         |
| ----------------------------------------- | ---------------------------------------------- |
| `com.vaadin.flow.theme.material.Material` | Replace with `com.vaadin.flow.theme.lumo.Lumo` |
| `@Theme(themeClass = Material.class`      | Replace with `@Theme(themeClass = Lumo.class`  |

### Spring Boot 4 Patterns

| Pattern                                         | Action                                         |
| ----------------------------------------------- | ---------------------------------------------- |
| `spring-boot-starter-webflux` without webclient | Add `spring-boot-starter-webclient` dependency |

### Spring AI 1.0 → 1.1 Patterns

| Pattern                                                                  | Action                                                                     |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| `import org.springframework.ai.openai.audio.speech.SpeechModel`          | Replace with `org.springframework.ai.audio.tts.TextToSpeechModel`          |
| `import org.springframework.ai.openai.audio.speech.StreamingSpeechModel` | Replace with `org.springframework.ai.audio.tts.StreamingTextToSpeechModel` |
| `import org.springframework.ai.openai.audio.speech.SpeechPrompt`         | Replace with `org.springframework.ai.audio.tts.TextToSpeechPrompt`         |
| `import org.springframework.ai.openai.audio.speech.SpeechResponse`       | Replace with `org.springframework.ai.audio.tts.TextToSpeechResponse`       |
| `.speed(1.0f)`                                                           | Change Float to Double: `.speed(1.0)`                                      |
| `CHAT_MEMORY_RETRIEVE_SIZE_KEY`                                          | Rename to `TOP_K`                                                          |
| `CHAT_MEMORY_CONVERSATION_ID_KEY`                                        | Replace with `ChatMemory.CONVERSATION_ID`                                  |

### Spring AI 2.0.x API Removals / Renames (M1-M7)

| Pattern                                                                                   | Since           | Action                                                                                                 |
| ----------------------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------ |
| `PromptChatMemoryAdvisor`                                                                 | M6              | Replace with explicit `ChatMemory.CONVERSATION_ID` parameter pattern. See `spring-ai-migrator` v2.4.0+ |
| `ModelOptionsUtils` (and `.merge()`)                                                      | M5              | Replace with builder-based options construction                                                        |
| `OpenAiConnectionProperties`                                                              | M6              | Rename to `OpenAiCommonProperties`                                                                     |
| `McpAsyncClientCustomizer` / `McpSyncClientCustomizer`                                    | M3              | Unify to `McpClientCustomizer<McpAsyncClient>` / `McpClientCustomizer<McpSyncClient>`                  |
| `.disableMemory(`                                                                         | M3              | Rename to `.disableInternalConversationHistory(`                                                       |
| `*ChatOptions.DEFAULT_TEMPERATURE`                                                        | M1              | Inline explicit literal (e.g., `0.7`)                                                                  |
| `AnthropicApi.ChatModel.CLAUDE_3_OPUS`                                                    | M3              | Replace with `CLAUDE_4_OPUS` (verify model identity)                                                   |
| `AnthropicApi.ChatModel.CLAUDE_3_SONNET`                                                  | M3              | Replace with `CLAUDE_4_5_SONNET` (verify)                                                              |
| `AnthropicApi.ChatModel.CLAUDE_3_HAIKU`                                                   | M3              | Replace with `CLAUDE_4_5_HAIKU` (verify)                                                               |
| `*Options.set<Property>(`                                                                 | M6              | Convert to builder method `.property(`. See `spring-ai-options-setter-migrator`                        |
| `WebFluxSseClientTransport` / `WebMvcSseClientTransport` / `HttpClientSseClientTransport` | M7 (deprecated) | Replace with Streamable HTTP variants. See `spring-ai-mcp-sse-to-streamable-http-migrator`             |
| `McpSseClientProperties`                                                                  | M7              | Replace with `McpStreamableHttpClientProperties`                                                       |
| `spring.ai.mcp.client.sse.` (YAML)                                                        | M7              | Translate to `spring.ai.mcp.client.streamable-http.`                                                   |
| `spring-ai-spring-cloud-bindings` (artifact)                                              | M7              | REMOVE — preserve unrelated `org.springframework.cloud:spring-cloud-bindings`                          |
| `spring-ai-azure-openai`                                                                  | M4              | Merged into `spring-ai-openai` — switch to `spring-ai-starter-model-openai` w/ Azure endpoint config   |
| `spring-ai-vertex-ai-gemini` / `spring-ai-zhipuai` / `spring-ai-oci-genai`                | M5              | Removed — switch providers or pin Spring AI to 1.x                                                     |
| Multi-provider classpath + missing `spring.ai.model.<type>` selectors                     | any 2.0         | Run `spring-ai-model-selector-enforcer` to inject all six selectors per profile                        |

## Search Commands

### Jackson Patterns

```bash
# Find Jackson core imports
grep -r "import com.fasterxml.jackson.core" --include="*.java"
grep -r "import com.fasterxml.jackson.databind" --include="*.java"
grep -r "JsonProcessingException" --include="*.java"
```

### Security Patterns

```bash
# Find security configuration patterns
grep -r "extends VaadinWebSecurity" --include="*.java"
grep -r "AntPathRequestMatcher" --include="*.java"
grep -r "configure(HttpSecurity" --include="*.java"
```

### Vaadin Patterns

```bash
# Find theme patterns
grep -r "Material.class" --include="*.java"
grep -r "com.vaadin.flow.theme.material" --include="*.java"
```

### Spring AI Patterns

```bash
# Find TTS patterns
grep -r "SpeechModel" --include="*.java"
grep -r "SpeechPrompt" --include="*.java"
grep -r "CHAT_MEMORY_RETRIEVE_SIZE_KEY" --include="*.java"
```

## Output Format

```json
{
  "project": "my-app",
  "patterns": {
    "jackson": {
      "count": 15,
      "files": ["Service.java", "Controller.java"],
      "patterns": [
        {
          "pattern": "import com.fasterxml.jackson.core.*",
          "occurrences": 10,
          "action": "Update to tools.jackson.core.*"
        }
      ]
    },
    "security": {
      "count": 3,
      "files": ["SecurityConfig.java"],
      "patterns": [
        {
          "pattern": "extends VaadinWebSecurity",
          "occurrences": 1,
          "action": "Replace with VaadinSecurityConfigurer bean"
        }
      ]
    }
  },
  "totalPatterns": 18
}
```
