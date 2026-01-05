# Phase 2-3 Remaining Implementation Plan

**Status**: In Progress
**Branch**: `feature/openapi-and-spring-ai-and-spring-cloud-skills-enhancements`
**Start Date**: 2026-01-05
**Target Completion**: v1.5.0 release

## Executive Summary

This document captures the remaining implementation work for Phases 2-3 of the Spring Modernization Marketplace enhancement plan. Phase 1 (Dependency Updater Enhancement v2.0.0) is **100% complete**. Phase 2 (OpenAPI Generator Intelligence) is **40% complete**.

## What's Been Completed

### ✅ Phase 1: Dependency Updater Enhancement (100% Complete)

**Commit**: `c43237c` on `feature/openapi-and-spring-ai-and-spring-cloud-skills-enhancements`

#### Files Modified/Created

1. **skills/dependency-updater/SKILL.md** (v2.0.0)
   - Added "Compatibility Validation" section (338 lines)
   - Added "OpenAPI Generator Special Handling" section
   - Documented incremental rollback strategy
   - Documented `--skip-tests` flag
   - Documented migration skill integration
   - Documented error classification

2. **skills/dependency-updater/metadata.yaml** (v1.0.0 → v2.0.0)
   - Updated version to 2.0.0
   - Added `compatibility-validation` transformation
   - Added `incremental-rollback` transformation
   - Added `compatibilityValidation` configuration section
   - Added migration skill mapping (4 patterns)
   - Added error classification (5 patterns)

3. **agents/migration-agent.md**
   - Enhanced Phase 1.5 from v1.0.0 to v2.0.0
   - Added filter strategy auto-selection
   - Added validation workflow documentation
   - Added state tracking with validation details

4. **commands/migrate.md**
   - Added Phase 1.5 documentation
   - Documented `--skip-tests` flag
   - Documented filter strategy selection

#### Key Features Delivered

- ✅ Compatibility validation (compilation + tests)
- ✅ Incremental rollback for incompatible updates
- ✅ `--skip-tests` flag for faster validation
- ✅ Migration skill suggestions
- ✅ Error classification and reporting
- ✅ Filter strategy auto-selection
- ✅ State tracking with validation results

### ✅ Phase 2: OpenAPI Generator Intelligence (40% Complete)

**Commit**: Same as Phase 1

#### Files Created

1. **skills/openapi-generator-plugin-updater/metadata.yaml** (v1.0.0)
   - Defined 5 transformations
   - Defined Spring Framework compatibility matrix
   - Defined Maven and Gradle build tool support
   - Defined delegation patterns

2. **skills/openapi-generator-plugin-updater/SKILL.md** (v1.0.0)
   - Comprehensive documentation (600+ lines)
   - Spring Framework compatibility matrix
   - Detection logic for Maven/Gradle
   - Update workflow (7 steps)
   - Update strategies (conservative, latest)
   - Integration with migration state
   - Coordination with spring-framework-7-migrator

3. **skills/dependency-updater/SKILL.md** (updated)
   - Added "OpenAPI Generator Special Handling" section
   - Documented delegation workflow
   - Documented integration example

---

## Remaining Work

### Phase 2: OpenAPI Generator Intelligence (60% Remaining)

#### 2.1: Spring Framework 7 API Migrator Skill

**Priority**: HIGH
**Effort**: 8-12 hours
**Status**: Not Started

##### Tasks

1. **Create skill structure**

   ```bash
   mkdir -p skills/spring-framework-7-migrator/templates/spring-http-interface
   ```

2. **Create metadata.yaml**

   **Content**:

   ```yaml
   skill:
     name: spring-framework-7-migrator
     version: 1.0.0
     description: Migrate Spring Framework 6 → 7 API changes including HttpServiceProxyFactory and OpenAPI Generator templates

     transformations:
       - id: http-service-proxy-factory-api
         version: 1.0.0
         description: Migrate HttpServiceProxyFactory.builder() to builderFor()
         detection: "HttpServiceProxyFactory\\s*\\.\\s*builder\\s*\\("
         automationPotential: 95

       - id: webclient-adapter-api
         version: 1.0.0
         description: Migrate WebClientAdapter.forClient() to create()
         detection: "WebClientAdapter\\s*\\.\\s*forClient\\s*\\("
         automationPotential: 100

       - id: openapi-generator-template-injection
         version: 1.0.0
         description: Inject Framework 7 compatible templates
         detection: 'spring-http-interface.*library'
         automationPotential: 80
         userApprovalRequired: true

     apiMigrations:
       - pattern: "HttpServiceProxyFactory\\.builder\\("
         replacement: 'HttpServiceProxyFactory.builderFor('

       - pattern: "WebClientAdapter\\.forClient\\("
         replacement: 'WebClientAdapter.create('

     templateMergeStrategy: manual # Show diff, explain, ask user
     bundledTemplates:
       - name: httpInterfacesConfiguration.mustache
         location: templates/spring-http-interface/
         frameworkVersion: '7.x'
   ```

