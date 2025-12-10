---
name: spring-ai-migrator
description: Migrate Spring AI 1.0.x to 1.1.x including TTS API changes (SpeechModel to TextToSpeechModel), speed parameter type change (Float to Double), and chat memory advisor constant renames. Use when upgrading Spring AI or fixing Spring AI compilation errors.
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Spring AI Migrator

Migrate Spring AI 1.0.x to Spring AI 1.1.x with TTS API and advisor changes.

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

## Benefits of Migration

- **Provider-agnostic code** - TextToSpeechModel works with OpenAI, ElevenLabs, and future providers
- **Cleaner API** - Shared interfaces instead of provider-specific classes
- **Future compatibility** - Aligned with Spring AI's abstraction direction
