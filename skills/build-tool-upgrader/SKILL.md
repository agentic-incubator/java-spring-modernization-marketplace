---
name: build-tool-upgrader
description: Upgrade Maven or Gradle wrapper versions to meet Spring Boot 4 requirements. Use when build tool versions are outdated or before starting Spring ecosystem migrations.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Build Tool Upgrader

Upgrade Maven and Gradle wrappers to versions compatible with Spring Boot 4 and Java 21+.

## Version Requirements

### Spring Boot 4.x Requirements

| Build Tool | Minimum Version | Recommended Version | Reason                         |
| ---------- | --------------- | ------------------- | ------------------------------ |
| Gradle     | 8.5             | 8.11                | Java 21+ toolchain support     |
| Maven      | 3.9.0           | 3.9.9               | Improved dependency resolution |

### Java Version Compatibility

| Java Version | Gradle Minimum | Maven Minimum |
| ------------ | -------------- | ------------- |
| 21           | 8.4            | 3.9.0         |
| 22           | 8.7            | 3.9.6         |
| 23           | 8.10           | 3.9.9         |
| 25           | 8.11           | 3.9.9         |

## Upgrade Commands

### Gradle Wrapper Upgrade

```bash
# Check current version
./gradlew --version

# Upgrade to specific version
./gradlew wrapper --gradle-version 8.11

# Upgrade with distribution type
./gradlew wrapper --gradle-version 8.11 --distribution-type all

# Verify upgrade
./gradlew --version
```

**Files modified:**

- `gradle/wrapper/gradle-wrapper.properties`
- `gradle/wrapper/gradle-wrapper.jar`
- `gradlew`
- `gradlew.bat`

### Maven Wrapper Upgrade

```bash
# Check current version
./mvnw --version

# Upgrade using wrapper plugin (Maven 3.7+)
./mvnw wrapper:wrapper -Dmaven=3.9.9

# Alternative: Use mvn directly if wrapper is broken
mvn wrapper:wrapper -Dmaven=3.9.9

# Verify upgrade
./mvnw --version
```

**Files modified:**

- `.mvn/wrapper/maven-wrapper.properties`
- `.mvn/wrapper/maven-wrapper.jar`
- `mvnw`
- `mvnw.cmd`

## Detection and Analysis

### Check Current Gradle Version

Read `gradle/wrapper/gradle-wrapper.properties`:

```properties
distributionUrl=https\://services.gradle.org/distributions/gradle-8.5-bin.zip
```

Extract version: `8.5`

### Check Current Maven Version

Read `.mvn/wrapper/maven-wrapper.properties`:

```properties
distributionUrl=https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.9.6/apache-maven-3.9.6-bin.zip
```

Extract version: `3.9.6`

## Upgrade Workflow

### Step 1: Detect Current Version

```bash
# Gradle
grep distributionUrl gradle/wrapper/gradle-wrapper.properties

# Maven
grep distributionUrl .mvn/wrapper/maven-wrapper.properties
```

### Step 2: Compare Against Requirements

```javascript
// Pseudo-logic
if (gradleVersion < '8.5') {
  recommend('Upgrade Gradle to 8.11 for Spring Boot 4 compatibility')
}
if (mavenVersion < '3.9.0') {
  recommend('Upgrade Maven to 3.9.9 for Spring Boot 4 compatibility')
}
```

### Step 3: Execute Upgrade

```bash
# Gradle
cd /path/to/project
./gradlew wrapper --gradle-version 8.11

# Maven
cd /path/to/project
./mvnw wrapper:wrapper -Dmaven=3.9.9
```

### Step 4: Verify Upgrade

```bash
# Gradle - verify wrapper files updated
cat gradle/wrapper/gradle-wrapper.properties | grep distributionUrl

# Maven - verify wrapper files updated
cat .mvn/wrapper/maven-wrapper.properties | grep distributionUrl
```

### Step 5: Test Build

```bash
# Gradle
./gradlew clean build -x test

# Maven
./mvnw clean package -DskipTests
```

## Output Format

```json
{
  "project": "/path/to/project",
  "buildTool": "gradle",
  "upgrade": {
    "from": "8.5",
    "to": "8.11",
    "reason": "Spring Boot 4 + Java 21 compatibility"
  },
  "filesModified": [
    "gradle/wrapper/gradle-wrapper.properties",
    "gradle/wrapper/gradle-wrapper.jar",
    "gradlew",
    "gradlew.bat"
  ],
  "verification": {
    "wrapperVersion": "8.11",
    "buildSuccess": true
  }
}
```

## Troubleshooting

### Gradle Wrapper Issues

**Problem**: `gradlew` command not found or permission denied

```bash
# Fix permissions
chmod +x gradlew

# Or use Gradle directly to regenerate wrapper
gradle wrapper --gradle-version 8.11
```

**Problem**: Download fails behind corporate proxy

```bash
# Set proxy in gradle.properties
systemProp.http.proxyHost=proxy.example.com
systemProp.http.proxyPort=8080
systemProp.https.proxyHost=proxy.example.com
systemProp.https.proxyPort=8080
```

### Maven Wrapper Issues

**Problem**: `mvnw` command not found or corrupted

```bash
# Use system Maven to regenerate
mvn wrapper:wrapper -Dmaven=3.9.9

# Or download manually
curl -o .mvn/wrapper/maven-wrapper.jar https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper-3.2.0.jar
```

**Problem**: Old wrapper plugin version

```bash
# Update wrapper plugin in pom.xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-wrapper-plugin</artifactId>
    <version>3.2.0</version>
</plugin>
```

## Integration with Migration

This skill should run **before** other migration steps:

```text
┌─────────────────────┐
│ 1. BUILD TOOL CHECK │  ← build-tool-upgrader
│    Gradle 8.11+     │
│    Maven 3.9.9+     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 2. SPRING MIGRATION │  ← build-file-updater
│    Boot 4.0         │
│    Jackson 3.x      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 3. CODE MIGRATION   │  ← import-migrator
│    Imports          │
│    Configurations   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 4. VALIDATION       │  ← build-runner
│    Compile + Test   │
└─────────────────────┘
```

## Recommended Versions (December 2024)

| Tool   | Version | Release Date | Notes                    |
| ------ | ------- | ------------ | ------------------------ |
| Gradle | 8.11    | Nov 2024     | Latest stable            |
| Gradle | 8.10.2  | Sep 2024     | LTS candidate            |
| Maven  | 3.9.9   | Aug 2024     | Latest 3.9.x             |
| Maven  | 4.0.0   | Beta         | Not recommended for prod |
