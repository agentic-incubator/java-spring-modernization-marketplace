# H. Build Tooling & Infrastructure

> ← [Back to Use Cases home](README.md)

These touch the plumbing — Maven/Gradle wrappers, deployment manifests, formatter
configs. Useful when the framework code is already migrated but the build
infrastructure needs to catch up.

---

<details id="h1">
<summary><strong>H1.</strong> Bump my Maven or Gradle wrapper to the latest compatible version</summary>

**What's happening.** A new JDK ships, or a new Spring Boot version, and your old
Maven 3.8.x or Gradle 7.x wrapper isn't compatible. The skill resolves the latest
wrapper version that satisfies your project's Java version requirement (live lookup —
never hardcoded) and bumps it.

**Easiest thing to say:**

> "Upgrade the Maven wrapper to a newer version."

**Other ways you might phrase it:**

> "Bump my Gradle wrapper."
>
> "Update my build tool to the latest compatible version."
>
> "Maven wrapper is too old for Java 25 — fix it."

**What gets used under the hood:**

- Skill:
  [`build-tool-upgrader`](../../skills/build-tool-upgrader/SKILL.md)
- Detector:
  [`build-tool-detector`](../../skills/build-tool-detector/SKILL.md)

**What you get.** `mvnw` / `gradlew` wrapper files updated to the latest stable
version that works with your Java version. For Gradle, `gradle/wrapper/gradle-wrapper.properties`
gets the new distribution URL; for Maven, `.mvn/wrapper/maven-wrapper.properties` is
updated.

**Why "live lookup" matters.** The skill never hardcodes a target version. It fetches
the current latest from the official source at runtime, so you always get the actual
latest — no stale catalog.

**What if something goes wrong?**

- _"My CI uses a specific Maven version cached at a fixed path."_ Update your CI
  Maven cache key after the wrapper bump, otherwise CI keeps using the old version
  from cache.
- _"`./mvnw` immediately fails after upgrade with `error: Source option 17 is not
supported in this JDK`."_ Your wrapper is now newer than your local Java install.
  Either downgrade the wrapper or install a newer JDK.
- _"Gradle wrapper download fails behind corporate proxy."_ The wrapper download
  needs internet access to `services.gradle.org`. If your environment requires a
  proxy, set `gradle.org.gradle.daemon=true` and proxy env vars before running.

</details>

---

<details id="h2">
<summary><strong>H2.</strong> Migrate my Gradle scripts to Gradle 9.x syntax</summary>

**What's happening.** Gradle 9 changed a few syntax expectations: `compile`/`runtime`
configurations are fully removed (you must use `implementation`/`runtimeOnly`),
`useJUnitPlatform()` placement matters more, and `dependencyUpdates` requires the
`--no-parallel` flag. This skill rewrites your build scripts to the new style.

**Easiest thing to say:**

> "Update my Gradle build files to Gradle 9 syntax."

**Other ways you might phrase it:**

> "Migrate to Gradle 9 syntax."
>
> "Replace `compile` with `implementation` everywhere."
>
> "Fix my Gradle build for Gradle 9."

**What gets used under the hood:**

- Skill:
  [`gradle-9-syntax-migrator`](../../skills/gradle-9-syntax-migrator/SKILL.md)

**What you get.** Build files (Groovy DSL and Kotlin DSL both) updated with the new
configuration names, `useJUnitPlatform()` placed inside `tasks.named<Test>` blocks,
and any other Gradle 9 syntax updates applied.

**What if something goes wrong?**

- _"My custom plugin uses `compile`."_ Either upgrade the plugin to a Gradle 9
  compatible version, or pin Gradle to 8.x via `build-tool-upgrader`'s
  `--target-version=8.x` flag — but this is a workaround; eventually you have to
  upgrade.
- _"My multi-project build broke."_ The skill applies the same syntax updates to all
  subproject build files it can find. If one subproject is on a non-standard path
  (e.g., included from a different repo), you'll need to update it manually.

</details>

---

<details id="h3">
<summary><strong>H3.</strong> Update Java version in my Dockerfile / K8s / Fly.io / buildpack configs</summary>

**What's happening.** Your `pom.xml` says Java 25, but your `Dockerfile` is still
`FROM eclipse-temurin:21-jdk`. Deployment matches Java 21, runtime fails. This skill
syncs deployment manifests to the build file.

**Easiest thing to say:**

> "Update my Dockerfile and Kubernetes manifests to use Java 25."

**Other ways you might phrase it:**

> "Sync my deployment files to my pom's Java version."
>
> "Fix the Java version in my buildpack config."
>
> "Update Java in my Cloud Foundry manifest."

**What gets used under the hood:**

- Detector:
  [`deployment-java-detector`](../../skills/deployment-java-detector/SKILL.md)
- Updater:
  [`deployment-java-updater`](../../skills/deployment-java-updater/SKILL.md)

**What you get.** `Dockerfile`, Kubernetes pod specs (`spec.containers[].image`),
Fly.io `fly.toml`, Cloud Foundry `manifest.yml`, buildpack configs, and any
`JAVA_VERSION` env vars updated to match the build file's Java version. Default
distribution is **Liberica** unless the file already pins something else, since
Liberica has the smoothest Spring Boot 4 + JDK 25 support.

**What if something goes wrong?**

- _"It picked Liberica, but I want Temurin."_ Either edit the resulting file
  manually, or pre-set the distribution before running:
  `JAVA_DISTRIBUTION=temurin /spring-m11n:migrate-... (the skills honor this env var).
