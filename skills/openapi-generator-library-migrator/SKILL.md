# OpenAPI Generator Library Migrator

**Version**: 1.0.0
**Skill ID**: `openapi-generator-library-migrator`
**Status**: Production
**Automation Potential**: 88% (Build file: 95%, Application.yml: 85%, Code regeneration: 90%)

## Overview

Migrate OpenAPI Generator library configuration from `spring-cloud` (Feign) to `spring-http-interface` for Spring Boot 4 compatibility.

This skill handles **OpenAPI-generated** Feign clients (not hand-written `@FeignClient` interfaces). It modifies the
OpenAPI Generator plugin configuration to regenerate clients using Spring Framework's native HTTP Interface pattern instead of
Spring Cloud OpenFeign.

## Critical Distinction

| Client Type       | Migration Approach                             | Skill to Use                                          |
| ----------------- | ---------------------------------------------- | ----------------------------------------------------- |
| OpenAPI-generated | **Regenerate** with new library config         | `openapi-generator-library-migrator` ⬅ **This skill** |
| Hand-written      | **Transform** `@FeignClient` → `@HttpExchange` | `openfeign-to-httpinterface-migrator`                 |

**Key insight**: OpenAPI-generated clients don't need code transformation—you change the generation configuration and regenerate the code.

## Why This Migration

**Spring Cloud OpenFeign Status**: Entered maintenance mode as of Spring Cloud 2022.0.0
**Spring Boot 4 Compatibility**: Spring Cloud OpenFeign 2025.0.x is incompatible with Boot 4
**Recommended Path**: Migrate to Spring Framework's built-in HTTP Interface (available since Framework 6.0)

## Critical Rules

1. **NEVER** modify generated code directly (it will be regenerated)
2. **ALWAYS** backup `pom.xml`/`build.gradle` before modifications
3. **ALWAYS** validate XML/YAML syntax after changes
4. **ALWAYS** regenerate code after library configuration changes
5. **ALWAYS** compile after regeneration to validate
6. **NEVER** remove `@EnableFeignClients` if hand-written clients exist
7. **ALWAYS** coordinate with `openfeign-to-httpinterface-migrator` for mixed scenarios

## Detection Logic

### Step 1: Detect OpenAPI Generator Plugin

**Maven**:

```bash
grep -E "<artifactId>openapi-generator-maven-plugin</artifactId>" pom.xml
```

**Gradle**:

```bash
grep -E "id.*org\.openapi\.generator" build.gradle
```

**If not found**: Skip this skill (not applicable)

### Step 2: Detect Library Configuration

**Maven**:

```bash
grep -A 50 "openapi-generator-maven-plugin" pom.xml | grep -E "<library>"
```

**Gradle**:

```bash
grep -A 30 "org\.openapi\.generator" build.gradle | grep -E "library.*="
```

**Decision Tree**:

```text
Library detected?
├─ spring-cloud → MIGRATE (needs migration)
├─ spring-http-interface → SKIP (already migrated)
└─ other → WARN (unsupported library)
```

### Step 3: Detect Generated API Clients

```bash
# Find generated client files
find target/generated-sources/openapi -name "*Api.java" 2>/dev/null | head -5

# Or check configured output directory
API_PACKAGE=$(grep -oP '<apiPackage>\K[^<]+' pom.xml)
find src -path "*/${API_PACKAGE}/*Api.java"
```

## Transformations

### Transformation 1: Library Configuration Update

**Before (Feign)**:

```xml
<configuration>
    <library>spring-cloud</library>
    <!-- Feign-specific options -->
</configuration>
```

**After (HTTP Interface)**:

```xml
<configuration>
    <library>spring-http-interface</library>
    <configPackage>me.pacphi.mattermost.configuration</configPackage> <!-- REQUIRED -->
    <templateDirectory>${project.basedir}/src/main/resources/templates</templateDirectory> <!-- Recommended -->
    <!-- Common options preserved -->
</configuration>
```

