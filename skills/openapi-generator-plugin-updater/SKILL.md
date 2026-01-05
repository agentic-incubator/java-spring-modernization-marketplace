---
name: openapi-generator-plugin-updater
description: Intelligent OpenAPI Generator maven/gradle plugin version management with Spring Framework compatibility validation. Use when updating OpenAPI Generator plugin to ensure compatibility with target Spring Framework version.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# OpenAPI Generator Plugin Updater

Intelligently updates OpenAPI Generator maven/gradle plugin versions based on Spring Framework compatibility requirements.

## Critical Rules

1. **Plugin version MUST match Spring Framework version** - Framework 7.x requires plugin ≥7.18.0
2. **Template compatibility depends on plugin version** - Plugin version determines API patterns
3. **Always validate library configuration** - Only update if using `spring-http-interface` library
4. **Coordinate with spring-framework-7-migrator** - Trigger template updates for Framework 7
5. **Use conservative update strategy** - Only update if incompatible, not just for latest version

## Spring Framework Compatibility Matrix

| Spring Framework | Minimum Plugin | Recommended | Template API | Reason |
|------------------|----------------|-------------|--------------|--------|
| **7.x** | 7.18.0 | 7.18.0 | `.builderFor()` | Framework 7 API changes |
| **6.x** | 7.0.0 | 7.17.0 | `.builder()` | Framework 6 API |
| **5.x** | 6.0.0 | 6.6.0 | `.builder()` | Legacy support |

## When This Skill Applies

**Automatic detection criteria:**

1. **OpenAPI Generator plugin detected** in Maven or Gradle
2. **Library configuration** = `spring-http-interface`
3. **Plugin version incompatible** with target Spring Framework version

**Not needed when:**

- Not using OpenAPI Generator
- Using different library (e.g., `spring-cloud`, `java`, `kotlin`)
- Plugin version already compatible

## Detection Logic

### Maven Detection

```bash
# Detect OpenAPI Generator plugin
grep -r "openapi-generator-maven-plugin" pom.xml

# Extract current plugin version
CURRENT_VERSION=$(grep -A 5 "openapi-generator-maven-plugin" pom.xml | \
  grep "<version>" | \
  sed 's/.*<version>\(.*\)<\/version>/\1/' | \
  head -1)

# Detect library configuration
LIBRARY=$(grep -A 20 "<configOptions>" pom.xml | \
  grep "<library>" | \
  sed 's/.*<library>\(.*\)<\/library>/\1/')

echo "OpenAPI Generator: ${CURRENT_VERSION}"
echo "Library: ${LIBRARY}"
```

**Example pom.xml**:

```xml
<plugin>
    <groupId>org.openapitools</groupId>
    <artifactId>openapi-generator-maven-plugin</artifactId>
    <version>7.17.0</version>  <!-- DETECTED -->
    <configuration>
        <generatorName>spring</generatorName>
        <library>spring-http-interface</library>  <!-- DETECTED -->
    </configuration>
</plugin>
```

### Gradle Detection

```bash
# Detect OpenAPI Generator plugin
grep -r 'id("org.openapi.generator")' build.gradle build.gradle.kts

# Extract current plugin version
CURRENT_VERSION=$(grep 'id("org.openapi.generator")' build.gradle.kts | \
  sed 's/.*version "\([^"]*\)".*/\1/')

# Detect library configuration
LIBRARY=$(grep -A 10 "openApiGenerate" build.gradle.kts | \
  grep "library" | \
  sed 's/.*library.*=.*"\([^"]*\)".*/\1/')

echo "OpenAPI Generator: ${CURRENT_VERSION}"
echo "Library: ${LIBRARY}"
```

**Example build.gradle.kts**:

```kotlin
plugins {
    id("org.openapi.generator") version "7.17.0"  // DETECTED
}

openApiGenerate {
    generatorName.set("spring")
    library.set("spring-http-interface")  // DETECTED
}
```

### Spring Framework Version Detection

