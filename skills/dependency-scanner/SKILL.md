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

| Dependency                     | Migration Concern          | Action                                              |
| ------------------------------ | -------------------------- | --------------------------------------------------- |
| `jackson-*`                    | groupId change             | `com.fasterxml.jackson` → `tools.jackson`           |
| `spring-security-*`            | API changes                | Spring Security 6 → 7 patterns                      |
| `vaadin-*`                     | Theme and security changes | Material → Lumo, VaadinWebSecurity                  |
| `spring-ai-*`                  | TTS API + Boot 4 compat    | Upgrade to 2.0.0-M1 for Boot 4, add milestones repo |
| `spring-boot-starter-undertow` | **REMOVED in Boot 4**      | Replace with Tomcat (default) or Jetty              |
| `spring-boot-starter-web`      | Renamed in Boot 4          | Rename to `spring-boot-starter-webmvc`              |
| `jakarta.*`                    | Already migrated           | Verify javax.\* complete                            |
| `resilience4j-*`               | Compatibility check        | Version alignment                                   |

## Critical: Undertow Removal

**Undertow is not compatible with Servlet 6.1 and has been removed from Spring Boot 4.**

### Detection

```xml
<!-- This dependency MUST be removed for Spring Boot 4 -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-undertow</artifactId>
</dependency>
```

### Migration Options

| Current  | Migration Path                           | Notes                    |
| -------- | ---------------------------------------- | ------------------------ |
| Undertow | Remove dependency (use Tomcat default)   | Recommended              |
| Undertow | Replace with `spring-boot-starter-jetty` | If Jetty features needed |

### Why Undertow Was Removed

Undertow does not support Servlet 6.1, which is required by Spring Boot 4.
The Spring team decided to remove Undertow support rather than maintain a
partially-compatible embedded server.

## Milestone Version Detection

Spring AI 2.0.0-M1 (and other milestone releases) require the Spring Milestones repository.

### Detection Pattern

Look for version patterns indicating milestone releases:

- `-M1`, `-M2`, `-M3` (Milestone)
- `-RC1`, `-RC2` (Release Candidate)
- `-SNAPSHOT` (Snapshot)

### Required Repository

When milestone versions are detected, verify Spring Milestones repository is configured:

```xml
<repository>
    <id>spring-milestones</id>
    <url>https://repo.spring.io/milestone</url>
</repository>
```

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
        "action": "Upgrade to 2.0.0-M1 for Boot 4 compatibility, add Spring Milestones repo"
      }
    ],
    "undertow": [
      {
        "groupId": "org.springframework.boot",
        "artifactId": "spring-boot-starter-undertow",
        "currentVersion": "managed",
        "migrationRequired": true,
        "severity": "BLOCKING",
        "action": "REMOVE - Undertow not compatible with Servlet 6.1. Use Tomcat (default) or Jetty."
      }
    ],
    "web-starter": [
      {
        "groupId": "org.springframework.boot",
        "artifactId": "spring-boot-starter-web",
        "currentVersion": "managed",
        "migrationRequired": true,
        "action": "Rename to spring-boot-starter-webmvc"
      }
    ]
  },
  "milestoneVersionsDetected": ["spring-ai:2.0.0-M1"],
  "repositoryRequired": {
    "spring-milestones": true,
    "reason": "Spring AI 2.0.0-M1 is a milestone release"
  },
  "totalMigrationActions": 6
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

### Undertow Detection (BLOCKING)

```text
org.springframework.boot:spring-boot-starter-undertow
```

### Web Starter Detection (Rename Required)

```text
org.springframework.boot:spring-boot-starter-web
```

### Milestone Version Detection

```text
*-M1
*-M2
*-M3
*-RC1
*-RC2
*-SNAPSHOT
```
