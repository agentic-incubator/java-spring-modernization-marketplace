# Spring Framework 7 API Migrator

**Version**: 1.0.0
**Skill ID**: `spring-framework-7-migrator`
**Status**: Production
**Automation Potential**: 85% (API migrations: 95%, Template injection: 80%)

## Overview

Migrate Spring Framework 6.x to 7.x API changes including:

- **HttpServiceProxyFactory API**: `builder()` → `builderFor()`
- **WebClientAdapter API**: `forClient()` → `create()`
- **OpenAPI Generator Templates**: Inject Framework 7 compatible templates for `spring-http-interface` library

This skill is critical for projects using Spring Framework 7 with OpenAPI Generator's `spring-http-interface` library, as the generated
code must use the new Framework 7 APIs.

## Critical Rules

1. **NEVER** modify custom templates without user approval
2. **ALWAYS** show diffs before template merging
3. **ALWAYS** validate compilation after API migrations
4. **NEVER** inject templates if custom templates exist without merge workflow
5. **ALWAYS** update migration state after successful transformations
6. **NEVER** apply transformations if already applied (check state)

## Spring Framework 7 API Changes

### Breaking Changes Table

| Component                 | Framework 6.x API       | Framework 7.x API          | Breaking? | Automation |
| ------------------------- | ----------------------- | -------------------------- | --------- | ---------- |
| `HttpServiceProxyFactory` | `.builder()`            | `.builderFor(adapter)`     | ✅ Yes    | 95%        |
| `WebClientAdapter`        | `.forClient(webClient)` | `.create(webClient)`       | ✅ Yes    | 100%       |
| Template Variables        | N/A                     | Updated mustache templates | ✅ Yes    | 80%        |

### API Migration Details

#### 1. HttpServiceProxyFactory

**Framework 6.x (Deprecated)**:

```java
HttpServiceProxyFactory factory = HttpServiceProxyFactory
    .builder(WebClientAdapter.forClient(webClient))
    .build();
```

**Framework 7.x (Required)**:

```java
HttpServiceProxyFactory factory = HttpServiceProxyFactory
    .builderFor(WebClientAdapter.create(webClient))
    .build();
```

**Changes**:

- `.builder(adapter)` → `.builderFor(adapter)`
- Adapter is now passed as argument to `builderFor()`

#### 2. WebClientAdapter

**Framework 6.x (Deprecated)**:

```java
WebClientAdapter adapter = WebClientAdapter.forClient(webClient);
```

**Framework 7.x (Required)**:

```java
WebClientAdapter adapter = WebClientAdapter.create(webClient);
```

**Changes**:

- `.forClient(webClient)` → `.create(webClient)`
- Static method renamed

#### 3. Combined Example

**Framework 6.x**:

```java
@Configuration
public class HttpInterfacesConfiguration {

    @Bean
    public HttpServiceProxyFactory httpServiceProxyFactory(WebClient webClient) {
        return HttpServiceProxyFactory
            .builder(WebClientAdapter.forClient(webClient))
            .build();
    }
}
```

**Framework 7.x**:

```java
@Configuration
public class HttpInterfacesConfiguration {

    @Bean
    public HttpServiceProxyFactory httpServiceProxyFactory(WebClient webClient) {
        return HttpServiceProxyFactory
            .builderFor(WebClientAdapter.create(webClient))
            .build();
    }
}
```

## Detection Logic

### Maven Projects

**Detect Spring Framework 7**:

```bash
grep -E '<spring.framework.version>7\.' pom.xml
```

**Detect HttpServiceProxyFactory Usage**:

```bash
grep -r "HttpServiceProxyFactory" src/main/java/
```

**Detect OpenAPI Generator with spring-http-interface**:

```bash
grep -A 10 "openapi-generator-maven-plugin" pom.xml | grep -E "<library>spring-http-interface</library>"
```

### Gradle Projects

**Detect Spring Framework 7**:

```bash
grep -E 'springFrameworkVersion.*=.*"7\.' build.gradle
```

**Detect HttpServiceProxyFactory Usage**:

```bash
grep -r "HttpServiceProxyFactory" src/main/java/
```

**Detect OpenAPI Generator with spring-http-interface**:

```bash
grep -A 10 "org.openapi.generator" build.gradle | grep -E 'library.*spring-http-interface'
```

## Migration Patterns

### Pattern 1: Simple HttpServiceProxyFactory

