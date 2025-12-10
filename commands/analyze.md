---
description: Analyze a Spring project for migration requirements
argument-hint: [project-path]
allowed-tools: Read, Glob, Grep, Bash
---

# Analyze Spring Project

Analyze the project at `$ARGUMENTS` (or current directory if not specified) to determine migration requirements.

## Tasks

1. **Detect build tool** - Maven or Gradle (Groovy/Kotlin DSL)
2. **Detect versions** - Spring Boot, Spring Cloud, Java, Jackson, etc.
3. **Scan dependencies** - Identify migration-relevant dependencies
4. **Find patterns** - Locate code requiring migration

## Analysis Steps

First, detect the build tool:

- Check for `build.gradle.kts` (Gradle Kotlin)
- Check for `build.gradle` (Gradle Groovy)
- Check for `pom.xml` (Maven)

Then extract versions from the appropriate build file.

Finally, scan for code patterns:

- Jackson imports (`com.fasterxml.jackson.*`)
- Security configurations (`VaadinWebSecurity`, `AntPathRequestMatcher`)
- Vaadin themes (`Material.class`)
- Spring AI TTS (`SpeechModel`, `SpeechPrompt`)

## Output

Provide a comprehensive analysis report with:

- Current versions detected
- Target versions for migration
- Dependencies requiring attention
- Code patterns found
- Recommended migration steps
