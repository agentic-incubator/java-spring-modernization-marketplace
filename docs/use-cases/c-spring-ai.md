# C. Spring AI Use Cases

> ← [Back to Use Cases home](README.md)

Spring AI is in active milestone development and the API has churned hard between
1.x and 2.0.0-M7. These use cases handle the full upgrade and the most common single
issues people hit along the way.

---

<details>
<summary><strong>C1.</strong> Upgrade Spring AI from 1.x (or 2.0.0-M1..M6) to 2.0.0-M7</summary>

**What's happening.** Spring AI 2.0 has shipped seven milestones, each with breaking
changes: starter renames, TTS class renames, removed advisor classes, options-setter
removal (M6), MCP package moves, SSE transport deprecation (M7), and the multi-provider
selector trap. This use case rolls all of them up in one pass.

**Easiest thing to say:**

> "Upgrade Spring AI to 2.0.0-M7."

**Other ways you might phrase it:**

> "Take Spring AI to the latest 2.0 milestone."
>
> "Migrate Spring AI."
>
> "Run `/migrate-spring-ai-20`."

**What gets used under the hood:**

- Command: [`/migrate-spring-ai-20`](../../commands/migrate-spring-ai-20.md)
- Agent:
  [`spring-ai-20-m7-upgrade-agent`](../../agents/spring-ai-20-m7-upgrade-agent.md)
- Key skills:
  [`spring-ai-version-validator`](../../skills/spring-ai-version-validator/SKILL.md),
  [`build-file-updater`](../../skills/build-file-updater/SKILL.md),
  [`spring-ai-migrator`](../../skills/spring-ai-migrator/SKILL.md),
  [`spring-ai-mcp-client-package-migrator`](../../skills/spring-ai-mcp-client-package-migrator/SKILL.md),
  [`spring-ai-mcp-sse-to-streamable-http-migrator`](../../skills/spring-ai-mcp-sse-to-streamable-http-migrator/SKILL.md),
  [`spring-ai-options-setter-migrator`](../../skills/spring-ai-options-setter-migrator/SKILL.md),
  [`application-property-migrator`](../../skills/application-property-migrator/SKILL.md),
  [`spring-ai-model-selector-enforcer`](../../skills/spring-ai-model-selector-enforcer/SKILL.md)
  ⭐ mandatory final step

**What you get.** Spring AI bumped to 2.0.0-M7, all starter artifact IDs renamed to
`spring-ai-starter-model-*`, removed APIs rewritten, MCP transport migrated from SSE
to Streamable HTTP, options setters folded into builder chains, and most importantly,
all six `spring.ai.model.*` selectors set per Spring profile so the app actually
starts up.

**What if something goes wrong?**

- _"Maven says `2.0-M1` is not found."_ Your version string is malformed (should be
  `2.0.0-M7` with the patch number). The
  [`spring-ai-version-validator`](../../skills/spring-ai-version-validator/SKILL.md)
  skill normally catches this in the first phase. Re-run; if it still fails, clear
  the Maven cache: `rm -rf ~/.m2/repository/org/springframework/ai`.
- _"`McpAsyncClientCustomizer` cannot be resolved."_ That interface was unified into
  `McpClientCustomizer<B>` in M3. The
  [`spring-ai-mcp-client-package-migrator`](../../skills/spring-ai-mcp-client-package-migrator/SKILL.md)
  v1.1.0+ handles this — re-run the command if you upgraded the marketplace mid-flight.
- _"`PromptChatMemoryAdvisor` is gone."_ Removed in M6. The migrator rewrites it to
  the explicit `ChatMemory.CONVERSATION_ID` pattern.
