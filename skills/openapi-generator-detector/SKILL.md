# OpenAPI Generator Detector

**Version**: 1.0.0
**Skill ID**: `openapi-generator-detector`
**Status**: Production
**Automation Potential**: 100%

## Overview

Provide reusable detection logic for OpenAPI Generator usage, library configuration, and template paths. This skill is used by other skills to:

- Detect if OpenAPI Generator is used in a project (Maven or Gradle)
- Identify the library configuration (spring-http-interface, spring-cloud, etc.)
- Locate custom template directories
- Find existing mustache template files

## Detection Patterns

### Maven Plugin Detection

**Pattern**: `openapi-generator-maven-plugin`
**Location**: `pom.xml`

**Command**:

```bash
grep -q "openapi-generator-maven-plugin" pom.xml && echo "DETECTED" || echo "NOT_FOUND"
```

**Example Match**:

```xml
<plugin>
    <groupId>org.openapitools</groupId>
    <artifactId>openapi-generator-maven-plugin</artifactId>
    <version>7.17.0</version>
</plugin>
```

### Gradle Plugin Detection

**Pattern**: `org\.openapi\.generator`
**Location**: `build.gradle` or `build.gradle.kts`

**Command**:

```bash
grep -E "org\.openapi\.generator" build.gradle build.gradle.kts 2>/dev/null && echo "DETECTED" || echo "NOT_FOUND"
```

**Example Match (Groovy)**:

```gradle
plugins {
    id 'org.openapi.generator' version '7.17.0'
}
```

**Example Match (Kotlin DSL)**:

```kotlin
plugins {
    id("org.openapi.generator") version "7.17.0"
}
```

### Library Configuration Detection

#### Spring HTTP Interface

**Pattern**: `<library>spring-http-interface</library>|library.*spring-http-interface`

**Maven**:

```bash
grep -E "<library>spring-http-interface</library>" pom.xml
```

**Gradle**:

```bash
grep -E "library.*=.*['\"]spring-http-interface['\"]" build.gradle
```

**Example Match (Maven)**:

```xml
<configuration>
    <generatorName>java</generatorName>
    <library>spring-http-interface</library>
</configuration>
```

**Example Match (Gradle)**:

```gradle
configOptions = [
    library: "spring-http-interface"
]
```

#### Spring Cloud

**Pattern**: `<library>spring-cloud</library>|library.*spring-cloud`

**Maven**:

```bash
grep -E "<library>spring-cloud</library>" pom.xml
```

**Gradle**:

```bash
grep -E "library.*=.*['\"]spring-cloud['\"]" build.gradle
```

### Custom Template Detection

#### Maven Template Directory

**Pattern**: `<templateDirectory>`
**Location**: `pom.xml`

**Command**:

```bash
grep -oP '<templateDirectory>\K[^<]+' pom.xml
```

**Example**:

```xml
<configuration>
    <templateDirectory>${project.basedir}/src/main/resources/templates</templateDirectory>
</configuration>
```

**Output**: `${project.basedir}/src/main/resources/templates`

#### Gradle Template Directory

**Pattern**: `templateDir|templates`
**Location**: `build.gradle` or `build.gradle.kts`

**Command**:

```bash
grep -oP 'templateDir.*=.*["\'\'']\K[^"\'\'']+" build.gradle
```

**Example**:

```gradle
templateDir = file("${projectDir}/src/main/resources/templates")
```

**Output**: `${projectDir}/src/main/resources/templates`

#### Template Files (File System)

**Pattern**: `*.mustache`
**Location**: `src/main/resources/templates/**`

**Command**:

```bash
find src/main/resources/templates -name "*.mustache" 2>/dev/null
```

**Example Output**:

```text
src/main/resources/templates/spring-http-interface/httpInterfacesConfiguration.mustache
src/main/resources/templates/spring-http-interface/apiInterface.mustache
```

## Output Formats

### JSON Format

