---
name: spring-ai-options-setter-migrator
description: >
  Rewrite removed setter methods on Spring AI options classes (OpenAiChatOptions,
  AnthropicChatOptions, OllamaOptions, MistralAiChatOptions, etc.) — all setters
  were removed in Spring AI 2.0.0-M6. Migrate to builder-based construction or
  YAML property equivalents. Use when compilation fails with `cannot find symbol:
  method setTemperature(double)` (or similar) on any *Options class after upgrading
  Spring AI to 2.0.0-M6+.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Spring AI Options Setter Migrator

Convert Spring AI 2.0.0-M6+ removed-setter calls to builder construction or YAML.

## Problem

Spring AI 2.0.0-M6 removed every setter method from the model options classes:

- `OpenAiChatOptions`, `OpenAiEmbeddingOptions`, `OpenAiImageOptions`,
  `OpenAiAudioSpeechOptions`, `OpenAiAudioTranscriptionOptions`,
  `OpenAiModerationOptions`
- `AnthropicChatOptions`
- `OllamaOptions`
- `MistralAiChatOptions`
- `AzureOpenAiChatOptions`
- … and every other provider's options class

Options are now **immutable**. Configuration must use the builder pattern or the
`spring.ai.<provider>.<type>.*` YAML namespace.

## Detection

```bash
# Find any setter call on a *Options class
grep -rnE "(OpenAi|Anthropic|Ollama|MistralAi|Azure|Bedrock|Stability|HuggingFace)\w*Options\w*\.\s*set[A-Z]\w+\s*\(" src/main/java/

# More targeted — common setter names
grep -rnE "\.(setTemperature|setMaxTokens|setModel|setTopP|setTopK|setFrequencyPenalty|setPresencePenalty|setN|setStop|setSpeed|setVoice|setUser|setSeed|setStreamUsage)\s*\(" src/main/java/
```

## Inputs

| Parameter   | Type    | Default   | Description                                                                                          |
| ----------- | ------- | --------- | ---------------------------------------------------------------------------------------------------- |
| `--target`  | string  | `builder` | `builder`: rewrite to in-code builder chain. `yaml`: extract literal-only setters to application.yml |
| `--mode`    | string  | `migrate` | `detect` (read-only) or `migrate` (apply edits)                                                      |
| `--dry-run` | boolean | `false`   | Print planned changes without writing                                                                |

## Transformations

### Strategy A — In-place builder rewrite (`--target=builder`, default)

Detect any `OptionsType` instance, locate the construction site, fold setters into a
builder chain.

**Before:**

```java
OpenAiChatOptions options = new OpenAiChatOptions();
options.setModel("gpt-4o");
options.setTemperature(0.7);
options.setMaxTokens(2000);
ChatResponse response = chatClient.prompt()
    .options(options)
    .call();
```

**After:**

```java
OpenAiChatOptions options = OpenAiChatOptions.builder()
    .model("gpt-4o")
    .temperature(0.7)
    .maxTokens(2000)
    .build();
ChatResponse response = chatClient.prompt()
    .options(options)
    .call();
```

If a builder chain already exists at the construction site, fold subsequent setters
into the chain:

**Before:**

```java
OpenAiChatOptions options = OpenAiChatOptions.builder()
    .model("gpt-4o")
    .build();
options.setTemperature(0.7);   // setter — removed in M6
```

**After:**

```java
OpenAiChatOptions options = OpenAiChatOptions.builder()
    .model("gpt-4o")
    .temperature(0.7)
    .build();
```

### Strategy B — Extract to YAML (`--target=yaml`)

When all setter arguments are compile-time literals, extract to `application.yml` under
the matching provider namespace and remove the Java setters.

**Java before:**

```java
OpenAiChatOptions options = new OpenAiChatOptions();
options.setModel("gpt-4o");
options.setTemperature(0.7);
```

**Java after:**

