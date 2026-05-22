---
name: spotless-formatter-migrator
description: >
  Migrate Spotless Java formatter from google-java-format or palantir-java-format to
  Eclipse JDT when targeting JDK 25+. Both google-java-format and palantir-java-format
  use an internal JDK API removed in JDK 25, causing NoSuchMethodError at format-time.
  Use when upgrading to JDK 25 or when spotless:apply fails with NoSuchMethodError on
  com.sun.tools.javac.util.Log$DeferredDiagnosticHandler.getDiagnostics().
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Spotless Java Formatter Migration

Migrate from `google-java-format` / `palantir-java-format` to Eclipse JDT formatter
for JDK 25 compatibility.

## Problem

`google-java-format` 1.x–1.24.x (and `palantir-java-format`, which wraps it) uses:

```text
com.sun.tools.javac.util.Log$DeferredDiagnosticHandler.getDiagnostics()
```

This internal JDK API was **removed in JDK 25 (LTS)**. The failure manifests as a
`NoSuchMethodError` at format-time, not compile-time — it goes undetected until the
first `spotless:apply` run on JDK 25.

## Detection

All three conditions must be present for this migration to apply:

```bash
# 1. Check for google/palantir format config in pom.xml
grep -E '<googleJavaFormat>|<palantirJavaFormat>' pom.xml

# 2. Check Java version targeting JDK 25
grep -E '<java\.version>25|java-version: 25' pom.xml .github/workflows/*.yml

# 3. Check spotless-maven-plugin version
grep -A2 'spotless-maven-plugin' pom.xml | grep '<version>'
# Version < 3.5.1 needs upgrading
```

## Migration Steps

### Step 1 — Upgrade spotless-maven-plugin

Update to latest stable (3.5.1+):

```xml
<!-- Before -->
<plugin>
    <groupId>com.diffplug.spotless</groupId>
    <artifactId>spotless-maven-plugin</artifactId>
    <version>2.43.0</version>  <!-- or any version < 3.5.1 -->
    ...
</plugin>

<!-- After -->
<plugin>
    <groupId>com.diffplug.spotless</groupId>
    <artifactId>spotless-maven-plugin</artifactId>
    <version>3.5.1</version>
    ...
</plugin>
```

### Step 2 — Replace formatter configuration

Replace the `<googleJavaFormat>` or `<palantirJavaFormat>` block with Eclipse JDT.
Preserve any existing `<excludes>` and `<removeUnusedImports/>` entries.

**google-java-format → Eclipse JDT:**

```xml
<!-- Before -->
<java>
    <googleJavaFormat>
        <version>1.24.0</version>
        <style>GOOGLE</style>
    </googleJavaFormat>
    <removeUnusedImports/>
    <excludes>
        <exclude>**/generated/**</exclude>
    </excludes>
</java>

<!-- After -->
<java>
    <eclipse>
        <version>4.33</version>
    </eclipse>
    <removeUnusedImports/>
    <excludes>
        <exclude>**/generated/**</exclude>
    </excludes>
</java>
```

**palantir-java-format → Eclipse JDT:**

```xml
<!-- Before -->
<java>
    <palantirJavaFormat>
        <version>2.50.0</version>
    </palantirJavaFormat>
    <removeUnusedImports/>
</java>

<!-- After -->
<java>
    <eclipse>
        <version>4.33</version>
    </eclipse>
    <removeUnusedImports/>
</java>
```

### Step 3 — Remove workaround exclusions

If per-file exclusions were added as workarounds for format failures, remove them:

```xml
<!-- Remove these kinds of workaround exclusions -->
<exclude>**/ReactiveFeign.java</exclude>
<exclude>**/SomeProblematicFile.java</exclude>
```

Keep only intentional exclusions (generated sources, third-party code).

### Step 4 — Reformat and commit separately

Run Spotless to reformat the entire codebase, then commit the diff as its own commit
separate from functional changes:

```bash
./mvnw spotless:apply
git add -p
git commit -m "style: reformat with Eclipse JDT 4.33 (spotless-formatter-migrator)

Replace google-java-format with Eclipse JDT for JDK 25 compatibility.
google-java-format uses com.sun.tools.javac internal API removed in JDK 25.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

Committing reformatting separately from functional changes keeps PR review tractable.

## Verification

```bash
# Confirm no google/palantir format config remains
grep -E '<googleJavaFormat>|<palantirJavaFormat>' pom.xml
# Should return nothing

# Run spotless check (not apply) to verify clean state
./mvnw spotless:check
```

## Tradeoff: Style Differences

Eclipse JDT uses **tab-based indentation** by default and produces different whitespace
than Google style. If the codebase has strict style requirements, provide an `.editorconfig`
or Eclipse XML formatter config:

```xml
<eclipse>
    <version>4.33</version>
    <configFiles>
        <configFile>eclipse-java-formatter.xml</configFile>
    </configFiles>
</eclipse>
```

Document the style change in the PR description so reviewers understand the large diff
is purely cosmetic.

## Related Skills

- `java-maintenance-workflow` — covers the full dependency + quality gate workflow,
  including `spotless:apply` as the first quality gate step
- `build-runner` — build/test execution and error pattern reference

## Notes

- This issue affects both `google-java-format` AND `palantir-java-format` because
  palantir wraps google-java-format internally.
- The error is a runtime `NoSuchMethodError`, not a compile error — it only surfaces
  when `spotless:apply` or `spotless:check` actually runs.
- Eclipse JDT formatter has no dependency on internal JDK APIs and works with all
  supported JDK versions.