- _"It missed my `helm/values.yaml`."_ The detector covers the common manifest
  shapes; Helm charts with deeply nested image refs may need a manual edit. Open the
  values file and replace the image tag.
- _"My CI builds the image with a different Java version than the build file."_ Run
  [A5](a-diagnostic.md#a5) to detect the misalignment, then this skill + GitHub
  Actions updater to sync everything.

</details>

---

<details id="h4">
<summary><strong>H4.</strong> Spotless formatter is broken on JDK 25 — fix it</summary>

**What's happening.** Spotless 2.x uses google-java-format or palantir-java-format
under the hood. Both of those reach into a JDK-internal API that was removed in
JDK 25, so `mvn spotless:apply` crashes with `NoSuchMethodError` on
`com.sun.tools.javac.util.Log$DeferredDiagnosticHandler.getDiagnostics()`. The fix is
to switch the Spotless formatter to Eclipse JDT, which doesn't touch that API.

**Easiest thing to say:**

> "Fix Spotless for JDK 25."

**Other ways you might phrase it:**

> "Switch Spotless to Eclipse JDT formatter."
>
> "`spotless:apply` crashes — fix it."
>
> "Migrate from google-java-format to Eclipse JDT."

**What gets used under the hood:**

- Skill:
  [`spotless-formatter-migrator`](../../skills/spotless-formatter-migrator/SKILL.md)

**What you get.** Your `pom.xml` / `build.gradle*` Spotless config switched from
google-java-format (or palantir-java-format) to Eclipse JDT, with sensible default
settings. Formatting runs without crashing.

**What if something goes wrong?**

- _"Eclipse JDT formats my code differently — I see massive diffs."_ Yes — JDT and
  google-java-format have different style preferences. You can either commit one
  "format pass" as a one-shot commit (so blame stays useful), or configure Eclipse
  JDT with a custom XML preferences file to mimic google-java-format style more
  closely. The skill includes a template settings file you can drop in.
- _"My CI still uses the old Spotless config."_ The migrator only updates the build
  file. If your CI has a cached Spotless plugin jar, clear the cache.
- _"I want to stay on google-java-format and downgrade Java instead."_ The skill is
  designed for the "stay on JDK 25" path. If you want JDK 21 with
  google-java-format, just don't run the skill — pin your JDK and ignore the JDK 25
  crash.

</details>
