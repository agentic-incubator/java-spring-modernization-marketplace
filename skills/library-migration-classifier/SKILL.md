# Library Migration Classifier Skill

**Skill ID:** `library-migration-classifier`
**Version:** 1.0.0
**Category:** Analysis
**Priority:** MEDIUM

---

## Purpose

Classify dependency changes as "version upgrade" vs "library migration" to accurately estimate migration effort and complexity.

---

## Classification Types

### Version Upgrade (LOW effort)

- **Definition:** Same library, newer version
- **Impact:** API mostly compatible, minor code changes
- **Example:** Spring Boot 4.0.0 → 4.0.1
- **Effort:** Minutes to hours

### Library Migration (HIGH effort)

- **Definition:** Different library/API requiring code changes
- **Impact:** Architecture changes, interface rewrites
- **Example:** reactive-pg-client → Spring Data R2DBC
- **Effort:** Hours to days

---

## Deprecated Libraries Database

```yaml
deprecated:
  - library: 'io.reactiverse:reactive-pg-client'
    status: 'DEPRECATED'
    replacement: 'org.springframework.boot:spring-boot-starter-data-r2dbc'
    type: 'LIBRARY_MIGRATION'
    effort: 'HIGH'
    estimatedHours: '4-8'
    scope:
      - 'Dependency replacement (3 → 2 artifacts)'
      - 'Entity annotation changes (@Table, @Column)'
      - 'Repository interface rewrite (class → interface)'
      - 'Configuration removal (PgPool → autoconfigured)'
      - 'application.yml migration (pg.* → spring.r2dbc.*)'
      - 'Documentation overhaul'

  - library: 'ru.yandex.qatools.embed:postgresql-embedded'
    status: 'DEPRECATED'
    replacement: 'org.testcontainers:postgresql'
    type: 'LIBRARY_MIGRATION'
    effort: 'MEDIUM'
    estimatedHours: '1-2'
    scope:
      - 'Test configuration changes'
      - 'Embedded DB → Testcontainers pattern'

  - library: 'junit:junit'
    status: 'END_OF_LIFE'
    replacement: 'org.junit.jupiter:junit-jupiter'
    type: 'VERSION_UPGRADE_MAJOR'
    effort: 'MEDIUM'
    estimatedHours: '1-3'
    scope:
      - 'Import migration'
      - 'Annotation updates'
      - 'Build configuration'
```

---

## Detection Algorithm

```text
1. SCAN dependencies in build file
   - Extract groupId:artifactId:version

2. CHECK against deprecated library database
   - IF library in database:
     - type = database.entry.type
     - effort = database.entry.effort
     - scope = database.entry.scope

3. IF not in database:
   - ANALYZE version change:
     - Same groupId+artifactId, different version → VERSION_UPGRADE
     - Different groupId or artifactId → LIBRARY_MIGRATION

4. ESTIMATE effort based on type:
   - VERSION_UPGRADE_PATCH → LOW (minutes)
   - VERSION_UPGRADE_MINOR → MEDIUM (1-2 hours)
   - VERSION_UPGRADE_MAJOR → MEDIUM-HIGH (1-4 hours)
   - LIBRARY_MIGRATION → HIGH (4-8+ hours)

5. GENERATE classification report
```

---

## Output Format

```yaml
libraryClassification:
  totalDependencies: 45
  classified: 12
  versionUpgrades: 10
  libraryMigrations: 2

  versionUpgrades:
    - library: "org.springframework.boot:spring-boot-starter-web"
      from: "3.5.7"
      to: "4.0.1"
      type: "VERSION_UPGRADE_MAJOR"
      effort: "LOW"
      estimatedHours: "0.5"
      automationPotential: "95%"

  libraryMigrations:
    - library: "io.reactiverse:reactive-pg-client:0.11.4"
      status: "DEPRECATED"
      replacement: "spring-boot-starter-data-r2dbc"
      type: "LIBRARY_MIGRATION"
      effort: "HIGH"
      estimatedHours: "4-8"
      requiresManualReview: true
      scope:
        - "Entity annotation changes"
        - "Repository interface rewrite"
        - "Configuration removal"
        - "application.yml migration"
        - "Documentation overhaul"
      automationPotential: "30%"
      recommendation: "Flag for manual migration planning"

  summary:
    totalEffort: "4.5-8.5 hours"
    automationPotential: "75%"
    manualReviewRequired: 2
```

---

## Integration Points

**Used by:** discovery-agent (Phase 10: Deprecated Library Detection)
**Triggers:** When dependencies scanned during project analysis

---

## References

- **Spring Boot Migration Guide:** <https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Migration-Guide>
- **Spring Data R2DBC:** <https://spring.io/projects/spring-data-r2dbc>

---

## Version History

- **1.0.0** (2026-01-04): Initial implementation with deprecated library database
