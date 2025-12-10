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
