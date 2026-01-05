---
description: Migrate OpenAPI Generator from spring-cloud to spring-http-interface library
argument-hint: [project-path] [--dry-run]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Migrate OpenAPI Generator Library

Migrate OpenAPI Generator library configuration from `spring-cloud` (Feign) to `spring-http-interface` for Spring Boot 4 compatibility.

## Usage

```bash
# Migrate current project
migrate-openapi-library

# Specific project
migrate-openapi-library /path/to/project

# Dry run (show what would be changed)
migrate-openapi-library --dry-run
```

## What This Command Does

1. Detects OpenAPI Generator plugin and current library
2. Updates library: `spring-cloud` → `spring-http-interface`
3. Adds `configPackage` (required for spring-http-interface)
4. Adds `templateDirectory` (for Framework 7 templates)
5. Removes Feign-specific options
6. Cleans application.yml (removes Feign URL mappings)
7. Regenerates code with new configuration
8. Validates compilation

## Why This Migration

**Spring Cloud OpenFeign**: Entered maintenance mode as of Spring Cloud 2022.0.0
**Spring Boot 4**: Incompatible with Spring Cloud OpenFeign 2025.0.x
**Solution**: Use Spring Framework's built-in HTTP Interface (since Framework 6.0)

## Configuration Changes

### Before (Feign)

```xml
<configuration>
    <library>spring-cloud</library>
    <configOptions>
        <interfaceOnly>false</interfaceOnly>
        <useTags>true</useTags>
    </configOptions>
</configuration>
```

### After (HTTP Interface)

```xml
<configuration>
    <library>spring-http-interface</library>
    <templateDirectory>${project.basedir}/src/main/resources/templates</templateDirectory>
    <configOptions>
        <configPackage>me.pacphi.mattermost.configuration</configPackage>
        <useJakartaEe>true</useJakartaEe>
    </configOptions>
</configuration>
```

## Output

### Successful Migration

```text
OpenAPI Generator Library Migration

Step 1: Detection
  ✅ OpenAPI Generator detected (Maven)
  ✅ Current library: spring-cloud
  ℹ️  Target library: spring-http-interface

Step 2: Backup
  ✅ Created backup: pom.xml.bak
  ✅ Created backup: application.yml.bak

Step 3: Update Build Configuration
  ✅ Library: spring-cloud → spring-http-interface
  ✅ Added configPackage: me.pacphi.mattermost.configuration
  ✅ Added templateDirectory: ${project.basedir}/src/main/resources/templates
  ✅ Removed Feign options: interfaceOnly, useTags, java8
  ✅ Validated XML syntax

Step 4: Clean Application Configuration
  ✅ Detected 7 Feign client URL mappings
  ✅ Removed URL mappings: channels, posts, users, teams, files, preferences, webhooks
  ✅ Preserved base URL: mattermost.base-url
  ✅ Validated YAML syntax

Step 5: Check for Hand-Written Clients
  ℹ️  No hand-written @FeignClient interfaces found
  ✅ Removed @EnableFeignClients annotation

Step 6: Regenerate Code
  ✅ Cleaned old generated code
  ✅ Regenerated with new configuration (45s)
  ✅ Generated 24 files
     - 7 *Api interfaces (@HttpExchange)
     - 15 model classes
     - 1 HttpInterfacesAbstractConfigurator
     - 1 ApiClient configurator

Step 7: Validation
  ✅ Compilation successful (52s)
  ✅ No @FeignClient annotations found
  ✅ Found 7 @HttpExchange annotations

✅ Migration complete!

Summary:
  Library: spring-cloud → spring-http-interface
  configPackage: me.pacphi.mattermost.configuration
  Feign options removed: 7
  URL mappings cleaned: 7
  Files regenerated: 24
  Compilation: SUCCESS

Next steps:
  1. Review generated code in target/generated-sources/openapi
  2. Update service classes if they reference old client names
  3. Run tests
  4. Run spring-framework-7-migrator if using Framework 7
```

### Migration with Hand-Written Clients

```text
OpenAPI Generator Library Migration

[... steps 1-7 same as above ...]

Step 5: Check for Hand-Written Clients
  ⚠️  Found 3 hand-written @FeignClient interfaces:
      - src/main/java/com/example/client/LegacyApiClient.java
      - src/main/java/com/example/client/ExternalServiceClient.java
      - src/main/java/com/example/client/ThirdPartyClient.java

  ℹ️  Preserving @EnableFeignClients (required for hand-written clients)

  Recommendation:
    Run openfeign-to-httpinterface-migrator to migrate hand-written clients

✅ OpenAPI Generator library migration complete!

⚠️  Next: Migrate hand-written clients
  /migrate-openfeign
```

## Examples

### Example 1: Maven Project

```bash
$ migrate-openapi-library

OpenAPI Generator Library Migration

Detection:
  ✅ Build tool: Maven
  ✅ OpenAPI Generator plugin: 7.18.0
  ✅ Current library: spring-cloud
  ✅ API package: me.pacphi.mattermost.api
  ℹ️  Inferred configPackage: me.pacphi.mattermost.configuration

Configuration updates:
  ✅ pom.xml modified (4 changes)
     1. library: spring-cloud → spring-http-interface
     2. Added configPackage: me.pacphi.mattermost.configuration
     3. Added templateDirectory
     4. Removed Feign options: interfaceOnly, useTags

Application.yml cleanup:
  ✅ Removed 7 Feign URL mappings
  ✅ Preserved base URL: mattermost.base-url

Code regeneration:
  ✅ Generated 24 files (7 APIs, 15 models, 2 config)

Validation:
  ✅ Compilation successful

✅ Migration complete! (1m 42s)
```

