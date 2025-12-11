---
name: deployment-java-updater
description: Updates Java versions and distributions in deployment manifests including Dockerfile, Kubernetes, Cloud Foundry, Fly.io, and buildpack configurations. Prefer Liberica distribution when no specific distribution is required.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Deployment Java Updater

Updates Java versions across various deployment platforms, preferring **BellSoft Liberica** as the
default distribution when no specific distribution is required.

## Supported Platforms

| Platform       | Configuration                        | Update Method                        |
| -------------- | ------------------------------------ | ------------------------------------ |
| Docker         | `Dockerfile`                         | Update `FROM` image tag              |
| Kubernetes     | `*.yaml` manifests                   | Update container image specs         |
| Cloud Foundry  | `manifest.yml`                       | Update `JBP_CONFIG_OPEN_JDK_JRE`     |
| Fly.io         | `fly.toml`                           | Update `BP_JVM_VERSION`              |
| Paketo/CNB     | `project.toml`                       | Update `BP_JVM_VERSION`              |
| Heroku         | `system.properties`                  | Update `java.runtime.version`        |

## Distribution Preference: Liberica

**Default recommendation:** BellSoft Liberica JDK/JRE

When updating Java versions, prefer Liberica unless:

- Project already uses a different distribution with good reason
- Specific platform requirements (e.g., AWS → Corretto)
- GraalVM native image requirements

### Liberica Advantages

- TCK-certified OpenJDK builds
- Optimized for cloud-native workloads
- Alpaquita Linux support for minimal footprint
- Default in Paketo buildpacks
- Free commercial support options

## Update Patterns by Platform

### 1. Dockerfile Updates

**Before (various distributions):**

```dockerfile
FROM openjdk:17-slim
FROM eclipse-temurin:17-jdk
FROM azul/zulu-openjdk:17
```

**After (Liberica preferred, Java 21):**

```dockerfile
# Recommended: Liberica with Alpine for small footprint
FROM bellsoft/liberica-openjdk-alpine:21

# Alternative: Liberica with Debian for broader compatibility
FROM bellsoft/liberica-openjdk-debian:21

# For minimal runtime (JRE only)
FROM bellsoft/liberica-openjre-alpine:21

# For ultra-minimal (Alpaquita Linux)
FROM bellsoft/liberica-runtime-container:jre-21-slim-musl
```

**Multi-stage Build Update:**

```dockerfile
# Build stage
FROM bellsoft/liberica-openjdk-alpine:21 AS builder
WORKDIR /app
COPY . .
RUN ./mvnw package -DskipTests

# Runtime stage
FROM bellsoft/liberica-openjre-alpine:21
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
```

**Update Rules:**

| Original Pattern              | Replacement Pattern                    |
| ----------------------------- | -------------------------------------- |
| `FROM openjdk:{ver}*`         | `FROM bellsoft/liberica-openjdk-alpine:{ver}` |
| `FROM eclipse-temurin:{ver}*` | Keep or switch to Liberica             |
| `FROM *:{ver}-jdk*`           | `FROM bellsoft/liberica-openjdk-alpine:{ver}` |
| `FROM *:{ver}-jre*`           | `FROM bellsoft/liberica-openjre-alpine:{ver}` |

### 2. Cloud Foundry manifest.yml Updates

**Before (no version or old version):**

```yaml
applications:
  - name: my-app
    buildpacks:
      - java_buildpack
```

**After (Java 21 with explicit configuration):**

```yaml
applications:
  - name: my-app
    buildpacks:
      - java_buildpack
    env:
      JBP_CONFIG_OPEN_JDK_JRE: '{ jre: { version: 21.+ } }'
```

**Version Format Reference:**

| Java Version | JBP Config Value                    |
| ------------ | ----------------------------------- |
| Java 8       | `{ jre: { version: 1.8.0_+ } }`     |
| Java 11      | `{ jre: { version: 11.+ } }`        |
| Java 17      | `{ jre: { version: 17.+ } }`        |
| Java 21      | `{ jre: { version: 21.+ } }`        |
| Java 25      | `{ jre: { version: 25.+ } }`        |