**Before (Framework 6)**:

```java
HttpServiceProxyFactory.builder(adapter).build()
```

**After (Framework 7)**:

```java
HttpServiceProxyFactory.builderFor(adapter).build()
```

**Automation**: 100% (simple regex replacement)

### Pattern 2: WebClientAdapter Migration

**Before (Framework 6)**:

```java
WebClientAdapter.forClient(webClient)
```

**After (Framework 7)**:

```java
WebClientAdapter.create(webClient)
```

**Automation**: 100% (simple regex replacement)

### Pattern 3: Combined in Configuration Class

**Before (Framework 6)**:

```java
@Bean
public HttpServiceProxyFactory factory(WebClient client) {
    return HttpServiceProxyFactory
        .builder(WebClientAdapter.forClient(client))
        .build();
}
```

**After (Framework 7)**:

```java
@Bean
public HttpServiceProxyFactory factory(WebClient client) {
    return HttpServiceProxyFactory
        .builderFor(WebClientAdapter.create(client))
        .build();
}
```

**Automation**: 95% (nested replacement)

### Pattern 4: Custom Configuration

**Before (Framework 6)**:

```java
@Bean
public HttpServiceProxyFactory factory(WebClient client) {
    return HttpServiceProxyFactory
        .builder(WebClientAdapter.forClient(client))
        .customArgumentResolver(new CustomResolver())
        .build();
}
```

**After (Framework 7)**:

```java
@Bean
public HttpServiceProxyFactory factory(WebClient client) {
    return HttpServiceProxyFactory
        .builderFor(WebClientAdapter.create(client))
        .customArgumentResolver(new CustomResolver())
        .build();
}
```

**Automation**: 95% (preserves custom configuration)

## Template Management

### Bundled Template

**Location**: `skills/spring-framework-7-migrator/templates/libraries/spring-http-interface/httpInterfacesConfiguration.mustache`

**Content**:

```mustache
{{>licenseInfo}}
package {{configPackage}};

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.support.WebClientAdapter;
import org.springframework.web.service.invoker.HttpServiceProxyFactory;

@Configuration
public abstract class HttpInterfacesAbstractConfigurator {

    protected HttpInterfacesAbstractConfigurator(WebClient webClient) {
        this.webClient = webClient;
    }

    private final WebClient webClient;

    @Bean
    public HttpServiceProxyFactory httpServiceProxyFactory() {
        return HttpServiceProxyFactory
            .builderFor(WebClientAdapter.create(webClient))  // Framework 7 API
            .build();
    }

{{#apiInfo}}
{{#apis}}
    @Bean
    public {{classname}} {{#lambda.camelcase}}{{classname}}{{/lambda.camelcase}}(HttpServiceProxyFactory factory) {
        return factory.createClient({{classname}}.class);
    }

{{/apis}}
{{/apiInfo}}
}
```

### Template Detection

**Detect Custom Templates**:

1. **Maven**:

   ```bash
   grep -E "<templateDirectory>" pom.xml
   ```

2. **Gradle**:

   ```bash
   grep -E "templateDir|templates" build.gradle
   ```

3. **Check File System**:

   ```bash
   find . -name "httpInterfacesConfiguration.mustache" -o -name "apiAbstractConfigurator.mustache"
   ```

### Template Path Flexibility

OpenAPI Generator uses a nested template structure that varies by project:

**Standard OpenAPI Generator Structure** (with `/libraries/` subdirectory):

```text
src/main/resources/templates/
  └── libraries/
      └── spring-http-interface/
          └── httpInterfacesConfiguration.mustache
```

**Simplified Structure** (some projects omit `/libraries/`):

```text
src/main/resources/templates/
  └── spring-http-interface/
      └── httpInterfacesConfiguration.mustache
```

**Detection Strategy**:

Use flexible glob patterns to support both structures:

```bash
# Find template using glob pattern (supports both structures)
CUSTOM_TEMPLATE=$(find . -path "*/templates/*spring-http-interface/httpInterfacesConfiguration.mustache" | head -1)

# Detect which structure is used
if echo "$CUSTOM_TEMPLATE" | grep -q "/libraries/"; then
    TEMPLATE_STRUCTURE="libraries/spring-http-interface"
else
    TEMPLATE_STRUCTURE="spring-http-interface"
fi

# Set injection path accordingly
TEMPLATE_INJECT_PATH="src/main/resources/templates/$TEMPLATE_STRUCTURE"
```

