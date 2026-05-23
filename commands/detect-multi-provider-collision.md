---
description: Detect Spring AI multi-provider classpath collisions and missing spring.ai.model.* selectors
argument-hint: [project-path]
allowed-tools: Read, Glob, Grep, Bash
---

# Detect Multi-Provider Collision

Run `spring-ai-model-selector-enforcer` in **detect-only** mode to surface the silent
multi-provider classpath collision that crashes Spring AI 2.0 apps at startup with
`At least one credential source must be specified`.

## Usage

```bash
# Scan current directory
/spring-m11n:detect-multi-provider-collision

# Scan specific project
/spring-m11n:detect-multi-provider-collision /path/to/project
```

## What This Command Does

1. Inspects `pom.xml` / `build.gradle*` for multiple `spring-ai-starter-model-*` starters
   (or one starter + additional provider-specific Spring AI dependencies).
2. Enumerates Spring profiles from `application*.yml` / `*.properties`.
3. For each profile, checks whether **all six** of these selectors are explicitly set:
   - `spring.ai.model.chat`
   - `spring.ai.model.embedding`
   - `spring.ai.model.image`
   - `spring.ai.model.moderation`
   - `spring.ai.model.audio.speech`
   - `spring.ai.model.audio.transcription`
4. Reports any profile where a selector is missing. Missing selectors silently default
   to OpenAI via `@ConditionalOnProperty(matchIfMissing=true)` and crash the app at
   startup when no OpenAI API key is configured for that model type.

## Read-Only

This command **does not modify** any files. To apply the fix, run:

```bash
/spring-m11n:migrate-spring-ai-20      # full Spring AI 2.0 upgrade including enforcement
```

Or invoke the enforcer skill directly:

```bash
spring-ai-model-selector-enforcer --mode=migrate
```

## Output

```text
Multi-Provider Collision Detector

Classpath providers detected:
  - openai (spring-ai-starter-model-openai)
  - ollama (spring-ai-starter-model-ollama)

⚠️  COLLISION RISK — multiple providers, OpenAI is the default for unset selectors.

Profiles scanned: 3

  ❌ default (src/main/resources/application.yml)
     missing: chat, image, moderation, audio.speech, audio.transcription
     present: embedding

  ❌ test (src/main/resources/application-test.yml)
     missing: all six selectors
     present: (none)

  ✅ prod (src/main/resources/application-prod.yml)
     all six selectors set

Summary:
  Profiles with collision risk: 2/3
  Total missing selectors: 11

To fix:
  /spring-m11n:migrate-spring-ai-20
```

## Related

- Skill: `spring-ai-model-selector-enforcer`
- Command: `/spring-m11n:migrate-spring-ai-20`
