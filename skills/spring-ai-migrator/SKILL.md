---
name: spring-ai-migrator
description: Migrate Spring AI 1.x to 2.0.x including TTS API changes (SpeechModel to TextToSpeechModel), speed parameter type change (Float to Double), chat memory advisor constant renames, and autoconfigure migration for Spring Boot 4 compatibility. Use when upgrading Spring AI or fixing Spring AI compilation errors.
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Spring AI Migrator

Migrate Spring AI 1.x to Spring AI 2.0.x with TTS API, advisor, and autoconfigure changes.

## Critical: Spring Boot 4 Compatibility

**Spring AI 2.0.0-M1 is required for Spring Boot 4 compatibility.**

Spring Boot 4.0 splits the monolithic autoconfigure JAR into modules, causing package
relocations. Spring AI 1.x was built for Spring Boot 3.x and references old class
locations, resulting in:

```text
ClassNotFoundException: org.springframework.boot.autoconfigure.web.client.RestClientAutoConfiguration
```

**Solution:** Upgrade Spring AI from 1.x to 2.0.0-M1 or later.

## Version Compatibility

| Spring Boot | Spring AI     | Notes                           |
| ----------- | ------------- | ------------------------------- |
| 3.3.x       | 1.0.x         | Original Spring AI              |
| 3.5.x       | 1.0.x - 1.1.x | Last Spring Boot 3.x compatible |
| **4.0.x**   | **2.0.0-M1+** | Required for Boot 4             |

## Key Migration Areas

1. **TTS API** - SpeechModel → TextToSpeechModel classes
2. **Speed Parameter** - Float → Double type change
3. **Memory Constants** - Renamed advisor constants

## TTS API Migration

### Import Changes

| Old Import (1.0.x)                                | New Import (1.1.x)                            |
| ------------------------------------------------- | --------------------------------------------- |
| `o.s.ai.openai.audio.speech.SpeechModel`          | `o.s.ai.audio.tts.TextToSpeechModel`          |
| `o.s.ai.openai.audio.speech.StreamingSpeechModel` | `o.s.ai.audio.tts.StreamingTextToSpeechModel` |
| `o.s.ai.openai.audio.speech.SpeechPrompt`         | `o.s.ai.audio.tts.TextToSpeechPrompt`         |
| `o.s.ai.openai.audio.speech.SpeechResponse`       | `o.s.ai.audio.tts.TextToSpeechResponse`       |
| `o.s.ai.openai.audio.speech.SpeechMessage`        | `o.s.ai.audio.tts.TextToSpeechMessage`        |

### Complete TTS Example

#### Before (Spring AI 1.0.x)

```java
import org.springframework.ai.openai.audio.speech.SpeechModel;
import org.springframework.ai.openai.audio.speech.SpeechPrompt;
import org.springframework.ai.openai.audio.speech.SpeechResponse;
import org.springframework.ai.openai.OpenAiAudioSpeechOptions;

@Service
public class TextToSpeechService {

    private final SpeechModel speechModel;

    public TextToSpeechService(SpeechModel speechModel) {
        this.speechModel = speechModel;
    }

    public byte[] synthesize(String text) {
        OpenAiAudioSpeechOptions options = OpenAiAudioSpeechOptions.builder()
            .voice(Voice.ALLOY)
            .speed(1.0f)  // Float type
            .build();

        SpeechPrompt prompt = new SpeechPrompt(text, options);
        SpeechResponse response = speechModel.call(prompt);
        return response.getResult().getOutput();
    }
}
```

#### After (Spring AI 1.1.x)

```java
import org.springframework.ai.audio.tts.TextToSpeechModel;
import org.springframework.ai.audio.tts.TextToSpeechPrompt;
import org.springframework.ai.audio.tts.TextToSpeechResponse;
import org.springframework.ai.openai.OpenAiAudioSpeechOptions;

@Service
public class TextToSpeechService {

    private final TextToSpeechModel textToSpeechModel;  // Changed type

    public TextToSpeechService(TextToSpeechModel textToSpeechModel) {
        this.textToSpeechModel = textToSpeechModel;
    }

    public byte[] synthesize(String text) {
        OpenAiAudioSpeechOptions options = OpenAiAudioSpeechOptions.builder()
            .voice(Voice.ALLOY)
            .speed(1.0)  // Double type (removed 'f' suffix)
            .build();

        TextToSpeechPrompt prompt = new TextToSpeechPrompt(text, options);
        TextToSpeechResponse response = textToSpeechModel.call(prompt);
        return response.getResult().getOutput();
    }
}
```

## Chat Memory Advisor Migration

### Constant Renames

| Old Constant (1.0.x)                | New Constant (1.1.x)         | Notes                          |
| ----------------------------------- | ---------------------------- | ------------------------------ |
| `CHAT_MEMORY_RETRIEVE_SIZE_KEY`     | `TOP_K`                      | Default changed from 100 to 20 |
| `DEFAULT_CHAT_MEMORY_RESPONSE_SIZE` | `DEFAULT_TOP_K`              | Value is now 20                |
| `CHAT_MEMORY_CONVERSATION_ID_KEY`   | `ChatMemory.CONVERSATION_ID` | Moved to ChatMemory class      |

### Chat Memory Example

#### Before (Spring AI 1.0.x)

