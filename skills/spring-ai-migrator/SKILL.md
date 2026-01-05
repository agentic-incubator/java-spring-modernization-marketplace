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

## Jackson 2 Compatibility Layer (Spring AI 2.0.0-M\*)

**NEW in v2.2.0**: Spring AI 2.0.0-M\* milestone releases require Jackson 2 while Spring Boot 4 uses Jackson 3.
This section covers the temporary compatibility layer needed for Spring AI milestones.

### Problem

**Spring AI 2.0.0-M1** requires Jackson 2 (`com.fasterxml.jackson.*` packages)
**Spring Boot 4** uses Jackson 3 (`tools.jackson.*` packages)

**Root Cause**: Spring AI's ChromaVectorStoreAutoConfiguration still imports Jackson 2's ObjectMapper:

```java
// From Spring AI 2.0.0-M1 source
import com.fasterxml.jackson.databind.ObjectMapper;  // Jackson 2!
```

**Error Without Compatibility Layer**:

```text
No qualifying bean of type 'com.fasterxml.jackson.databind.ObjectMapper' available
```

### Version Gate (Milestone Only)

This transformation **ONLY** applies when:

- ✅ Spring AI version matches `2.0.0-M*` (milestone releases)
- ✅ Spring Boot version is `4.0.0+`
- ❌ Spring AI version is GA (`2.0.0`, `2.0.1`, etc.) - **SKIP** (GA likely supports Jackson 3)

### Solution: Dual Jackson Environment

Run both Jackson 2 and Jackson 3 simultaneously:

- **Jackson 3**: Used by Spring Boot 4 (tools.jackson.\*)
- **Jackson 2**: Provided explicitly for Spring AI (com.fasterxml.jackson.\*)

### Before (Fails with Spring AI 2.0.0-M1 + Boot 4)

**pom.xml**:

```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>4.0.0</version>
</parent>

<properties>
    <spring-ai.version>2.0.0-M1</spring-ai.version>
</properties>

<dependencies>
    <dependency>
        <groupId>org.springframework.ai</groupId>
        <artifactId>spring-ai-openai-spring-boot-starter</artifactId>
    </dependency>
</dependencies>
```

**Result**: Application fails to start:

```text
***************************
APPLICATION FAILED TO START
***************************

Description:

Parameter 0 of constructor in org.springframework.ai.vectorstore.chroma.ChromaVectorStoreAutoConfiguration
required a bean of type 'com.fasterxml.jackson.databind.ObjectMapper' that could not be found.
```

### After (Jackson 2 + 3 Coexistence)

**pom.xml** (additions):

```xml
<!-- Jackson 2 dependencies for Spring AI compatibility (Spring AI 2.0.0-M1 requires Jackson 2) -->
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
    <version>2.18.2</version>
</dependency>
<dependency>
    <groupId>com.fasterxml.jackson.datatype</groupId>
    <artifactId>jackson-datatype-jsr310</artifactId>
    <version>2.18.2</version>
</dependency>
```

`src/main/java/<base-package>/config/JacksonConfiguration.java` (created):

```java
package com.example.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Jackson 2 configuration for Spring AI compatibility.
 *
 * <p>Spring AI 2.0.0-M1 requires Jackson 2's {@link ObjectMapper} but Spring Boot 4
 * only auto-configures Jackson 3's {@code tools.jackson.databind.json.JsonMapper}.
 * This configuration provides a Jackson 2 ObjectMapper bean to satisfy Spring AI's
 * requirements.
 *
 * <p>This is a temporary workaround until Spring AI 2.0 GA adds full Jackson 3 support
 * (expected H1 2026).
 *
 * @see <a href="https://spring.io/blog/2025/10/07/introducing-jackson-3-support-in-spring/">Spring Jackson 3 Support</a>
 * @see <a href="https://github.com/FasterXML/jackson/blob/main/jackson3/MIGRATING_TO_JACKSON_3.md">Jackson 3 Migration Guide</a>
 */
@Configuration
public class JacksonConfiguration {

    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }
}
```

**Result**: Application starts successfully with both Jackson versions:

