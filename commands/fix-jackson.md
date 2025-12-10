---
description: Fix Jackson 3 migration issues in a project
argument-hint: [project-path]
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Fix Jackson 3 Issues

Fix Jackson 3 migration issues in `$ARGUMENTS` (or current directory).

## Common Issues

### Issue 1: Wrong annotation import changed

**Symptom:** `com.fasterxml.jackson.annotation.*` was changed to `tools.jackson.annotation.*`

**Fix:** Revert annotation imports - they are backward compatible!

```java
// CORRECT - keep as-is
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonIgnore;
```

### Issue 2: JsonProcessingException not found

**Symptom:** `cannot find symbol: JsonProcessingException`

**Fix:** Change to `JacksonException`

```java
// Before
import com.fasterxml.jackson.core.JsonProcessingException;

// After
import tools.jackson.core.JacksonException;
```

### Issue 3: Missing Jackson BOM

**Symptom:** Version conflicts or missing classes

**Fix:** Add Jackson BOM to dependency management

**Maven:**

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
```

**Gradle:**

```kotlin
dependencies {
    implementation(platform("tools.jackson:jackson-bom:3.0.2"))
}
```

### Issue 4: Wrong groupId

**Symptom:** `package com.fasterxml.jackson.core does not exist`

**Fix:** Update imports

```java
// Before
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.ObjectMapper;

// After
import tools.jackson.core.JsonParser;
import tools.jackson.databind.ObjectMapper;
```

## Verification

After fixes, run:

```bash
mvn clean package -DskipTests
# or
./gradlew clean build -x test
```
