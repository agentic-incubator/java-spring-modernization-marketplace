# JUnit4 to JUnit5 Migrator Skill

**Skill ID:** `junit4-to-junit5-migrator`
**Version:** 1.0.0
**Category:** Transformation & Migration
**Priority:** HIGH (upgrades testing infrastructure)

---

## Purpose

Automate migration from JUnit4 to JUnit5 (Jupiter) test framework. JUnit4 is end-of-life and Spring Boot 4.x promotes JUnit5 as the standard
testing framework. This skill handles all import changes, annotation migrations, and build configuration updates required for the migration.

---

## Problem Statement

JUnit4 → JUnit5 migration is a common requirement in enterprise Spring Boot 4.x migrations:

1. **Import Changes:** `org.junit.*` → `org.junit.jupiter.api.*`
2. **Runner Changes:** `@RunWith(SpringRunner.class)` → `@ExtendWith(SpringExtension.class)`
3. **Assertion Changes:** `org.junit.Assert` → `org.junit.jupiter.api.Assertions`
4. **Build Configuration:** Gradle requires explicit `test { useJUnitPlatform() }`

**Impact:** Test failures and outdated testing patterns block Spring Boot 4.x migrations.

---

## Migration Patterns

### 1. Test Annotation Migration

**Pattern:**

```java
// BEFORE (JUnit4)
import org.junit.Test;

public class MyTest {
    @Test
    public void testMethod() {
        // test code
    }
}
```

**After:**

```java
// AFTER (JUnit5)
import org.junit.jupiter.api.Test;

public class MyTest {
    @Test
    public void testMethod() {
        // test code
    }
}
```

**Detection:**

```bash
grep -r "import org\.junit\.Test" --include="*.java"
```

**Transformation:**

```text
REPLACE: import org.junit.Test;
WITH:    import org.junit.jupiter.api.Test;
```

---

### 2. Runner Migration (Spring Tests)

**Pattern:**

```java
// BEFORE (JUnit4)
import org.junit.runner.RunWith;
import org.springframework.test.context.junit4.SpringRunner;

@RunWith(SpringRunner.class)
@SpringBootTest
public class MyIntegrationTest {
    @Test
    public void testMethod() { }
}
```

**After:**

```java
// AFTER (JUnit5)
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.test.context.junit.jupiter.SpringExtension;

@ExtendWith(SpringExtension.class)
@SpringBootTest
public class MyIntegrationTest {
    @Test
    public void testMethod() { }
}
```

**Detection:**

```bash
grep -r "@RunWith\|SpringRunner" --include="*.java"
```

**Transformations:**

```text
1. REPLACE: import org.junit.runner.RunWith;
   WITH:    import org.junit.jupiter.api.extension.ExtendWith;

2. REPLACE: import org.springframework.test.context.junit4.SpringRunner;
   WITH:    import org.springframework.test.context.junit.jupiter.SpringExtension;

3. REPLACE: @RunWith(SpringRunner.class)
   WITH:    @ExtendWith(SpringExtension.class)
```

---

### 3. Assertion Migration

**Pattern:**

```java
// BEFORE (JUnit4)
import static org.junit.Assert.*;

@Test
public void testEquals() {
    assertEquals("expected", actual);
    assertTrue(condition);
    assertFalse(condition);
    assertNull(object);
    assertNotNull(object);
}
```

**After:**

```java
// AFTER (JUnit5)
import static org.junit.jupiter.api.Assertions.*;

@Test
public void testEquals() {
    assertEquals("expected", actual);
    assertTrue(condition);
    assertFalse(condition);
    assertNull(object);
    assertNotNull(object);
}
```

**Detection:**

```bash
grep -r "import static org\.junit\.Assert\.\*" --include="*.java"
grep -r "import org\.junit\.Assert" --include="*.java"
```

**Transformation:**

```text
REPLACE: import static org.junit.Assert.*;
WITH:    import static org.junit.jupiter.api.Assertions.*;

REPLACE: import org.junit.Assert;
WITH:    import org.junit.jupiter.api.Assertions;
```

---

### 4. Lifecycle Annotation Migration

**Pattern:**

