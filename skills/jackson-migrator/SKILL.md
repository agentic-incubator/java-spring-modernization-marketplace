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
            <version>3.1.3</version>
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
    implementation platform('tools.jackson:jackson-bom:3.1.3')
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
    implementation(platform("tools.jackson:jackson-bom:3.1.3"))
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

## Transformation Protocol

Follows the standard migration protocol — see `migration-protocol` skill for the full
transformation loop, skip logic, state file format, and build verification commands.

**Dependencies:** `migration-state` >= 1.0.0, `build-runner` >= 1.0.0

### Skill State Entry

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

### State Updates

```yaml
skill: jackson-migrator
version: 1.2.0
transformations:
  [jackson-imports, jackson-groupid, jackson-exception-handling, jackson-bom, jackson-docs]
completedAt: <ISO-8601-timestamp>
commitSha: <git-commit-sha>
```

## Documentation Migration (v1.2.0+)

Starting with version 1.2.0, the jackson-migrator also updates Jackson examples and references in documentation files.

### What Gets Updated

The `jackson-docs` transformation updates:

- **README.md**: Jackson code examples, dependency snippets, version references
- **docs/migrations.md**: Jackson migration guides with before/after examples
- **docs/getting-started.md**: Quick start examples using Jackson
- **docs/troubleshooting.md**: Error messages and exception handling examples

### Detection Pattern

Documentation migration only runs if:

1. Documentation directory exists (`docs/` or README.md found)
2. Jackson references detected in documentation files:
   - `com.fasterxml.jackson` import statements in code blocks
   - `JsonProcessingException` or `JsonMappingException` in examples
   - Maven/Gradle dependencies with Jackson groupId

### Example: README Before

````markdown
## Quick Start

```java
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

public void serialize() throws JsonProcessingException {
    ObjectMapper mapper = new ObjectMapper();
    String json = mapper.writeValueAsString(myObject);
}
```

**Maven Dependency:**

```xml
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
    <version>2.17.0</version>
</dependency>
```
````

### Example: README After

````markdown
## Quick Start

```java
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

public void serialize() throws JacksonException {
    ObjectMapper mapper = new ObjectMapper();
    String json = mapper.writeValueAsString(myObject);
}
```

**Maven Dependency:**

```xml
<dependency>
    <groupId>tools.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
    <version>3.0.2</version>
</dependency>
```
````

### Documentation State Tracking

Documentation changes are tracked separately in the state file:

```yaml
skill: jackson-migrator
version: 1.2.0
transformations:
  - jackson-imports
  - jackson-groupid
  - jackson-exception-handling
  - jackson-bom
  - jackson-docs # Documentation transformation
completedAt: 2026-01-03T10:35:00Z
commitSha: abc123def456
documentationChanges: # Tracked separately
  filesUpdated:
    - README.md
    - docs/migrations.md
    - docs/getting-started.md
  linesChanged: 45
  examplesUpdated: 8 # Code blocks updated
```

### Optional Execution

The jackson-docs transformation is **optional**:

- Skipped if no `docs/` directory exists
- Skipped if no Jackson references found in documentation
- Runs automatically when relevant documentation is detected

### Integration with Documentation-Migrator

The jackson-docs transformation:

- Updates **domain-specific** Jackson examples in documentation
- Works alongside `documentation-migrator` which handles cross-cutting version references
- Prevents duplication through section-based boundaries (e.g., "## Jackson 2.x to 3.x" section in docs/migrations.md)
