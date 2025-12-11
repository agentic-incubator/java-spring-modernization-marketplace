---
name: deployment-java-detector
description: Detects Java versions and distributions in deployment manifests including Dockerfile, Kubernetes, Cloud Foundry, Fly.io, and buildpack configurations. Use when analyzing deployment files for Java version alignment.
allowed-tools: Read, Glob, Grep, Bash
---

# Deployment Java Detector

Detects Java versions and distributions across various deployment platforms and container configurations.

## Supported Platforms

| Platform      | Files                                      | Version Location                  |
| ------------- | ------------------------------------------ | --------------------------------- |
| Docker        | `Dockerfile`, `Dockerfile.*`               | `FROM` image tags                 |
| Kubernetes    | `*.yaml`, `*.yml` in `k8s/`, `kubernetes/` | Container image specs             |
| Cloud Foundry | `manifest.yml`, `manifest.yaml`            | `JBP_CONFIG_OPEN_JDK_JRE` env var |
| Fly.io        | `fly.toml`                                 | `BP_JVM_VERSION` in build.args    |
| Paketo/CNB    | `project.toml`, `pack` config              | `BP_JVM_VERSION` env var          |
| Heroku        | `system.properties`                        | `java.runtime.version` property   |

## Detection Patterns

### 1. Dockerfile Java Detection

**Search Locations:**

```bash
# Find Dockerfiles
Glob: **/Dockerfile*
```

**Java Image Patterns:**

```dockerfile
# Eclipse Temurin (formerly AdoptOpenJDK)
FROM eclipse-temurin:21-jdk
FROM eclipse-temurin:17-jre-alpine
FROM eclipse-temurin:21.0.2_13-jdk-jammy

# BellSoft Liberica (preferred)
FROM bellsoft/liberica-openjdk-alpine:21
FROM bellsoft/liberica-openjdk-debian:17
FROM bellsoft/liberica-runtime-container:jdk-21-slim-musl

# Azul Zulu
FROM azul/zulu-openjdk:21
FROM azul/zulu-openjdk-alpine:17

# Amazon Corretto
FROM amazoncorretto:21
FROM amazoncorretto:17-alpine

# Official OpenJDK (deprecated)
FROM openjdk:21-slim

# GraalVM
FROM ghcr.io/graalvm/jdk:21
FROM ghcr.io/graalvm/native-image:21
```

**Regex Patterns:**

```regex
# Match FROM with Java image
FROM\s+(eclipse-temurin|bellsoft/liberica|azul/zulu|amazoncorretto|openjdk|ghcr.io/graalvm)[:/](\d+)

# Extract version from tag
:(\d+)[-.]?(\d+)?[-.]?(\d+)?

# Multi-stage build patterns
FROM\s+\S+\s+AS\s+(builder|build|compile)
```

### 2. Kubernetes Java Detection

**Search Locations:**

```bash
# Find K8s manifests
Glob: **/k8s/**/*.yaml
Glob: **/kubernetes/**/*.yaml
Glob: **/deploy/**/*.yaml
Glob: **/helm/**/*.yaml
```

**Container Image Patterns:**

```yaml
# Deployment spec
spec:
  containers:
    - name: app
      image: myapp:1.0  # May contain Java version in custom images
      image: eclipse-temurin:21-jre  # Direct Java image

# ConfigMap with Java version
data:
  JAVA_VERSION: "21"

# Init container for Java setup
initContainers:
  - name: java-setup
    image: eclipse-temurin:21-jdk
```

**Detection Strategy:**

1. Find image references containing Java distribution names
2. Check ConfigMaps/Secrets for `JAVA_VERSION` or similar keys
3. Parse Helm values for Java version variables

### 3. Cloud Foundry Java Detection

**Search Locations:**

```bash
Glob: **/manifest.yml
Glob: **/manifest.yaml
Glob: **/manifest-*.yml
```

**Environment Variable Patterns:**

```yaml
# manifest.yml
applications:
  - name: my-app
    buildpacks:
      - java_buildpack
    env:
      # JRE version configuration
      JBP_CONFIG_OPEN_JDK_JRE: '{ jre: { version: 21.+ } }'

      # Alternative: JDK configuration
      JBP_CONFIG_OPEN_JDK_JDK: '{ jdk: { version: 21.+ } }'

      # Memory calculator settings (indicates Java version indirectly)
      JBP_CONFIG_OPEN_JDK_JRE: '{ jre: { version: 17.+ }, memory_calculator: { stack_threads: 25 } }'
```

**Version Extraction Regex:**

```regex
# Extract version from JBP_CONFIG
version:\s*(\d+)\.\+
version:\s*(\d+\.\d+)\.\+
version:\s*1\.(\d+)\.0_\+   # For Java 8 format (1.8.0_+)
```

**Default JVM Detection:**

```yaml
# Check for JVM type override
JBP_DEFAULT_COMPONENTS: '{ jres: ["JavaBuildpack::Jre::ZuluJRE"] }'
```

### 4. Fly.io Java Detection

**Search Location:**

```bash
Glob: **/fly.toml
```

**Configuration Patterns:**

```toml
# fly.toml with Paketo buildpacks
[build]
builder = "paketobuildpacks/builder:base"
buildpacks = ["gcr.io/paketo-buildpacks/java"]

[build.args]
BP_JVM_VERSION = "21"
BP_JVM_TYPE = "JRE"
BP_MAVEN_BUILD_ARGUMENTS = "-Dmaven.test.skip=true package"
```

**Version Extraction:**

```regex
BP_JVM_VERSION\s*=\s*["']?(\d+)["']?
```

### 5. Paketo/CNB Java Detection

**Search Locations:**

```bash
Glob: **/project.toml
Glob: **/.pack/config.toml
```

**Configuration Patterns:**

