---
name: dependency-scanner
description: Scan and catalog all project dependencies requiring migration attention including Jackson, Spring Security, Vaadin, and Spring AI. Use when identifying dependencies that need updates or have breaking changes.
allowed-tools: Read, Glob, Grep, Bash
---

# Dependency Scanner

Identify all dependencies requiring migration attention in Java/Spring projects.

## Instructions

Scan the project to identify dependencies in these categories:

1. **Direct Dependencies** - Listed explicitly in pom.xml or build.gradle
2. **Managed Dependencies** - Version managed by BOMs
3. **Transitive Dependencies** - Pulled in by other dependencies
4. **Plugin Dependencies** - Build plugins and their versions

## Key Dependencies to Track

| Dependency          | Migration Concern          | Action                                    |
| ------------------- | -------------------------- | ----------------------------------------- |
| `jackson-*`         | groupId change             | `com.fasterxml.jackson` → `tools.jackson` |
| `spring-security-*` | API changes                | Spring Security 6 → 7 patterns            |
| `vaadin-*`          | Theme and security changes | Material → Lumo, VaadinWebSecurity        |
| `spring-ai-*`       | TTS API changes            | SpeechModel → TextToSpeechModel           |
| `jakarta.*`         | Already migrated           | Verify javax.\* complete                  |
| `resilience4j-*`    | Compatibility check        | Version alignment                         |

## Maven Scanning

```bash
# Generate dependency tree
mvn dependency:tree -DoutputType=text

# Check for specific dependencies
mvn dependency:tree -Dincludes=com.fasterxml.jackson*
mvn dependency:tree -Dincludes=org.springframework.security*
```

## Gradle Scanning

```bash
# Generate dependency tree
./gradlew dependencies

# Check specific configuration
./gradlew dependencies --configuration compileClasspath

# Dependency insight
./gradlew dependencyInsight --dependency jackson
```

## Output Format

```json
{
  "project": "my-app",
  "scanDate": "2025-12-10",
  "dependencies": {
    "jackson": [
      {
        "groupId": "com.fasterxml.jackson.core",
        "artifactId": "jackson-databind",
        "currentVersion": "2.17.0",
        "migrationRequired": true,
        "action": "Change groupId to tools.jackson.core"
      }
    ],
    "spring-security": [
      {
        "groupId": "org.springframework.security",
        "artifactId": "spring-security-web",
        "currentVersion": "6.4.0",
        "migrationRequired": true,
        "action": "Update to Spring Security 7.0, review API changes"
      }
    ],
    "vaadin": [
      {
        "groupId": "com.vaadin",
        "artifactId": "vaadin-spring-boot-starter",
        "currentVersion": "24.9.6",
        "migrationRequired": true,
        "action": "Update to Vaadin 25, migrate Material to Lumo theme"
      }
    ],
    "spring-ai": [
      {
        "groupId": "org.springframework.ai",
        "artifactId": "spring-ai-openai-spring-boot-starter",
        "currentVersion": "1.0.0",
        "migrationRequired": true,
        "action": "Update TTS API classes, change speed param to Double"
      }
    ]
  },
  "totalMigrationActions": 4
}
```

## Pattern Detection for Dependencies

### Jackson Detection

```text
com.fasterxml.jackson.core:jackson-core
com.fasterxml.jackson.core:jackson-databind
com.fasterxml.jackson.core:jackson-annotations
com.fasterxml.jackson.dataformat:jackson-dataformat-*
com.fasterxml.jackson.datatype:jackson-datatype-*
com.fasterxml.jackson.module:jackson-module-*
```

### Spring Security Detection

```text
org.springframework.security:spring-security-core
org.springframework.security:spring-security-web
org.springframework.security:spring-security-config
org.springframework.security:spring-security-oauth2-*
```

### Spring AI Detection

```text
org.springframework.ai:spring-ai-*
```
