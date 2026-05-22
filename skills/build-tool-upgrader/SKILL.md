---
name: build-tool-upgrader
description: >
  Upgrade Maven or Gradle wrapper to the latest stable version that is compatible
  with the Java version the project uses. Performs a live lookup of the current
  latest release at runtime — never uses hardcoded target versions. Use before
  Spring ecosystem migrations or whenever the wrapper is stale.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Build Tool Upgrader

Upgrade Maven and Gradle wrappers to the **latest available** stable release that
satisfies the minimum required for the project's Java version.

**The target is always the live-resolved latest.** The compatibility table below is a
set of permanent historical floor values — they tell you the minimum acceptable version,
not the version to install. Running this skill at different times will produce different
results as new releases appear, which is the correct behaviour.

---

## Step 0 — Detect Project Java Version

```bash
# From pom.xml
JAVA_VERSION=$(grep -m1 '<java.version>\|<maven.compiler.source>' pom.xml 2>/dev/null \
  | sed 's/.*>\([0-9]*\)<.*/\1/')

# From build.gradle.kts / build.gradle
JAVA_VERSION=$(grep -m1 'javaVersion\|sourceCompatibility\|JavaVersion\.VERSION_' \
  build.gradle.kts build.gradle 2>/dev/null \
  | grep -oE '[0-9]{2,}' | head -1)

# From .java-version / .tool-versions
[ -z "$JAVA_VERSION" ] && JAVA_VERSION=$(cat .java-version 2>/dev/null | grep -oE '[0-9]+' | head -1)

echo "Project Java version: $JAVA_VERSION"
```

---

## Step 1 — Live Version Discovery

Always run this before any comparison or upgrade. The result varies over time as new
releases are published.

### Gradle — latest stable

```bash
GRADLE_LATEST=$(curl -fsSL https://services.gradle.org/versions/current \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['version'])")
echo "Gradle latest: $GRADLE_LATEST"
```

### Maven — latest stable 3.x (and 4.x if already in use)

```bash
MAVEN_META=$(curl -fsSL \
  "https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/maven-metadata.xml")

MAVEN_LATEST_3=$(echo "$MAVEN_META" | python3 -c "
import sys
from xml.etree.ElementTree import parse
root = parse(sys.stdin).getroot()
versions = [v.text for v in root.findall('.//version')
            if not any(q in v.text for q in ['alpha','beta','rc','RC','SNAPSHOT'])]
v3 = sorted([v for v in versions if v.startswith('3.')],
            key=lambda s: list(map(int, s.split('.'))))
print(v3[-1] if v3 else 'unknown')
")

MAVEN_LATEST_4=$(echo "$MAVEN_META" | python3 -c "
import sys
from xml.etree.ElementTree import parse
root = parse(sys.stdin).getroot()
versions = [v.text for v in root.findall('.//version')
            if not any(q in v.text for q in ['alpha','beta','rc','RC','SNAPSHOT'])]
v4 = sorted([v for v in versions if v.startswith('4.')],
            key=lambda s: list(map(int, s.split('.'))))
print(v4[-1] if v4 else 'none')
")

echo "Maven 3.x latest: $MAVEN_LATEST_3"
echo "Maven 4.x latest: $MAVEN_LATEST_4"
```

---

## Step 2 — Determine Minimum Required Version

These are permanent historical facts. The minimum for a given Java version never changes.

### Java LTS Compatibility Table

| Java LTS | GA Date     | Gradle minimum | Maven minimum |
| -------- | ----------- | -------------- | ------------- |
| **17**   | 14 Sep 2021 | **7.3**        | **3.8.1**     |
| **21**   | 19 Sep 2023 | **8.5**        | **3.9.6**     |
| **25**   | 16 Sep 2025 | **9.1.0**      | **3.9.10**    |

> **Gradle 9.x runtime caveat**: Gradle 9.0+ requires **JVM 17 to run the Gradle daemon
> itself** (not just to compile project code). If your CI pipeline runs on JDK 11 or
> earlier, upgrading the wrapper to Gradle 9.x will break the build. Ensure the runtime
> JDK ≥ 17 before upgrading to any Gradle 9.x version.

### Compute minimum from detected Java version

```bash
case "$JAVA_VERSION" in
  17) GRADLE_MIN="7.3";   MAVEN_MIN="3.8.1"  ;;
  21) GRADLE_MIN="8.5";   MAVEN_MIN="3.9.6"  ;;
  25) GRADLE_MIN="9.1.0"; MAVEN_MIN="3.9.10" ;;
  *)
    # For non-LTS or future versions, conservative fallback:
    # use the highest known minimum (always safe to run newer tools)
    GRADLE_MIN="9.1.0"; MAVEN_MIN="3.9.10"
    echo "Warning: no exact compatibility entry for Java $JAVA_VERSION — using highest known floor"
    ;;
esac

echo "Gradle:  current floor=$GRADLE_MIN  →  target=$GRADLE_LATEST"
echo "Maven:   current floor=$MAVEN_MIN   →  target=$MAVEN_LATEST_3"
```