3. **Create SKILL.md**

   **Sections needed**:
   - Critical Rules
   - Spring Framework 7 API Changes table
   - Detection Logic (Maven/Gradle)
   - Migration Patterns (before/after examples)
   - Template Management (bundle, detect, inject, merge)
   - Manual Merge Workflow (diff generation, explanation, user approval)
   - Validation Strategy
   - Integration with migration state
   - Idempotent execution
   - Edge cases (custom templates, multiple APIs)

   **Estimate**: ~800 lines

4. **Create Framework 7 compatible template**

   **File**: `skills/spring-framework-7-migrator/templates/spring-http-interface/httpInterfacesConfiguration.mustache`

   **Content** (from mattermost-ai-service example):

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

5. **Testing requirements**
   - Test Framework 6 → 7 API migrations on sample code
   - Test template injection with custom templates
   - Test manual merge workflow
   - Test validation after template injection

##### Files to Create

- `skills/spring-framework-7-migrator/metadata.yaml`
- `skills/spring-framework-7-migrator/SKILL.md`
- `skills/spring-framework-7-migrator/templates/spring-http-interface/httpInterfacesConfiguration.mustache`

#### 2.2: OpenAPI Generator Detector Skill

**Priority**: MEDIUM
**Effort**: 2-4 hours
**Status**: Not Started

##### Purpose

Provide reusable detection logic for OpenAPI Generator usage, library configuration, and template paths.

##### Tasks

1. **Create metadata.yaml**

   ```yaml
   skill:
     name: openapi-generator-detector
     version: 1.0.0
     description: Detect OpenAPI Generator usage, library configuration, and custom templates

     detectionPatterns:
       - id: maven-plugin
         pattern: 'openapi-generator-maven-plugin'
         location: pom.xml

       - id: gradle-plugin
         pattern: "org\\.openapi\\.generator"
         location: build.gradle|build.gradle.kts

       - id: library-spring-http-interface
         pattern: '<library>spring-http-interface</library>|library.*spring-http-interface'

       - id: custom-templates
         pattern: 'templateDirectory|templates/libraries'
         location: pom.xml|build.gradle|src/main/resources
   ```

2. **Create SKILL.md**

   **Sections**:
   - Detection patterns (Maven/Gradle)
   - Library configuration detection
   - Template directory detection
   - Output format (JSON/YAML)
   - Integration with other skills

   **Estimate**: ~300 lines

##### Files to Create

- `skills/openapi-generator-detector/metadata.yaml`
- `skills/openapi-generator-detector/SKILL.md`

#### 2.3: Migration Agent Integration

**Priority**: HIGH
**Effort**: 2-3 hours
**Status**: Not Started

##### Tasks

1. **Add Phase 11: OpenAPI Generator Plugin Update**

   **File**: `agents/migration-agent.md`

   **Location**: After Phase 10 (Build Tool Syntax Migration), before Phase 11 (OpenFeign Migration)

   **Content**:

   ````markdown
   ### Phase 11: OpenAPI Generator Plugin Update (NEW - Conditional)

   **When**: OpenAPI Generator plugin detected + spring-http-interface library

   **Skills Used**:

   - openapi-generator-detector
   - openapi-generator-plugin-updater

   **Steps**:

   1. Detect OpenAPI Generator usage
   2. Check library configuration
   3. Detect Spring Framework version
   4. Check plugin version compatibility
   5. Update plugin if incompatible
   6. Trigger spring-framework-7-migrator if Framework 7
   7. Validate generated code compilation

   **Example Output**:

   ```text
   Phase 11: OpenAPI Generator Plugin Update
     Plugin: 7.17.0 → 7.18.0 (Framework 7 compatibility)
     Templates: Updated to Framework 7 API
     Validation: ✅ Code generation successful
   ```
   ````

   **State Update**:

   ```yaml
   appliedTransformations:
     - skill: openapi-generator-plugin-updater
       version: '1.0.0'
       pluginUpdate:
         from: '7.17.0'
         to: '7.18.0'
     - skill: spring-framework-7-migrator
       version: '1.0.0'
       templatesInjected: true
   ```

   ```

   ```

2. **Add Phase 11.5: Spring Framework 7 API Migration**

   **Content**:

   ````markdown
   ### Phase 11.5: Spring Framework 7 API Migration (NEW - Conditional)

   **When**: Spring Framework 7.x detected + HttpServiceProxyFactory usage

   **Skills Used**:

   - spring-framework-7-migrator

   **Steps**:

   1. Detect Framework 7 API patterns
   2. Migrate HttpServiceProxyFactory.builder() → builderFor()
   3. Migrate WebClientAdapter.forClient() → create()
   4. Validate compilation

   **State Update**:

   ```yaml
   appliedTransformations:
     - skill: spring-framework-7-migrator
       version: '1.0.0'
       transformations:
         - http-service-proxy-factory-api
         - webclient-adapter-api
   ```
   ````

   ```

   ```