**Injection Strategy**:

1. **If custom template exists**: Mirror the detected structure when injecting bundled template
2. **If no custom template**: Prefer standard `/libraries/` structure (OpenAPI Generator convention)
3. **Backwards compatibility**: Support both paths for existing projects

**Build Configuration**:

The `<templateDirectory>` or `templateDir` configuration points to the **parent** templates directory:

Maven:

```xml
<templateDirectory>${project.basedir}/src/main/resources/templates</templateDirectory>
```

Gradle:

```groovy
templateDir = file("${projectDir}/src/main/resources/templates")
```

Both configurations expect the library subdirectory structure (with or without `/libraries/`) beneath the parent directory.

### Template Injection Workflow

#### Step 1: Detect Existing Templates

```bash
# Check Maven pom.xml
TEMPLATE_DIR=$(grep -oP '<templateDirectory>\K[^<]+' pom.xml)

# Check Gradle build.gradle
TEMPLATE_DIR=$(grep -oP 'templateDir.*=.*"\K[^"]+' build.gradle)

# Check file system
CUSTOM_TEMPLATE=$(find . -path "*/templates/*/httpInterfacesConfiguration.mustache")
```

#### Step 2: Decision Tree

```text
Does custom template exist?
├─ NO → Copy bundled template to default location
│       └─ Maven: src/main/resources/templates/libraries/spring-http-interface/
│       └─ Gradle: src/main/resources/templates/libraries/spring-http-interface/
│
└─ YES → Enter Manual Merge Workflow
         ├─ Generate diff
         ├─ Explain changes
         ├─ Ask user: [Apply Diff | Manual Edit | Skip]
         └─ If "Apply Diff" → Apply changes
            If "Manual Edit" → Open editor
            If "Skip" → Skip template injection
```

#### Step 3: Update Build Configuration

**Maven** (if no templateDirectory):

```xml
<configuration>
    <templateDirectory>${project.basedir}/src/main/resources/templates</templateDirectory>
</configuration>
```

**Gradle** (if no templateDir):

```gradle
templateDir = file("${projectDir}/src/main/resources/templates")
```

### Manual Merge Workflow

When custom templates exist, follow this workflow:

#### Step 1: Generate Diff

```bash
# Copy bundled template to temp location
cp skills/spring-framework-7-migrator/templates/libraries/spring-http-interface/httpInterfacesConfiguration.mustache /tmp/framework7.mustache

# Generate diff
diff -u <custom-template-path> /tmp/framework7.mustache > /tmp/framework7-diff.patch
```

#### Step 2: Explain Changes

Show user the diff with explanations:

```text
Found custom template: src/main/resources/templates/libraries/spring-http-interface/httpInterfacesConfiguration.mustache

Changes required for Spring Framework 7 compatibility:

Line 15: HttpServiceProxyFactory.builder(adapter)
      → HttpServiceProxyFactory.builderFor(adapter)

Line 15: WebClientAdapter.forClient(webClient)
      → WebClientAdapter.create(webClient)

These are breaking API changes in Spring Framework 7.

Would you like to:
1. Apply diff automatically (recommended)
2. Manually edit the template
3. Skip template update (manual migration required)
```

#### Step 3: User Decision

##### Option 1: Apply Diff

```bash
patch <custom-template-path> < /tmp/framework7-diff.patch
```

##### Option 2: Manual Edit

```bash
# Open in user's preferred editor
$EDITOR <custom-template-path>

# Show what needs to change
cat <<EOF
Required changes:
1. Replace: HttpServiceProxyFactory.builder(
   With:    HttpServiceProxyFactory.builderFor(

2. Replace: WebClientAdapter.forClient(
   With:    WebClientAdapter.create(
EOF
```

##### Option 3: Skip

```text
Skipping template injection. Manual migration required.
Note: Generated code will fail to compile with Spring Framework 7 until template is updated.
```

## Validation Strategy

### Post-Migration Validation

After applying API migrations or template injections, validate:

#### 1. Compilation Check

```bash
# Maven
./mvnw clean compile

# Gradle
./gradlew clean compileJava
```

**Success Criteria**: No compilation errors related to:

- `HttpServiceProxyFactory.builder()`
- `WebClientAdapter.forClient()`

#### 2. Code Generation Check (if OpenAPI Generator)