```json
{
  "openapiGenerator": {
    "detected": true,
    "buildTool": "maven",
    "pluginVersion": "7.17.0",
    "library": "spring-http-interface",
    "customTemplates": {
      "detected": true,
      "directory": "src/main/resources/templates",
      "templates": [
        "src/main/resources/templates/spring-http-interface/httpInterfacesConfiguration.mustache"
      ]
    }
  }
}
```

### YAML Format

```yaml
openapiGenerator:
  detected: true
  buildTool: maven
  pluginVersion: 7.17.0
  library: spring-http-interface
  customTemplates:
    detected: true
    directory: src/main/resources/templates
    templates:
      - src/main/resources/templates/spring-http-interface/httpInterfacesConfiguration.mustache
```

### Text Format

```text
OpenAPI Generator Detection Results
====================================

Build Tool: Maven
Plugin Version: 7.17.0
Library: spring-http-interface

Custom Templates: YES
Template Directory: src/main/resources/templates
Template Files:
  - src/main/resources/templates/spring-http-interface/httpInterfacesConfiguration.mustache
```

## Detection Workflow

### Complete Detection Sequence

```bash
#!/bin/bash

# 1. Detect build tool
if [ -f "pom.xml" ]; then
    BUILD_TOOL="maven"
elif [ -f "build.gradle" ] || [ -f "build.gradle.kts" ]; then
    BUILD_TOOL="gradle"
else
    echo "No build tool detected"
    exit 1
fi

# 2. Detect OpenAPI Generator plugin
if [ "$BUILD_TOOL" = "maven" ]; then
    PLUGIN_DETECTED=$(grep -q "openapi-generator-maven-plugin" pom.xml && echo "true" || echo "false")
    PLUGIN_VERSION=$(grep -A 1 "openapi-generator-maven-plugin" pom.xml | grep -oP '<version>\K[^<]+')
elif [ "$BUILD_TOOL" = "gradle" ]; then
    PLUGIN_DETECTED=$(grep -qE "org\.openapi\.generator" build.gradle* && echo "true" || echo "false")
    PLUGIN_VERSION=$(grep -oP "org\.openapi\.generator.*version.*['\"]?\K[\d\.]+['\"]?" build.gradle*)
fi

if [ "$PLUGIN_DETECTED" = "false" ]; then
    echo "OpenAPI Generator not detected"
    exit 0
fi

# 3. Detect library configuration
if [ "$BUILD_TOOL" = "maven" ]; then
    LIBRARY=$(grep -oP '<library>\K[^<]+' pom.xml)
elif [ "$BUILD_TOOL" = "gradle" ]; then
    LIBRARY=$(grep -oP 'library.*=.*["\'\'']\K[^"\'\'']+" build.gradle*)
fi

# 4. Detect custom template directory
if [ "$BUILD_TOOL" = "maven" ]; then
    TEMPLATE_DIR=$(grep -oP '<templateDirectory>\K[^<]+' pom.xml)
elif [ "$BUILD_TOOL" = "gradle" ]; then
    TEMPLATE_DIR=$(grep -oP 'templateDir.*=.*["\'\'']\K[^"\'\'']+" build.gradle*)
fi

# 5. Find template files
if [ -n "$TEMPLATE_DIR" ]; then
    # Expand variables
    TEMPLATE_DIR_EXPANDED=$(eval echo $TEMPLATE_DIR)
    TEMPLATE_FILES=$(find "$TEMPLATE_DIR_EXPANDED" -name "*.mustache" 2>/dev/null)
else
    # Check default location
    TEMPLATE_FILES=$(find src/main/resources/templates -name "*.mustache" 2>/dev/null)
fi

# Output results
echo "Build Tool: $BUILD_TOOL"
echo "Plugin Detected: $PLUGIN_DETECTED"
echo "Plugin Version: $PLUGIN_VERSION"
echo "Library: $LIBRARY"
echo "Template Directory: $TEMPLATE_DIR"
echo "Template Files:"
echo "$TEMPLATE_FILES"
```

## Integration with Other Skills

### Called By

- **openapi-generator-plugin-updater**: To detect current configuration before updating
- **spring-framework-7-migrator**: To detect if template injection is needed
- **migration-agent**: During Phase 11 (OpenAPI Generator Plugin Update)

