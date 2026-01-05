---
description: Update OpenAPI Generator plugin to compatible version
argument-hint: [project-path] [--strategy conservative|latest]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Update OpenAPI Generator Plugin

Intelligently update OpenAPI Generator maven/gradle plugin to version compatible with target Spring Framework.

## Usage

```bash
# Auto-detect and update
update-openapi-generator

# Specific project
update-openapi-generator /path/to/project

# Conservative strategy (default)
update-openapi-generator --strategy conservative

# Latest strategy
update-openapi-generator --strategy latest
```

## What This Command Does

1. Detects OpenAPI Generator plugin version
2. Detects Spring Framework version
3. Determines compatible plugin version
4. Updates plugin in pom.xml/build.gradle
5. Validates template compatibility
6. Triggers template updates if needed

## Update Strategies

### Conservative (Default)

Updates to minimum compatible version for target Spring Framework:

- **Spring Framework 6.x**: OpenAPI Generator 7.0.0+
- **Spring Framework 7.x**: OpenAPI Generator 7.18.0+

**Use when**: Production migrations where stability is critical.

### Latest

Updates to latest stable OpenAPI Generator version:

- Always uses latest release from Maven Central
- May include new features and improvements
- Requires more testing

**Use when**: Development projects or when latest features needed.

## Output

```text
OpenAPI Generator Plugin Update
  Current: 7.17.0
  Framework: 7.0.0
  Required: 7.18.0 (conservative strategy)
  Updating...
  ✅ Plugin updated successfully

Validation:
  ✅ Code generation successful
  ✅ Compilation successful
```

## Spring Framework Compatibility Matrix

| Spring Framework | Minimum OpenAPI Generator | Recommended |
| ---------------- | ------------------------- | ----------- |
| 6.0.x - 6.x.x    | 7.0.0                     | 7.17.0      |
| 7.0.x+           | 7.18.0                    | 7.18.0+     |

## Integration with Migration

This command is automatically called during Phase 11 of the migration agent when:

- OpenAPI Generator plugin is detected
- `spring-http-interface` library is configured
- Spring Framework version upgrade detected

## Examples

### Example 1: Maven Project with Framework 7

```bash
# Current state
$ grep -A 3 "openapi-generator-maven-plugin" pom.xml
<artifactId>openapi-generator-maven-plugin</artifactId>
<version>7.10.0</version>

$ grep "<spring.framework.version>" pom.xml
<spring.framework.version>7.0.0</spring.framework.version>

# Run update
$ update-openapi-generator --strategy conservative

OpenAPI Generator Plugin Update
  Build Tool: Maven
  Current Plugin: 7.10.0
  Framework: 7.0.0
  Required: 7.18.0 (Framework 7 compatibility)
  Strategy: conservative

Updating pom.xml...
  ✅ Updated openapi-generator-maven-plugin: 7.10.0 → 7.18.0

Validating...
  ✅ Code generation successful
  ✅ Compilation successful

✅ Update complete!

Next steps:
  1. Run spring-framework-7-migrator if needed
  2. Test generated API clients
  3. Commit changes
```

### Example 2: Gradle Project with Custom Templates

```bash
$ update-openapi-generator /path/to/my-project

OpenAPI Generator Plugin Update
  Build Tool: Gradle
  Current Plugin: 7.17.0
  Framework: 7.0.0
  Required: 7.18.0
  Custom Templates: YES

Updating build.gradle.kts...
  ✅ Updated org.openapi.generator: 7.17.0 → 7.18.0

⚠️  Custom templates detected:
    src/main/resources/templates/spring-http-interface/httpInterfacesConfiguration.mustache

Recommendation:
  Run spring-framework-7-migrator --inject-templates to update templates

Validating...
  ⚠️  Code generation uses old Framework 6 API

Next steps:
  1. Run spring-framework-7-migrator --inject-templates
  2. Review and merge template changes
  3. Re-run code generation
  4. Test and commit
```

## Error Handling

### Error: Plugin Version Not Found

```text
❌ Error: Could not detect OpenAPI Generator plugin

Possible causes:
  - OpenAPI Generator not configured in pom.xml/build.gradle
  - Custom plugin configuration not recognized

Solution:
  Manually add OpenAPI Generator plugin to build file
```

### Error: Incompatible Framework Version

```text
❌ Error: Spring Framework version not compatible
   Framework: 5.3.30
   Required: 6.0.0+

Solution:
  Upgrade Spring Framework first using dependency-updater or build-file-updater
```

### Error: Code Generation Fails After Update

```text
❌ Error: Code generation failed after plugin update
   Error: Class not found: org.springframework.web.service.annotation.HttpExchange

Possible causes:
  - Spring Framework version too old
  - Missing dependencies

Solution:
  1. Verify Spring Framework 6.0+ or 7.0+
  2. Ensure spring-boot-starter-webmvc or spring-boot-starter-webflux is present
  3. Run dependency-updater to update all dependencies
```

## Related Commands

- `/migrate-framework-7` - Migrate Spring Framework 7 API patterns
- `/migrate` - Full Spring Boot 4 migration (includes OpenAPI Generator update)
- `/dependency-updater` - Update all dependencies including OpenAPI Generator

## State Tracking

This command updates `.migration-state.yaml`:

```yaml
appliedTransformations:
  - skill: openapi-generator-plugin-updater
    version: '1.0.0'
    transformations:
      - openapi-plugin-version-update
      - framework-compatibility-check
    pluginUpdate:
      from: '7.17.0'
      to: '7.18.0'
    strategy: conservative
    completedAt: '2026-01-05T10:30:00Z'
    commitSha: abc123
```

## Version History

### 1.0.0 (2026-01-05)

**Initial Release**:

- Maven and Gradle support
- Spring Framework compatibility detection
- Conservative and latest update strategies
- Template compatibility validation
- Integration with spring-framework-7-migrator

## See Also

- [Spring Framework 7 Migration Guide](../docs/migrations/spring-framework-7.md)
- [OpenAPI Generator Plugin Updater Skill](../skills/openapi-generator-plugin-updater/SKILL.md)
- [Spring Framework 7 Migrator Skill](../skills/spring-framework-7-migrator/SKILL.md)