3. **Update agents/migration-agent.md description**

   Add `openapi-generator-plugin-updater` and `spring-framework-7-migrator` to the skills list in the frontmatter.

##### Files to Modify

- `agents/migration-agent.md`

#### 2.4: Commands and Documentation

**Priority**: MEDIUM
**Effort**: 3-4 hours
**Status**: Not Started

##### Tasks

1. **Create `/commands/update-openapi-generator.md`**

   **Content**:

   ````markdown
   ---
   description: Update OpenAPI Generator plugin to compatible version
   argument-hint: [project-path]
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
   ````

   ## What This Command Does

   1. Detects OpenAPI Generator plugin version
   2. Detects Spring Framework version
   3. Determines compatible plugin version
   4. Updates plugin in pom.xml/build.gradle
   5. Validates template compatibility
   6. Triggers template updates if needed

   ## Output

   ```text
   OpenAPI Generator Plugin Update
     Current: 7.17.0
     Framework: 7.0.0
     Required: 7.18.0
     Updating...
     ✅ Plugin updated successfully
   ```

   ```

   ```

2. **Create `/commands/migrate-framework-7.md`**

   **Content**:

   ````markdown
   ---
   description: Migrate Spring Framework 6 to 7 API changes
   argument-hint: [project-path] [--inject-templates]
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
   ```
   ````

   ## What This Command Does

   1. Detects Framework 7 API patterns
   2. Migrates HttpServiceProxyFactory.builder() → builderFor()
   3. Migrates WebClientAdapter.forClient() → create()
   4. Optionally injects Framework 7 templates
   5. Validates compilation

   ## Template Merge Workflow

   If custom templates exist:
   1. Shows diff between custom and Framework 7 template
   2. Explains required changes
   3. Asks user: apply diff, manual edit, or skip

   ```

   ```

3. **Create `/docs/migrations/spring-framework-7.md`**

   **Sections**:
   - Overview
   - Breaking Changes (HttpServiceProxyFactory, WebClientAdapter)
   - Migration Steps (automated vs manual)
   - Template Management
   - Troubleshooting
   - Examples

   **Estimate**: ~400 lines

##### Files to Create

- `commands/update-openapi-generator.md`
- `commands/migrate-framework-7.md`
- `docs/migrations/spring-framework-7.md`

---

### Phase 3: HTTP Interface & Remaining Enhancements (Not Started)

**Note**: Phase 3 is lower priority and should be tackled after Phase 2 completion.

#### 3.1: OpenFeign Configuration Analyzer

**Priority**: MEDIUM
**Effort**: 6-8 hours

#### 3.2: OpenFeign-to-HTTP-Interface v2.0.0

**Priority**: MEDIUM
**Effort**: 8-10 hours

#### 3.3: Jackson Compatibility Layer

**Priority**: LOW
**Effort**: 4-6 hours

---

## Final Tasks: Version Update and CHANGELOG

### Version Update

**Priority**: HIGH (after Phase 2 complete)
**Effort**: 1 hour

**Files to Update**:

1. `package.json` - Update version from `1.4.0` to `1.5.0`
2. `README.md` - Update version references
3. `docs/getting-started.md` - Update version in examples

### CHANGELOG.md Update

**Priority**: HIGH (after Phase 2 complete)
**Effort**: 1 hour

**Content to Add**:

```markdown
## [1.5.0] - 2026-01-XX

### Added

#### Phase 1: Dependency Updater Enhancement (v2.0.0)

- **Compatibility Validation**: Automatic validation of dependency updates with compilation + tests
- **Incremental Rollback**: Intelligent rollback of incompatible dependency updates
- **--skip-tests Flag**: Fast validation mode (compilation only)
- **Migration Skill Integration**: Automatic suggestion of related migration skills
- **Error Classification**: Pattern matching for 5 common error types
- **Compatibility Reporting**: Detailed success/rollback/skipped summary
- **Filter Strategy Auto-Selection**: Automatically selects filter based on target versions

#### Phase 2: OpenAPI Generator Intelligence

- **openapi-generator-plugin-updater**: New skill for Spring Framework compatibility
- **Spring Framework 7 Support**: Automatic plugin version selection for Framework 7
- **openapi-generator-detector**: Reusable detection logic
- **spring-framework-7-migrator**: API pattern migrations and template management
- **Template Bundling**: Framework 7 compatible templates included
- **Manual Merge Workflow**: User-controlled template customization

### Changed