### Example 2: Gradle Project (Kotlin DSL)

```bash
$ migrate-openapi-library

OpenAPI Generator Library Migration

Detection:
  ✅ Build tool: Gradle (Kotlin DSL)
  ✅ OpenAPI Generator plugin: 7.18.0
  ✅ Current library: spring-cloud

Configuration updates:
  ✅ build.gradle.kts modified
     - library.set("spring-http-interface")
     - configOptions["configPackage"] = "com.example.configuration"
     - templateDir.set(file("${projectDir}/src/main/resources/templates"))

Code regeneration:
  ✅ ./gradlew openApiGenerate (38s)

✅ Migration complete!
```

### Example 3: Dry Run

```bash
$ migrate-openapi-library --dry-run

OpenAPI Generator Library Migration (DRY RUN)

The following changes would be made:

pom.xml:
  Line 45: <library>spring-cloud</library>
        → <library>spring-http-interface</library>

  Line 48: Add:
    <templateDirectory>${project.basedir}/src/main/resources/templates</templateDirectory>

  Line 52: Add to configOptions:
    <configPackage>me.pacphi.mattermost.configuration</configPackage>

  Lines 55-61: Remove:
    <interfaceOnly>false</interfaceOnly>
    <useTags>true</useTags>
    <java8>true</java8>

application.yml:
  Remove URL mappings for: channels, posts, users, teams (4 entries)

Generated code:
  Would regenerate 24 files with @HttpExchange annotations

Main application:
  Would remove @EnableFeignClients (no hand-written clients found)

No changes were made. Run without --dry-run to apply.
```

## Error Handling

### Error: OpenAPI Generator Not Found

```text
ℹ️  OpenAPI Generator Library Migration

  OpenAPI Generator plugin not detected.

  This command requires OpenAPI Generator plugin in your build file:
    - Maven: openapi-generator-maven-plugin
    - Gradle: org.openapi.generator

  Not applicable to this project. Skipping. ✅
```

### Error: Library Already Migrated

```text
ℹ️  OpenAPI Generator Library Migration

  Current library: spring-http-interface ✅

  The OpenAPI Generator library has already been migrated.
  No migration needed.

  Skipping. ✅
```

### Error: Code Generation Fails

```text
❌ Error: Code generation failed

  Command: ./mvnw generate-sources
  Exit code: 1

  Error:
    [ERROR] Missing required config option: configPackage
    [ERROR] Library spring-http-interface requires configPackage

  This should not happen - configPackage was added automatically.

  Solution:
    1. Check pom.xml line 52-54 for configPackage
    2. Verify value: <configPackage>me.pacphi.mattermost.configuration</configPackage>
    3. Review full error log above

  Backups available:
    - pom.xml.bak (restore with: mv pom.xml.bak pom.xml)
```

### Error: Compilation Fails

```text
❌ Error: Compilation failed after code regeneration

  Command: ./mvnw clean compile -DskipTests
  Exit code: 1

  Compilation errors:
    [ERROR] /src/main/java/com/example/service/ApiService.java:[15,8]
    cannot find symbol: class ChannelsApiClient

  Cause: Generated class names changed:
    Old (Feign): ChannelsApiClient, PostsApiClient
    New (HTTP Interface): ChannelsApi, PostsApi

  Solution:
    1. Update service classes to use new generated class names:
       - ChannelsApiClient → ChannelsApi
       - PostsApiClient → PostsApi
       - (Remove "Client" suffix)

    2. Update @Autowired or constructor injection accordingly

    3. Recompile: ./mvnw compile

  Backups available if you need to revert.
```

## Integration with Migration

This command is automatically called during Phase 11 Step 2a of the migration agent when:

- OpenAPI Generator is detected
- Library is `spring-cloud`
- Spring Boot 4 is the target version

Can also be run standalone for targeted OpenAPI Generator library migration.

## State Tracking

This command updates `.migration-state.yaml`:

```yaml
appliedTransformations:
  - skill: openapi-generator-library-migrator
    version: '1.0.0'
    transformations:
      - library-config-update
      - config-package-addition
      - template-directory-addition
      - feign-config-cleanup
      - application-yml-url-cleanup
    libraryMigration:
      from: 'spring-cloud'
      to: 'spring-http-interface'
      configPackage: 'me.pacphi.mattermost.configuration'
      urlMappingsRemoved: 7
    validation:
      codeGeneration: success
      compilation: success
    completedAt: '2026-01-05T11:15:00Z'
    commitSha: abc123
```

## Related Commands

- `/migrate-openfeign` - Migrate hand-written Feign clients
- `/migrate-framework-7` - Migrate Spring Framework 7 API patterns
- `/update-openapi-generator` - Update OpenAPI Generator plugin version
- `/migrate` - Full Spring Boot 4 migration (includes library migration)

## Version History

### 1.0.0 (2026-01-05)

**Initial Release**:

- Library configuration migration (spring-cloud → spring-http-interface)
- configPackage inference and addition
- templateDirectory addition
- Feign-specific option removal
- Application.yml cleanup
- Code regeneration and validation
- Coordination with openfeign-to-httpinterface-migrator

## See Also

- [OpenAPI Generator Library Migrator Skill](../skills/openapi-generator-library-migrator/SKILL.md)
- [Spring Cloud OpenFeign Maintenance Mode](https://github.com/spring-cloud/spring-cloud-openfeign/discussions/867)
- [Spring Framework HTTP Interface](https://docs.spring.io/spring-framework/reference/integration/rest-clients.html#rest-http-interface)
- [OpenAPI Generator Documentation](https://openapi-generator.tech/docs/generators/spring/)
