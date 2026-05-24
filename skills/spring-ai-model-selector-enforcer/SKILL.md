---
name: spring-ai-model-selector-enforcer
description: >
  Detect Spring AI 2.0 multi-provider classpath collisions and inject the six
  spring.ai.model.* selector properties per Spring profile with `none` as the
  safe default. Prevents "At least one credential source must be specified"
  startup failures caused by OpenAI autoconfigure classes binding by default
  when both spring-ai-starter-model-openai and another provider starter (e.g.,
  Ollama) are on the classpath.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Spring AI Model Selector Enforcer

Make Spring AI 2.0 multi-provider configuration explicit and collision-safe.

## Problem

All six OpenAI autoconfiguration classes in Spring AI 2.0 use
`@ConditionalOnProperty(name = "spring.ai.model.<type>", havingValue = "openai", matchIfMissing = true)`.

When `spring-ai-starter-model-openai` is on the classpath together with **any** other
provider starter (e.g., `spring-ai-starter-model-ollama`), every model type whose
`spring.ai.model.<type>` selector is not explicitly set silently defaults to creating an
**OpenAI** bean — which fails at startup with:

```text
At least one credential source must be specified
```

…if no `spring.ai.openai.api-key` is configured for that model type, even when the user
intended Ollama (or another provider) to own that model type.

## The Six Mandatory Selectors

Every Spring profile that uses Spring AI 2.0 with more than one provider on the classpath
**must** explicitly set all six selectors:

```yaml
spring:
  ai:
    model:
      chat: <provider|none>
      embedding: <provider|none>
      image: <provider|none>
      moderation: <provider|none>
      audio:
        speech: <provider|none>
        transcription: <provider|none>
```

Valid values: a provider name (`openai`, `ollama`, `anthropic`, `mistral-ai`, `bedrock-converse`,
`huggingface`, `stability-ai`, `minimax`, `moonshot`, `qianfan`) or **`none`** to disable
autoconfiguration for that model type entirely.

## Detection

```bash
# 1. Detect multi-provider classpath collision
grep -E "spring-ai-starter-model-(openai|ollama|anthropic|mistral-ai|bedrock|huggingface|stability-ai|minimax|moonshot|qianfan)" \
    pom.xml build.gradle build.gradle.kts 2>/dev/null

# 2. Detect missing selectors in application*.yml
yq eval '.spring.ai.model' application.yml
# If null → ALL six selectors missing
# If partial → missing selectors will default to "openai"

# 3. Detect implicit OpenAI binding from classpath probe
# (run after build)
mvn spring-boot:run -Dspring.profiles.active=test --dry-run 2>&1 | \
    grep "At least one credential source must be specified"
```

**Applies when ALL of the following are true:**

1. `org.springframework.ai:spring-ai-bom` version `>= 2.0.0-M1`
2. More than one `spring-ai-starter-model-*` starter (OR one starter + at least one
   provider-specific `spring-ai-*` dependency that contributes an autoconfigure module)
3. Any profile in `application*.yml` lacks one or more of the six selectors

## Inputs

| Parameter            | Type    | Default        | Description                                                           |
| -------------------- | ------- | -------------- | --------------------------------------------------------------------- |
| `--strategy`         | string  | `infer`        | `infer`: read code/config hints. `explicit-none`: every gap → `none`  |
| `--profiles`         | csv     | _all detected_ | Comma-separated profile names to process                              |
| `--primary-provider` | string  | _none_         | Optional override (e.g., `ollama`) — wins when inference is ambiguous |
| `--mode`             | string  | `migrate`      | `detect` (read-only report) or `migrate` (apply edits)                |
| `--dry-run`          | boolean | `false`        | Print planned changes without writing                                 |

## Inference Algorithm

For each profile, decide each of the six model-type selectors by checking signals in priority order:

1. **Explicit existing setting** — if `spring.ai.model.<type>` is already set, keep it.
2. **Existing provider-specific config block** — if `spring.ai.<provider>.<type>.*` exists
   (e.g., `spring.ai.ollama.chat.model`), select that provider for that type.
3. **Code reference** — grep the source tree for the relevant bean injection:

   | Selector              | Java type injected        |
   | --------------------- | ------------------------- |
   | `chat`                | `ChatClient`, `ChatModel` |
   | `embedding`           | `EmbeddingModel`          |
   | `image`               | `ImageModel`              |
   | `moderation`          | `ModerationModel`         |
   | `audio.speech`        | `TextToSpeechModel`       |
   | `audio.transcription` | `AudioTranscriptionModel` |

   If the bean is referenced and a single matching provider config exists, use it. If
   multiple provider configs match, use `--primary-provider` (or fall back to `none`).

4. **`--primary-provider` fallback** — when set, becomes the answer for any unset selector
   for which a provider config block exists.
5. **`none`** — final fallback. Safe: disables autoconfiguration for that model type.

## Migration Steps

