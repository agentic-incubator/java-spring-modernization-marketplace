# Testcontainers Module Validator Skill

**Skill ID:** `testcontainers-module-validator`
**Version:** 1.0.0
**Category:** Validation
**Priority:** MEDIUM
**Automation:** 100%

---

## Purpose

Ensure required Testcontainers modules are declared when container classes are used in tests. Prevents ClassNotFoundException at test runtime.

---

## Problem Statement

Testcontainers uses modular architecture requiring explicit module dependencies. Using a container class without its module causes runtime failures:

```text
java.lang.NoClassDefFoundError: CassandraDatabaseDelegate
Caused by: java.lang.ClassNotFoundException: CassandraDatabaseDelegate
```

---

## Container to Module Mapping

| Container Import         | Required Module                | Required Version  |
| ------------------------ | ------------------------------ | ----------------- |
| `CassandraContainer`     | `testcontainers:cassandra`     | Aligned with core |
| `PostgreSQLContainer`    | `testcontainers:postgresql`    | Aligned with core |
| `MySQLContainer`         | `testcontainers:mysql`         | Aligned with core |
| `MariaDBContainer`       | `testcontainers:mariadb`       | Aligned with core |
| `MongoDBContainer`       | `testcontainers:mongodb`       | Aligned with core |
| `KafkaContainer`         | `testcontainers:kafka`         | Aligned with core |
| `ElasticsearchContainer` | `testcontainers:elasticsearch` | Aligned with core |
| `Neo4jContainer`         | `testcontainers:neo4j`         | Aligned with core |
| `RedisContainer`         | `testcontainers:redis`         | Aligned with core |

---

## Detection Algorithm

```text
1. SCAN test code for Testcontainers imports
   - Pattern: import org.testcontainers.containers.*Container
   - Extract container class names

2. MAP container classes to required modules
   - CassandraContainer → cassandra
   - PostgreSQLContainer → postgresql
   - etc.

3. CHECK declared dependencies
   - Read pom.xml or build.gradle
   - Look for testcontainers:<module> dependencies

4. IDENTIFY missing modules
   - Required modules - Declared modules = Missing

5. AUTO-ADD missing modules (if approved)
   - Add to build file with test scope
   - Align version with core testcontainers version

6. GENERATE validation report
```

---

## Detection Patterns

```bash
# Scan for container imports
grep -r "import org.testcontainers.containers" --include="*.java"

# Common patterns:
grep -r "CassandraContainer\|PostgreSQLContainer\|MySQLContainer" --include="*.java"
```

---

## Auto-Remediation

### Maven (pom.xml)

```xml
<!-- Container used in test -->
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>junit-jupiter</artifactId>
    <scope>test</scope>
</dependency>

<!-- AUTO-ADD missing module -->
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>cassandra</artifactId>
    <scope>test</scope>
</dependency>
```

### Gradle (build.gradle)

```gradle
// Container used in test
testImplementation 'org.testcontainers:junit-jupiter'

// AUTO-ADD missing module
testImplementation 'org.testcontainers:cassandra'
```

---

## Output Format

```yaml
testcontainersValidation:
  detected: true
  coreVersion: "1.21.3"
  containersUsed: 2
  modulesRequired: 2
  modulesDeclared: 1
  missingModules: 1

  containers:
    - class: "CassandraContainer"
      import: "org.testcontainers.containers.CassandraContainer"
      file: "src/test/java/com/example/CassandraIntegrationTest.java"
      module: "cassandra"
      declared: false  # MISSING

    - class: "PostgreSQLContainer"
      import: "org.testcontainers.containers.PostgreSQLContainer"
      file: "src/test/java/com/example/PostgresIntegrationTest.java"
      module: "postgresql"
      declared: true  # OK

  missingModules:
    - module: "cassandra"
      reason: "CassandraContainer used but module not declared"
      autoFix:
        maven: "<dependency><groupId>org.testcontainers</groupId><artifactId>cassandra</artifactId><scope>test</scope></dependency>"
        gradle: "testImplementation 'org.testcontainers:cassandra'"

  summary:
    automationPotential: "100%"
    estimatedEffort: "2 minutes"
    status: "AUTO_FIXABLE"
```

---

## Integration Points

**Used by:** validation-agent, discovery-agent
**Triggers:** When Testcontainers usage detected

---

## References

- **Testcontainers Documentation:** <https://testcontainers.com/>
- **Testcontainers Modules:** <https://testcontainers.com/modules/>

---

## Version History

- **1.0.0** (2026-01-04): Initial implementation with container-to-module mapping