```java
import static org.springframework.ai.chat.memory.AbstractChatMemoryAdvisor.CHAT_MEMORY_CONVERSATION_ID_KEY;
import static org.springframework.ai.chat.memory.VectorStoreChatMemoryAdvisor.CHAT_MEMORY_RETRIEVE_SIZE_KEY;

chatClient.prompt()
    .advisors(advisor -> advisor
        .param(CHAT_MEMORY_CONVERSATION_ID_KEY, "session-123")
        .param(CHAT_MEMORY_RETRIEVE_SIZE_KEY, 50))
    .call();
```

#### After (Spring AI 1.1.x)

```java
import static org.springframework.ai.chat.memory.ChatMemory.CONVERSATION_ID;
import static org.springframework.ai.chat.memory.VectorStoreChatMemoryAdvisor.TOP_K;

chatClient.prompt()
    .advisors(advisor -> advisor
        .param(CONVERSATION_ID, "session-123")
        .param(TOP_K, 50))  // Note: default changed from 100 to 20
    .call();
```

## Speed Parameter Migration

### Find and Replace Pattern

```java
// Before - Float literal
.speed(1.0f)
.speed(0.5f)
.speed(1.5f)

// After - Double literal
.speed(1.0)
.speed(0.5)
.speed(1.5)
```

## Migration Steps

1. **Update imports** - Replace SpeechModel classes with TextToSpeechModel classes
2. **Update types** - Change `SpeechModel` to `TextToSpeechModel` in declarations
3. **Fix speed params** - Remove `f` suffix from speed values
4. **Update constants** - Replace memory advisor constant names
5. **Check defaults** - Note that `TOP_K` default is now 20 (was 100)
6. **Run tests** - Verify TTS and chat memory functionality

## Spring AI 2.0 Autoconfigure Migration

### Provider Selection (Recommended Approach)

Spring AI 2.0 introduces the `spring.ai.model.*` properties for provider selection instead of autoconfigure excludes.

#### Before (Spring AI 1.x - Autoconfigure Excludes)

```yaml
spring:
  autoconfigure:
    exclude: org.springframework.ai.autoconfigure.openai.OpenAiAutoConfiguration
  ai:
    ollama:
      base-url: http://localhost:11434
      chat:
        model: llama3.2
```

#### After (Spring AI 2.0 - Model Selection)

```yaml
spring:
  ai:
    model:
      chat: ollama
      embedding: ollama
    ollama:
      base-url: http://localhost:11434
      chat:
        model: llama3.2
```

### Autoconfigure Class Split

In Spring AI 2.0, the monolithic `OpenAiAutoConfiguration` was split into 6 separate classes:

| Old Class (1.x)                                       | New Classes (2.0)                           |
| ----------------------------------------------------- | ------------------------------------------- |
| `o.s.ai.autoconfigure.openai.OpenAiAutoConfiguration` | `OpenAiAudioSpeechAutoConfiguration`        |
|                                                       | `OpenAiAudioTranscriptionAutoConfiguration` |
|                                                       | `OpenAiChatAutoConfiguration`               |
|                                                       | `OpenAiEmbeddingAutoConfiguration`          |
|                                                       | `OpenAiImageAutoConfiguration`              |
|                                                       | `OpenAiModerationAutoConfiguration`         |

If you must exclude specific autoconfiguration (not recommended), reference the new class names:

```yaml
spring:
  autoconfigure:
    exclude:
      - org.springframework.ai.autoconfigure.openai.OpenAiChatAutoConfiguration
      - org.springframework.ai.autoconfigure.openai.OpenAiEmbeddingAutoConfiguration
```

### Default Model Changes

Spring AI 2.0 changes some defaults:

| Setting           | Old Default (1.x) | New Default (2.0) | Action Required           |
| ----------------- | ----------------- | ----------------- | ------------------------- |
| OpenAI chat model | `gpt-4o-mini`     | `gpt-5-mini`      | Explicit config if needed |
| Temperature       | Implicit defaults | Not set           | Must configure explicitly |

### Version Property Update

```yaml
# Before (1.x)
spring-ai.version: 1.1.2

# After (2.0)
spring-ai.version: 2.0.0-M1
```

## Spring Milestones Repository

Spring AI 2.0.0-M1 is a milestone release requiring the Spring Milestones repository:

### Maven

```xml
<repositories>
    <repository>
        <id>spring-milestones</id>
        <name>Spring Milestones</name>
        <url>https://repo.spring.io/milestone</url>
        <snapshots>
            <enabled>false</enabled>
        </snapshots>
    </repository>
</repositories>
```

### Gradle

```kotlin
repositories {
    maven { url = uri("https://repo.spring.io/milestone") }
}
```

## Benefits of Migration

- **Spring Boot 4 compatibility** - Required for autoconfigure module split
- **Provider-agnostic code** - TextToSpeechModel works with OpenAI, ElevenLabs, and future providers
- **Cleaner API** - Shared interfaces instead of provider-specific classes
- **Future compatibility** - Aligned with Spring AI's abstraction direction
- **Simplified provider selection** - Use `spring.ai.model.*` instead of excludes

## Migration Steps (Complete)

1. **Update version** - Change Spring AI to 2.0.0-M1 in build files
2. **Add repository** - Add Spring Milestones repo for milestone releases
3. **Update imports** - Replace SpeechModel classes with TextToSpeechModel classes
4. **Update types** - Change `SpeechModel` to `TextToSpeechModel` in declarations
5. **Fix speed params** - Remove `f` suffix from speed values
6. **Update constants** - Replace memory advisor constant names
7. **Migrate provider selection** - Replace autoconfigure excludes with `spring.ai.model.*`
8. **Configure defaults** - Explicitly set temperature and model if needed
9. **Run tests** - Verify TTS and chat memory functionality