```text
Dependency tree:
  com.fasterxml.jackson.core:jackson-databind:2.18.2  (Jackson 2 - for Spring AI)
  tools.jackson.core:jackson-databind:3.0.3          (Jackson 3 - for Spring Boot 4)
```

### Gradle Example

**build.gradle.kts** (additions):

```kotlin
dependencies {
    // Jackson 2 for Spring AI 2.0.0-M1 compatibility
    implementation("com.fasterxml.jackson.core:jackson-databind:2.18.2")
    implementation("com.fasterxml.jackson.datatype:jackson-datatype-jsr310:2.18.2")
}
```

### Package Detection Strategy

The configuration class is placed in `<base-package>.config`:

```bash
# Find main application class
MAIN_CLASS=$(grep -r "@SpringBootApplication" src/main/java/ -l)

# Extract package: com.example.app.Application → com.example.app
BASE_PACKAGE=$(grep "^package" "$MAIN_CLASS" | cut -d' ' -f2 | sed 's/;$//')

# Use config subpackage: com.example.app.config
CONFIG_PACKAGE="${BASE_PACKAGE}.config"

# Create JacksonConfiguration.java in that package
CONFIG_FILE="src/main/java/$(echo $CONFIG_PACKAGE | tr '.' '/')/JacksonConfiguration.java"
```

### When to Remove This Compatibility Layer

**Remove when upgrading to Spring AI 2.0.0 GA or later** (GA releases support Jackson 3)

**Removal Steps**:

1. **Remove Jackson 2 dependencies** from `pom.xml` or `build.gradle.kts`:

   ```bash
   # Remove these lines
   <dependency>
       <groupId>com.fasterxml.jackson.core</groupId>
       <artifactId>jackson-databind</artifactId>
       <version>2.18.2</version>
   </dependency>
   <dependency>
       <groupId>com.fasterxml.jackson.datatype</groupId>
       <artifactId>jackson-datatype-jsr310</artifactId>
       <version>2.18.2</version>
   </dependency>
   ```

2. **Delete JacksonConfiguration.java**:

   ```bash
   rm src/main/java/com/example/config/JacksonConfiguration.java
   ```

3. **Verify application still compiles**:

   ```bash
   ./mvnw clean compile
   ```

4. **Run tests** to confirm no regressions:

   ```bash
   ./mvnw test
   ```

### Integration with Migration State

```yaml
appliedTransformations:
  - skill: spring-ai-migrator
    version: '2.2.0'
    transformations:
      - tts-model-rename
      - speed-parameter
      - advisor-constants
      - autoconfigure-provider-selection
      - autoconfigure-class-split
      - milestones-repository
      - jackson-2-compatibility-layer # NEW transformation
    jacksonCompatibility:
      applied: true
      jackson2Version: '2.18.2'
      jackson3Version: '3.0.2' # From Spring Boot 4 BOM
      coexistenceMode: true
      configurationClass: 'src/main/java/com/example/config/JacksonConfiguration.java'
      reason: 'Spring AI 2.0.0-M1 requires Jackson 2'
      temporaryWorkaround: true
      expectedRemovalVersion: '2.0.0' # Remove when Spring AI GA
      removalGuidance: |
        When upgrading to Spring AI 2.0.0 GA or later:
        1. Remove Jackson 2 dependencies from build file
        2. Delete JacksonConfiguration.java
        3. Run mvn clean compile to verify
        4. Run tests to confirm no regressions
    completedAt: '2026-01-05T12:00:00Z'
    commitSha: 'abc123def456'
```

### Important Notes

1. **Temporary workaround**: This is explicitly a temporary solution for milestone releases
2. **GA releases**: Spring AI 2.0.0 GA and later will support Jackson 3 natively
3. **No conflicts**: Jackson 2 and 3 can coexist safely due to different package names
4. **Performance impact**: Negligible - both libraries are loaded but used by different components
5. **Spring Boot 4 still uses Jackson 3**: Your application code should use Jackson 3 APIs (tools.jackson.\*)

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

## Idempotent Transformation Logic

This skill implements idempotent transformations that can be safely run multiple times. Each transformation:

1. **Reads migration state** - Loads `.migration-state.yaml` to check applied transformations
2. **Checks if already applied** - Skips transformations with version >= applied version
3. **Detects if still needed** - Uses regex patterns to verify transformation is required
4. **Applies transformation** - Only executes if detection pattern matches
5. **Updates state** - Records transformation in state file with version and commit SHA

### Transformation Flow

```yaml
# Example state file entry after spring-ai-migrator runs
appliedTransformations:
  - skill: spring-ai-migrator
    version: 2.0.0
    transformations:
      - tts-model-rename
      - speed-parameter
      - advisor-constants
      - autoconfigure-provider-selection
      - autoconfigure-class-split
      - milestones-repository
    completedAt: 2026-01-03T11:30:00Z
    commitSha: def456abc
```

### Detection Patterns

Each transformation has a detection pattern in `metadata.yaml`:

| Transformation ID                  | Detection Pattern                                                                                   | Purpose                              |
| ---------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `tts-model-rename`                 | `SpeechModel\|SpeechPrompt\|SpeechResponse\|SpeechMessage`                                          | Find old TTS class names             |
| `speed-parameter`                  | `\.speed\s*\(\s*\d+\.\d+f\s*\)`                                                                     | Find Float speed parameters          |
| `advisor-constants`                | `CHAT_MEMORY_RETRIEVE_SIZE_KEY\|DEFAULT_CHAT_MEMORY_RESPONSE_SIZE\|CHAT_MEMORY_CONVERSATION_ID_KEY` | Find old advisor constants           |
| `autoconfigure-provider-selection` | `spring:\s*\n\s*autoconfigure:\s*\n\s*exclude:.*OpenAiAutoConfiguration`                            | Find autoconfigure excludes          |
| `autoconfigure-class-split`        | `org\.springframework\.ai\.autoconfigure\.openai\.OpenAiAutoConfiguration`                          | Find monolithic autoconfigure class  |
| `milestones-repository`            | `spring-ai\.version.*2\.0\.0-M1`                                                                    | Detect Spring AI 2.0 milestone usage |

### Skip Logic

Before applying any transformation:

1. Load state from `.migration-state.yaml`
2. For each transformation in `metadata.yaml`:
   - Check if `skill: spring-ai-migrator` exists in `appliedTransformations`
   - If yes, check if transformation ID is in the list
   - If yes, compare versions: skip if `appliedVersion >= currentVersion`
   - If no or version is older, run detection pattern
3. If detection pattern matches, apply transformation
4. If detection pattern doesn't match, skip (already transformed or not applicable)

### Version Comparison

Transformations are only reapplied if:

- Transformation ID not found in state file, OR
- Applied version < current version (e.g., 1.0.0 < 2.0.0), OR
- Detection pattern still matches (manual revert detected)

**Example upgrade scenario:**

```yaml
# User ran spring-ai-migrator v1.0.0 previously
appliedTransformations:
  - skill: spring-ai-migrator
    version: 1.0.0
    transformations: [tts-model-rename, speed-parameter, advisor-constants]

# Marketplace upgraded to v2.0.0 with new transformations
# On resume, these transformations are applied:
# - autoconfigure-provider-selection (new in 2.0.0)
# - autoconfigure-class-split (new in 2.0.0)
# - milestones-repository (new in 2.0.0)
# Existing transformations are skipped (already at v1.0.0)
```

### State Updates

After successful transformation:

```yaml
# Updated .migration-state.yaml
skill: spring-ai-migrator
version: 2.0.0
transformations:
  [
    tts-model-rename,
    speed-parameter,
    advisor-constants,
    autoconfigure-provider-selection,
    autoconfigure-class-split,
    milestones-repository,
  ]
completedAt: 2026-01-03T11:30:00Z
commitSha: <git-commit-sha>
```

The state file is committed with the migration changes for audit trail.

## Integration with Migration State Skill

This skill depends on the `migration-state` skill (v1.0.0+) for:

- Reading `.migration-state.yaml`
- Checking applied transformations
- Updating state after successful transformation
- Version comparison logic

See `skills/migration-state/SKILL.md` for state management details.
