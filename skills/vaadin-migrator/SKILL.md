---
name: vaadin-migrator
description: Migrate Vaadin Flow 23.x to 24.x and 24.x to 25.x including theme updates, component API changes, and Spring Security integration. Use when upgrading Vaadin or fixing Vaadin-related compilation errors after Spring Boot 4 upgrade.
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Vaadin Migrator

Migrate Vaadin Flow 23.x to Vaadin Flow 24.x with theme and API updates. This skill also covers migration to **Vaadin Flow 25.x (current recommended)**.

> **IMPORTANT:** Vaadin Flow 24.x free maintenance ends **June 16, 2026**.
> New projects and migrations should target **Vaadin Flow 25.1.x** directly.
> Existing 24.x projects should plan immediate migration to 25.x.

## Critical: Spring Boot 4 Compatibility

**Vaadin Flow 24.x is required for Spring Boot 4 compatibility.**

Vaadin Flow 23.x was built for Spring Boot 3.x and has compatibility issues with Spring Boot 4.0's modular structure.

## Version Compatibility

| Spring Boot | Vaadin Flow | Notes                             |
| ----------- | ----------- | --------------------------------- |
| 3.3.x       | 23.x        | Legacy — upgrade required         |
| **4.0.x**   | **24.x**    | Boot 4 minimum (EOL Jun 16, 2026) |
| **4.0.x**   | **25.1.x**  | Current recommended               |

## Key Migration Areas

1. **Theme Configuration** - Lumo theme property updates
2. **VaadinWebSecurity** - Spring Security 7 integration (see security-config-migrator)
3. **Component API** - Breaking changes in component methods
4. **Router Configuration** - Updated routing patterns

## Theme Migration

### Lumo Theme Properties

#### Before (Vaadin 23)

```java
@Theme(value = "my-theme", variant = Lumo.DARK)
public class MyApp extends AppShellConfigurator {
}
```

#### After (Vaadin 24)

```java
@Theme(value = "my-theme")
@CssImport("./styles/shared-styles.css")
public class MyApp extends AppShellConfigurator {
    // Theme variant now set via CSS custom properties
}
```

## Component API Changes

### Grid Component

#### Before (Vaadin 23)

```java
Grid<Person> grid = new Grid<>();
grid.addColumn(Person::getName).setHeader("Name");
grid.setDataProvider(dataProvider);
```

#### After (Vaadin 24)

```java
Grid<Person> grid = new Grid<>();
grid.addColumn(Person::getName).setHeader("Name");
grid.setItems(dataProvider);  // setDataProvider deprecated
```

### Dialog Component

#### Before (Vaadin 23)

```java
Dialog dialog = new Dialog();
dialog.setCloseOnEsc(true);
dialog.setCloseOnOutsideClick(false);
```

#### After (Vaadin 24)

```java
Dialog dialog = new Dialog();
dialog.setCloseOnEsc(true);
dialog.setModal(true);  // Replaces closeOnOutsideClick
```

## Spring Security Integration

Vaadin 24 requires updated Spring Security configuration. See `security-config-migrator` for:

- VaadinWebSecurity → VaadinSecurityConfigurer
- AntPathRequestMatcher → PathPatternRequestMatcher
- SecurityFilterChain patterns

## Import Changes

| Old Import (Vaadin 23)                       | New Import (Vaadin 24)                                   |
| -------------------------------------------- | -------------------------------------------------------- |
| `com.vaadin.flow.theme.lumo.Lumo`            | `com.vaadin.flow.theme.lumo.LumoUtility`                 |
| `com.vaadin.flow.component.grid.GridVariant` | `com.vaadin.flow.component.grid.GridVariant` (unchanged) |

## Migration Steps

1. **Update version** - Change Vaadin to 24.x in build files
2. **Update theme** - Migrate Lumo theme configuration
3. **Update components** - Replace deprecated API calls
4. **Update security** - Apply security-config-migrator changes
5. **Update imports** - Replace changed import statements
6. **Run build** - Verify compilation
7. **Test UI** - Verify all views and components work

## Vaadin 24 → 25 Migration

### BOM Update

Maven:

```xml
<properties>
    <vaadin.version>25.1.0</vaadin.version>
</properties>
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>com.vaadin</groupId>
            <artifactId>vaadin-bom</artifactId>
            <version>${vaadin.version}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

Gradle Kotlin DSL:

```kotlin
extra["vaadinVersion"] = "25.1.0"
dependencyManagement {
    imports {
        mavenBom("com.vaadin:vaadin-bom:${property("vaadinVersion")}")
    }
}
```

### Frontend Build — Vite replaces Webpack

Vaadin 25 uses Vite instead of webpack. Remove any `webpack.config.js` customizations and replace
with Vite config if needed. The default Vite config works for most projects.

Before (Vaadin 24 — webpack):

```bash
# Custom webpack.config.js was supported
frontend/webpack.config.js
```

After (Vaadin 25 — Vite):

```bash
# Delete webpack.config.js if present
# Vaadin 25 uses Vite by default — no config file needed for standard setups
# For custom config: frontend/vite.config.ts
```

### Theme / Styling Changes

Vaadin 25 simplifies the theming system. The `@Theme` variant attribute on `AppShellConfigurator` is removed.

Before (Vaadin 24):

```java
@Theme(value = "my-theme", variant = Lumo.DARK)
public class MyApp extends AppShellConfigurator {}
```

After (Vaadin 25):

```java
@Theme("my-theme")
public class MyApp extends AppShellConfigurator {}
// Dark mode is now set via CSS:
// document.documentElement.setAttribute('theme', 'dark');
// Or via Lumo utility class on the server:
// UI.getCurrent().getElement().setAttribute("theme", "dark");
```

### Java 21+ Requirement

Vaadin 25 requires Java 21 minimum. Add a gate check:

```bash
JAVA_VERSION=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}' | cut -d. -f1)
if [ "$JAVA_VERSION" -lt 21 ]; then
  echo "ERROR: Vaadin 25 requires Java 21+. Current: $JAVA_VERSION"
  exit 1
fi
```

### Migration Steps (24 → 25)

1. Update BOM to `25.1.0` (or latest 25.x)
2. Run `mvn vaadin:clean-frontend` or `gradle vaadinClean` to clear cached frontend assets
3. Remove `webpack.config.js` if present (Vite is the new bundler)
4. Update `@Theme` usages — remove `variant =` attribute; handle dark/light mode via CSS
5. Run `mvn compile` or `gradle compileJava` to catch compilation errors
6. Run full build including frontend: `mvn vaadin:build-frontend` or `gradle vaadinBuildFrontend`
7. Test all views and confirm theme is applied correctly

## Transformation State

### Skill State Entries

```yaml
# Example state file entry after vaadin-migrator runs (23 → 24)
appliedTransformations:
  - skill: vaadin-migrator
    version: 1.0.0
    transformations:
      - vaadin-theme
      - vaadin-grid-api
      - vaadin-dialog-api
      - vaadin-imports
    completedAt: 2026-01-03T11:15:00Z
    commitSha: mno345pqr

  # Example state file entry after vaadin-migrator runs (24 → 25)
  - skill: vaadin-migrator
    version: 2.0.0
    transformations:
      - vaadin-24-to-25-bom
      - vaadin-25-theme-variant
      - vaadin-25-webpack
    completedAt: 2026-05-21T00:00:00Z
    commitSha: <git-commit-sha>
```

### Detection Patterns

Each transformation has a detection pattern in `metadata.yaml`:

| Transformation ID         | Detection Pattern                                  | Purpose                                             |
| ------------------------- | -------------------------------------------------- | --------------------------------------------------- |
| `vaadin-theme`            | `@Theme.*variant\s*=\s*Lumo\.(DARK\|LIGHT)`        | Find old theme variant syntax                       |
| `vaadin-grid-api`         | `\.setDataProvider\s*\(`                           | Find deprecated Grid methods                        |
| `vaadin-dialog-api`       | `\.setCloseOnOutsideClick\s*\(`                    | Find deprecated Dialog methods                      |
| `vaadin-imports`          | `import.*com\.vaadin\.flow\.theme\.lumo\.Lumo[^U]` | Find old Lumo imports                               |
| `vaadin-24-to-25-bom`     | `vaadin-bom.*24\.\|vaadin\.version.*24\.`          | Find Vaadin 24 BOM references                       |
| `vaadin-25-theme-variant` | `@Theme.*variant\s*=\s*Lumo\.(DARK\|LIGHT)`        | Find old theme variant (still applicable for 24→25) |
| `vaadin-25-webpack`       | `webpack\.config\.js`                              | Find webpack config to remove                       |

### Verification

After each transformation:

1. `mvn compile` or `gradle compileJava` succeeds
2. Vaadin frontend build succeeds (`mvn vaadin:build-frontend` or `gradle vaadinBuildFrontend`)
3. UI views render correctly in the browser
4. Re-run detection pattern to confirm it no longer matches

## Transformation Protocol

Follows the standard migration protocol — see `migration-protocol` skill for the full
transformation loop, skip logic, state file format, and build verification commands.

**Dependencies:** `migration-state` >= 1.0.0, `build-runner` >= 1.0.0, `security-config-migrator` >= 1.0.0