```java
// BEFORE (JUnit4)
import org.junit.Before;
import org.junit.After;
import org.junit.BeforeClass;
import org.junit.AfterClass;
import org.junit.Ignore;

public class MyTest {
    @Before
    public void setUp() { }

    @After
    public void tearDown() { }

    @BeforeClass
    public static void setUpClass() { }

    @AfterClass
    public static void tearDownClass() { }

    @Ignore("Not ready yet")
    @Test
    public void testSkipped() { }
}
```

**After:**

```java
// AFTER (JUnit5)
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Disabled;

public class MyTest {
    @BeforeEach
    public void setUp() { }

    @AfterEach
    public void tearDown() { }

    @BeforeAll
    public static void setUpClass() { }

    @AfterAll
    public static void tearDownClass() { }

    @Disabled("Not ready yet")
    @Test
    public void testSkipped() { }
}
```

**Transformations:**

```text
@Before      → @BeforeEach
@After       → @AfterEach
@BeforeClass → @BeforeAll
@AfterClass  → @AfterAll
@Ignore      → @Disabled
```

---

### 5. Expected Exceptions Migration

**Pattern:**

```java
// BEFORE (JUnit4)
@Test(expected = IllegalArgumentException.class)
public void testException() {
    throw new IllegalArgumentException("error");
}
```

**After:**

```java
// AFTER (JUnit5)
import static org.junit.jupiter.api.Assertions.assertThrows;

@Test
public void testException() {
    assertThrows(IllegalArgumentException.class, () -> {
        throw new IllegalArgumentException("error");
    });
}
```

**Note:** This requires manual code restructuring. Automated transformation is complex.

**Recommendation:** Flag for manual review with suggestion.

---

### 6. Gradle Configuration Update

**Pattern:**

```gradle
// BEFORE (Gradle without JUnit5 config)
dependencies {
    testImplementation 'junit:junit:4.13.2'
}

test {
    // No useJUnitPlatform()
}
```

**After:**

```gradle
// AFTER (Gradle with JUnit5 config)
dependencies {
    testImplementation 'org.junit.jupiter:junit-jupiter:5.10.0'
}

test {
    useJUnitPlatform()  // REQUIRED for JUnit5
}
```

**Transformations:**

1. Update test dependency to junit-jupiter
2. Add `test { useJUnitPlatform() }` block

---

### 7. Maven Configuration Update

**Pattern:**

```xml
<!-- BEFORE (Maven with JUnit4) -->
<dependency>
    <groupId>junit</groupId>
    <artifactId>junit</artifactId>
    <version>4.13.2</version>
    <scope>test</scope>
</dependency>
```

**After:**

```xml
<!-- AFTER (Maven with JUnit5) -->
<dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter</artifactId>
    <scope>test</scope>
</dependency>
```

**Note:** Spring Boot BOM manages JUnit5 version, no explicit version needed.

---

## Migration Algorithm

```text
1. DETECT JUnit4 usage
   - Scan for import org.junit.Test
   - Scan for @RunWith annotations
   - Scan for JUnit4 dependencies

2. IF JUnit4 detected:

   PHASE 1: Import Migration
   - Replace all JUnit4 imports with JUnit5 equivalents
   - Update lifecycle annotations (@Before → @BeforeEach, etc.)
   - Update assertion imports

   PHASE 2: Annotation Migration
   - @RunWith(SpringRunner.class) → @ExtendWith(SpringExtension.class)
   - @Ignore → @Disabled
   - Flag @Test(expected=...) for manual review

   PHASE 3: Build File Updates
   - IF Gradle:
     - Update junit dependency to junit-jupiter
     - Add test { useJUnitPlatform() } if missing
   - IF Maven:
     - Update junit dependency to junit-jupiter

   PHASE 4: Validation
   - Run ./gradlew test or mvn test
   - Verify tests are discovered and executed
   - Report any failures

3. GENERATE migration report with:
   - Files modified
   - Patterns migrated
   - Manual review items
   - Test execution results
```

---

## Import Mapping Table

