---
description: Upgrade a Spring Boot 4.0.x project to 4.1.0-RC1 (or future Boot 4.1 GA)
argument-hint: [project-path] [--target=4.1.0-RC1|GA] [--dry-run]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task
---

# Migrate Spring Boot 4.1

Run the focused Boot 4.0.x → 4.1.0-RC1 upgrade on the project at `$ARGUMENTS` (or
current directory). Delegates to the `spring-boot-41-rc-upgrade-agent`.

## Usage

```bash
# Upgrade current project to 4.1.0-RC1 (default target)
/spring-m11n:migrate-spring-boot-41

# Specific project, specific target
/spring-m11n:migrate-spring-boot-41 /path/to/project --target=4.1.0-RC1

# Dry run
/spring-m11n:migrate-spring-boot-41 --dry-run
```

## What This Command Does

1. **Detects** current Spring Boot version (must be 4.0.x).
2. **Bumps parent / plugin** to the target Boot 4.1 version.
3. **Adds Spring Milestones repository** to BOTH `<repositories>` and
   `<pluginRepositories>` (Maven) or `repositories { … }` + `settings.gradle*`
   `pluginManagement` (Gradle). The plugin block is critical — RC versions of the
   `spring-boot-maven-plugin` are not on Maven Central.
4. **Reconciles BOM overrides** (Micrometer, Spring Framework, Spring Security,
   OpenTelemetry, Flyway) via `spring-boot-bom-override-reconciler`.
5. **Updates non-Boot dependencies** via `dependency-updater --target-rc=spring-boot:<version>`.
6. **Migrates `ReactorClientHttpRequestFactoryBuilder`** — injects
   `.withHttpClientDefaults()` (Boot 4.1 no longer applies proxy defaults automatically).
7. **Reports** new Spring Boot 4.1 opt-in properties (`spring.datasource.connection-fetch`,
   `spring.webflux.default-html-escape`, `spring.data.redis.listener.*`, `spring.grpc.*`)
   without applying them.
8. **Validates** via full compile + test cycle.

## Output

```text
Spring Boot 4.1.0-RC1 Upgrade

Phase 0: Detection
  Current Spring Boot: 4.0.6
  Target: 4.1.0-RC1 ✅

Phase 1: Build file updates
  ✅ parent: 4.0.6 → 4.1.0-RC1
  ✅ <repositories> block: Spring Milestones present
  ✅ <pluginRepositories> block: Spring Milestones added (NEW)

Phase 2: BOM override reconciliation
  ✅ <micrometer.version>1.16.5</> dropped (BOM ships 1.17.0-RC1)
  ✅ <spring-framework.version>7.0.5</> dropped (BOM ships 7.0.7)
  ℹ️  <jackson-bom.version>3.2.0</> preserved (intentional uplift)

Phase 3: Dependency updates
  ✅ 12 deps bumped to latest stable

Phase 4: Code migrations
  ✅ ReactorClientHttpRequestFactoryBuilder: 2 files patched with .withHttpClientDefaults()

Phase 5: New property awareness
  ℹ️  4 new opt-in properties available — see .migration-summary/boot-41-opt-ins.md

Phase 6: Validation
  ✅ Compile: PASSED (45s)
  ✅ Tests: PASSED (150 passed, 0 failed)

✅ Upgrade complete!

Next: review .migration-state.yaml and open a PR.
```

## State Tracking

Records each phase in `.migration-state.yaml`:

```yaml
migrationId: sb41-<date>-<sha>
targetVersions:
  spring-boot: 4.1.0-RC1
appliedTransformations:
  - skill: build-file-updater
  - skill: spring-boot-bom-override-reconciler
  - skill: dependency-updater
  - skill: restclient-to-webclient-customizer-migrator
validationStatus: PASSED
```

## Composes With

- `/spring-m11n:migrate-spring-ai-20` — run **after** this if the project also needs
  Spring AI 2.0.0-M7. (Boot 4.1.0-RC1 pairs with Spring AI 2.0.0-M7.)
- `/spring-m11n:validate` — re-run after manual edits to verify state remains consistent.

## Related

- Agent: `spring-boot-41-rc-upgrade-agent`
- Skill: `spring-boot-bom-override-reconciler`
- Skill: `restclient-to-webclient-customizer-migrator` v1.1.0+