**Automation**: 95%

### Transformation 2: Add configPackage (REQUIRED)

The `configPackage` option is **required** for `spring-http-interface` library. Without it, code generation will fail.

**Inference Strategy**:

```bash
# Extract apiPackage from build file
API_PACKAGE=$(grep -oP '<apiPackage>\K[^<]+' pom.xml | head -1)

# Transform to configuration package
# Example: me.pacphi.mattermost.api → me.pacphi.mattermost.configuration
CONFIG_PACKAGE="${API_PACKAGE%.*}.configuration"

# Fallback if apiPackage not found
CONFIG_PACKAGE="${CONFIG_PACKAGE:-org.openapitools.configuration}"
```

**Maven**:

```xml
<configOptions>
    <configPackage>me.pacphi.mattermost.configuration</configPackage>
</configOptions>
```

**Gradle**:

```kotlin
configOptions = mapOf(
    "configPackage" to "me.pacphi.mattermost.configuration"
)
```

**Automation**: 100%

### Transformation 3: Add templateDirectory (Recommended)

Add `templateDirectory` to enable Framework 7 template customization:

**Maven**:

```xml
<configuration>
    <templateDirectory>${project.basedir}/src/main/resources/templates</templateDirectory>
</configuration>
```

**Gradle**:

```kotlin
templateDir = file("${projectDir}/src/main/resources/templates")
```

**Rationale**: Allows `spring-framework-7-migrator` to inject Framework 7 compatible templates.

**Automation**: 100%

### Transformation 4: Remove Feign-Specific Options

**Options to REMOVE** (incompatible with `spring-http-interface`):

| Option                  | Feign-Specific | Reason                                         |
| ----------------------- | -------------- | ---------------------------------------------- |
| `interfaceOnly`         | ✅             | HTTP Interface generates configuration classes |
| `useTags`               | ✅             | HTTP Interface uses different naming           |
| `java8`                 | ⚠️             | Deprecated, use `dateLibrary` instead          |
| `performBeanValidation` | ⚠️             | Use `useBeanValidation` instead                |
| `useOptional`           | ⚠️             | HTTP Interface doesn't support this pattern    |
| `basePackage`           | ✅             | Not used by HTTP Interface                     |
| `invokerPackage`        | ✅             | Not used by HTTP Interface                     |

**Example Cleanup**:

```xml
<!-- REMOVE these lines -->
<interfaceOnly>false</interfaceOnly>
<useTags>true</useTags>
<java8>true</java8>
<performBeanValidation>true</performBeanValidation>
<useOptional>false</useOptional>
<basePackage>me.pacphi.mattermost</basePackage>
<invokerPackage>me.pacphi.mattermost.invoker</invokerPackage>
```

**Automation**: 90%

### Transformation 5: Preserve Common Options

**Options to KEEP** (compatible with both libraries):

| Option              | Purpose                                    | Keep? |
| ------------------- | ------------------------------------------ | ----- |
| `useJakartaEe`      | Jakarta EE vs javax                        | ✅    |
| `dateLibrary`       | Date handling (java8, java8-localdatetime) | ✅    |
| `useBeanValidation` | Jakarta Validation annotations             | ✅    |
| `serializableModel` | Serializable models                        | ✅    |
| `sourceFolder`      | Output directory                           | ✅    |
| `apiPackage`        | API interface package                      | ✅    |
| `modelPackage`      | Model class package                        | ✅    |

**Example (no changes needed)**:

```xml
<useJakartaEe>true</useJakartaEe>
<dateLibrary>java8</dateLibrary>
<useBeanValidation>true</useBeanValidation>
<serializableModel>true</serializableModel>
<sourceFolder>src/gen/java/main</sourceFolder>
<apiPackage>me.pacphi.mattermost.api</apiPackage>
<modelPackage>me.pacphi.mattermost.model</modelPackage>
```