```bash
# Maven
./mvnw clean generate-sources

# Gradle
./gradlew clean openApiGenerate
```

**Success Criteria**: Generated code compiles without errors

#### 3. Pattern Detection Check

```bash
# Verify old patterns are gone
grep -r "HttpServiceProxyFactory\.builder(" src/main/java/ || echo "✅ Old pattern removed"
grep -r "WebClientAdapter\.forClient(" src/main/java/ || echo "✅ Old pattern removed"

# Verify new patterns exist
grep -r "HttpServiceProxyFactory\.builderFor(" src/main/java/ && echo "✅ New pattern applied"
grep -r "WebClientAdapter\.create(" src/main/java/ && echo "✅ New pattern applied"
```

## Integration with Migration State

### State Tracking

After successful migration, update `.migration-state.yaml`:

```yaml
appliedTransformations:
  - skill: spring-framework-7-migrator
    version: '1.0.0'
    timestamp: '2026-01-05T10:30:00Z'
    transformations:
      - id: http-service-proxy-factory-api
        filesModified: 3
        patterns:
          - src/main/java/com/example/config/HttpInterfacesConfig.java:25
          - src/main/java/com/example/service/ApiClientFactory.java:42
      - id: webclient-adapter-api
        filesModified: 3
        patterns:
          - src/main/java/com/example/config/HttpInterfacesConfig.java:25
          - src/main/java/com/example/service/ApiClientFactory.java:42
      - id: openapi-generator-template-injection
        templatesInjected: true
        templatePath: src/main/resources/templates/libraries/spring-http-interface/httpInterfacesConfiguration.mustache
        mergeStrategy: automatic # or 'manual' or 'skipped'
    validation:
      compilation: success
      codeGeneration: success
      patternsRemaining:
        oldPatterns: 0
        newPatterns: 3
```

### Idempotent Execution

Before applying transformations, check if already applied:

```bash
# Check migration state
if grep -q "spring-framework-7-migrator" .migration-state.yaml; then
    echo "Spring Framework 7 migration already applied. Skipping."
    exit 0
fi
```

## Workflow Integration

### Called By

- **migration-agent** (Phase 11.5: Spring Framework 7 API Migration)
- **openapi-generator-plugin-updater** (when Framework 7 detected)
- **User command**: `/migrate-framework-7`

### Calls

- **openapi-generator-detector** (to detect template usage)
- **Build tools** (Maven/Gradle for validation)

### Execution Flow

```text
1. Detect Spring Framework version
   └─ If < 7.0 → Skip (not applicable)
   └─ If >= 7.0 → Continue

2. Detect API usage patterns
   └─ HttpServiceProxyFactory.builder() ?
   └─ WebClientAdapter.forClient() ?
   └─ If none found → Skip

3. Apply API migrations
   └─ Replace builder() → builderFor()
   └─ Replace forClient() → create()

4. Detect OpenAPI Generator usage
   └─ If not used → Skip template injection
   └─ If used → Continue

5. Detect library configuration
   └─ If NOT spring-http-interface → Skip template injection
   └─ If spring-http-interface → Continue

6. Detect custom templates
   └─ If no custom templates → Copy bundled template
   └─ If custom templates → Manual merge workflow

7. Validate compilation
   └─ Run clean compile
   └─ Check for errors

8. Update migration state
   └─ Record transformations
   └─ Record validation results
```

## Edge Cases

### Edge Case 1: Multiple API Usages in Single Statement

**Scenario**:

```java
return HttpServiceProxyFactory.builder(WebClientAdapter.forClient(client)).build();
```

**Solution**: Apply inner replacement first, then outer:

```java
// Step 1: WebClientAdapter.forClient → .create
return HttpServiceProxyFactory.builder(WebClientAdapter.create(client)).build();

// Step 2: HttpServiceProxyFactory.builder → .builderFor
return HttpServiceProxyFactory.builderFor(WebClientAdapter.create(client)).build();
```

### Edge Case 2: Custom Templates with Additional Customizations

**Scenario**: User has custom template with additional beans, logging, etc.

**Solution**:

- Generate diff showing ONLY Framework 7 API changes
- Preserve all custom additions
- Use 3-way merge if possible

### Edge Case 3: Mixed Framework Versions (Multi-Module)

**Scenario**: Multi-module project with some modules on Framework 6, others on 7.

**Solution**:

- Detect Framework version per module
- Apply migrations only to modules with Framework 7
- Record per-module state