- **dependency-updater**: Upgraded from v1.0.0 to v2.0.0
- **migration-agent Phase 1.5**: Enhanced with validation and rollback
- **commands/migrate**: Updated documentation for new capabilities

### Fixed

- Dependency updates now validate compatibility before committing
- OpenAPI Generator plugin updates respect Spring Framework version requirements
- Template compatibility validated during plugin updates

### Documentation

- Updated migration-agent.md with Phase 11 and 11.5
- Added OpenAPI Generator delegation documentation
- Added Spring Framework 7 migration guide
- Updated commands documentation

## [1.4.0] - 2026-01-04

... (existing changelog content)
```

---

## Testing Plan

### Unit Testing

**Phase 2 Skills**:

1. **openapi-generator-plugin-updater**
   - Test Framework 6 → 7 plugin version detection
   - Test Maven and Gradle detection
   - Test library configuration detection

2. **spring-framework-7-migrator**
   - Test API pattern detection and replacement
   - Test template injection
   - Test manual merge workflow

### Integration Testing

**Test Projects**:

1. **spring-ai-resos** (pacphi/spring-ai-resos)
   - OpenAPI Generator with spring-http-interface
   - Spring Framework 7
   - Spring AI 2.0.0-M1

2. **mattermost-ai-service** (pacphi/mattermost-ai-service)
   - Already migrated (reference implementation)
   - Validate against manual migration

### Validation Checklist

- [ ] dependency-updater v2.0.0 validates compilation
- [ ] dependency-updater rolls back incompatible updates
- [ ] --skip-tests flag works correctly
- [ ] OpenAPI Generator plugin updates to correct version
- [ ] Spring Framework 7 templates injected correctly
- [ ] Manual merge workflow functions properly
- [ ] State tracking records all transformations
- [ ] Migration-agent phases execute in order
- [ ] Commands function as documented

---

## Implementation Timeline (Remaining)

### Week 1: Core Skills

- [ ] Day 1-2: spring-framework-7-migrator skill (metadata + SKILL.md)
- [ ] Day 3: Framework 7 template creation
- [ ] Day 4: openapi-generator-detector skill
- [ ] Day 5: Testing spring-framework-7-migrator

### Week 2: Integration and Documentation

- [ ] Day 6-7: Migration-agent integration (Phases 11, 11.5)
- [ ] Day 8: Commands creation (update-openapi-generator, migrate-framework-7)
- [ ] Day 9: Documentation (spring-framework-7 migration guide)
- [ ] Day 10: Integration testing on spring-ai-resos

### Week 3: Polish and Release

- [ ] Day 11-12: Fix any issues from testing
- [ ] Day 13: Version update (1.4.0 → 1.5.0)
- [ ] Day 14: CHANGELOG.md update
- [ ] Day 15: Final validation and release preparation

---

## Success Criteria

### Phase 2 Complete When

- [x] openapi-generator-plugin-updater skill created
- [ ] spring-framework-7-migrator skill created
- [ ] Framework 7 templates bundled
- [ ] openapi-generator-detector skill created
- [ ] Migration-agent Phases 11 and 11.5 added
- [ ] Commands created and documented
- [ ] Spring Framework 7 migration guide written
- [ ] Integration tests pass on spring-ai-resos

### v1.5.0 Release Ready When

- [ ] All Phase 2 tasks complete
- [ ] Version updated to 1.5.0
- [ ] CHANGELOG.md updated
- [ ] All documentation updated
- [ ] Integration tests pass
- [ ] Markdown linting issues resolved

---

## References

### Related Documents

- [Original Enhancement Plan](/Users/cphillipson/.claude/plans/witty-herding-sloth.md)
- [Mattermost Migration Analysis](Captured in plan context)
- [Spring Framework 7 API Changes](https://docs.spring.io/spring-framework/reference/7.0/web/webflux-webclient.html)

### Commits

- **Phase 1 Complete**: `c43237c` on `feature/openapi-and-spring-ai-and-spring-cloud-skills-enhancements`

### Testing Repositories

- **spring-ai-resos**: `/tmp/migration-workspace/spring-ai-resos`
- **mattermost-ai-service**: `/tmp/migration-workspace/mattermost-ai-service`
- **reactive-cassy**: `/tmp/migration-workspace/reactive-cassy`

---

## Notes and Considerations

### Markdown Linting

Minor markdown linting issues exist in committed files:

- Table formatting (spacing issues)
- Code block language specification
- Line length violations

**Action**: Fix in follow-up commit before final release.

### Token Management

This document was created due to token/context concerns. Implementation can continue incrementally by referring to this plan.

### Phase 3 Deferral

Phase 3 (HTTP Interface Configuration Generator, Jackson Compatibility Layer) can be deferred to v1.6.0 if needed. Phase 2 provides the most critical enhancements for OpenAPI Generator and Spring Framework 7 compatibility.