**Automation**: 100% (no action needed)

### Transformation 6: Application.yml Cleanup

**Problem**: Feign clients require URL configuration in `application.yml`:

```yaml
# REMOVE these Feign-specific configurations
channels:
  url: ${mattermost.base-url}
posts:
  url: ${mattermost.base-url}
users:
  url: ${mattermost.base-url}
# ... more client URLs
```

**Solution**: HTTP Interface clients use `WebClient` with a single base URL:

```yaml
# KEEP the base URL property
mattermost:
  base-url: https://api.example.com
```

**Detection Pattern**:

```bash
# Find Feign URL mapping patterns
yq eval 'to_entries | .[] | select(.value.url != null) | .key' application.yml
```

**Safe Cleanup Using yq**:

```bash
# Extract generated API names
GENERATED_APIS=$(find target/generated-sources/openapi -name "*Api.java" | \
  sed 's|.*/||' | sed 's|Api.java||' | tr '[:upper:]' '[:lower:]')

# Remove corresponding YAML entries
for api_name in $GENERATED_APIS; do
  yq eval "del(.$api_name)" -i src/main/resources/application.yml
done
```

**Automation**: 85% (manual review recommended for complex configurations)

### Transformation 7: @EnableFeignClients Removal (Conditional)

**Decision Logic**:

```bash
# Check if ONLY OpenAPI-generated clients exist
HANDWRITTEN_COUNT=$(grep -r "@FeignClient" src/main/java/ --include="*.java" \
  --exclude-dir="target/generated-sources" | wc -l)

if [ "$HANDWRITTEN_COUNT" -eq 0 ]; then
  # Safe to remove @EnableFeignClients
  MAIN_CLASS=$(grep -r "@SpringBootApplication" src/main/java/ -l)
  sed -i.bak '/@EnableFeignClients/d' "$MAIN_CLASS"
  sed -i.bak '/import.*EnableFeignClients/d' "$MAIN_CLASS"
else
  # Hand-written clients exist - let openfeign-to-httpinterface-migrator handle it
  echo "⚠️  Hand-written Feign clients detected. Preserving @EnableFeignClients."
  echo "   Run openfeign-to-httpinterface-migrator to complete migration."
fi
```

**Automation**: 95%

## Build File Modifications

### Maven (pom.xml)

**Complete Before/After Example**:

**Before**:

```xml
<plugin>
    <groupId>org.openapitools</groupId>
    <artifactId>openapi-generator-maven-plugin</artifactId>
    <version>7.18.0</version>
    <executions>
        <execution>
            <goals>
                <goal>generate</goal>
            </goals>
            <configuration>
                <inputSpec>${project.basedir}/src/main/resources/api/openapi.yaml</inputSpec>
                <generatorName>java</generatorName>
                <library>spring-cloud</library>
                <apiPackage>me.pacphi.mattermost.api</apiPackage>
                <modelPackage>me.pacphi.mattermost.model</modelPackage>
                <configOptions>
                    <useJakartaEe>true</useJakartaEe>
                    <dateLibrary>java8</dateLibrary>
                    <interfaceOnly>false</interfaceOnly>
                    <useTags>true</useTags>
                    <java8>true</java8>
                    <performBeanValidation>true</performBeanValidation>
                    <useOptional>false</useOptional>
                    <basePackage>me.pacphi.mattermost</basePackage>
                    <invokerPackage>me.pacphi.mattermost.invoker</invokerPackage>
                </configOptions>
            </configuration>
        </execution>
    </executions>
</plugin>
```

**After**:

```xml
<plugin>
    <groupId>org.openapitools</groupId>
    <artifactId>openapi-generator-maven-plugin</artifactId>
    <version>7.18.0</version>
    <executions>
        <execution>
            <goals>
                <goal>generate</goal>
            </goals>
            <configuration>
                <inputSpec>${project.basedir}/src/main/resources/api/openapi.yaml</inputSpec>
                <generatorName>java</generatorName>
                <library>spring-http-interface</library>
                <templateDirectory>${project.basedir}/src/main/resources/templates</templateDirectory>
                <apiPackage>me.pacphi.mattermost.api</apiPackage>
                <modelPackage>me.pacphi.mattermost.model</modelPackage>
                <configOptions>
                    <configPackage>me.pacphi.mattermost.configuration</configPackage>
                    <useJakartaEe>true</useJakartaEe>
                    <dateLibrary>java8</dateLibrary>
                    <useBeanValidation>true</useBeanValidation>
                    <serializableModel>true</serializableModel>
                </configOptions>
            </configuration>
        </execution>
    </executions>
</plugin>
```

**Changes Made**:

1. ✅ `<library>spring-cloud</library>` → `<library>spring-http-interface</library>`
2. ✅ Added `<templateDirectory>`
3. ✅ Added `<configPackage>` in `<configOptions>`
4. ❌ Removed `interfaceOnly`, `useTags`, `java8`, `performBeanValidation`, `useOptional`, `basePackage`, `invokerPackage`
5. ✅ Kept `useJakartaEe`, `dateLibrary`, `useBeanValidation`, `serializableModel`

### Gradle (build.gradle.kts)

**Before**:

```kotlin
openApiGenerate {
    generatorName.set("java")
    library.set("spring-cloud")
    inputSpec.set("${projectDir}/src/main/resources/api/openapi.yaml")
    apiPackage.set("me.pacphi.mattermost.api")
    modelPackage.set("me.pacphi.mattermost.model")
    configOptions.set(mapOf(
        "useJakartaEe" to "true",
        "dateLibrary" to "java8",
        "interfaceOnly" to "false",
        "useTags" to "true"
    ))
}
```

**After**:

```kotlin
openApiGenerate {
    generatorName.set("java")
    library.set("spring-http-interface")
    templateDir.set(file("${projectDir}/src/main/resources/templates"))
    inputSpec.set("${projectDir}/src/main/resources/api/openapi.yaml")
    apiPackage.set("me.pacphi.mattermost.api")
    modelPackage.set("me.pacphi.mattermost.model")
    configOptions.set(mapOf(
        "configPackage" to "me.pacphi.mattermost.configuration",
        "useJakartaEe" to "true",
        "dateLibrary" to "java8",
        "useBeanValidation" to "true",
        "serializableModel" to "true"
    ))
}
```

## Code Regeneration

After modifying the build configuration, regenerate the code:

### Maven

```bash
# Clean old generated code
./mvnw clean

# Regenerate with new configuration
./mvnw generate-sources
```

### Gradle

```bash
# Clean old generated code
./gradlew clean

# Regenerate with new configuration
./gradlew openApiGenerate
```

### Validation

```bash
# Verify generated code structure
find target/generated-sources/openapi -name "*Api.java" | head -3

# Check for @HttpExchange annotations (not @FeignClient)
grep -r "@HttpExchange" target/generated-sources/openapi/

# Check for HttpInterfacesAbstractConfigurator
find target/generated-sources/openapi -name "*AbstractConfigurator.java"
```

**Success Criteria**:

- ✅ No `@FeignClient` annotations in generated code
- ✅ `@HttpExchange` annotations present
- ✅ `HttpInterfacesAbstractConfigurator` class generated
- ✅ Configuration package contains configurator class

## Coordination with Other Skills

### Scenario 1: ONLY OpenAPI-Generated Clients

```text
Project has:
  - OpenAPI Generator plugin with spring-cloud library
  - No hand-written @FeignClient interfaces

Migration sequence:
  1. openapi-generator-library-migrator (this skill)
     - Update library configuration
     - Add configPackage, templateDirectory
     - Remove Feign options
     - Clean application.yml
     - Regenerate code
     - Remove @EnableFeignClients (no hand-written clients)

  2. Skip openfeign-to-httpinterface-migrator
     (not needed - no hand-written clients)
```

