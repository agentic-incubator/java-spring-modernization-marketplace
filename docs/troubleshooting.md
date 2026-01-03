# Troubleshooting

Common errors and their solutions.

## Compilation Errors

### Jackson 3 Errors

#### `cannot find symbol: JsonProcessingException`

**Cause:** Jackson 3 renamed this exception.

**Solution:**

```java
// Before
import com.fasterxml.jackson.core.JsonProcessingException;

// After
import tools.jackson.core.JacksonException;
```

**Quick fix:**

```bash
/fix-jackson /path/to/project
```

#### `package com.fasterxml.jackson.core does not exist`

**Cause:** Jackson 3 changed the groupId.

**Solution:** Update imports from `com.fasterxml.jackson.core` to `tools.jackson.core`.

**Note:** Do NOT change `com.fasterxml.jackson.annotation.*` - those stay the same!

#### `cannot find symbol: class ObjectMapper` (after import change)

**Cause:** Build file not updated with new groupId.

**Solution:** Update pom.xml or build.gradle:

```xml
<!-- Maven: Add BOM first -->
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

<!-- Then update dependency groupIds -->
<dependency>
    <groupId>tools.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
</dependency>
```

### Spring Security 7 Errors

#### `cannot find symbol: VaadinWebSecurity`

**Cause:** Vaadin 25 / Security 7 removed this class.

**Solution:** Convert to bean-based configuration:

```java
// Before
public class SecurityConfig extends VaadinWebSecurity {
    @Override
    protected void configure(HttpSecurity http) { }
}

// After
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.with(VaadinSecurityConfigurer.vaadin(), Customizer.withDefaults());
        return http.build();
    }
}
```

**Quick fix:**

```bash
/fix-security /path/to/project
```

#### `cannot find symbol: AntPathRequestMatcher`

**Cause:** Security 7 uses PathPattern matchers.

**Solution:**

```java
// Before
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
new AntPathRequestMatcher("/api/**")

// After
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
PathPatternRequestMatcher.withDefaults().matcher("/api/**")
```

### Vaadin 25 Errors

#### `cannot find symbol: Material`

**Cause:** Vaadin 25 uses Lumo theme by default.

**Solution:**

```java
// Before
@Theme(themeClass = Material.class)

// After
@Theme(themeClass = Lumo.class)
```

### Spring AI 1.1 Errors

#### `cannot find symbol: SpeechModel`

**Cause:** Spring AI 1.1 renamed TTS classes.

**Solution:**

```java
// Before
import org.springframework.ai.audio.speech.SpeechModel;

// After
import org.springframework.ai.audio.tts.TextToSpeechModel;
```

#### Type mismatch: Float vs Double

**Cause:** Speed parameter changed from Float to Double.

**Solution:**

```java
// Before
.withSpeed(1.0f)

// After
.withSpeed(1.0)
```

## Build Errors

### Maven: Parent POM not found

**Cause:** Spring Boot 4.0.0 not yet in Maven Central (or cached old version).

**Solution:**

```bash
# Clear Maven cache
rm -rf ~/.m2/repository/org/springframework/boot

# Force update
./mvnw clean install -U
```

### Gradle: Could not resolve dependency

**Cause:** Similar to Maven - dependency not found.

**Solution:**

```bash
# Clear Gradle cache
rm -rf ~/.gradle/caches

# Refresh dependencies
./gradlew clean build --refresh-dependencies
```

### Test failures after migration

**Common causes:**

1. **Security context changes** - Update test mocks
2. **Jackson serialization differences** - Check JSON output
3. **Removed deprecated APIs** - Update test code

**Debug:**

```bash
# Run specific test
./mvnw test -Dtest=FailingTestClass

# With debug output
./mvnw test -Dtest=FailingTestClass -X
```

## Dependency Update Errors

### Compilation Fails After Dependency Update

**Error:**

```text
[ERROR] package tools.jackson.databind does not exist
```

**Cause:** Dependency update introduced breaking API changes (e.g., Jackson 2→3).

**Solution:**

1. **Rollback first:**

   ```bash
   # Maven
   mvn versions:revert

   # Gradle
   cp build.gradle.backup build.gradle
   git checkout build.gradle
   ```

2. **Run migration skill first:**

   ```bash
   /fix-jackson /path/to/project
   ```

3. **Then retry dependency update:**

   ```text
   "Apply stable dependency updates"
   ```

### Tests Fail After Dependency Update

**Error:** Tests fail but compilation succeeds.

**Cause:** Behavioral changes in updated dependencies.

**Solution:**

1. **Review failing tests:**

   ```bash
   # Maven
   mvn test

   # Gradle
   ./gradlew test
   ```

2. **Options:**
   - Update test expectations if changes are intentional
   - Rollback and update incrementally (one dependency at a time)
   - Check dependency changelogs for breaking changes

3. **Incremental update approach:**

   ```text
   "Update only Jackson dependencies and validate"
   "Update only Spring Security dependencies and validate"
   ```

### Version Conflicts

**Error:**

```text
[ERROR] Conflict between dependency versions
[ERROR] Dependency convergence error for com.google.guava:guava
```

**Cause:** Transitive dependency version mismatches after update.

**Solution:**

1. **Analyze dependency tree:**

   ```bash
   # Maven
   mvn dependency:tree
   mvn dependency:tree -Dverbose

   # Gradle
   ./gradlew dependencies
   ./gradlew dependencies --configuration compileClasspath
   ```

2. **Add explicit dependency management (Maven):**

   ```xml
   <dependencyManagement>
       <dependencies>
           <dependency>
               <groupId>com.google.guava</groupId>
               <artifactId>guava</artifactId>
               <version>33.0.0</version>
           </dependency>
       </dependencies>
   </dependencyManagement>
   ```