**With Memory Calculator (recommended for production):**

```yaml
env:
  JBP_CONFIG_OPEN_JDK_JRE: '{ jre: { version: 21.+ }, memory_calculator: { stack_threads: 250 } }'
```

**Switching Distribution (if needed):**

```yaml
env:
  # Use Zulu instead of default Liberica
  JBP_DEFAULT_COMPONENTS: '{ jres: ["JavaBuildpack::Jre::ZuluJRE"] }'
  JBP_CONFIG_ZULU_JRE: '{ jre: { version: 21.+ } }'
```

### 3. Fly.io fly.toml Updates

**Before (no Java version):**

```toml
[build]
builder = "paketobuildpacks/builder:base"
```

**After (Java 21 with Paketo):**

```toml
[build]
builder = "paketobuildpacks/builder:base"
buildpacks = ["gcr.io/paketo-buildpacks/java"]

[build.args]
BP_JVM_VERSION = "21"
BP_JVM_TYPE = "JRE"
```

**With BellSoft Liberica explicitly:**

```toml
[build]
builder = "paketobuildpacks/builder:base"
buildpacks = ["gcr.io/paketo-buildpacks/bellsoft-liberica", "gcr.io/paketo-buildpacks/java"]

[build.args]
BP_JVM_VERSION = "21"
BP_JVM_TYPE = "JRE"
BP_JVM_JLINK_ENABLED = "true"  # Optional: Create minimal JRE
```

### 4. Paketo project.toml Updates

**Before:**

```toml
[build]
[[build.env]]
name = "BP_JVM_VERSION"
value = "17"
```

**After:**

```toml
[build]
[[build.env]]
name = "BP_JVM_VERSION"
value = "21"

[[build.env]]
name = "BP_JVM_TYPE"
value = "JRE"

# Optional: Enable JLink for minimal runtime
[[build.env]]
name = "BP_JVM_JLINK_ENABLED"
value = "true"
```

### 5. Kubernetes Manifest Updates

**Before:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  template:
    spec:
      containers:
        - name: app
          image: eclipse-temurin:17-jre
```

**After:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  template:
    spec:
      containers:
        - name: app
          image: bellsoft/liberica-openjre-alpine:21
```

**For Helm charts (values.yaml):**

```yaml
# Before
image:
  repository: eclipse-temurin
  tag: "17-jre"

# After
image:
  repository: bellsoft/liberica-openjre-alpine
  tag: "21"
```

### 6. Heroku system.properties Updates

**Before:**

```properties
java.runtime.version=17
```

**After:**

```properties
java.runtime.version=21
```

## Update Workflow

### Step 1: Detect Current Configuration

Use `deployment-java-detector` skill to find all deployment files and their current Java versions.

### Step 2: Determine Target Version

Based on build configuration:

| Build Config Java | Recommended Deployment Java |
| ----------------- | --------------------------- |
| 8                 | 8 (legacy)                  |
| 11                | 11 or 17                    |
| 17                | 17 or 21                    |
| 21                | 21                          |
| 25                | 25                          |

### Step 3: Apply Updates

For each detected file, apply the appropriate update pattern.

**Priority Order:**

1. Update Dockerfile first (base for other deployments)
2. Update CI/CD (GitHub Actions via `github-actions-updater`)
3. Update deployment manifests (K8s, CF, Fly.io)
4. Update buildpack configs

### Step 4: Verify Updates

After updating, verify:

- Dockerfiles build successfully
- Application starts with new Java version
- Tests pass

## Update Output Format

