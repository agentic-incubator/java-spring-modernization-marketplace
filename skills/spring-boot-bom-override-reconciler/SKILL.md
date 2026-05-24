---
name: spring-boot-bom-override-reconciler
description: >
  Detect and reconcile stale Maven `<properties>` / Gradle `ext`-`extra` overrides
  of dependencies whose versions are managed by the Spring Boot BOM. Run BEFORE or
  AFTER a Spring Boot major/minor bump (e.g., 4.0→4.1, 3.x→4.x) to prevent the
  override from shadowing the BOM-shipped version with an older or incompatible one.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Spring Boot BOM Override Reconciler

Strip or update explicit version overrides that conflict with the new Spring Boot BOM.

## Problem

Many Spring Boot projects pin individual library versions via Maven `<properties>` or
Gradle `ext`/`extra` blocks (e.g., `<micrometer.version>1.16.5</micrometer.version>`).
When the parent Spring Boot version is bumped, the BOM ships a newer managed version —
but the explicit override still wins, leaving the project on the older version.

This causes:

- **Version drift** — the project ships with a stale managed dep that the new Spring
  Boot release expects to be newer.
- **Runtime incompatibilities** — e.g., Micrometer 1.16.x against Spring Boot 4.1.0-RC1
  whose Actuator stack expects Micrometer 1.17.x APIs.
- **Silent failures** — code compiles because the override pins to a compatible-looking
  version, but `NoSuchMethodError` surfaces at runtime.

## Detection

```bash
# Maven — list explicit properties that match Spring Boot BOM managed deps
grep -E "<(micrometer|spring-framework|spring-security|opentelemetry|flyway|jackson|hikaricp|liquibase|reactor)\.?[a-z-]*\.version>" pom.xml

# Gradle Groovy
grep -E "(micrometerVersion|springFrameworkVersion|springSecurityVersion|openTelemetryVersion|flywayVersion|jacksonVersion)" build.gradle

# Gradle Kotlin
grep -E "extra\[\"(micrometerVersion|springFrameworkVersion|springSecurityVersion|openTelemetryVersion|flywayVersion|jacksonVersion)\"\]" build.gradle.kts
```

## Inputs

| Parameter               | Type    | Default    | Description                                                                                   |
| ----------------------- | ------- | ---------- | --------------------------------------------------------------------------------------------- |
| `--target-boot-version` | string  | _required_ | Target Spring Boot version (e.g., `4.1.0-RC1`)                                                |
| `--strategy`            | string  | `drop`     | `drop`: remove override entirely. `update`: bump override to BOM version. `report`: read-only |
| `--ignore`              | csv     | _empty_    | Property keys to leave alone (project-specific intentional pins)                              |
| `--allow-uplift`        | boolean | `true`     | When override > BOM version, preserve (intentional uplift)                                    |
| `--dry-run`             | boolean | `false`    | Print planned changes without writing                                                         |

## BOM Resolution

Resolve the target Boot BOM via Spring Milestones if RC/milestone:

```bash
# Maven — effective POM with the target parent
mvn help:effective-pom -Dexpression=project.dependencyManagement -q -DforceStdout \
    -Dspring-boot.version="$TARGET" | xq .

# Or directly download the BOM
curl -fsSL \
  "https://repo.spring.io/milestone/org/springframework/boot/spring-boot-dependencies/$TARGET/spring-boot-dependencies-$TARGET.pom" \
  -o /tmp/sb-deps.pom
```

Then extract managed `<properties>`:

```bash
xq '.project.properties' /tmp/sb-deps.pom
```

Build a map: `{ "micrometer.version": "1.17.0-RC1", "spring-framework.version": "7.0.7", ... }`.

## Reconciliation Algorithm

For each project property that matches a BOM-managed key:

1. Read project's value (e.g., `<micrometer.version>1.16.5</micrometer.version>`).
2. Read BOM's value (e.g., `1.17.0-RC1`).
3. Compare:
   - **Older or equal** → apply `--strategy`:
     - `drop`: remove the `<property>` entirely → project inherits BOM version.
     - `update`: rewrite to BOM value.
     - `report`: log only.
   - **Newer (with `--allow-uplift=true`)** → preserve; emit warning that the project is
     intentionally ahead of the BOM.
   - **Newer (with `--allow-uplift=false`)** → roll back to BOM value.
4. After all rewrites, run `mvn dependency:tree` / `./gradlew dependencies` and check the
   resolved version matches the BOM-shipped version.

