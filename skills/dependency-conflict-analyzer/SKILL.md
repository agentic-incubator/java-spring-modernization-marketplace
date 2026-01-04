# Dependency Conflict Analyzer Skill

**Skill ID:** `dependency-conflict-analyzer`
**Version:** 1.0.0
**Category:** Validation & Analysis
**Priority:** MEDIUM

## Purpose

Detect transitive dependency conflicts, particularly Jackson 2.x vs 3.x version conflicts that cause runtime failures.

## Detection

```bash
# Maven
mvn dependency:tree | grep -E "jackson-databind|jackson-core"

# Gradle
./gradlew dependencies | grep -E "jackson-databind|jackson-core"
```

## Key Patterns

- Mixed Jackson versions (2.17.2 and 3.0.2 in same classpath)
- Spring AI 2.0.0-M1 brings Jackson 3.x
- Legacy dependencies may bring Jackson 2.x

## Output

```yaml
conflicts:
  - library: 'jackson-databind'
    versions: ['2.17.2', '3.0.2']
    source:
      - 'my-lib:1.0.0 → jackson-databind:2.17.2'
      - 'spring-ai-core:2.0.0-M1 → jackson-databind:3.0.2'
    recommendation: 'Pin to Jackson 3.0.2 via BOM'
```

## Remediation

Add explicit dependency management to force Jackson 3.x:

```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>tools.jackson</groupId>
            <artifactId>jackson-bom</artifactId>
            <version>3.0.2</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

## Integration

**Used by:** validation-agent (Phase 6)
**Triggers:** Auto-triggered when migrating to Spring Boot 4.x with Jackson 3.x

## References

- **Maven Dependency Plugin:** <https://maven.apache.org/plugins/maven-dependency-plugin/>
- **Gradle Dependency Management:** <https://docs.gradle.org/current/userguide/dependency_management.html>
- **Jackson BOM:** <https://github.com/FasterXML/jackson-bom>