### Scenario 2: Mixed (OpenAPI + Hand-Written)

```text
Project has:
  - OpenAPI Generator plugin with spring-cloud library
  - Hand-written @FeignClient interfaces

Migration sequence:
  1. openapi-generator-library-migrator (this skill)
     - Update library configuration
     - Regenerate code
     - Preserve @EnableFeignClients (hand-written clients still need it)

  2. openfeign-to-httpinterface-migrator
     - Transform hand-written @FeignClient → @HttpExchange
     - Create HttpServiceProxyFactory beans
     - Remove @EnableFeignClients (after all clients migrated)
```

### Scenario 3: ONLY Hand-Written Clients

```text
Project has:
  - No OpenAPI Generator
  - Hand-written @FeignClient interfaces

Migration sequence:
  1. Skip openapi-generator-library-migrator
     (not applicable - no OpenAPI Generator)

  2. openfeign-to-httpinterface-migrator
     - Transform @FeignClient → @HttpExchange
     - Create configuration classes
     - Remove @EnableFeignClients
```

## Safety Mechanisms

### 1. Backup Before Modifications

```bash
# Maven
cp pom.xml pom.xml.bak

# Gradle
cp build.gradle.kts build.gradle.kts.bak

# Application.yml
cp src/main/resources/application.yml src/main/resources/application.yml.bak
```

### 2. XML Validation

```bash
# Validate pom.xml syntax after modifications
xmllint --noout pom.xml || {
  echo "❌ Invalid XML syntax. Restoring backup..."
  mv pom.xml.bak pom.xml
  exit 1
}
```

### 3. YAML Validation

```bash
# Validate application.yml syntax after modifications
yamllint src/main/resources/application.yml || {
  echo "❌ Invalid YAML syntax. Restoring backup..."
  mv src/main/resources/application.yml.bak src/main/resources/application.yml
  exit 1
}
```

### 4. Compilation Validation

```bash
# Validate generated code compiles
./mvnw clean compile -DskipTests || {
  echo "❌ Compilation failed. Review changes."
  echo "   Backups available: pom.xml.bak, application.yml.bak"
  exit 1
}
```

### 5. Rollback on Failure

```bash
# Automatic rollback function
rollback() {
  echo "❌ Migration failed at: $1"
  echo "   Restoring backups..."
  [ -f pom.xml.bak ] && mv pom.xml.bak pom.xml
  [ -f build.gradle.kts.bak ] && mv build.gradle.kts.bak build.gradle.kts
  [ -f src/main/resources/application.yml.bak ] && \
    mv src/main/resources/application.yml.bak src/main/resources/application.yml
  echo "✅ Backups restored. Please review error above."
  exit 1
}

# Usage
./mvnw generate-sources || rollback "Code generation"
```

## Integration with Migration State

### State Tracking

After successful migration, update `.migration-state.yaml`:

```yaml
appliedTransformations:
  - skill: openapi-generator-library-migrator
    version: '1.0.0'
    timestamp: '2026-01-05T11:00:00Z'
    transformations:
      - id: library-config-update
        from: 'spring-cloud'
        to: 'spring-http-interface'
      - id: config-package-addition
        configPackage: 'me.pacphi.mattermost.configuration'
      - id: template-directory-addition
        templateDirectory: '${project.basedir}/src/main/resources/templates'
      - id: feign-config-cleanup
        optionsRemoved:
          [
            'interfaceOnly',
            'useTags',
            'java8',
            'performBeanValidation',
            'useOptional',
            'basePackage',
            'invokerPackage',
          ]
      - id: application-yml-url-cleanup
        urlMappingsRemoved: 7
        clientsAffected: ['channels', 'posts', 'users', 'teams', 'files', 'preferences', 'webhooks']
    validation:
      codeGeneration: success
      compilation: success
      generatedFiles: 24
      annotationsFound:
        '@HttpExchange': 7
        '@FeignClient': 0
    commitSha: 'abc123def456'
```

