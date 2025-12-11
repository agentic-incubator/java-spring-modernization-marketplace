---
name: recipe-discovery
description: Discover and analyze OpenRewrite recipes dynamically from online documentation. Use when searching for recipes by version, walking composite recipe trees, or finding the latest migration recipes for detected dependencies.
allowed-tools: Read, WebFetch, WebSearch, Glob, Grep
---

# OpenRewrite Recipe Discovery

Dynamically discover OpenRewrite recipes from the official documentation at https://docs.openrewrite.org/recipes. This skill provides version-based recipe matching, composite recipe tree walking, and latest version targeting.

## Core Capabilities

### 1. Version-Based Recipe Discovery

Given detected artifact versions from a project, find the most appropriate upgrade recipes.

**Process:**

1. Parse detected versions from project analysis
2. Consult the recipe catalog (`recipe-catalog.yaml`)
3. Search OpenRewrite docs for latest recipes if not in catalog
4. Match source version to target version upgrade paths

**Example:**

```yaml
# Detected versions
spring-boot: 3.3.5
spring-security: 6.3.2
jackson: 2.17.2
java: 17

# Recipe discovery result
recommended-recipes:
  - recipe: org.openrewrite.java.spring.boot4.UpgradeSpringBoot_4_0
    artifact: org.openrewrite.recipe:rewrite-spring:RELEASE
    upgrades:
      spring-boot: 3.3.5 → 4.0.x
      spring-security: 6.3.2 → 7.0.x (included)
      jackson: 2.17.2 → 3.x (included)
    composite: true

  - recipe: org.openrewrite.java.migrate.UpgradeToJava21
    artifact: org.openrewrite.recipe:rewrite-migrate-java:RELEASE
    upgrades:
      java: 17 → 21
```

### 2. Composite Recipe Tree Walking

Understand what sub-recipes are included in composite recipes by walking the recipe tree.

**Process:**

1. Identify composite recipe from catalog or documentation
2. Recursively enumerate included recipes from `recipeList`
3. Build dependency tree showing execution order
4. Identify coverage and gaps

**Example Tree for Spring Boot 4.0 Upgrade:**

```
org.openrewrite.java.spring.boot4.UpgradeSpringBoot_4_0
├── org.openrewrite.java.spring.boot4.SpringBoot4Properties
│   └── Property file migrations
├── org.openrewrite.java.spring.boot4.UpdateJackson2ToJackson3
│   ├── org.openrewrite.java.jackson.UpgradeJacksonDependencies_2_3
│   ├── org.openrewrite.java.jackson.UpdateJacksonPackageNames_2_3
│   └── org.openrewrite.java.jackson.UpdateJacksonTypes_2_3
├── org.openrewrite.java.spring.security7.UpgradeSpringSecurity_7_0
│   ├── org.openrewrite.java.spring.security7.SecurityConfigurerAdapter
│   └── org.openrewrite.java.spring.security7.RequestMatchersMigration
├── org.openrewrite.java.spring.boot3.UpgradeSpringBoot_3_5
│   └── (incremental boot upgrades)
└── org.openrewrite.java.migrate.UpgradeToJava21
    ├── org.openrewrite.java.migrate.UpgradeBuildToJava21
    └── org.openrewrite.java.migrate.lang.UseTextBlocks
```

### 3. Online Documentation Search

Search OpenRewrite documentation for recipes not in the static catalog.

**Base URLs:**

```yaml
recipes-index: https://docs.openrewrite.org/recipes
java-spring: https://docs.openrewrite.org/recipes/java/spring
java-migrate: https://docs.openrewrite.org/recipes/java/migrate
java-jackson: https://docs.openrewrite.org/recipes/java/jackson
java-testing: https://docs.openrewrite.org/recipes/java/testing
staticanalysis: https://docs.openrewrite.org/recipes/staticanalysis
gradle: https://docs.openrewrite.org/recipes/gradle
maven: https://docs.openrewrite.org/recipes/maven
```

**Search Strategy:**

1. Start at category index (e.g., `/recipes/java/spring/boot4`)
2. Identify composite vs individual recipes
3. Follow links to specific recipe documentation
4. Extract recipe identifier, artifact, and sub-recipes

### 4. Latest Version Targeting

Find recipes for upgrading to the latest available versions.

**Latest Versions (as of 2025-12):**

| Technology     | Latest Version | Recipe                                   |
| -------------- | -------------- | ---------------------------------------- |
| Spring Boot    | 4.0.x          | `UpgradeSpringBoot_4_0`                  |
| Spring Boot    | 3.5.x          | `UpgradeSpringBoot_3_5`                  |
| Spring Security| 7.0.x          | `UpgradeSpringSecurity_7_0`              |
| Spring Cloud   | 2025.x         | `UpgradeSpringCloud_2025`                |
| Jackson        | 3.x            | `UpgradeJackson_2_3`                     |
| Java           | 25             | `UpgradeToJava25`                        |
| Java (LTS)     | 21             | `UpgradeToJava21`                        |
| Hibernate      | 6.6            | `UpgradeHibernate_6_6`                   |

## Recipe Discovery Workflow

### Step 1: Analyze Project Dependencies

Read build files to extract current versions:

```bash
# Maven
grep -E "<version>|<parent>" pom.xml

# Gradle
grep -E "springBootVersion|implementation|api" build.gradle
```

### Step 2: Consult Recipe Catalog

Check `recipe-catalog.yaml` for known upgrade paths:

```yaml
spring-boot:
  versions:
    "4.0":
      recipe: org.openrewrite.java.spring.boot4.UpgradeSpringBoot_4_0
      from_version: "3.x"
      target_version: "4.0.x"
      composite: true
      includes:
        - org.openrewrite.java.spring.security7.UpgradeSpringSecurity_7_0
        - org.openrewrite.java.jackson.UpgradeJackson_2_3
```

