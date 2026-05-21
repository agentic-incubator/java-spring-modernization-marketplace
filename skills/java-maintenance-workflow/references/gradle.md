# Gradle Reference — Dependency Maintenance

Reference for Gradle dependency-update commands used in the `java-maintenance-workflow` skill.

Versions Plugin docs: <https://github.com/ben-manes/gradle-versions-plugin>
Use-Latest-Versions Plugin docs: <https://github.com/patrikerdes/gradle-use-latest-versions-plugin>

For Maven projects see `references/maven.md`.

---

## Required Plugins

Add to `build.gradle.kts` (or `build.gradle`) if not already present:

```kotlin
// build.gradle.kts
plugins {
    id("com.github.ben-manes.versions") version "0.51.0"
    id("se.patrikerdes.use-latest-versions") version "0.2.18"
}
```

```groovy
// build.gradle (Groovy DSL)
plugins {
    id 'com.github.ben-manes.versions' version '0.51.0'
    id 'se.patrikerdes.use-latest-versions' version '0.2.18'
}
```

---

## Report Mode (read-only, no changes)

```bash
# Show available dependency and plugin updates
./gradlew dependencyUpdates \
    --no-parallel --refresh-dependencies \
    -DrevisionLevel=release
```

To filter out pre-release versions, add a `rejectVersionIf` block to the versions plugin
configuration:

```kotlin
// build.gradle.kts
tasks.withType<DependencyUpdatesTask> {
    rejectVersionIf {
        val preRelease = listOf(
            "-M", "-RC", "-SNAPSHOT",
            "alpha", "Alpha", "beta", "Beta",
            "Dev", "milestone", "preview", "nf-"
        )
        preRelease.any { candidate.version.contains(it, ignoreCase = true) }
    }
}
```

Output to inspect:

```text
The following dependencies have later milestone versions:
 - org.springframework.boot:spring-boot-starter-parent [4.0.0 -> 4.0.3]
```

---

## Update Mode (modifies build files)

```bash
# Apply stable updates to build.gradle.kts / libs.versions.toml / gradle.properties
./gradlew useLatestVersions --no-parallel
```

The plugin updates version references in (checked in priority order):

1. `gradle/libs.versions.toml` (version catalog)
2. `gradle.properties`
3. `build.gradle.kts` / `build.gradle` inline version strings

After running, confirm the changes:

```bash
git diff gradle/libs.versions.toml gradle.properties build.gradle.kts
```

---

## Version Filter Reference

Skip any version that contains these strings (case-insensitive):

| Pattern                 | Examples               |
| ----------------------- | ---------------------- |
| `-M` followed by digits | `3.0.0-M1`, `4.0.0-M3` |
| `-RC`                   | `2.0.0-RC1`            |
| `-SNAPSHOT`             | `1.5.0-SNAPSHOT`       |
| `alpha`                 | `2.0.0-alpha.1`        |
| `beta`                  | `1.0.0-beta`           |
| `Alpha`                 | `3.0.0-Alpha2`         |
| `Dev`                   | `4.0.0-Dev`            |
| `milestone`             | `2.0.0-milestone.1`    |
| `preview`               | `1.0.0-preview`        |
| `nf-`                   | `2.3.0-nf-foo`         |

---

## Quality Gates

```bash
# Format (requires Spotless plugin)
./gradlew spotlessApply

# Compile
./gradlew compileJava

# Unit tests
./gradlew test

# SpotBugs (requires spotbugs-gradle-plugin)
./gradlew spotbugsMain
```

### SpotBugs Gradle Plugin Setup

```kotlin
// build.gradle.kts
plugins {
    id("com.github.spotbugs") version "6.1.7"
}

spotbugs {
    effort = com.github.spotbugs.snom.Effort.MAX
    reportLevel = com.github.spotbugs.snom.Confidence.LOW
    excludeFilter = file("src/main/resources/spotbugs-exclude.xml")
}
```

See `references/spotbugs-exclude-template.xml` for the exclusion file template.

---

## Useful Diagnostics

```bash
# Show full dependency tree
./gradlew dependencies

# Dependency tree for a specific configuration
./gradlew dependencies --configuration compileClasspath

# Show why a specific dependency is on the classpath
./gradlew dependencyInsight \
    --dependency spring-boot \
    --configuration compileClasspath

# Force-refresh dependencies from remote
./gradlew clean build --refresh-dependencies

# Clear Gradle caches
./gradlew clean
rm -rf ~/.gradle/caches/modules-2/files-2.1/org.springframework.boot

# Detect dependency conflicts
./gradlew dependencyInsight \
    --dependency jackson-databind \
    --configuration compileClasspath
```

---

## Gradle Wrapper

Always prefer `./gradlew` over a globally-installed `gradle` to ensure the project uses
the exact Gradle version pinned in `gradle/wrapper/gradle-wrapper.properties`.

If the wrapper binary is missing:

```bash
gradle wrapper --gradle-version 8.14
```

Check the current version:

```bash
./gradlew --version
```