### Example Usage in openapi-generator-plugin-updater

```bash
# Use detector to get current configuration
DETECTION_RESULT=$(openapi-generator-detector --format json)

# Parse JSON
BUILD_TOOL=$(echo $DETECTION_RESULT | jq -r '.openapiGenerator.buildTool')
PLUGIN_VERSION=$(echo $DETECTION_RESULT | jq -r '.openapiGenerator.pluginVersion')
LIBRARY=$(echo $DETECTION_RESULT | jq -r '.openapiGenerator.library')

# Make decisions based on detection
if [ "$LIBRARY" = "spring-http-interface" ]; then
    echo "Spring HTTP Interface detected. Checking Framework 7 compatibility..."
fi
```

### Example Usage in spring-framework-7-migrator

```bash
# Use detector to check for custom templates
CUSTOM_TEMPLATES=$(openapi-generator-detector --format json | jq -r '.openapiGenerator.customTemplates.detected')

if [ "$CUSTOM_TEMPLATES" = "true" ]; then
    echo "Custom templates detected. Entering manual merge workflow..."
    # Show diff, ask user, etc.
else
    echo "No custom templates. Copying bundled template..."
    # Copy bundled template
fi
```

## Command-Line Interface

### Usage

```bash
# Auto-detect in current directory
openapi-generator-detector

# Specific project
openapi-generator-detector /path/to/project

# JSON output
openapi-generator-detector --format json

# YAML output
openapi-generator-detector --format yaml

# Text output (default)
openapi-generator-detector --format text

# Check specific aspect
openapi-generator-detector --check plugin
openapi-generator-detector --check library
openapi-generator-detector --check templates
```

### Exit Codes

- `0`: Detection completed successfully
- `1`: No build tool found
- `2`: OpenAPI Generator not detected
- `3`: Invalid arguments

## Edge Cases

### Edge Case 1: Multi-Module Maven Project

**Scenario**: Parent POM defines plugin, child modules use it.

**Solution**:

- Detect plugin in parent POM
- Check each module for library configuration
- Report per-module results

### Edge Case 2: Gradle Composite Build

**Scenario**: Multiple Gradle projects in composite build.

**Solution**:

- Detect plugin in each sub-project
- Report per-project results

### Edge Case 3: Custom Template with Non-Standard Location

**Scenario**: Templates stored outside `src/main/resources/templates`.

**Solution**:

- Parse `templateDirectory` or `templateDir` configuration
- Expand variables (`${project.basedir}`, `${projectDir}`)
- Search in resolved directory

### Edge Case 4: No Library Configuration

**Scenario**: OpenAPI Generator plugin detected but no library specified.

**Solution**:

- Report library as `default` or `unknown`
- Check generated code to infer library

## Testing Requirements

### Unit Tests

1. **Maven Plugin Detection**:
   - Test with plugin present
   - Test with plugin absent
   - Test with different plugin versions

2. **Gradle Plugin Detection**:
   - Test with Groovy DSL
   - Test with Kotlin DSL
   - Test with plugin present/absent

3. **Library Detection**:
   - Test spring-http-interface
   - Test spring-cloud
   - Test no library (default)

4. **Template Detection**:
   - Test with custom template directory (Maven)
   - Test with custom template directory (Gradle)
   - Test with no custom templates
   - Test with multiple template files

### Integration Tests

1. **Complete Detection on Real Projects**:
   - Test on mattermost-ai-service (spring-http-interface)
   - Test on spring-ai-resos (spring-http-interface)
   - Test on project without OpenAPI Generator

2. **Output Format Validation**:
   - Test JSON output parsing
   - Test YAML output parsing
   - Test text output readability

## Version History

### 1.0.0 (2026-01-05)

**Initial Release**:

- Maven plugin detection
- Gradle plugin detection
- Library configuration detection
- Custom template detection
- JSON, YAML, and text output formats
- Integration with other skills

## Related Skills

- **openapi-generator-plugin-updater**: Uses detector to get current configuration
- **spring-framework-7-migrator**: Uses detector to check for custom templates
- **migration-agent**: Uses detector during Phase 11