```java
// Options now sourced from spring.ai.openai.chat.options.* (see application.yml)
```

**application.yml after:**

```yaml
spring:
  ai:
    openai:
      chat:
        options:
          model: gpt-4o
          temperature: 0.7
```

### Setter → Builder Method Mapping

The builder method name is the setter name minus `set` and lowercased first letter. The
table below lists the most common.

| Setter (removed)              | Builder method              |
| ----------------------------- | --------------------------- |
| `setModel(String)`            | `.model(String)`            |
| `setTemperature(Double)`      | `.temperature(Double)`      |
| `setMaxTokens(Integer)`       | `.maxTokens(Integer)`       |
| `setTopP(Double)`             | `.topP(Double)`             |
| `setTopK(Integer)`            | `.topK(Integer)`            |
| `setFrequencyPenalty(Double)` | `.frequencyPenalty(Double)` |
| `setPresencePenalty(Double)`  | `.presencePenalty(Double)`  |
| `setN(Integer)`               | `.n(Integer)`               |
| `setStop(List<String>)`       | `.stop(List<String>)`       |
| `setUser(String)`             | `.user(String)`             |
| `setSeed(Integer)`            | `.seed(Integer)`            |
| `setStreamUsage(Boolean)`     | `.streamUsage(Boolean)`     |
| `setSpeed(Double)`            | `.speed(Double)`            |
| `setVoice(Voice)`             | `.voice(Voice)`             |

## Migration Algorithm

1. **Detect** setter call sites (regex above).
2. **Group** by enclosing method + variable name.
3. **Locate** the variable's construction:
   - If `new ...Options()` — replace with `...Options.builder()…build()`.
   - If `...Options.builder()…build()` — fold setters into the chain (delete `.build()`
     temporarily, append `.<method>(arg)`, re-append `.build()`).
4. **Rewrite** the file in one Edit call per file.
5. **Verify** compile via `build-runner`.

### Edge Cases

- **Conditional setters** (`if (x) options.setTemperature(x)`) — cannot be folded
  into a builder chain. Use `builder.applyIf(condition, b -> b.temperature(x))` style or
  fall back to YAML extraction with a TODO comment.
- **Setters of complex types** (e.g., `setTools(List<FunctionCallback>)`) — keep in
  builder; do not extract to YAML.
- **Mixed builder + setter** (already in builder, additional setters added later) —
  fold all subsequent setters into the existing chain.

## Output Format

```yaml
optionsSetterMigration:
  detected: true
  target: builder
  filesRewritten:
    - path: src/main/java/com/example/ai/ChatService.java
      setterCallsConverted: 5
      strategy: builder-fold
    - path: src/main/java/com/example/ai/EmbeddingService.java
      setterCallsConverted: 2
      strategy: new-builder
  yamlExtracted: [] # only populated when --target=yaml
  todos: 1 # conditional setters that couldn't be folded
  summary:
    callsConverted: 7
    filesChanged: 2
    todosCreated: 1
```

## Composes With

| Skill                                  | When                                                                           |
| -------------------------------------- | ------------------------------------------------------------------------------ |
| `spring-ai-migrator`                   | Run in same phase — many setter migrations co-occur with TTS / advisor renames |
| `pattern-detector` / `import-migrator` | For pattern catalog support                                                    |
| `application-property-migrator`        | Run **after** when `--target=yaml`                                             |
| `build-runner`                         | Run **after** to verify compile                                                |

## Transformation Protocol

Follows the standard migration protocol — see `migration-protocol` skill.

**Dependencies:** `migration-state` >= 1.0.0, `build-runner` >= 1.0.0

### Skill State Entry

```yaml
appliedTransformations:
  - skill: spring-ai-options-setter-migrator
    version: 1.0.0
    transformations:
      - options-setter-to-builder
    target: builder
    filesRewritten: 2
    callsConverted: 7
    completedAt: 2026-05-23T12:00:00Z
    commitSha: abc123
```
