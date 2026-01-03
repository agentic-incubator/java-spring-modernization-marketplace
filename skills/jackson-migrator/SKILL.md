---
name: jackson-migrator
description: Migrate Jackson 2.x to 3.x including groupId changes, import updates, and exception handling. Use when upgrading Jackson dependencies or fixing Jackson-related compilation errors after Spring Boot 4 upgrade.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Jackson Migrator

Migrate Jackson 2.x to Jackson 3.x with proper import and dependency updates.

## Critical Rules

1. **Jackson annotations STAY at `com.fasterxml.jackson.annotation`** - They are backward compatible!
2. **Jackson core moves to `tools.jackson`**
3. **`JsonProcessingException` becomes `JacksonException`**
4. **Add Jackson BOM for version management**

## Import Mappings

| Category    | Old Import                                           | New Import                            |
| ----------- | ---------------------------------------------------- | ------------------------------------- |
| Exception   | `com.fasterxml.jackson.core.JsonProcessingException` | `tools.jackson.core.JacksonException` |
| Core        | `com.fasterxml.jackson.core.*`                       | `tools.jackson.core.*`                |
| Databind    | `com.fasterxml.jackson.databind.*`                   | `tools.jackson.databind.*`            |
| Dataformat  | `com.fasterxml.jackson.dataformat.*`                 | `tools.jackson.dataformat.*`          |
| Datatype    | `com.fasterxml.jackson.datatype.*`                   | `tools.jackson.datatype.*`            |
| Module      | `com.fasterxml.jackson.module.*`                     | `tools.jackson.module.*`              |
| Annotations | `com.fasterxml.jackson.annotation.*`                 | **NO CHANGE**                         |

## Maven Migration

### Before

```xml
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
</dependency>
```

### After

```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>tools.jackson</groupId>
            <artifactId>jackson-bom</artifactId>
            <version>3.0.2</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>

<dependency>
    <groupId>tools.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
</dependency>
```

## Gradle Migration

### Groovy DSL - Before

```groovy
dependencies {
    implementation 'com.fasterxml.jackson.core:jackson-databind'
}
```

### Groovy DSL - After

```groovy
dependencies {
    implementation platform('tools.jackson:jackson-bom:3.0.2')
    implementation 'tools.jackson.core:jackson-databind'
}
```

### Kotlin DSL - Before

```kotlin
dependencies {
    implementation("com.fasterxml.jackson.core:jackson-databind")
}
```

### Kotlin DSL - After

```kotlin
dependencies {
    implementation(platform("tools.jackson:jackson-bom:3.0.2"))
    implementation("tools.jackson.core:jackson-databind")
}
```

## Java Code Migration

### Before

```java
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.annotation.JsonProperty;

public class MyService {
    private final ObjectMapper mapper = new ObjectMapper();

    public String serialize(Object obj) throws JsonProcessingException {
        return mapper.writeValueAsString(obj);
    }
}
```

### After

```java
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.annotation.JsonProperty; // UNCHANGED!

public class MyService {
    private final ObjectMapper mapper = new ObjectMapper();

    public String serialize(Object obj) throws JacksonException {
        return mapper.writeValueAsString(obj);
    }
}
```

## Migration Steps

1. **Update build file** - Add Jackson BOM, change groupIds
2. **Update imports** - Change `com.fasterxml.jackson.core/databind` to `tools.jackson`
3. **Update exceptions** - `JsonProcessingException` → `JacksonException`
4. **Keep annotations** - Do NOT change `com.fasterxml.jackson.annotation.*`
5. **Run build** - Verify compilation
6. **Run tests** - Verify functionality

## Idempotent Transformation Logic

This skill implements idempotent transformations that can be safely run multiple times. Each transformation:

1. **Reads migration state** - Loads `.migration-state.yaml` to check applied transformations
2. **Checks if already applied** - Skips transformations with version >= applied version
3. **Detects if still needed** - Uses regex patterns to verify transformation is required
4. **Applies transformation** - Only executes if detection pattern matches
5. **Updates state** - Records transformation in state file with version and commit SHA

### Transformation Flow

```yaml
# Example state file entry after jackson-migrator runs
appliedTransformations:
  - skill: jackson-migrator
    version: 1.0.0
    transformations:
      - jackson-imports
      - jackson-groupid
      - jackson-exception-handling
      - jackson-bom
    completedAt: 2026-01-03T10:35:00Z
    commitSha: abc123def
```

### Detection Patterns

Each transformation has a detection pattern in `metadata.yaml`:

| Transformation ID            | Detection Pattern                                                    | Purpose                    |
| ---------------------------- | -------------------------------------------------------------------- | -------------------------- |
| `jackson-imports`            | `import\s+com\.fasterxml\.jackson\.(core\|databind\|dataformat\|...` | Find old Jackson imports   |
| `jackson-groupid`            | `com\.fasterxml\.jackson\.(core\|databind\|dataformat\|...`          | Find old groupIds in build |
| `jackson-exception-handling` | `JsonProcessingException\|JsonMappingException\|JsonParseException`  | Find old exception classes |
| `jackson-bom`                | `tools\.jackson:jackson-bom` (inverse)                               | Detect missing BOM         |

### Skip Logic

Before applying any transformation:

1. Load state from `.migration-state.yaml`
2. For each transformation in `metadata.yaml`:
   - Check if `skill: jackson-migrator` exists in `appliedTransformations`
   - If yes, check if transformation ID is in the list
   - If yes, compare versions: skip if `appliedVersion >= currentVersion`
   - If no or version is older, run detection pattern
3. If detection pattern matches, apply transformation
4. If detection pattern doesn't match, skip (already transformed or not applicable)

### Version Comparison

Transformations are only reapplied if:

- Transformation ID not found in state file, OR
- Applied version < current version (e.g., 0.9.0 < 1.0.0), OR
- Detection pattern still matches (manual revert detected)

### State Updates

After successful transformation:

```yaml
# Updated .migration-state.yaml
skill: jackson-migrator
version: 1.0.0
transformations: [jackson-imports, jackson-groupid, jackson-exception-handling, jackson-bom]
completedAt: 2026-01-03T10:35:00Z
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