### Idempotent Execution

```bash
# Check if already migrated
if grep -q "openapi-generator-library-migrator" .migration-state.yaml; then
    # Check if library is already spring-http-interface
    CURRENT_LIBRARY=$(grep -oP '<library>\K[^<]+' pom.xml | head -1)
    if [ "$CURRENT_LIBRARY" = "spring-http-interface" ]; then
        echo "✅ OpenAPI Generator library already migrated to spring-http-interface. Skipping."
        exit 0
    fi
fi
```

## Workflow Integration

### Called By

- **migration-agent** (Phase 11, Step 2a: Library Migration)
- **User command**: `/migrate-openapi-library`

### Calls

- **openapi-generator-detector** (for current config detection)
- **Build tools** (Maven/Gradle for code regeneration and validation)

### Execution Flow

```text
1. Detect OpenAPI Generator
   └─ If not present → Skip (not applicable)
   └─ If present → Continue

2. Detect library configuration
   └─ If spring-http-interface → Skip (already migrated)
   └─ If spring-cloud → Continue
   └─ If other → Warn user

3. Backup build files
   └─ pom.xml or build.gradle
   └─ application.yml

4. Update library configuration
   └─ Change library: spring-cloud → spring-http-interface
   └─ Add configPackage (inferred from apiPackage)
   └─ Add templateDirectory
   └─ Remove Feign-specific options
   └─ Keep common options

5. Validate XML/YAML syntax
   └─ If invalid → Rollback and exit
   └─ If valid → Continue

6. Clean application.yml
   └─ Detect Feign URL mappings
   └─ Remove generated client URLs
   └─ Preserve base URL property
   └─ Validate YAML syntax

7. Check for hand-written clients
   └─ If none → Remove @EnableFeignClients
   └─ If exist → Preserve (for later migration)

8. Regenerate code
   └─ Clean old generated code
   └─ Run generate-sources/openApiGenerate
   └─ Verify generated files

9. Validate compilation
   └─ Run clean compile -DskipTests
   └─ If fails → Rollback and report errors
   └─ If succeeds → Continue

10. Update migration state
    └─ Record transformations
    └─ Record validation results
    └─ Save commit sha

11. Report success
    └─ Show summary of changes
    └─ List next steps
```

## Error Handling

### Error 1: OpenAPI Generator Not Found

```text
ℹ️  OpenAPI Generator Library Migration

  OpenAPI Generator plugin not detected in:
    - pom.xml (Maven)
    - build.gradle/build.gradle.kts (Gradle)

  This skill is only applicable to projects using OpenAPI Generator.

  Skipping library migration. ✅
```

### Error 2: Library Already Migrated

```text
ℹ️  OpenAPI Generator Library Migration

  Current library: spring-http-interface ✅

  The OpenAPI Generator library has already been migrated.
  No migration needed.

  Skipping. ✅
```

### Error 3: Code Generation Fails

```text
❌ Error: Code generation failed

  Command: ./mvnw generate-sources
  Exit code: 1

  Error output:
    [ERROR] Failed to execute goal org.openapitools:openapi-generator-maven-plugin:7.18.0:generate
    [ERROR] Missing required config option: configPackage

  Cause: configPackage is required for spring-http-interface library

  Solution:
    1. Verify configPackage was added to pom.xml
    2. Check configPackage value: me.pacphi.mattermost.configuration
    3. Review error log above for specific issues

  Backups available:
    - pom.xml.bak
    - application.yml.bak
```

### Error 4: Compilation Fails After Regeneration

