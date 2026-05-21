# Maven Reference — Dependency Maintenance

Reference for Maven Versions Plugin commands used in the `java-maintenance-workflow` skill.

Official docs: <https://www.mojohaus.org/versions/versions-maven-plugin/>

For Gradle projects see `references/gradle.md`.

---

## Report Mode (read-only, no changes)

```bash
# Show available dependency updates
./mvnw versions:display-dependency-updates

# Show available plugin updates
./mvnw versions:display-plugin-updates

# Show updates accessible via Maven properties
./mvnw versions:display-property-updates

# Run all three at once (most common)
./mvnw versions:display-dependency-updates versions:display-plugin-updates versions:display-property-updates
```

Output lines to act on look like:

```text
[INFO] The following dependencies in Dependencies have newer versions:
[INFO]   org.springframework.boot:spring-boot-starter-parent .............. 4.0.0 -> 4.0.3
```

---

## Update Mode (modifies pom.xml)

### Dependencies

```bash
./mvnw versions:use-latest-releases \
    -DallowMajorUpdates=false \
    -DprocessDependencies=true \
    -DprocessPlugins=false \
    -DexcludesVersionFilters='(?i).*-(alpha|beta|m\d+|rc\d*|snapshot)|.*\b(dev|milestone|preview|nf-)\b.*'
```

| Flag                         | Effect                                    |
| ---------------------------- | ----------------------------------------- |
| `-DallowMajorUpdates=false`  | Stay within the current major version     |
| `-DprocessDependencies=true` | Update `<dependency>` blocks              |
| `-DprocessPlugins=false`     | Leave plugins to the separate plugin goal |
| `-DexcludesVersionFilters`   | Regex to skip pre-release versions        |

### Plugins

```bash
./mvnw versions:update-plugins \
    -DallowMajorUpdates=false \
    -DexcludesVersionFilters='(?i).*-(alpha|beta|m\d+|rc\d*|snapshot)|.*\b(dev|milestone|preview|nf-)\b.*'
```

### Properties (version catalogs / `<properties>` blocks)

```bash
./mvnw versions:update-properties \
    -DallowMajorUpdates=false \
    -DexcludesVersionFilters='(?i).*-(alpha|beta|m\d+|rc\d*|snapshot)|.*\b(dev|milestone|preview|nf-)\b.*'
```

---

## Commit / Rollback

Maven Versions Plugin creates `.versionsBackup` files before editing.

```bash
# Accept all changes (removes .versionsBackup files)
./mvnw versions:commit

# Revert all changes (restores from .versionsBackup files)
./mvnw versions:revert
```

Always run `versions:commit` after verifying the build passes, or `versions:revert` if
you want to undo without touching git.

---

## Version Filter Reference

Skip a version if it contains any of these strings (case-insensitive):

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

## Useful Diagnostics

```bash
# Show full dependency tree
./mvnw dependency:tree

# Show why a specific dependency is on the classpath
./mvnw dependency:tree -Dincludes=org.springframework.boot:spring-boot

# Force-refresh dependencies from remote
./mvnw clean package -U

# Clear local repository cache for a specific artifact
./mvnw dependency:purge-local-repository -DincludeArtifactIds=jackson-databind

# Check for deprecation warnings
./mvnw compile -Xlint:deprecation
```

---

## Maven Wrapper

Always prefer `./mvnw` over a globally-installed `mvn` to ensure the project uses the
exact Maven version pinned in `.mvn/wrapper/maven-wrapper.properties`.

If the wrapper binary is missing:

```bash
mvn wrapper:wrapper
```
