---
name: vaadin-migrator
description: Migrate Vaadin Flow 23.x to 24.x including theme updates, component API changes, and Spring Security integration. Use when upgrading Vaadin or fixing Vaadin-related compilation errors after Spring Boot 4 upgrade.
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Vaadin Migrator

Migrate Vaadin Flow 23.x to Vaadin Flow 24.x with theme and API updates.

## Critical: Spring Boot 4 Compatibility

**Vaadin Flow 24.x is required for Spring Boot 4 compatibility.**

Vaadin Flow 23.x was built for Spring Boot 3.x and has compatibility issues with Spring Boot 4.0's modular structure.

## Version Compatibility

| Spring Boot | Vaadin Flow | Notes                |
| ----------- | ----------- | -------------------- |
| 3.3.x       | 23.x        | Original Vaadin Flow |
| **4.0.x**   | **24.x**    | Required for Boot 4  |

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

## Idempotent Transformation Logic

This skill implements idempotent transformations that can be safely run multiple times. Each transformation:

1. **Reads migration state** - Loads `.migration-state.yaml` to check applied transformations
2. **Checks if already applied** - Skips transformations with version >= applied version
3. **Detects if still needed** - Uses regex patterns to verify transformation is required
4. **Applies transformation** - Only executes if detection pattern matches
5. **Updates state** - Records transformation in state file with version and commit SHA

### Transformation Flow

```yaml
# Example state file entry after vaadin-migrator runs
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
```

### Detection Patterns

Each transformation has a detection pattern in `metadata.yaml`:

| Transformation ID   | Detection Pattern                                  | Purpose                        |
| ------------------- | -------------------------------------------------- | ------------------------------ |
| `vaadin-theme`      | `@Theme.*variant\s*=\s*Lumo\.(DARK\|LIGHT)`        | Find old theme variant syntax  |
| `vaadin-grid-api`   | `\.setDataProvider\s*\(`                           | Find deprecated Grid methods   |
| `vaadin-dialog-api` | `\.setCloseOnOutsideClick\s*\(`                    | Find deprecated Dialog methods |
| `vaadin-imports`    | `import.*com\.vaadin\.flow\.theme\.lumo\.Lumo[^U]` | Find old Lumo imports          |

### Skip Logic

Before applying any transformation:

1. Load state from `.migration-state.yaml`
2. For each transformation in `metadata.yaml`:
   - Check if `skill: vaadin-migrator` exists in `appliedTransformations`
   - If yes, check if transformation ID is in the list
   - If yes, compare versions: skip if `appliedVersion >= currentVersion`
   - If no or version is older, run detection pattern
3. If detection pattern matches, apply transformation
4. If detection pattern doesn't match, skip (already transformed or not applicable)

### Version Comparison

Transformations are only reapplied if:

- Transformation ID not found in state file, OR
- Applied version < current version (e.g., 0.9.0 < 1.0.0), OR
- Detection pattern still matches (manual revert detected)

### Verification

After each transformation, verify:

1. **Compilation** - Run `mvn compile` or `gradle compileJava`
2. **Frontend build** - Ensure Vaadin frontend compilation succeeds
3. **UI rendering** - Verify views render correctly
4. **Pattern absence** - Re-run detection pattern to confirm it no longer matches

### State Updates

After successful transformation:

```yaml
# Updated .migration-state.yaml
skill: vaadin-migrator
version: 1.0.0
transformations: [vaadin-theme, vaadin-grid-api, vaadin-dialog-api, vaadin-imports]
completedAt: 2026-01-03T11:15:00Z
commitSha: <git-commit-sha>
```

The state file is committed with the migration changes for audit trail.

## Integration with Migration State Skill

This skill depends on the `migration-state` skill (v1.0.0+) for:

- Reading `.migration-state.yaml`
- Checking applied transformations
- Updating state after successful transformation
- Version comparison logic

See `skills/migration-state/SKILL.md` for state management details.

## Related Skills

- **security-config-migrator** - Required for Spring Security 7 integration with Vaadin
- **build-runner** - Used for verification after transformation