```text
❌ Error: Compilation failed after code regeneration

  Command: ./mvnw clean compile -DskipTests
  Exit code: 1

  Errors found:
    src/main/java/com/example/service/ApiService.java:[15,8] cannot find symbol
      symbol:   class ChannelsApiClient
      location: class com.example.service.ApiService

  Cause: Code still references old Feign client classes

  Solution:
    1. Generated class names changed:
       - Old: ChannelsApiClient
       - New: ChannelsApi

    2. Update service classes to use new names
    3. Or run openfeign-to-httpinterface-migrator for comprehensive migration

  Backups available if you need to revert:
    - pom.xml.bak
    - application.yml.bak
```

## Success Criteria

Migration is successful when:

- ✅ `<library>spring-http-interface</library>` in build file
- ✅ `<configPackage>` present and valid
- ✅ `<templateDirectory>` added (recommended)
- ✅ Feign-specific options removed
- ✅ Common options preserved
- ✅ Application.yml cleaned (Feign URLs removed)
- ✅ Code regeneration succeeds
- ✅ Generated code uses `@HttpExchange` (not `@FeignClient`)
- ✅ `HttpInterfacesAbstractConfigurator` generated
- ✅ Compilation succeeds
- ✅ Migration state updated

## Testing Requirements

### Manual Testing Checklist

#### Test Case 1: Maven Project with spring-cloud Library

Setup:

- Maven project
- openapi-generator-maven-plugin configured
- library: spring-cloud
- No hand-written Feign clients

Expected:

- ✅ Library updated to spring-http-interface
- ✅ configPackage added
- ✅ Feign options removed
- ✅ Code regenerates successfully
- ✅ @EnableFeignClients removed
- ✅ Compilation succeeds

#### Test Case 2: Gradle Project with spring-cloud Library

Setup:

- Gradle project (Kotlin DSL)
- org.openapi.generator plugin
- library: spring-cloud

Expected:

- ✅ Library updated
- ✅ configPackage added
- ✅ Code regenerates successfully
- ✅ Compilation succeeds

#### Test Case 3: Mixed Clients (OpenAPI + Hand-Written)

Setup:

- OpenAPI Generator with spring-cloud
- Hand-written @FeignClient interfaces exist

Expected:

- ✅ OpenAPI library migrated
- ✅ @EnableFeignClients preserved (hand-written clients still need it)
- ⚠️ Warning: Run openfeign-to-httpinterface-migrator for hand-written clients

#### Test Case 4: Already Migrated (Idempotency)

Setup:

- Library already spring-http-interface
- Migration state shows previous migration

Expected:

- ℹ️ Detects already migrated
- ✅ Skips migration (no changes)
- ✅ Reports "Already migrated" status

## Version History

### 1.0.0 (2026-01-05)

**Initial Release**:

- Library configuration migration (spring-cloud → spring-http-interface)
- configPackage inference and addition
- templateDirectory addition
- Feign-specific option removal
- Application.yml cleanup
- Code regeneration
- Compilation validation
- Coordination with openfeign-to-httpinterface-migrator
- State tracking
- Safety mechanisms (backup, validation, rollback)

## References

- [Spring Cloud OpenFeign Maintenance Mode](https://github.com/spring-cloud/spring-cloud-openfeign/discussions/867)
- [Spring Framework HTTP Interface](https://docs.spring.io/spring-framework/reference/7.0/integration/rest-clients.html#rest-http-interface)
- [OpenAPI Generator - Spring HTTP Interface](https://openapi-generator.tech/docs/generators/spring/)
- [Spring Boot 4 Migration Guide](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Migration-Guide)

## Related Skills

- **openapi-generator-detector**: Detects OpenAPI Generator usage and configuration
- **openapi-generator-plugin-updater**: Updates OpenAPI Generator plugin version
- **openfeign-to-httpinterface-migrator**: Migrates hand-written Feign clients
- **spring-framework-7-migrator**: Migrates Framework 7 API patterns
- **migration-agent**: Orchestrates full Spring Boot 4 migration
