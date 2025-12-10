---
name: import-migrator
description: Update Java import statements for Spring Boot 4 migrations including Jackson, Spring Security, Vaadin, and Spring AI. Use when performing bulk import updates across multiple files.
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Import Migrator

Update Java import statements across a project for Spring ecosystem migrations.

## Complete Import Mapping Reference

### Jackson 2 → 3

| Old Import                                           | New Import                            | Notes                |
| ---------------------------------------------------- | ------------------------------------- | -------------------- |
| `com.fasterxml.jackson.core.JsonProcessingException` | `tools.jackson.core.JacksonException` | Exception renamed    |
| `com.fasterxml.jackson.core.*`                       | `tools.jackson.core.*`                |                      |
| `com.fasterxml.jackson.databind.*`                   | `tools.jackson.databind.*`            |                      |
| `com.fasterxml.jackson.dataformat.*`                 | `tools.jackson.dataformat.*`          |                      |
| `com.fasterxml.jackson.datatype.*`                   | `tools.jackson.datatype.*`            |                      |
| `com.fasterxml.jackson.module.*`                     | `tools.jackson.module.*`              |                      |
| `com.fasterxml.jackson.annotation.*`                 | **NO CHANGE**                         | Backward compatible! |

### Spring Security 6 → 7

| Old Import                                                            | New Import                                                                        |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `org.springframework.security.web.util.matcher.AntPathRequestMatcher` | `org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher` |

### Vaadin 24 → 25

| Old Import                                          | New Import                                                 |
| --------------------------------------------------- | ---------------------------------------------------------- |
| `com.vaadin.flow.spring.security.VaadinWebSecurity` | `com.vaadin.flow.spring.security.VaadinSecurityConfigurer` |
| `com.vaadin.flow.theme.material.Material`           | `com.vaadin.flow.theme.lumo.Lumo`                          |

### Spring AI 1.0 → 1.1

| Old Import                                                                                     | New Import                                                      |
| ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `org.springframework.ai.openai.audio.speech.SpeechModel`                                       | `org.springframework.ai.audio.tts.TextToSpeechModel`            |
| `org.springframework.ai.openai.audio.speech.StreamingSpeechModel`                              | `org.springframework.ai.audio.tts.StreamingTextToSpeechModel`   |
| `org.springframework.ai.openai.audio.speech.SpeechPrompt`                                      | `org.springframework.ai.audio.tts.TextToSpeechPrompt`           |
| `org.springframework.ai.openai.audio.speech.SpeechResponse`                                    | `org.springframework.ai.audio.tts.TextToSpeechResponse`         |
| `org.springframework.ai.openai.audio.speech.SpeechMessage`                                     | `org.springframework.ai.audio.tts.TextToSpeechMessage`          |
| `org.springframework.ai.chat.memory.AbstractChatMemoryAdvisor.CHAT_MEMORY_CONVERSATION_ID_KEY` | `org.springframework.ai.chat.memory.ChatMemory.CONVERSATION_ID` |

## Migration Strategy

### 1. AST-Based (Preferred)

Use IDE refactoring or OpenRewrite for reliable transformations.

### 2. Regex-Based (Fallback)

For simple import statement updates:

```bash
# Jackson core imports
find . -name "*.java" -exec sed -i '' \
  's/import com\.fasterxml\.jackson\.core\./import tools.jackson.core./g' {} \;

# Jackson databind imports
find . -name "*.java" -exec sed -i '' \
  's/import com\.fasterxml\.jackson\.databind\./import tools.jackson.databind./g' {} \;

# Exception rename
find . -name "*.java" -exec sed -i '' \
  's/JsonProcessingException/JacksonException/g' {} \;
```

## Execution Order

1. **Scan** - Identify all files with imports needing migration
2. **Categorize** - Group by migration type (Jackson, Security, etc.)
3. **Transform** - Apply import updates
4. **Preserve** - Keep `com.fasterxml.jackson.annotation.*` unchanged
5. **Verify** - Compile to check for errors
6. **Format** - Run Spotless to organize imports

## Output Format

```json
{
  "migratedFiles": 42,
  "importChanges": {
    "jackson": {
      "core": 15,
      "databind": 20,
      "exceptions": 7
    },
    "security": {
      "requestMatcher": 5
    },
    "vaadin": {
      "theme": 3,
      "security": 2
    },
    "springAi": {
      "tts": 4,
      "memory": 2
    }
  },
  "preservedAnnotations": 25,
  "errors": []
}
```

## Common Pitfalls

1. **Don't change Jackson annotations** - They remain at `com.fasterxml.jackson.annotation`
2. **Update catch blocks** - `JsonProcessingException` → `JacksonException`
3. **Check static imports** - Memory advisor constants use static imports
4. **Verify wildcard imports** - Ensure all classes are available after migration