3. **Use Spring Boot BOM to align versions:**
   - Let Spring Boot manage compatible versions
   - Avoid overriding BOM-managed dependencies

### BOM-Managed Dependency Not Updated

**Issue:** Dependency wasn't updated even though newer version exists.

**Cause:** Version is managed by Spring Boot BOM (spring-boot-starter-parent).

**Solution:**

This is expected behavior. BOM-managed dependencies are skipped with INFO log:

```text
ℹ️  org.springframework.security:spring-security-core
   Current: (managed by spring-boot-starter-parent:4.0.0)
   Action: Update Spring Boot parent version instead
```

To update BOM-managed dependencies:

```bash
# Maven
mvn versions:update-parent

# Or manually update parent version in pom.xml
<parent>
    <version>4.0.1</version>  <!-- Updated -->
</parent>
```

### Maven Versions Plugin Backup Files

**Issue:** `pom.xml.versionsBackup` files left behind.

**Solution:**

```bash
# Commit changes (deletes backups)
mvn versions:commit

# Or manually clean up
rm pom.xml.versionsBackup
```

### Milestone Repository Not Added

**Error:**

```text
[ERROR] Failed to resolve org.springframework.ai:spring-ai-openai:2.0.0-M1
```

**Cause:** Milestone version requires Spring Milestones repository.

**Solution:**

The dependency-updater should auto-add this, but if not:

**Maven:**

```xml
<repositories>
    <repository>
        <id>spring-milestones</id>
        <url>https://repo.spring.io/milestone</url>
    </repository>
</repositories>
```

**Gradle:**

```kotlin
repositories {
    maven { url = uri("https://repo.spring.io/milestone") }
}
```

## GitHub Workflow Errors

### `gh: command not found`

**Cause:** GitHub CLI not installed.

**Solution:**

```bash
# macOS
brew install gh

# Linux
sudo apt install gh

# Then authenticate
gh auth login
```

### `HTTP 401: Unauthorized`

**Cause:** GitHub CLI not authenticated.

**Solution:**

```bash
gh auth login --web
```

### `remote: Permission denied`

**Cause:** No push access to repository.

**Solution:**

1. Verify you have write access to the repo
2. Check SSH key or token permissions
3. For org repos, check org settings

### PR creation fails

**Cause:** Branch not pushed or already exists.

**Solution:**

```bash
# Check if branch was pushed
git ls-remote --heads origin feature/spring-boot-4-migration

# Check for existing PR
gh pr list --head feature/spring-boot-4-migration

# Manual creation
gh pr create --title "..." --body "..."
```

### GitHub Actions Java version mismatch

**Cause:** CI workflow uses a different Java version than the build file.

**Symptoms:**

- Build passes locally but fails in CI
- CI uses Java 17 but project requires Java 21+
- Matrix builds don't include target Java version

**Diagnose:**

```bash
/check-github-actions /path/to/project
```

**Solution:**

Update `.github/workflows/*.yml` files:

```yaml
# Before
- uses: actions/setup-java@v4
  with:
    distribution: temurin
    java-version: '17'

# After
- uses: actions/setup-java@v4
  with:
    distribution: temurin
    java-version: '21'
```

For matrix builds:

```yaml
# Before
strategy:
  matrix:
    java: ['17', '21']

# After
strategy:
  matrix:
    java: ['21', '25']
```

### GitHub Actions workflow not updated after migration

**Cause:** Migration updated build files but not CI configuration.

**Solution:**

The migration agent should update workflows automatically. If not:

1. Check workflow files in `.github/workflows/`
2. Update `java-version` in all `setup-java` steps
3. Update matrix strategies if present
4. Preserve distribution settings (temurin, liberica, etc.)

## Common Patterns

### Migration order matters

Always follow this order:

1. Add BOMs to build file
2. Update dependency groupIds
3. Update imports in Java code
4. Update configurations
5. Run build

Doing imports before build file changes causes compilation errors.

### Annotation imports must NOT change

This is the #1 mistake:

```java
// WRONG - Don't change this!
import tools.jackson.annotation.JsonProperty;  // NO!

// CORRECT - Keep original
import com.fasterxml.jackson.annotation.JsonProperty;  // YES!
```

### Multi-module projects

For multi-module Maven/Gradle projects:

1. Update parent/root build file first
2. Then update child modules
3. Build from root to verify

```bash
# Maven multi-module
./mvnw clean install -pl parent-module
./mvnw clean install

# Gradle multi-module
./gradlew :parent:build
./gradlew build
```

## Getting Help

### Check project state

```bash
/analyze /path/to/project
```

### See current versions

```bash
/version-check /path/to/project
```

### Fix specific issues

```bash
/fix-jackson /path/to/project
/fix-security /path/to/project
```

### Review archived docs

```text
.archives/spring-modernization-plan.md
```

## Error Reference Table

| Error                                               | Cause      | Quick Fix        |
| --------------------------------------------------- | ---------- | ---------------- |
| `cannot find symbol: JsonProcessingException`       | Jackson 3  | `/fix-jackson`   |
| `package com.fasterxml.jackson.core does not exist` | Jackson 3  | `/fix-jackson`   |
| `cannot find symbol: VaadinWebSecurity`             | Vaadin 25  | `/fix-security`  |
| `cannot find symbol: AntPathRequestMatcher`         | Security 7 | `/fix-security`  |
| `cannot find symbol: SpeechModel`                   | Spring AI  | Manual update    |
| `cannot find symbol: Material`                      | Vaadin 25  | Change to `Lumo` |
