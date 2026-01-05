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
- Spring AI 2.0.0-M\* **requires** Jackson 2.x (not 3.x)
- Legacy dependencies may bring Jackson 2.x
- **Special case**: Spring AI 2.0.0-M\* + Spring Boot 4 requires dual Jackson environment

## Output

```yaml
conflicts:
  - library: 'jackson-databind'
    versions: ['2.18.2', '3.0.3']
    source:
      - 'spring-ai-openai-spring-boot-starter:2.0.0-M1 → jackson-databind:2.18.2'
      - 'spring-boot-starter-json:4.0.0 → jackson-databind:3.0.3'
    recommendation: 'Use Jackson 2/3 coexistence for Spring AI 2.0.0-M*'
    specialCase: 'spring-ai-milestone-boot-4'
```

## Remediation

### Standard Case: Pin to Jackson 3.x (General)

For most conflicts, add explicit dependency management to force Jackson 3.x:

```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>tools.jackson</groupId>
            <artifactId>jackson-bom</artifactId>
            <version>3.0.3</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

### Special Case: Spring AI 2.0.0-M\* + Spring Boot 4

**DO NOT pin to Jackson 3** - this will break Spring AI milestone releases!

**Problem**: Spring AI 2.0.0-M\* requires Jackson 2, but Spring Boot 4 uses Jackson 3.

**Solution**: Use `spring-ai-migrator` with Jackson 2 compatibility layer:

```bash
# Run spring-ai-migrator v2.2.0+
# This adds:
# 1. Jackson 2 dependencies (explicit)
# 2. JacksonConfiguration.java with Jackson 2 ObjectMapper bean
# 3. Both Jackson versions coexist safely
```

**Detection Pattern**:

```bash
# Detect Spring AI 2.0.0-M* + Boot 4.x
SPRING_AI_VERSION=$(grep -oP 'spring-ai\.version.*>\K2\.0\.0-M\d+' pom.xml)
SPRING_BOOT_VERSION=$(grep -oP '<version>\K4\.\d+\.\d+' pom.xml)

if [ -n "$SPRING_AI_VERSION" ] && [ -n "$SPRING_BOOT_VERSION" ]; then
    echo "⚠️  Spring AI milestone + Boot 4 detected"
    echo "   Use spring-ai-migrator jackson-2-compatibility-layer"
    echo "   DO NOT pin to Jackson 3 (breaks Spring AI)"
fi
```

**Recommended Action**:

```bash
# Let migration-agent handle it automatically in Phase 2.5
# Or run manually:
/migrate --skill spring-ai-migrator --transformation jackson-2-compatibility-layer
```

**Removal**: This compatibility layer is temporary. Remove when upgrading to Spring AI 2.0.0 GA or later.

## Integration

**Used by:** validation-agent (Phase 6)
**Triggers:** Auto-triggered when migrating to Spring Boot 4.x with Jackson 3.x

## References

- **Maven Dependency Plugin:** <https://maven.apache.org/plugins/maven-dependency-plugin/>
- **Gradle Dependency Management:** <https://docs.gradle.org/current/userguide/dependency_management.html>
- **Jackson BOM:** <https://github.com/FasterXML/jackson-bom>