The live-resolved latest always satisfies the minimum — you never need to check.
If for any reason `$GRADLE_LATEST < $GRADLE_MIN` (possible only during a major version
transition where the `current` endpoint lags), stop and report rather than downgrading.

---

## Step 3 — Detect Current Wrapper Version

```bash
# Gradle
GRADLE_CURRENT=$(grep distributionUrl gradle/wrapper/gradle-wrapper.properties 2>/dev/null \
  | grep -oE 'gradle-[0-9]+\.[0-9]+(\.[0-9]+)?' | grep -oE '[0-9]+\.[0-9]+(\.[0-9]+)?')

# Maven
MAVEN_CURRENT=$(grep distributionUrl .mvn/wrapper/maven-wrapper.properties 2>/dev/null \
  | grep -oE 'apache-maven-[0-9]+\.[0-9]+\.[0-9]+' | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')

echo "Current Gradle wrapper: ${GRADLE_CURRENT:-not found}"
echo "Current Maven wrapper:  ${MAVEN_CURRENT:-not found}"
```

---

## Step 4 — Execute Upgrade

Only upgrade when `$GRADLE_CURRENT != $GRADLE_LATEST` (or Maven equivalent).

### Gradle

```bash
./gradlew wrapper --gradle-version "$GRADLE_LATEST"
# With full distribution (required for IDE tooling and source navigation):
./gradlew wrapper --gradle-version "$GRADLE_LATEST" --distribution-type all
```

**Files modified:** `gradle/wrapper/gradle-wrapper.properties`, `gradle/wrapper/gradle-wrapper.jar`, `gradlew`, `gradlew.bat`

### Maven

```bash
# Use 3.x unless the project already uses Maven 4
TARGET_MAVEN="$MAVEN_LATEST_3"
[ -n "$MAVEN_CURRENT" ] && [[ "$MAVEN_CURRENT" == 4.* ]] && TARGET_MAVEN="$MAVEN_LATEST_4"

./mvnw wrapper:wrapper -Dmaven="$TARGET_MAVEN"
# If wrapper is broken, fall back to system Maven:
mvn wrapper:wrapper -Dmaven="$TARGET_MAVEN"
```

**Files modified:** `.mvn/wrapper/maven-wrapper.properties`, `.mvn/wrapper/maven-wrapper.jar`, `mvnw`, `mvnw.cmd`

---

## Step 5 — Verify and Test Build

```bash
# Gradle
./gradlew --version
./gradlew clean build -x test

# Maven
./mvnw --version
./mvnw clean package -DskipTests
```

---

## Troubleshooting

### Gradle: permission denied

```bash
chmod +x gradlew
# Or regenerate via system Gradle (version from $GRADLE_LATEST):
gradle wrapper --gradle-version "$GRADLE_LATEST"
```

### Gradle: download fails behind corporate proxy

```bash
# gradle.properties
systemProp.http.proxyHost=proxy.example.com
systemProp.http.proxyPort=8080
systemProp.https.proxyHost=proxy.example.com
systemProp.https.proxyPort=8080
```

### Maven: mvnw not found or corrupted

```bash
# Use system Maven with the live-resolved version
mvn wrapper:wrapper -Dmaven="$MAVEN_LATEST_3"
```

### Maven: old wrapper plugin version

Add or update in `pom.xml` — look up current version at
`https://repo.maven.apache.org/maven2/org/apache/maven/plugins/maven-wrapper-plugin/maven-metadata.xml`:

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-wrapper-plugin</artifactId>
    <version><!-- latest from maven-metadata.xml --></version>
</plugin>
```

### Gradle 9.x: daemon fails to start on JDK < 17

Gradle 9.0+ requires JVM 17 to run the daemon. If CI uses an older JDK:

1. Update CI to install JDK 17+, or
2. Pin the wrapper to the latest Gradle 8.x release (query
   `https://services.gradle.org/versions/all` and take the highest `version` where
   `version` starts with `8.` and `broken: false`).

---

## Integration with Migration

Run **before** other migration skills:

```text
┌─────────────────────┐
│ 1. BUILD TOOL CHECK │  ← build-tool-upgrader (this skill)
│    latest wrapper   │
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│ 2. SPRING MIGRATION │  ← build-file-updater
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│ 3. CODE MIGRATION   │  ← import-migrator
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│ 4. VALIDATION       │  ← build-runner
└─────────────────────┘
```