## Key BOM-Managed Properties (Spring Boot 4.x)

| Property                   | Managed by Spring Boot BOM | Notes                                    |
| -------------------------- | -------------------------- | ---------------------------------------- |
| `micrometer.version`       | yes                        | 4.0.x: 1.16.x; 4.1.0-RC1: **1.17.0-RC1** |
| `spring-framework.version` | yes                        | 4.0.x: 7.0.x; 4.1.0-RC1: **7.0.7**       |
| `spring-security.version`  | yes                        | 4.0.x: 7.0.x; 4.1.0-RC1: **7.1.0-RC1**   |
| `opentelemetry.version`    | yes                        | 4.1.0-RC1: **1.60.1**                    |
| `flyway.version`           | yes                        | 4.1.0-RC1: **12.4.0**                    |
| `jackson-bom.version`      | yes (via Jackson BOM)      | 3.x                                      |
| `hikaricp.version`         | yes                        | Boot-tracked                             |
| `liquibase.version`        | yes                        | Boot-tracked                             |
| `reactor-bom.version`      | yes                        | Boot-tracked                             |

## Migration Steps

### Step 1 — Identify candidate properties

```bash
# Read all properties from pom.xml
xq '.project.properties' pom.xml > /tmp/project-props.json

# Read all properties from BOM
xq '.project.properties' /tmp/sb-deps.pom > /tmp/bom-props.json

# Intersect — these are the candidates for reconciliation
jq -s '.[0] as $project | .[1] as $bom | $project | to_entries
       | map(select(.key as $k | $bom | has($k)))' \
       /tmp/project-props.json /tmp/bom-props.json
```

### Step 2 — Apply strategy

For **Maven** with `--strategy=drop`:

```diff
 <properties>
-    <micrometer.version>1.16.5</micrometer.version>
     <java.version>21</java.version>
 </properties>
```

For **Maven** with `--strategy=update`:

```diff
 <properties>
-    <micrometer.version>1.16.5</micrometer.version>
+    <micrometer.version>1.17.0-RC1</micrometer.version>
     <java.version>21</java.version>
 </properties>
```

For **Gradle Kotlin DSL** with `--strategy=drop`:

```diff
- extra["micrometerVersion"] = "1.16.5"
```

### Step 3 — Validate via dependency tree

```bash
# Maven
./mvnw dependency:tree -Dincludes=io.micrometer:micrometer-core | grep micrometer

# Gradle
./gradlew dependencyInsight --dependency io.micrometer:micrometer-core
```

Expected: resolved version matches the BOM-managed version.

### Step 4 — Compile + test

Delegate to `build-runner`.

## Output Format

```yaml
bomOverrideReconciliation:
  targetBootVersion: 4.1.0-RC1
  strategy: drop
  reconciled:
    - property: micrometer.version
      projectValue: 1.16.5
      bomValue: 1.17.0-RC1
      action: dropped
    - property: spring-framework.version
      projectValue: 7.0.5
      bomValue: 7.0.7
      action: dropped
  preserved:
    - property: custom-library.version
      projectValue: 1.0.0
      bomValue: null
      action: kept (not BOM-managed)
  uplifted:
    - property: jackson-bom.version
      projectValue: 3.2.0
      bomValue: 3.1.3
      action: preserved (intentional uplift, --allow-uplift=true)
  summary:
    reconciled: 2
    preserved: 1
    uplifted: 1
    bomManaged: 3
```

## Composes With

| Skill                | When                                                                      |
| -------------------- | ------------------------------------------------------------------------- |
| `version-detector`   | Run **before** — needs current versions                                   |
| `build-file-updater` | Run **before** if also bumping parent POM (which triggers this skill)     |
| `dependency-updater` | Run **after** — `dependency-updater` then handles non-BOM-managed updates |
| `build-runner`       | Run **after** — validate via compile + test                               |

## Transformation Protocol

Follows the standard migration protocol — see `migration-protocol` skill.

**Dependencies:** `migration-state` >= 1.0.0, `build-runner` >= 1.0.0,
`version-detector` >= 1.0.0

### Skill State Entry

```yaml
appliedTransformations:
  - skill: spring-boot-bom-override-reconciler
    version: 1.0.0
    transformations:
      - bom-override-reconciliation
    targetBootVersion: 4.1.0-RC1
    strategy: drop
    propertiesReconciled: 2
    propertiesUplifted: 1
    completedAt: 2026-05-23T12:00:00Z
    commitSha: abc123
```