```json
{
  "updatesApplied": [
    {
      "file": "Dockerfile",
      "platform": "docker",
      "before": {
        "image": "eclipse-temurin:17-jdk",
        "javaVersion": "17",
        "distribution": "eclipse-temurin"
      },
      "after": {
        "image": "bellsoft/liberica-openjdk-alpine:21",
        "javaVersion": "21",
        "distribution": "bellsoft-liberica"
      },
      "line": 1
    },
    {
      "file": "manifest.yml",
      "platform": "cloud-foundry",
      "before": {
        "envVar": "JBP_CONFIG_OPEN_JDK_JRE",
        "value": "{ jre: { version: 17.+ } }"
      },
      "after": {
        "envVar": "JBP_CONFIG_OPEN_JDK_JRE",
        "value": "{ jre: { version: 21.+ } }"
      },
      "line": 12,
      "action": "updated"
    },
    {
      "file": "fly.toml",
      "platform": "fly.io",
      "before": {
        "BP_JVM_VERSION": null
      },
      "after": {
        "BP_JVM_VERSION": "21"
      },
      "action": "added"
    }
  ],
  "summary": {
    "filesUpdated": 3,
    "targetVersion": "21",
    "targetDistribution": "bellsoft-liberica",
    "manualReviewNeeded": [
      "k8s/deployment.yaml - uses custom app image, verify base image"
    ]
  }
}
```

## Common Update Scenarios

### Scenario 1: Spring Boot 4 Migration

When migrating to Spring Boot 4, update all deployment files to Java 21+:

```text
Build file: Java 21
Dockerfile: bellsoft/liberica-openjdk-alpine:21
Cloud Foundry: JBP_CONFIG_OPEN_JDK_JRE: '{ jre: { version: 21.+ } }'
Fly.io: BP_JVM_VERSION = "21"
GitHub Actions: java-version: '21'
```

### Scenario 2: Adding Java Version to Missing Configs

If Cloud Foundry manifest has no Java version:

```yaml
# Add to env section
env:
  JBP_CONFIG_OPEN_JDK_JRE: '{ jre: { version: 21.+ } }'
```

### Scenario 3: Distribution Migration to Liberica

Migrate from deprecated/other distributions:

```dockerfile
# Before: deprecated openjdk
FROM openjdk:17-slim

# After: modern Liberica
FROM bellsoft/liberica-openjdk-alpine:21
```

### Scenario 4: Optimizing Container Size

Switch to minimal runtime images:

```dockerfile
# Before: full JDK
FROM bellsoft/liberica-openjdk-alpine:21

# After: JRE only (smaller)
FROM bellsoft/liberica-openjre-alpine:21

# After: ultra-minimal (Alpaquita Linux, ~3MB base)
FROM bellsoft/liberica-runtime-container:jre-21-slim-musl
```

## Image Size Reference

| Image                                        | Approximate Size |
| -------------------------------------------- | ---------------- |
| `openjdk:21` (deprecated)                    | ~470 MB          |
| `eclipse-temurin:21-jdk`                     | ~390 MB          |
| `eclipse-temurin:21-jre`                     | ~270 MB          |
| `bellsoft/liberica-openjdk-alpine:21`        | ~200 MB          |
| `bellsoft/liberica-openjre-alpine:21`        | ~100 MB          |
| `bellsoft/liberica-runtime-container:jre-21-slim-musl` | ~50 MB    |

## Integration with Migration Workflow

This skill integrates with the migration pipeline:

1. **Discovery Agent** → Detects build file Java version
2. **deployment-java-detector** → Finds deployment configs
3. **github-actions-detector** → Finds CI Java version
4. **Migration Agent** → Updates build files
5. **deployment-java-updater** → Updates deployment files
6. **github-actions-updater** → Updates CI files
7. **Validation Agent** → Builds and tests

## Troubleshooting

### Cloud Foundry: Version Not Taking Effect

After updating `manifest.yml`, restage the application:

```bash
cf restage my-app
```

### Dockerfile: Build Fails After Update

Check for architecture compatibility:

```dockerfile
# If arm64 issues, specify platform
FROM --platform=linux/amd64 bellsoft/liberica-openjdk-alpine:21
```

### Paketo: Wrong Java Version Used

Ensure `BP_JVM_VERSION` is set at build time, not runtime:

```bash
pack build myapp --env BP_JVM_VERSION=21
```

### Kubernetes: Image Pull Error

Verify the image exists and is accessible:

```bash
docker pull bellsoft/liberica-openjre-alpine:21
```