- _"Multi-provider classpath crash even after the migration."_ The mandatory final
  step (selector enforcer) was skipped or hit an error. See [C2](#c2).

</details>

---

<details>
<summary><strong>C2.</strong> My Spring AI app crashes with "At least one credential source must be specified"</summary>

**What's happening.** This is **the** Spring AI 2.0 footgun. When you have more than
one provider on the classpath (say `spring-ai-starter-model-openai` AND
`spring-ai-starter-model-ollama`), the OpenAI auto-configuration uses
`@ConditionalOnProperty(havingValue="openai", matchIfMissing=true)`. That means **every
unset `spring.ai.model.<type>` property silently defaults to OpenAI**. If you don't
have an OpenAI API key configured for that model type, the app dies on boot. This
bites everyone eventually — it's not you.

**Easiest thing to say:**

> "Fix my Spring AI provider configuration so the app stops crashing on startup."

**Other ways you might phrase it:**

> "Spring AI is silently defaulting to OpenAI — fix it."
>
> "Set all six `spring.ai.model.*` selectors."
>
> "Run `/detect-multi-provider-collision` first, then fix the missing selectors."

**What gets used under the hood:**

- Diagnostic only:
  [`/detect-multi-provider-collision`](../../commands/detect-multi-provider-collision.md)
- Fix-it skill:
  [`spring-ai-model-selector-enforcer`](../../skills/spring-ai-model-selector-enforcer/SKILL.md)
- Composes with:
  [`application-property-migrator`](../../skills/application-property-migrator/SKILL.md),
  [`dependency-scanner`](../../skills/dependency-scanner/SKILL.md)

**What you get.** Every Spring profile in your project gets all six selectors set
explicitly:
`spring.ai.model.{chat,embedding,image,moderation,audio.speech,audio.transcription}`.
The skill infers each value from existing config blocks and code references, falling
back to `none` when it can't decide.

**What if something goes wrong?**

- _"It set everything to `none` — now nothing works."_ The skill couldn't infer your
  intent. Re-run with `--primary-provider=ollama` (or whichever provider you use most)
  so it has a fallback hint.
- _"It missed a profile."_ Pass `--profiles=default,test,prod` explicitly. The
  auto-discovery looks for `application*.yml`/`*.properties` files in standard
  locations.
- _"It put a TODO comment in my YAML — what do I do?"_ The skill flagged that profile
  as ambiguous (multiple providers possible, no signal pointing to one). Read the
  TODO and pick `openai`, `ollama`, etc. yourself. The comment goes away once you
  edit the value.

</details>

---

<details>
<summary><strong>C3.</strong> Migrate my MCP client from SSE to Streamable HTTP (Spring AI M7)</summary>

**What's happening.** Spring AI 2.0.0-M7 deprecated the SSE-based MCP transports
(`WebFluxSseClientTransport`, `WebMvcSseClientTransport`, `HttpClientSseClientTransport`)
in favor of Streamable HTTP. SSE still works in M7 but is scheduled for removal in a
future milestone. If you're already on M7, you can migrate proactively without doing a
full Spring AI upgrade.

**Easiest thing to say:**

> "Migrate my MCP client from SSE to Streamable HTTP."

**Other ways you might phrase it:**

> "Replace SSE MCP transport with Streamable HTTP."
>
> "Fix the deprecated `WebFluxSseClientTransport`."
>
> "Run `/migrate-mcp-streamable-http`."

**What gets used under the hood:**

- Command:
  [`/migrate-mcp-streamable-http`](../../commands/migrate-mcp-streamable-http.md)
- Skill:
  [`spring-ai-mcp-sse-to-streamable-http-migrator`](../../skills/spring-ai-mcp-sse-to-streamable-http-migrator/SKILL.md)
- Prerequisite (auto-invoked if needed):
  [`spring-ai-mcp-client-package-migrator`](../../skills/spring-ai-mcp-client-package-migrator/SKILL.md)
  v1.1.0+

**What you get.** Transport classes renamed, the `spring.ai.mcp.client.sse.*` property
tree translated to `spring.ai.mcp.client.streamable-http.*`, and connection URLs
cleaned up (no more `/sse` suffix needed — Streamable HTTP discovers endpoints).
Custom SSE event handlers get a TODO marker for you to rewrite manually.

**What if something goes wrong?**

- _"My SSE event handler can't be auto-migrated."_ That's expected — the skill marks
  it with a TODO comment because the rewrite isn't mechanical. Streamable HTTP uses
  bidirectional HTTP streaming, not events, so custom `EventSource` or
  `Flux<ServerSentEvent>` handlers need a real rewrite. See the
  [skill doc](../../skills/spring-ai-mcp-sse-to-streamable-http-migrator/SKILL.md) for
  the pattern.
- _"My MCP server doesn't speak Streamable HTTP yet."_ Pass
  `--preserve-sse-fallback` to keep both transports wired under
  `@ConditionalOnProperty`, so you can flip between them per environment.
- _"`McpJsonMapper` not found."_ You're missing the MCP SDK 0.18+ package move. Run
  [`spring-ai-mcp-client-package-migrator`](../../skills/spring-ai-mcp-client-package-migrator/SKILL.md)
  first.

</details>

---

<details>
<summary><strong>C4.</strong> Spring AI 2.0-M6 removed all my setters — fix them</summary>

**What's happening.** In M6, every Spring AI options class (`OpenAiChatOptions`,
`AnthropicChatOptions`, `OllamaOptions`, etc.) lost all its setter methods. Code that
called `options.setTemperature(0.7)` no longer compiles. You need to either build
options through the builder pattern or move literal values into `application.yml`.

**Easiest thing to say:**

> "Spring AI 2.0-M6 removed all my options setters — fix the call sites."

**Other ways you might phrase it:**

> "Convert my `setTemperature()` calls to builder methods."
>
> "Move my options into YAML."
>
> "Compile errors on `.setModel()` after Spring AI bump — fix them."

**What gets used under the hood:**

- Skill:
  [`spring-ai-options-setter-migrator`](../../skills/spring-ai-options-setter-migrator/SKILL.md)
- Composes with:
  [`application-property-migrator`](../../skills/application-property-migrator/SKILL.md)
  (when `--target=yaml`)

**What you get.** Either an in-code builder chain (`OpenAiChatOptions.builder()
.temperature(0.7).maxTokens(2000).build()`) or extracted YAML config — your choice via
`--target=builder` (default) or `--target=yaml`.

**What if something goes wrong?**

- _"It rewrote my conditional setter (`if (debug) options.setTemperature(0.1)`) and
  broke the logic."_ The skill should mark conditionals with a TODO instead of
  rewriting them. If it folded one into a builder chain incorrectly, the
  `--target=builder` strategy can't always preserve conditions. Open the file, undo
  that one rewrite, and use `builder.applyIf(condition, b -> b.temperature(0.1))`.
- _"I picked `--target=yaml` but some setters used dynamic values."_ YAML extraction
  only works for compile-time literals. Dynamic values stay as builder calls. If the
  skill mixed them weirdly, run again with `--target=builder` for the affected file.

</details>