```bash
# Use version-detector skill to get Spring Framework version
FRAMEWORK_VERSION=$(version-detector --framework spring-framework)

# Determine compatibility
if [[ "$FRAMEWORK_VERSION" =~ ^7\. ]]; then
  REQUIRED_PLUGIN="7.18.0"
  TEMPLATE_API="builderFor"
elif [[ "$FRAMEWORK_VERSION" =~ ^6\. ]]; then
  REQUIRED_PLUGIN="7.0.0"
  TEMPLATE_API="builder"
else
  REQUIRED_PLUGIN="6.0.0"
  TEMPLATE_API="builder"
fi

echo "Spring Framework: ${FRAMEWORK_VERSION}"
echo "Required Plugin: ${REQUIRED_PLUGIN}"
echo "Template API: ${TEMPLATE_API}"
```

## Update Workflow

### Step 1: Detection

```bash
# Detect OpenAPI Generator plugin
DETECTED=$(detect_openapi_generator_plugin)

if [ "$DETECTED" = "false" ]; then
  echo "OpenAPI Generator not detected - skipping"
  exit 0
fi

echo "✅ OpenAPI Generator detected"
```

### Step 2: Library Validation

```bash
# Check if using spring-http-interface library
LIBRARY=$(detect_library_configuration)

if [ "$LIBRARY" != "spring-http-interface" ]; then
  echo "ℹ️  Library '$LIBRARY' doesn't require plugin update - skipping"
  exit 0
fi

echo "✅ Using spring-http-interface library"
```

### Step 3: Framework Version Detection

```bash
# Detect Spring Framework version
FRAMEWORK_VERSION=$(detect_spring_framework_version)

echo "Spring Framework version: ${FRAMEWORK_VERSION}"
```

### Step 4: Compatibility Check

```bash
# Get current plugin version
CURRENT_PLUGIN=$(get_current_plugin_version)

# Determine required plugin version
REQUIRED_PLUGIN=$(get_required_plugin_version "$FRAMEWORK_VERSION")

# Check compatibility
if is_compatible "$CURRENT_PLUGIN" "$REQUIRED_PLUGIN"; then
  echo "✅ Plugin version ${CURRENT_PLUGIN} is compatible with Framework ${FRAMEWORK_VERSION}"
  exit 0
fi

echo "⚠️  Plugin version ${CURRENT_PLUGIN} is NOT compatible"
echo "    Required: ${REQUIRED_PLUGIN}+"
echo "    Updating plugin..."
```

### Step 5: Plugin Update

**Maven**:

```bash
# Update plugin version in pom.xml
sed -i.bak "s/<version>${CURRENT_PLUGIN}<\/version>/<version>${REQUIRED_PLUGIN}<\/version>/" pom.xml

echo "✅ Updated plugin: ${CURRENT_PLUGIN} → ${REQUIRED_PLUGIN}"
```

**Gradle**:

```bash
# Update plugin version in build.gradle.kts
sed -i.bak "s/version \"${CURRENT_PLUGIN}\"/version \"${REQUIRED_PLUGIN}\"/" build.gradle.kts

echo "✅ Updated plugin: ${CURRENT_PLUGIN} → ${REQUIRED_PLUGIN}"
```

### Step 6: Template Compatibility Check

```bash
# Check if templates need updating for Framework 7
if [[ "$FRAMEWORK_VERSION" =~ ^7\. ]]; then
  echo "⚠️  Spring Framework 7 detected - checking templates..."

  # Check for old API patterns in templates
  if grep -r "\.builder(" src/main/resources/templates/ 2>/dev/null; then
    echo "⚠️  Old Framework 6 API detected in templates"
    echo "    Triggering spring-framework-7-migrator..."

    # Trigger template migration
    invoke_skill "spring-framework-7-migrator" "--inject-templates"
  else
    echo "✅ Templates already use Framework 7 API"
  fi
fi
```

### Step 7: Validation

```bash
# Regenerate OpenAPI code
if command -v mvn &> /dev/null; then
  mvn clean generate-sources
elif command -v gradle &> /dev/null; then
  ./gradlew clean openApiGenerate
fi

# Validate compilation
if command -v mvn &> /dev/null; then
  mvn clean compile -DskipTests
elif command -v gradle &> /dev/null; then
  ./gradlew clean compileJava -x test
fi

if [ $? -eq 0 ]; then
  echo "✅ Validation successful - generated code compiles"
else
  echo "❌ Validation failed - compilation errors"
  exit 1
fi
```

