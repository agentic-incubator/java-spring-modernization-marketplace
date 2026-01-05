---
description: Migrate Spring Framework 6 to 7 API changes
argument-hint: [project-path] [--inject-templates] [--dry-run]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Migrate Spring Framework 7 API

Migrate Spring Framework 6.x to 7.x API changes including HttpServiceProxyFactory and templates.

## Usage

```bash
# Migrate API patterns only
migrate-framework-7

# Migrate API patterns + inject templates
migrate-framework-7 --inject-templates

# Specific project
migrate-framework-7 /path/to/project --inject-templates

# Dry run (show what would be changed)
migrate-framework-7 --dry-run
```

## What This Command Does

1. Detects Framework 7 API patterns
2. Migrates HttpServiceProxyFactory.builder() → builderFor()
3. Migrates WebClientAdapter.forClient() → create()
4. Optionally injects Framework 7 templates
5. Validates compilation

## API Migrations

### HttpServiceProxyFactory

**Before (Framework 6)**:

```java
HttpServiceProxyFactory factory = HttpServiceProxyFactory
    .builder(WebClientAdapter.forClient(webClient))
    .build();
```

**After (Framework 7)**:

```java
HttpServiceProxyFactory factory = HttpServiceProxyFactory
    .builderFor(WebClientAdapter.create(webClient))
    .build();
```

### WebClientAdapter

**Before (Framework 6)**:

```java
WebClientAdapter adapter = WebClientAdapter.forClient(webClient);
```

**After (Framework 7)**:

```java
WebClientAdapter adapter = WebClientAdapter.create(webClient);
```

## Template Merge Workflow

When custom templates exist and `--inject-templates` is used:

1. Shows diff between custom and Framework 7 template
2. Explains required changes
3. Asks user: apply diff, manual edit, or skip

```text
Found custom template: src/main/resources/templates/spring-http-interface/httpInterfacesConfiguration.mustache

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

Choice [1-3]:
```

## Output

### Successful Migration

```text
Spring Framework 7 API Migration

Detecting Framework 7 API patterns...
  ✅ Found 3 files with HttpServiceProxyFactory.builder()
  ✅ Found 3 files with WebClientAdapter.forClient()

Migrating API patterns...
  ✅ HttpServiceProxyFactory.builder() → builderFor() (3 files)
  ✅ WebClientAdapter.create() → create() (3 files)

Files modified:
  - src/main/java/com/example/config/HttpInterfacesConfig.java
  - src/main/java/com/example/service/ApiClientFactory.java
  - src/main/java/com/example/client/ExternalServiceClient.java

Validating compilation...
  ✅ Compilation successful

Migration complete! ✅

Next steps:
  1. Review changes
  2. Run tests
  3. Commit changes
```

### Migration with Template Injection

```text
Spring Framework 7 API Migration

Migrating API patterns...
  ✅ HttpServiceProxyFactory.builder() → builderFor() (3 files)
  ✅ WebClientAdapter.forClient() → create() (3 files)

Injecting Framework 7 templates...
  ⚠️  Custom template detected:
      src/main/resources/templates/spring-http-interface/httpInterfacesConfiguration.mustache

[Shows diff and prompts user]

User selected: Apply diff automatically

  ✅ Template updated successfully

Validating...
  ✅ Code generation successful
  ✅ Compilation successful

Migration complete! ✅
```

## Examples

### Example 1: Simple API Migration

```bash
$ migrate-framework-7

Spring Framework 7 API Migration

Detecting Framework 7 API patterns...
  ✅ Found 2 files with HttpServiceProxyFactory.builder()
  ✅ Found 2 files with WebClientAdapter.forClient()

Migrating...
  ✅ src/main/java/com/example/config/ApiConfig.java
      - Line 25: HttpServiceProxyFactory.builder( → builderFor(
      - Line 25: WebClientAdapter.forClient( → create(

  ✅ src/main/java/com/example/service/ClientFactory.java
      - Line 42: HttpServiceProxyFactory.builder( → builderFor(
      - Line 42: WebClientAdapter.forClient( → create(

Validating compilation...
  ✅ Compilation successful (45s)

✅ Migration complete!

Summary:
  Files modified: 2
  Patterns replaced: 4
  Compilation: SUCCESS
```

### Example 2: Migration with Template Injection