### Edge Case 4: Already Partially Migrated

**Scenario**: Some files use Framework 7 API, others use Framework 6 API.

**Solution**:

- Detect both patterns
- Only migrate remaining Framework 6 patterns
- Report status: "3 of 5 files already migrated"

### Edge Case 5: Template Injection Without OpenAPI Generator Plugin

**Scenario**: User manually uses OpenAPI Generator CLI.

**Solution**:

- Ask user for template directory location
- Copy bundled template to user-specified location
- Provide instructions for CLI usage

## Command-Line Usage

### Standalone Command

```bash
# Auto-detect and migrate
/migrate-framework-7

# Migrate with template injection
/migrate-framework-7 --inject-templates

# Specific project
/migrate-framework-7 /path/to/project --inject-templates

# Dry run (show what would be changed)
/migrate-framework-7 --dry-run
```

### Integration with migrate Command

```bash
# Full migration (includes Framework 7 migration in Phase 11.5)
/migrate --target-version 4.0.0

# Skip Framework 7 migration
/migrate --target-version 4.0.0 --skip-phases 11.5
```

## Success Criteria

Migration is successful when:

- ✅ No `HttpServiceProxyFactory.builder()` patterns remain
- ✅ No `WebClientAdapter.forClient()` patterns remain
- ✅ All `HttpServiceProxyFactory.builderFor()` patterns compile
- ✅ All `WebClientAdapter.create()` patterns compile
- ✅ Templates (if any) use Framework 7 APIs
- ✅ Code generation (if OpenAPI Generator) succeeds
- ✅ Compilation succeeds
- ✅ Migration state updated

## Error Handling

### Error 1: Compilation Failure After Migration

**Cause**: Incorrect regex replacement or incomplete migration.

**Solution**:

- Revert changes
- Re-run with verbose logging
- Check for complex patterns not covered by regex

### Error 2: Template Merge Conflict

**Cause**: Custom template has conflicting structure.

**Solution**:

- Fall back to manual merge
- Provide detailed explanation of required changes
- Offer to create backup before applying

### Error 3: OpenAPI Generator Fails After Template Injection

**Cause**: Template syntax error or incompatible mustache variables.

**Solution**:

- Validate template syntax
- Test template with sample spec
- Restore original template if validation fails

## Testing Requirements

### Unit Tests

1. **API Pattern Detection**:
   - Test detection of `HttpServiceProxyFactory.builder()`
   - Test detection of `WebClientAdapter.forClient()`
   - Test detection in various contexts (nested, multi-line)

2. **API Pattern Replacement**:
   - Test simple replacement
   - Test nested replacement
   - Test multi-line replacement
   - Test with custom configuration

3. **Template Detection**:
   - Test Maven template directory detection
   - Test Gradle template directory detection
   - Test file system template detection

### Integration Tests

1. **End-to-End Migration**:
   - Test on sample project with Framework 6 code
   - Validate Framework 7 code compiles
   - Validate state tracking

2. **Template Injection**:
   - Test with no custom templates
   - Test with custom templates (manual merge)
   - Test with OpenAPI Generator code generation

3. **Multi-Module Projects**:
   - Test mixed Framework versions
   - Test per-module state tracking

## Version History

### 1.0.0 (2026-01-05)

**Initial Release**:

- HttpServiceProxyFactory API migration
- WebClientAdapter API migration
- Template injection for OpenAPI Generator
- Manual merge workflow for custom templates
- Integration with migration-agent
- State tracking and validation

## References

- [Spring Framework 7.0 Reference - WebClient](https://docs.spring.io/spring-framework/reference/7.0/web/webflux-webclient.html)
- [Spring Framework 7.0 - HTTP Interface](https://docs.spring.io/spring-framework/reference/7.0/integration/rest-clients.html#rest-http-interface)
- [OpenAPI Generator - Spring HTTP Interface](https://openapi-generator.tech/docs/generators/spring/)
- [Migration Guide: Spring Framework 6 to 7](https://github.com/spring-projects/spring-framework/wiki/Upgrading-to-Spring-Framework-7.x)

## Related Skills

- **openapi-generator-plugin-updater**: Updates OpenAPI Generator plugin version
- **openapi-generator-detector**: Detects OpenAPI Generator usage
- **dependency-updater**: Updates Spring Framework version
- **migration-agent**: Orchestrates full Spring Boot 4 migration