### Step 3: Search Online Documentation

For dependencies not in catalog, search OpenRewrite docs:

```
WebSearch: "openrewrite recipe [dependency-name] upgrade [version]"
WebFetch: https://docs.openrewrite.org/recipes/java/[category]
```

### Step 4: Walk Composite Recipe Tree

For composite recipes, enumerate all included sub-recipes:

```
1. Fetch recipe documentation page
2. Find "Composite Recipes" or "recipeList" section
3. Recursively process each included recipe
4. Build execution order tree
```

### Step 5: Generate Recommendations

Output structured recommendations:

```json
{
  "discoveredRecipes": [
    {
      "name": "UpgradeSpringBoot_4_0",
      "fullName": "org.openrewrite.java.spring.boot4.UpgradeSpringBoot_4_0",
      "artifact": "org.openrewrite.recipe:rewrite-spring:RELEASE",
      "type": "composite",
      "upgradesCovered": {
        "spring-boot": "3.x → 4.0.x",
        "spring-security": "6.x → 7.0.x",
        "jackson": "2.x → 3.x",
        "java": "→ 21 minimum"
      },
      "subRecipes": [
        "SpringBoot4Properties",
        "UpdateJackson2ToJackson3",
        "UpgradeSpringSecurity_7_0"
      ],
      "documentation": "https://docs.openrewrite.org/recipes/java/spring/boot4",
      "command": "mvn -U org.openrewrite.maven:rewrite-maven-plugin:run -Drewrite.recipeArtifactCoordinates=org.openrewrite.recipe:rewrite-spring:RELEASE -Drewrite.activeRecipes=org.openrewrite.java.spring.boot4.UpgradeSpringBoot_4_0"
    }
  ],
  "additionalRecipesNeeded": [],
  "manualMigrationsRequired": [
    "Vaadin theme migration (Material → Lumo)",
    "Custom Spring AI implementations"
  ]
}
```

## Recipe Categories Reference

### Spring Ecosystem

| Category        | Documentation URL                                    |
| --------------- | ---------------------------------------------------- |
| Spring Boot     | `/recipes/java/spring/boot`, `/boot2`, `/boot3`, `/boot4` |
| Spring Security | `/recipes/java/spring/security5`, `/security6`, `/security7` |
| Spring Cloud    | `/recipes/java/spring/cloud2022`, `/cloud2023`, etc. |
| Spring Data     | `/recipes/java/spring/data`                          |
| Spring Batch    | `/recipes/java/spring/batch`                         |
| Spring Kafka    | `/recipes/java/spring/kafka`                         |

### Java Platform

| Category     | Documentation URL                        |
| ------------ | ---------------------------------------- |
| Java Migrate | `/recipes/java/migrate`                  |
| Jakarta EE   | `/recipes/java/migrate/jakarta`          |
| Lombok       | `/recipes/java/migrate/lombok`           |
| Guava        | `/recipes/java/migrate/guava`            |

### Libraries

| Category     | Documentation URL                        |
| ------------ | ---------------------------------------- |
| Jackson      | `/recipes/java/jackson`                  |
| Hibernate    | `/recipes/java/hibernate`                |
| JUnit        | `/recipes/java/testing/junit5`           |
| Mockito      | `/recipes/java/testing/mockito`          |
| AssertJ      | `/recipes/java/testing/assertj`          |

### Build Tools

| Category     | Documentation URL                        |
| ------------ | ---------------------------------------- |
| Maven        | `/recipes/maven`                         |
| Gradle       | `/recipes/gradle`                        |

## Transitive Dependency Handling

When discovering recipes, consider transitive dependencies:

### Spring Boot 4.0 Transitive Upgrades

```yaml
spring-boot-4.0:
  direct:
    - spring-boot: 4.0.x
  transitive:
    - spring-security: 7.0.x (required)
    - jackson: 3.x (required)
    - hibernate: 6.6.x (included)
    - spring-cloud: 2025.x (if using cloud)
    - java: 21+ (required minimum)
```

### Recipe Selection Strategy

1. **Prefer composite recipes** - They handle transitive upgrades automatically
2. **Check coverage** - Verify composite includes all needed migrations
3. **Fill gaps** - Add individual recipes for missing upgrades
4. **Order matters** - Run build tool upgrades before code migrations

## Integration with Discovery Agent

The discovery agent should invoke this skill to:

1. Map detected versions to upgrade recipes
2. Understand composite recipe coverage
3. Identify additional recipes needed
4. Generate complete migration recipe list

**Example Integration:**

```
Discovery Agent → detects spring-boot: 3.3.5
Recipe Discovery → recommends UpgradeSpringBoot_4_0 (composite)
Recipe Discovery → walks tree: includes security7, jackson3
Recipe Discovery → identifies gap: need java-21 separately if java < 17
Migration Agent → executes recipes in order
```

## Troubleshooting Recipe Discovery

### Recipe Not Found

```bash
# Search Maven Central for recipe artifacts
curl "https://search.maven.org/solrsearch/select?q=g:org.openrewrite.recipe+AND+a:rewrite-spring&rows=20&wt=json"
```

### Unknown Composite Structure

```bash
# Fetch recipe YAML definition
WebFetch: https://raw.githubusercontent.com/openrewrite/rewrite-spring/main/src/main/resources/META-INF/rewrite/*.yml
```

### Version Mismatch

If recipe doesn't support detected version:

1. Check for intermediate upgrade paths (e.g., 3.3 → 3.4 → 3.5 → 4.0)
2. Search for version-specific recipes
3. Consider manual migration for unsupported paths
