---
name: security-config-migrator
description: Migrate Spring Security 6 to 7 configurations including VaadinWebSecurity replacement, AntPathRequestMatcher to PathPatternRequestMatcher, and SecurityFilterChain patterns. Use when upgrading Spring Security or fixing security configuration after Spring Boot 4 upgrade.
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Security Config Migrator

Migrate Spring Security 6.x to Spring Security 7.x configurations.

## Key Migration Patterns

### 1. VaadinWebSecurity → VaadinSecurityConfigurer

#### Before (Spring Security 6)

```java
@Configuration
public class SecurityConfig extends VaadinWebSecurity {
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(auth ->
            auth.requestMatchers(new AntPathRequestMatcher("/public/**"))
            .permitAll()
        );
        super.configure(http);
    }
}
```

#### After (Spring Security 7)

```java
@Configuration
public class SecurityConfig {
    private static final PathPatternRequestMatcher.Builder MATCHER =
        PathPatternRequestMatcher.withDefaults();

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(auth ->
            auth.requestMatchers(MATCHER.matcher("/public/**"))
            .permitAll()
        );
        http.with(VaadinSecurityConfigurer.vaadin(), configurer -> {});
        return http.build();
    }
}
```

### 2. AntPathRequestMatcher → PathPatternRequestMatcher

#### Before

```java
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

new AntPathRequestMatcher("/api/**")
new AntPathRequestMatcher("/admin/**", "POST")
```

#### After

```java
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;

private static final PathPatternRequestMatcher.Builder MATCHER =
    PathPatternRequestMatcher.withDefaults();

MATCHER.matcher("/api/**")
MATCHER.matcher(HttpMethod.POST, "/admin/**")
```

### 3. WebSecurityConfigurerAdapter Pattern (Legacy)

#### Before (Very Old Pattern)

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig extends WebSecurityConfigurerAdapter {
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.authorizeRequests()
            .antMatchers("/public/**").permitAll()
            .anyRequest().authenticated();
    }
}
```

#### After (Spring Security 7)

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    private static final PathPatternRequestMatcher.Builder MATCHER =
        PathPatternRequestMatcher.withDefaults();

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(auth -> auth
            .requestMatchers(MATCHER.matcher("/public/**")).permitAll()
            .anyRequest().authenticated()
        );
        return http.build();
    }
}
```

## Import Changes

| Old Import                                            | New Import                                                        |
| ----------------------------------------------------- | ----------------------------------------------------------------- |
| `o.s.security.web.util.matcher.AntPathRequestMatcher` | `o.s.security.web.servlet.util.matcher.PathPatternRequestMatcher` |
| `c.v.flow.spring.security.VaadinWebSecurity`          | `c.v.flow.spring.security.VaadinSecurityConfigurer`               |

## Common Security Patterns

### Static Resources

```java
// Before
.requestMatchers(new AntPathRequestMatcher("/css/**")).permitAll()
.requestMatchers(new AntPathRequestMatcher("/js/**")).permitAll()
.requestMatchers(new AntPathRequestMatcher("/images/**")).permitAll()

// After
.requestMatchers(MATCHER.matcher("/css/**")).permitAll()
.requestMatchers(MATCHER.matcher("/js/**")).permitAll()
.requestMatchers(MATCHER.matcher("/images/**")).permitAll()
```

### API Endpoints

```java
// Before
.requestMatchers(new AntPathRequestMatcher("/api/**")).authenticated()

// After
.requestMatchers(MATCHER.matcher("/api/**")).authenticated()
```

### Method-Specific Matchers

```java
// Before
.requestMatchers(new AntPathRequestMatcher("/api/data", "POST")).hasRole("ADMIN")

// After
.requestMatchers(MATCHER.matcher(HttpMethod.POST, "/api/data")).hasRole("ADMIN")
```

## Migration Steps

1. **Identify security configs** - Find all classes extending `VaadinWebSecurity` or using `AntPathRequestMatcher`
2. **Update imports** - Replace old imports with new ones
3. **Convert class structure** - Remove inheritance, add `@Bean` method
4. **Update request matchers** - Replace `AntPathRequestMatcher` with `PathPatternRequestMatcher`
5. **Add Vaadin configurer** - Use `http.with(VaadinSecurityConfigurer.vaadin(), ...)`
6. **Test security** - Verify authentication and authorization work correctly

## Idempotent Transformation Logic

This skill implements idempotent transformations that can be safely run multiple times. Each transformation:

1. **Reads migration state** - Loads `.migration-state.yaml` to check applied transformations
2. **Checks if already applied** - Skips transformations with version >= applied version
3. **Detects if still needed** - Uses regex patterns to verify transformation is required
4. **Applies transformation** - Only executes if detection pattern matches
5. **Updates state** - Records transformation in state file with version and commit SHA

### Transformation Flow

```yaml
# Example state file entry after security-config-migrator runs
appliedTransformations:
  - skill: security-config-migrator
    version: 1.0.0
    transformations:
      - security-config
      - authorizations
      - csrf-config
      - session-management
    completedAt: 2026-01-03T11:00:00Z
    commitSha: ghi789jkl
```

### Detection Patterns

Each transformation has a detection pattern in `metadata.yaml`:

| Transformation ID    | Detection Pattern                                        | Purpose                                |
| -------------------- | -------------------------------------------------------- | -------------------------------------- |
| `security-config`    | `WebSecurityConfigurerAdapter\|antMatchers\|mvcMatchers` | Find deprecated security configuration |
| `authorizations`     | `authorizeRequests\|access\s*\(`                         | Find old authorization rule syntax     |
| `csrf-config`        | `csrf\(\)\.disable\(\)`                                  | Find CSRF disable patterns             |
| `session-management` | `sessionManagement\(\)\.sessionCreationPolicy`           | Find session management configuration  |

### Skip Logic

Before applying any transformation:

1. Load state from `.migration-state.yaml`
2. For each transformation in `metadata.yaml`:
   - Check if `skill: security-config-migrator` exists in `appliedTransformations`
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
2. **Security tests** - Run security-related tests
3. **Configuration validation** - Ensure `SecurityFilterChain` bean is properly configured
4. **Pattern absence** - Re-run detection pattern to confirm it no longer matches

### State Updates

After successful transformation:

```yaml
# Updated .migration-state.yaml
skill: security-config-migrator
version: 1.0.0
transformations: [security-config, authorizations, csrf-config, session-management]
completedAt: 2026-01-03T11:00:00Z
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
