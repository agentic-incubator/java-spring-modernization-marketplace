---
description: Upgrade a Spring AI 1.1.x project to 2.0.0-M7 (or future Spring AI 2.0 GA)
argument-hint: [project-path] [--target=2.0.0-M7|GA] [--primary-provider=openai|ollama|...] [--dry-run]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task
---

# Migrate Spring AI 2.0

Run the focused Spring AI 1.1.x → 2.0.0-M7 upgrade on the project at `$ARGUMENTS` (or
current directory). Delegates to the `spring-ai-20-m7-upgrade-agent`.

## Usage

```bash
# Upgrade to 2.0.0-M7 (default target), infer provider per profile
/spring-m11n:migrate-spring-ai-20

# Explicit primary provider for selector inference
/spring-m11n:migrate-spring-ai-20 --primary-provider=ollama

# Dry run
/spring-m11n:migrate-spring-ai-20 --dry-run
```

## What This Command Does

1. **Detects + validates** the current Spring AI version (auto-corrects malformed
   formats like `2.0-M1` → `2.0.0-M7`).
2. **Bumps** Spring AI to the target milestone and applies the **starter artifact
   rename map** (`spring-ai-openai-spring-boot-starter` →
   `spring-ai-starter-model-openai`, etc.).
3. **Adds Spring Milestones repository** to both `<repositories>` and
   `<pluginRepositories>` (Maven) / `settings.gradle*` `pluginManagement` (Gradle).
4. **Removes `spring-ai-spring-cloud-bindings`** (removed in M7). Preserves the unrelated
   `org.springframework.cloud:spring-cloud-bindings`.
5. **Handles removed modules** (`spring-ai-azure-openai` → `spring-ai-openai` w/ Azure
   endpoint; `spring-ai-vertex-ai-gemini`, `spring-ai-zhipuai`, `spring-ai-oci-genai` →
   removed; user prompted to switch providers).
6. **Rewrites removed/renamed APIs** (M1-M6): `PromptChatMemoryAdvisor`,
   `ModelOptionsUtils[.merge]`, `OpenAiConnectionProperties` → `OpenAiCommonProperties`,
   `McpAsyncClientCustomizer`/`McpSyncClientCustomizer` → `McpClientCustomizer<B>`,
   `disableMemory()` → `disableInternalConversationHistory()`, Claude 3 enum constants,
   default temperature constants.
7. **MCP client migration**: package move, `WebFluxSseClientTransport` constructor,
   customizer unification.
8. **SSE → Streamable HTTP** transport (M7 deprecation).
9. **Options setter migration**: rewrites `.setTemperature()`, `.setModel()` etc. to
   builder construction (M6 removal).
10. **Removes Jackson 2 compat layer** if previously installed (no longer needed in M7+).
11. **MANDATORY**: Enforces all six `spring.ai.model.*` selectors per Spring profile via
    `spring-ai-model-selector-enforcer` — prevents the
    `"At least one credential source must be specified"` startup failure.
12. **Validates** via full compile + test + app-startup probe per profile.

## Output

```text
Spring AI 2.0.0-M7 Upgrade

Phase 0: Detect + validate
  Current Spring AI: 1.1.6 → target 2.0.0-M7 ✅

Phase 1: Build file updates
  ✅ spring-ai.version: 1.1.6 → 2.0.0-M7
  ✅ starters renamed: 2 (openai, ollama)
  ✅ <pluginRepositories>: Spring Milestones added

Phase 2: Spring AI core migration
  ✅ tts-model-rename: 1 file
  ✅ advisor-constants: 3 files
  ✅ spring-ai-cloud-bindings-removal: 1 dep removed
  ✅ spring-ai-api-removals-m1-m6: 4 files

Phase 3: MCP client migration
  ✅ Package move: 5 files
  ✅ McpClientCustomizer unification: 2 customizer beans

Phase 4: SSE → Streamable HTTP
  ✅ Transport rewritten: 1 config class
  ✅ Properties translated: 2 connection entries

Phase 5: Options setter migration
  ✅ Setters → builder: 7 calls across 2 files

Phase 6: Property migration
  ✅ Kebab-case + namespace updates

Phase 7: Selector enforcement
  ✅ Profiles processed: default, test, prod
  ✅ Selectors added: 18 (6 per profile × 3 profiles)
  ℹ️  Inferred: chat=ollama, embedding=openai, others=none

Phase 8: Validation
  ✅ Compile: PASSED
  ✅ Tests: PASSED
  ✅ Startup probe: PASSED (3 profiles)

✅ Upgrade complete!
```

## Selector Enforcement (Critical)

This command **will not finish** until `spring-ai-model-selector-enforcer` succeeds.
That skill addresses the silent multi-provider classpath collision where unset
`spring.ai.model.<type>` properties default to OpenAI and crash the app at startup. For
projects with only one provider on the classpath, the enforcer is a no-op.

## State Tracking

Records every phase in `.migration-state.yaml`. See `agents/spring-ai-20-m7-upgrade-agent.md`
for the full state shape.

## Composes With

- `/spring-m11n:migrate-spring-boot-41` — run **before** this if the project also needs
  Boot 4.1.0-RC1.
- `/spring-m11n:detect-multi-provider-collision` — standalone diagnostic that runs only
  the selector-enforcer in `detect` mode.
- `/spring-m11n:migrate-mcp-streamable-http` — standalone wrapper for the SSE → Streamable
  HTTP migration if you want to run it independently.

## Related

- Agent: `spring-ai-20-m7-upgrade-agent`
- Skill: `spring-ai-model-selector-enforcer` (mandatory final step)
- Skill: `spring-ai-options-setter-migrator`
- Skill: `spring-ai-mcp-sse-to-streamable-http-migrator`
