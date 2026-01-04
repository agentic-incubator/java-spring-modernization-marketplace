# Multi-Module Dependency Analyzer Skill

**Skill ID:** `multi-module-dependency-analyzer`
**Version:** 1.0.0
**Category:** Analysis
**Priority:** MEDIUM

---

## Purpose

Build dependency graph for multi-module Maven/Gradle projects to determine optimal build order and identify blocking modules.

---

## Problem Statement

Multi-module projects have inter-module dependencies that affect:

- Build order (parent → children → dependents)
- Parallel build strategy
- Error propagation (one module failure blocks all dependents)

**Example:** spring-ai-resos has 6 modules where mcp-server failure blocks mcp-client and backend builds.

---

## Detection

### Maven Multi-Module

**Parent pom.xml:**

```xml
<modules>
    <module>client</module>
    <module>codegen</module>
    <module>entities</module>
    <module>mcp-server</module>
    <module>mcp-client</module>
    <module>backend</module>
</modules>
```

**Module pom.xml (entities/pom.xml):**

```xml
<dependencies>
    <dependency>
        <groupId>com.example</groupId>
        <artifactId>client</artifactId>  <!-- Inter-module dependency -->
    </dependency>
</dependencies>
```

### Gradle Multi-Module

**settings.gradle:**

```gradle
include 'client', 'codegen', 'entities', 'mcp-server', 'mcp-client', 'backend'
```

**Module build.gradle (entities/build.gradle):**

```gradle
dependencies {
    implementation project(':client')  // Inter-module dependency
}
```

---

## Graph Building Algorithm

```text
1. DETECT multi-module project
   - Maven: Look for <modules> in parent pom.xml
   - Gradle: Look for include() in settings.gradle

2. EXTRACT module list
   - Parse module names from parent/settings

3. FOR EACH module:
   a. Read module build file (pom.xml or build.gradle)
   b. Extract dependencies
   c. Identify inter-module dependencies:
      - Maven: <groupId> matches parent groupId
      - Gradle: project(':module-name') syntax
   d. Build dependency edges

4. CONSTRUCT Directed Acyclic Graph (DAG)
   - Nodes: Modules
   - Edges: Dependencies (A → B means "A depends on B")

5. TOPOLOGICAL SORT
   - Order modules by dependencies
   - Modules with no dependencies first
   - Dependent modules after their dependencies

6. IDENTIFY blocking modules
   - Modules that many others depend on
   - Failures here block downstream builds

7. DETERMINE parallelization opportunities
   - Modules with same dependency level can build in parallel
   - Level 0: No dependencies
   - Level 1: Depends only on Level 0
   - Level N: Depends on Level N-1

8. GENERATE build order recommendation
```

---

## Example Analysis

### Module Structure

```text
spring-ai-resos-parent
├── client (generates OpenAPI code)
├── codegen (JavaParser utilities)
├── entities (depends on client)
├── mcp-server (depends on entities)
├── mcp-client (depends on entities)
└── backend (depends on entities)
```

### Dependency Graph

```text
client ───────┐
              ▼
codegen      entities ───┬───> mcp-server
                         ├───> mcp-client
                         └───> backend
```

### Build Order (Topological Sort)

```text
Level 0: [client, codegen]      # No dependencies, build in parallel
Level 1: [entities]              # Depends on client
Level 2: [mcp-server, mcp-client, backend]  # Depend on entities, build in parallel
```

---

## Output Format

```yaml
multiModuleAnalysis:
  detected: true
  moduleCount: 6
  parentModule: 'spring-ai-resos-parent'
  buildTool: 'maven'

  modules:
    - name: 'client'
      path: 'client'
      dependencies: []
      dependents: ['entities']
      level: 0
      blocking: true # Blocks entities

    - name: 'codegen'
      path: 'codegen'
      dependencies: []
      dependents: []
      level: 0
      blocking: false

    - name: 'entities'
      path: 'entities'
      dependencies: ['client']
      dependents: ['mcp-server', 'mcp-client', 'backend']
      level: 1
      blocking: true # Blocks 3 modules

    - name: 'mcp-server'
      path: 'mcp-server'
      dependencies: ['entities']
      dependents: []
      level: 2
      blocking: false

    - name: 'mcp-client'
      path: 'mcp-client'
      dependencies: ['entities']
      dependents: []
      level: 2
      blocking: false

    - name: 'backend'
      path: 'backend'
      dependencies: ['entities']
      dependents: []
      level: 2
      blocking: false

  dependencyGraph:
    edges:
      - from: 'entities'
        to: 'client'
      - from: 'mcp-server'
        to: 'entities'
      - from: 'mcp-client'
        to: 'entities'
      - from: 'backend'
        to: 'entities'

  buildOrder:
    sequential: ['client', 'codegen', 'entities', 'mcp-server', 'mcp-client', 'backend']
    optimized:
      - level: 0
        modules: ['client', 'codegen']
        parallelizable: true
      - level: 1
        modules: ['entities']
        parallelizable: false
      - level: 2
        modules: ['mcp-server', 'mcp-client', 'backend']
        parallelizable: true

  blockingModules:
    - module: 'client'
      blocks: ['entities']
      impactLevel: 'MEDIUM'
    - module: 'entities'
      blocks: ['mcp-server', 'mcp-client', 'backend']
      impactLevel: 'HIGH'

  recommendations:
    - 'Build client and codegen in parallel (Level 0)'
    - 'entities is critical path - failures block 3 modules'
    - 'Build mcp-server, mcp-client, backend in parallel after entities'
    - 'Total sequential time: 3 levels'
    - 'Total parallel time: 3 levels (optimized)'
```

---

## Validation Strategy

**Bottom-Up Validation:**

```bash
# Build modules in dependency order
# Validate each level before proceeding

# Level 0 (parallel)
mvn clean install -pl client,codegen

# Level 1 (after Level 0 succeeds)
mvn clean install -pl entities

# Level 2 (parallel, after Level 1 succeeds)
mvn clean install -pl mcp-server,mcp-client,backend
```

---

## Integration Points

**Used by:** discovery-agent, validation-agent
**Triggers:** When multi-module project detected

---

## References

- **Maven Multi-Module:** <https://maven.apache.org/guides/mini/guide-multiple-modules.html>
- **Gradle Multi-Project:** <https://docs.gradle.org/current/userguide/multi_project_builds.html>

---

## Version History

- **1.0.0** (2026-01-04): Initial implementation with DAG construction and topological sorting