### Step 1 — Detect classpath providers

```bash
# Maven
grep -oE "spring-ai-starter-model-[a-z-]+|spring-ai-[a-z-]+-spring-boot-starter" pom.xml \
    | sort -u

# Gradle
grep -oE "spring-ai-starter-model-[a-z-]+|spring-ai-[a-z-]+-spring-boot-starter" \
    build.gradle build.gradle.kts 2>/dev/null | sort -u
```

### Step 2 — Enumerate profiles

```bash
find src/main/resources -name "application*.yml" -o -name "application*.yaml" \
    -o -name "application*.properties" | sort
```

The `default` profile is `application.yml` / `application.properties`.
Profile-specific files are `application-<profile>.yml` etc.

### Step 3 — Inject the six selectors per profile

For **each** profile file, ensure the following block exists at the top of the `spring.ai`
section. If `spring.ai.model.*` is partially set, fill only the missing keys (do not
overwrite explicit values).

```yaml
spring:
  ai:
    model:
      chat: <inferred|none>
      embedding: <inferred|none>
      image: <inferred|none>
      moderation: <inferred|none>
      audio:
        speech: <inferred|none>
        transcription: <inferred|none>
```

For `application.properties`:

```properties
spring.ai.model.chat=<inferred|none>
spring.ai.model.embedding=<inferred|none>
spring.ai.model.image=<inferred|none>
spring.ai.model.moderation=<inferred|none>
spring.ai.model.audio.speech=<inferred|none>
spring.ai.model.audio.transcription=<inferred|none>
```

### Step 4 — Mark ambiguous selectors with a TODO

When the algorithm falls all the way through to `none` despite multiple providers being on
the classpath, emit a YAML comment so the developer can review:

```yaml
spring:
  ai:
    model:
      chat: none # TODO: choose 'openai' or 'ollama' for this profile
```

### Step 5 — Validate

Run the application against each profile and confirm no
`At least one credential source must be specified` error appears.

```bash
# Maven
./mvnw spring-boot:run -Dspring-boot.run.profiles=<profile>

# Gradle
./gradlew bootRun --args="--spring.profiles.active=<profile>"
```

## Output Format

```yaml
modelSelectorEnforcement:
  detected: true
  classpathProviders:
    - openai
    - ollama
  profilesProcessed:
    - name: default
      file: src/main/resources/application.yml
      selectorsInjected:
        chat: ollama # inferred from spring.ai.ollama.chat.model
        embedding: openai # inferred from EmbeddingModel injection
        image: none
        moderation: none
        audio.speech: none
        audio.transcription: none
      todos: 0
    - name: test
      file: src/main/resources/application-test.yml
      selectorsInjected:
        chat: none # TODO
        embedding: none
        image: none
        moderation: none
        audio.speech: none
        audio.transcription: none
      todos: 1
  summary:
    profilesChanged: 2
    selectorsAdded: 12
    todosCreated: 1
    collisionsPrevented: 2
```

## Composes With

| Skill                           | When                                                                |
| ------------------------------- | ------------------------------------------------------------------- |
| `application-property-migrator` | Run **before** — normalize kebab-case / namespaces                  |
| `spring-ai-migrator`            | Run **after** its `autoconfigure-provider-selection` transformation |
| `dependency-scanner`            | Consumed for the classpath provider inventory                       |
| `build-runner`                  | Run **after** — validate via app startup probe                      |
| `build-file-updater`            | Run before for starter rename map                                   |

## Transformation Protocol

Follows the standard migration protocol — see `migration-protocol` skill for the full
transformation loop, skip logic, state file format, and build verification commands.

**Dependencies:** `migration-state` >= 1.0.0, `build-runner` >= 1.0.0

### Detection Pattern

| Transformation ID            | Detection Pattern                                                                                                                      |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `model-selector-enforcement` | Multi-provider classpath collision + missing `spring.ai.model.{chat\|embedding\|image\|moderation\|audio.speech\|audio.transcription}` |

### Skill State Entry

```yaml
appliedTransformations:
  - skill: spring-ai-model-selector-enforcer
    version: 1.0.0
    transformations:
      - model-selector-enforcement
    profilesProcessed:
      - default
      - test
      - prod
    selectorsAdded: 18
    todosCreated: 0
    completedAt: 2026-05-23T12:00:00Z
    commitSha: abc123
```

## Why This Is the Highest-Value Spring AI Skill

This skill addresses a class of failure no other skill catches:

- **Silent classpath wiring** — OpenAI autoconfiguration binds by default even when the
  developer intended a different provider.
- **Startup-only manifestation** — compilation passes, tests pass (if tests don't exercise
  the model bean), and the failure surfaces only in the deployed environment.
- **Per-profile sensitivity** — a project that works in `dev` (where an OpenAI key happens
  to be present) fails in `prod` (where it isn't), or vice versa.

Run this skill on every Spring AI 2.0 project, not just those being newly migrated.