## Update Strategies

### Conservative (Default)

**When**: Production migrations requiring stability

**Behavior**:

- Only update if current plugin version is incompatible
- Use minimum required version, not latest
- Preserve existing templates unless incompatible

**Example**:

```bash
# Current: 7.10.0
# Framework: 7.0.0
# Required: 7.0.0
# Action: Skip (7.10.0 >= 7.0.0)

# Current: 6.6.0
# Framework: 7.0.0
# Required: 7.18.0
# Action: Update to 7.18.0 (incompatible)
```

### Latest

**When**: Development environments wanting cutting-edge features

**Behavior**:

- Always update to recommended version
- May update even if compatible
- Ensures latest bug fixes and features

**Example**:

```bash
# Current: 7.10.0
# Framework: 7.0.0
# Recommended: 7.18.0
# Action: Update to 7.18.0 (recommended)
```

## Integration with Migration State

### State Tracking

```yaml
appliedTransformations:
  - skill: openapi-generator-plugin-updater
    version: '1.0.0'
    transformations:
      - plugin-version-detection
      - framework-version-detection
      - plugin-version-update
      - template-compatibility-validation
    completedAt: '2026-01-05T10:30:00Z'
    commitSha: 'abc123def'

    pluginUpdate:
      buildTool: maven
      from: "7.17.0"
      to: "7.18.0"
      reason: "Spring Framework 7.0.0 compatibility"
      library: "spring-http-interface"

    frameworkCompatibility:
      springFramework: "7.0.0"
      requiredPlugin: "7.18.0"
      compatible: true

    templateUpdate:
      triggered: true
      skill: "spring-framework-7-migrator"
      reason: "Framework 7 API changes require template update"
```

### Idempotent Execution

```bash
# Check if already applied
if is_transformation_applied "openapi-generator-plugin-updater" "plugin-version-update"; then
  APPLIED_VERSION=$(get_applied_plugin_version)
  CURRENT_VERSION=$(get_current_plugin_version)

  if [ "$APPLIED_VERSION" = "$CURRENT_VERSION" ]; then
    echo "✅ Plugin already updated to ${CURRENT_VERSION} - skipping"
    exit 0
  else
    echo "⚠️  Manual plugin version change detected"
    echo "    State: ${APPLIED_VERSION}, Current: ${CURRENT_VERSION}"
    echo "    Re-validating compatibility..."
  fi
fi
```

## Coordination with spring-framework-7-migrator

When Spring Framework 7 is detected with spring-http-interface library:

1. **Plugin updated first** - Ensure compatible version
2. **Template migration triggered** - Update templates to Framework 7 API
3. **Code regenerated** - Generate with new templates
4. **Validation run** - Ensure compilation succeeds

**Integration Example**:

```bash
# After plugin update
if requires_framework_7_templates; then
  echo "Coordinating with spring-framework-7-migrator..."

  # Trigger template migration
  spring-framework-7-migrator --inject-templates

  # Regenerate code with new templates
  mvn generate-sources

  # Validate
  mvn compile -DskipTests
fi
```

## Error Handling

### Plugin Not Found

```text
❌ OpenAPI Generator plugin not found

Checked:
  - pom.xml: No openapi-generator-maven-plugin
  - build.gradle: No org.openapi.generator plugin
  - build.gradle.kts: No org.openapi.generator plugin

This skill only applies to projects using OpenAPI Generator.
```

### Library Not spring-http-interface

```text
ℹ️  Skipping plugin update

Reason: Library 'spring-cloud' doesn't require Spring Framework compatibility

Only 'spring-http-interface' library requires plugin version matching
Framework version due to API dependencies (HttpServiceProxyFactory).

Current configuration:
  Library: spring-cloud
  Plugin: 7.10.0
  No update needed.
```

### Plugin Update Failed