```toml
# project.toml
[build]
[[build.env]]
name = "BP_JVM_VERSION"
value = "21"

[[build.env]]
name = "BP_JVM_TYPE"
value = "JRE"

[[build.buildpacks]]
uri = "gcr.io/paketo-buildpacks/java"
```

**Pack CLI Detection:**

```bash
# Check pack build commands in CI files
grep -r "BP_JVM_VERSION" .github/workflows/
grep -r "pack build.*--env" .
```

### 6. Heroku Java Detection

**Search Location:**

```bash
Glob: **/system.properties
```

**Configuration Pattern:**

```properties
# system.properties
java.runtime.version=21
```

## Java Distribution Identification

### Distribution Priority (Prefer Liberica)

When no distribution is specified, recommend **BellSoft Liberica** as the preferred distribution:

| Distribution      | Docker Hub                    | Notes                                    |
| ----------------- | ----------------------------- | ---------------------------------------- |
| BellSoft Liberica | `bellsoft/liberica-openjdk-*` | **Preferred** - TCK certified, optimized |
| Eclipse Temurin   | `eclipse-temurin`             | Former AdoptOpenJDK, widely used         |
| Azul Zulu         | `azul/zulu-openjdk`           | Enterprise support available             |
| Amazon Corretto   | `amazoncorretto`              | AWS optimized                            |
| GraalVM           | `ghcr.io/graalvm/*`           | Native image support                     |

### Liberica Image Tags

```text
bellsoft/liberica-openjdk-alpine:{version}
bellsoft/liberica-openjdk-debian:{version}
bellsoft/liberica-openjdk-rocky:{version}
bellsoft/liberica-openjre-alpine:{version}
bellsoft/liberica-runtime-container:jdk-{version}-slim-musl  # Alpaquita Linux
```

**Tag Structure:** `{major-version}[update/patch[-build]][-arch]`

- `21` - Latest Java 21
- `21.0.2` - Specific patch version
- `21-slim-musl` - Slim variant with musl libc

## Detection Output Format

```json
{
  "deploymentFiles": [
    {
      "file": "Dockerfile",
      "platform": "docker",
      "javaVersion": "17",
      "distribution": "eclipse-temurin",
      "imageTag": "eclipse-temurin:17-jdk-alpine",
      "line": 1,
      "pattern": "FROM eclipse-temurin:17-jdk-alpine"
    },
    {
      "file": "manifest.yml",
      "platform": "cloud-foundry",
      "javaVersion": "17",
      "distribution": "default (liberica)",
      "envVar": "JBP_CONFIG_OPEN_JDK_JRE",
      "value": "{ jre: { version: 17.+ } }",
      "line": 12
    },
    {
      "file": "fly.toml",
      "platform": "fly.io",
      "javaVersion": "21",
      "distribution": "paketo-liberica",
      "envVar": "BP_JVM_VERSION",
      "value": "21",
      "line": 8
    },
    {
      "file": "k8s/deployment.yaml",
      "platform": "kubernetes",
      "javaVersion": "11",
      "distribution": "azul-zulu",
      "imageTag": "azul/zulu-openjdk:11",
      "line": 25,
      "containerName": "app"
    }
  ],
  "summary": {
    "totalFiles": 4,
    "versionsFound": ["11", "17", "21"],
    "distributions": ["eclipse-temurin", "azul-zulu", "paketo-liberica"],
    "versionMismatch": true,
    "recommendation": "Align all deployments to Java 21 with Liberica distribution"
  }
}
```

## Detection Workflow

### Step 1: Find All Deployment Files

```bash
# Dockerfiles
find . -name "Dockerfile*" -type f

# Kubernetes
find . \( -path "*/k8s/*" -o -path "*/kubernetes/*" -o -path "*/deploy/*" \) -name "*.yaml"

# Cloud Foundry
find . -name "manifest*.yml" -o -name "manifest*.yaml"

# Fly.io
find . -name "fly.toml"

# Paketo
find . -name "project.toml"

# Heroku
find . -name "system.properties"
```

### Step 2: Extract Java Versions

For each file type, apply the appropriate regex patterns to extract:

1. Java major version (8, 11, 17, 21, 25)
2. Distribution name
3. Full image tag or configuration value
4. Line number for update reference

### Step 3: Compare with Build Configuration

Cross-reference detected versions with:

- `pom.xml` Java version (`maven.compiler.source/target`, `java.version`)
- `build.gradle` Java toolchain or sourceCompatibility
- GitHub Actions Java version (from `github-actions-detector` skill)

### Step 4: Report Misalignments

Flag any inconsistencies:

- Build file says Java 21, Dockerfile uses Java 17
- Cloud Foundry manifest missing Java version (uses default)
- Different distributions across deployment targets

## Integration with Other Skills

This skill works with:

- **version-detector** - Compare against build file Java version
- **github-actions-detector** - Compare against CI Java version
- **deployment-java-updater** - Apply updates to detected files

## Troubleshooting

### Missing Java Version in Cloud Foundry

If no `JBP_CONFIG_OPEN_JDK_JRE` is set, the buildpack uses its default version:

- Check buildpack version to determine default
- Recent buildpacks default to Java 17 or 21

### Multi-stage Dockerfile Detection

For multi-stage builds, detect Java in all stages:

```dockerfile
FROM eclipse-temurin:21-jdk AS builder  # Build stage
FROM eclipse-temurin:21-jre AS runtime  # Runtime stage
```

Both stages should use the same Java major version.

### Kubernetes Image References

Images may use:

- Direct Java images: `eclipse-temurin:21-jre`
- Custom app images: `myorg/myapp:v1.2.3` (version may be in image)
- Helm templating: `{{ .Values.image.tag }}`

For custom/templated images, note that Java version may not be directly detectable.