| JUnit4 Import                                                     | JUnit5 Import                                                    |
| ----------------------------------------------------------------- | ---------------------------------------------------------------- |
| `org.junit.Test`                                                  | `org.junit.jupiter.api.Test`                                     |
| `org.junit.Before`                                                | `org.junit.jupiter.api.BeforeEach`                               |
| `org.junit.After`                                                 | `org.junit.jupiter.api.AfterEach`                                |
| `org.junit.BeforeClass`                                           | `org.junit.jupiter.api.BeforeAll`                                |
| `org.junit.AfterClass`                                            | `org.junit.jupiter.api.AfterAll`                                 |
| `org.junit.Ignore`                                                | `org.junit.jupiter.api.Disabled`                                 |
| `org.junit.Assert`                                                | `org.junit.jupiter.api.Assertions`                               |
| `org.junit.runner.RunWith`                                        | `org.junit.jupiter.api.extension.ExtendWith`                     |
| `org.springframework.test.context.junit4.SpringRunner`            | `org.springframework.test.context.junit.jupiter.SpringExtension` |
| `org.springframework.test.context.junit4.SpringJUnit4ClassRunner` | `org.springframework.test.context.junit.jupiter.SpringExtension` |

---

## Automation Strategy

### Fully Automated (100%)

✅ Import statement replacements
✅ @Test annotation import updates
✅ @RunWith → @ExtendWith migration
✅ SpringRunner → SpringExtension migration
✅ Lifecycle annotation updates (@Before → @BeforeEach)
✅ Assertion import updates
✅ Gradle test { useJUnitPlatform() } addition
✅ Dependency updates (Maven/Gradle)

### Partially Automated (Flag for Review)

⚠️ @Test(expected=...) → assertThrows() migration
⚠️ Custom runners (non-Spring runners)
⚠️ JUnit4 Rules → JUnit5 Extensions

### Manual Only

❌ Complex parameterized tests
❌ Custom test runners
❌ Legacy test suites

---

## Output Format

```yaml
junit5Migration:
  detected: true
  filesAnalyzed: 45
  filesModified: 38
  testFilesAffected: 38

  patterns:
    testAnnotations: 120
    runWithAnnotations: 38
    lifecycleAnnotations: 85
    assertionImports: 38

  transformations:
    - type: 'IMPORT_MIGRATION'
      count: 250
      examples:
        - file: 'src/test/java/com/example/UserServiceTest.java'
          line: 5
          before: 'import org.junit.Test;'
          after: 'import org.junit.jupiter.api.Test;'

    - type: 'RUNNER_MIGRATION'
      count: 38
      examples:
        - file: 'src/test/java/com/example/integration/ApiTest.java'
          line: 12
          before: '@RunWith(SpringRunner.class)'
          after: '@ExtendWith(SpringExtension.class)'

    - type: 'LIFECYCLE_MIGRATION'
      count: 85
      examples:
        - file: 'src/test/java/com/example/BaseTest.java'
          line: 18
          before: '@Before'
          after: '@BeforeEach'

  buildUpdates:
    gradle:
      updated: true
      changes:
        - 'Updated test dependency to junit-jupiter'
        - 'Added test { useJUnitPlatform() }'

  manualReviewRequired:
    - issue: 'Expected exception tests'
      count: 5
      files:
        - 'src/test/java/com/example/ValidationTest.java:45'
        - 'src/test/java/com/example/SecurityTest.java:67'
      recommendation: 'Migrate @Test(expected=...) to assertThrows() manually'

  validation:
    testsDiscovered: 120
    testsPassed: 118
    testsFailed: 2
    failureReasons:
      - 'Expected exception migration needed (2 tests)'

  summary:
    automationRate: '95%'
    estimatedEffort: '30 minutes for manual reviews'
    status: 'MOSTLY_AUTOMATED'
```

---

## Execution Logic

### Phase 1: Detection

**Tools Used:** Grep, Read

**Scans:**

```bash
# Detect JUnit4 usage
grep -r "import org\.junit\.Test" --include="*.java" | wc -l
grep -r "@RunWith" --include="*.java" | wc -l
grep -r "junit:junit" --include="*.xml" --include="*.gradle"
```

**If Detected:** Proceed with migration

### Phase 2: Import Migration