```text
❌ Plugin update failed

Error: Cannot update plugin version in pom.xml
  - Current version pattern not found
  - Multiple plugin declarations detected
  - Build file may have custom structure

Manual action required:
  1. Locate openapi-generator-maven-plugin in pom.xml
  2. Update <version> to 7.18.0 or higher
  3. Retry migration
```

### Validation Failed

```text
❌ Generated code compilation failed after plugin update

Plugin updated: 7.17.0 → 7.18.0
Error: HttpServiceProxyFactory.builder() not found

Root cause: Templates still use Framework 6 API

Next steps:
  1. Run spring-framework-7-migrator --inject-templates
  2. Regenerate code: mvn generate-sources
  3. Retry compilation
```

## Output Format

```text
=== OpenAPI Generator Plugin Update ===

Project: /Users/user/my-spring-app
Build Tool: Maven

Detection:
  ✅ OpenAPI Generator plugin found
  ✅ Library: spring-http-interface
  ✅ Spring Framework: 7.0.0

Compatibility Check:
  Current Plugin: 7.17.0
  Required Plugin: 7.18.0+
  Status: ❌ INCOMPATIBLE

Update:
  From: 7.17.0
  To: 7.18.0
  Reason: Spring Framework 7 API compatibility

Template Check:
  Framework 7 Detected: Yes
  Template Update Needed: Yes
  Triggering: spring-framework-7-migrator

Validation:
  Code Generation: ✅ PASSED
  Compilation: ✅ PASSED

✅ OpenAPI Generator plugin update complete!

State updated: .migration-state.yaml
Commit: abc123d
```

## Edge Cases

### Multiple Plugin Declarations

If project has multiple OpenAPI Generator configurations (e.g., multiple APIs):

```xml
<plugin>
    <groupId>org.openapitools</groupId>
    <artifactId>openapi-generator-maven-plugin</artifactId>
    <version>7.17.0</version>
    <executions>
        <execution>
            <id>user-api</id>
            <goals><goal>generate</goal></goals>
            <configuration>
                <library>spring-http-interface</library>
            </configuration>
        </execution>
        <execution>
            <id>product-api</id>
            <goals><goal>generate</goal></goals>
            <configuration>
                <library>java</library>  <!-- Different library -->
            </configuration>
        </execution>
    </executions>
</plugin>
```

**Action**:

- Update plugin version once (applies to all executions)
- Only trigger template updates for spring-http-interface executions
- Validate each execution separately

### Custom Template Directory

If project uses custom template directory:

```xml
<configuration>
    <templateDirectory>${project.basedir}/src/main/resources/custom-templates</templateDirectory>
</configuration>
```

**Action**:

- Detect custom template directory
- Inject Framework 7 templates into custom directory
- Preserve user customizations using merge strategy

### Plugin Managed in Parent POM

If plugin version managed in parent POM:

```xml
<!-- parent POM -->
<pluginManagement>
    <plugins>
        <plugin>
            <groupId>org.openapitools</groupId>
            <artifactId>openapi-generator-maven-plugin</artifactId>
            <version>7.17.0</version>
        </plugin>
    </plugins>
</pluginManagement>
```

**Action**:

- Detect parent POM management
- Log warning: "Plugin version managed in parent POM"
- Suggest updating parent POM or overriding in child

## Best Practices

1. **Always validate after update** - Run code generation and compilation
2. **Use conservative strategy in production** - Only update when necessary
3. **Coordinate template updates** - Ensure templates match plugin API
4. **Test generated clients** - Verify API client functionality
5. **Review breaking changes** - Check OpenAPI Generator changelogs for major updates
6. **Backup before update** - Create versionsBackup or git commit

## Related Skills

| Skill | Purpose | Integration |
|-------|---------|-------------|
| **spring-framework-7-migrator** | Template updates for Framework 7 | Triggered when Framework 7 detected |
| **version-detector** | Detect Spring Framework version | Used to determine required plugin version |
| **dependency-updater** | General dependency/plugin updates | Delegates OpenAPI Generator to this skill |
| **build-tool-detector** | Detect Maven vs Gradle | Used to determine update commands |
| **pattern-detector** | Detect configuration patterns | Used to find library configuration |

## Version History

- **1.0.0** (2026-01-05): Initial release with Spring Framework 7 compatibility support