```bash
$ migrate-framework-7 --inject-templates

Spring Framework 7 API Migration

Step 1: API Migrations
  ✅ HttpServiceProxyFactory.builder() → builderFor() (3 files)
  ✅ WebClientAdapter.forClient() → create() (3 files)

Step 2: Template Injection
  Detecting OpenAPI Generator usage...
    ✅ spring-http-interface library detected

  Detecting custom templates...
    ⚠️  Custom template found:
        src/main/resources/templates/spring-http-interface/httpInterfacesConfiguration.mustache

  Generating diff...

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Framework 7 Template Changes
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  @@ -19,7 +19,7 @@
       @Bean
       public HttpServiceProxyFactory httpServiceProxyFactory() {
           return HttpServiceProxyFactory
  -            .builder(WebClientAdapter.forClient(webClient))
  +            .builderFor(WebClientAdapter.create(webClient))
               .build();
       }

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  This change updates the template to use Spring Framework 7 API:
  - HttpServiceProxyFactory.builder() → builderFor()
  - WebClientAdapter.forClient() → create()

  Your custom template will preserve all customizations while
  updating only the Framework 7 API changes.

  Options:
    1. Apply diff automatically (recommended)
    2. Manually edit the template
    3. Skip template update

  Choice [1-3]: 1

  ✅ Template updated successfully

Step 3: Validation
  Regenerating code...
    ✅ Code generation successful

  Compiling...
    ✅ Compilation successful (52s)

✅ Migration complete!

Summary:
  API migrations: 6 replacements in 3 files
  Templates updated: 1
  Code generation: SUCCESS
  Compilation: SUCCESS
```

### Example 3: Dry Run

```bash
$ migrate-framework-7 --dry-run

Spring Framework 7 API Migration (DRY RUN)

The following changes would be made:

API Migrations:
  src/main/java/com/example/config/ApiConfig.java
    Line 25: HttpServiceProxyFactory.builder( → builderFor(
    Line 25: WebClientAdapter.forClient( → create(

  src/main/java/com/example/service/ClientFactory.java
    Line 42: HttpServiceProxyFactory.builder( → builderFor(
    Line 42: WebClientAdapter.forClient( → create(

Templates:
  No custom templates detected.

No changes were made. Run without --dry-run to apply.
```

## Error Handling

### Error: Not Framework 7

```text
❌ Error: Spring Framework 7 not detected
   Current version: 6.1.5
   Required: 7.0.0+

Solution:
  Upgrade Spring Framework first:
  1. Run dependency-updater
  2. Or manually update Framework version in pom.xml/build.gradle
  3. Then run migrate-framework-7 again
```

### Error: No Patterns Found

```text
ℹ️  Spring Framework 7 API Migration

  Framework version: 7.0.0 ✅

  No deprecated API patterns found:
    - HttpServiceProxyFactory.builder(): 0 occurrences
    - WebClientAdapter.forClient(): 0 occurrences

  Your code is already using Framework 7 APIs or does not use these features.

  No migration needed. ✅
```

### Error: Compilation Fails After Migration

```text
❌ Error: Compilation failed after migration

  File: src/main/java/com/example/config/ApiConfig.java
  Line: 25
  Error: incompatible types: WebClient cannot be converted to ClientHttpRequestFactorySettings

Possible causes:
  - Incorrect migration pattern
  - Missing imports
  - Custom HttpServiceProxyFactory configuration

Solution:
  1. Review the migration in ApiConfig.java:25
  2. Check if custom configuration is needed
  3. See Framework 7 migration guide: docs/migrations/spring-framework-7.md
  4. Report issue if this appears to be a bug
```

## Integration with Migration

This command is automatically called during Phase 11.5 of the migration agent when:

- Spring Framework 7.x is detected
- HttpServiceProxyFactory usage is found

Can also be run standalone for targeted Framework 7 API migrations.

## State Tracking

This command updates `.migration-state.yaml`:

```yaml
appliedTransformations:
  - skill: spring-framework-7-migrator
    version: '1.0.0'
    transformations:
      - http-service-proxy-factory-api
      - webclient-adapter-api
      - openapi-generator-template-injection
    filesModified: 3
    templatesInjected: true
    completedAt: '2026-01-05T10:45:00Z'
    commitSha: def456
    validation:
      compilation: success
      codeGeneration: success
      patternsRemaining:
        oldPatterns: 0
        newPatterns: 6
```

## Related Commands

- `/update-openapi-generator` - Update OpenAPI Generator plugin version
- `/migrate` - Full Spring Boot 4 migration (includes Framework 7 API migration)

## Version History

### 1.0.0 (2026-01-05)

**Initial Release**:

- HttpServiceProxyFactory API migration
- WebClientAdapter API migration
- Template injection for OpenAPI Generator
- Manual merge workflow for custom templates
- Dry run support
- Compilation validation

## See Also

- [Spring Framework 7 Migration Guide](../docs/migrations/spring-framework-7.md)
- [Spring Framework 7 Migrator Skill](../skills/spring-framework-7-migrator/SKILL.md)
- [Spring Framework 7 Documentation](https://docs.spring.io/spring-framework/reference/7.0/web/webflux-webclient.html)
