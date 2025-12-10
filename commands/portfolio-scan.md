---
description: Scan a portfolio of Spring projects for migration status
argument-hint: [portfolio-path]
allowed-tools: Read, Glob, Grep, Bash
---

# Portfolio Scan

Scan all Spring projects in `$ARGUMENTS` to assess migration status.

## Scan Process

1. **Find projects** - Locate all directories with `pom.xml` or `build.gradle*`
2. **Analyze each** - Detect versions and dependencies
3. **Categorize** - Group by migration status
4. **Report** - Generate portfolio summary

## Project Detection

Find all Spring projects:

```bash
# Maven projects
find . -name "pom.xml" -not -path "*/target/*"

# Gradle projects
find . -name "build.gradle*" -not -path "*/.gradle/*" -not -path "*/build/*"
```

## Analysis Per Project

For each project, determine:

- Build tool (Maven/Gradle)
- Spring Boot version
- Migration status (current, needs-upgrade, unknown)
- Dependencies requiring migration

## Output Format

```text
Portfolio Migration Status
==========================

Total Projects: 10

Already on Spring Boot 4.x: 3
  - project-a
  - project-b
  - project-c

Needs Migration (3.x → 4.x): 5
  - project-d (Spring Boot 3.5.7)
  - project-e (Spring Boot 3.3.2)
  - project-f (Spring Boot 3.5.7)
  - project-g (Spring Boot 3.4.1)
  - project-h (Spring Boot 3.5.0)

Older Versions (< 3.x): 2
  - legacy-app-1 (Spring Boot 2.7.x)
  - legacy-app-2 (Spring Boot 2.5.x)

Recommended Migration Order:
1. project-d (no dependencies)
2. project-e (depends on project-d)
3. project-f (standalone)
...
```

## Dependency Analysis

Identify inter-project dependencies to determine migration order:

- Libraries should be migrated before applications
- Shared modules before dependent modules