**Tools Used:** Read, Edit

**For Each Test File:**

1. Read entire file
2. Apply import replacement patterns
3. Update using Edit tool with replace_all=true for consistent imports

### Phase 3: Annotation Migration

**Tools Used:** Read, Edit

**For Each Test File:**

1. Replace @RunWith with @ExtendWith
2. Replace SpringRunner with SpringExtension
3. Replace lifecycle annotations
4. Flag @Test(expected=...) for manual review

### Phase 4: Build File Updates

**Gradle:**

```gradle
test {
    useJUnitPlatform()
}

dependencies {
    testImplementation 'org.junit.jupiter:junit-jupiter'
}
```

**Maven:**

```xml
<dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter</artifactId>
    <scope>test</scope>
</dependency>
```

### Phase 5: Validation

**Run Tests:**

```bash
./gradlew test
# or
mvn test
```

**Check Results:**

- Tests discovered?
- Tests passing?
- Any failures related to migration?

---

## Integration Points

### Used by Agents

- **migration-agent** (Phase 9: Testing Framework Migration)

### Uses Skills

- **build-file-updater** - Update Gradle/Maven test configurations
- **import-migrator** - Bulk import replacements

### Triggers

- Auto-triggered when JUnit4 usage detected during discovery
- Manual invocation when migrating to Spring Boot 4.x

---

## OpenRewrite Integration

This skill can optionally use OpenRewrite for automated migration:

**Recipe:** `org.openrewrite.java.testing.junit5.JUnit4to5Migration`

**Advantages:**

- AST-based transformation (more accurate)
- Handles complex patterns
- Includes parameterized test migration

**Implementation:**

```bash
./mvnw org.openrewrite.maven:rewrite-maven-plugin:run \
  -Drewrite.activeRecipes=org.openrewrite.java.testing.junit5.JUnit4to5Migration
```

**Usage:** Skill can use OpenRewrite if available, otherwise fallback to regex-based migration.

---

## Validation Rules

### Pre-Migration Checks

- ✅ JUnit4 dependencies present
- ✅ Test files using JUnit4 imports
- ✅ Build tool version compatible (Gradle 4.6+, Maven 2.22.0+)

### Post-Migration Validation

- ✅ All imports updated
- ✅ test { useJUnitPlatform() } present (Gradle)
- ✅ Tests discoverable by test runner
- ✅ No compilation errors
- ⚠️ Test execution results reviewed

---

## Exit Criteria

The skill completes successfully when:

1. All JUnit4 imports replaced with JUnit5 equivalents
2. All @RunWith migrations completed
3. Build files updated for JUnit5
4. Tests discoverable and executable
5. Migration report generated
6. Manual review items flagged

---

## Error Handling

### Import Replacement Failures

- If Edit fails: Log error, continue with other files
- If pattern not found: Skip file, report as no-op

### Build Update Failures

- If build file read-only: Report error, suggest manual update
- If syntax errors: Validate changes before applying

### Test Execution Failures

- If tests fail after migration: Report failures, suggest rollback or manual fix
- If no tests discovered: Check test { useJUnitPlatform() } configuration

---

## Examples

### Example 1: Spring Boot Test Migration

**Input:**

```java
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;

@RunWith(SpringRunner.class)
@SpringBootTest
public class UserServiceTest {
    @Test
    public void testGetUser() {
        // test code
    }
}
```

**Output:**

```java
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit.jupiter.SpringExtension;

@ExtendWith(SpringExtension.class)
@SpringBootTest
public class UserServiceTest {
    @Test
    public void testGetUser() {
        // test code
    }
}
```

---

## References

- **Migration Learnings:** docs/planning/migration-learnings.md (Section 6.1)
- **JUnit 5 User Guide:** <https://junit.org/junit5/docs/current/user-guide/>
- **Spring Boot Testing:** <https://docs.spring.io/spring-boot/reference/testing/index.html>
- **OpenRewrite JUnit5 Migration:** <https://docs.openrewrite.org/recipes/java/testing/junit5>

---

## Version History

- **1.0.0** (2026-01-04): Initial implementation covering comprehensive JUnit4 → JUnit5 migration
