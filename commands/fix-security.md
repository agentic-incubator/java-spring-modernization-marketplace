---
description: Fix Spring Security 7 migration issues
argument-hint: [project-path]
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Fix Spring Security 7 Issues

Fix Spring Security 7 migration issues in `$ARGUMENTS` (or current directory).

## Common Issues

### Issue 1: VaadinWebSecurity not found

**Symptom:** `cannot find symbol: VaadinWebSecurity`

**Fix:** Convert to VaadinSecurityConfigurer

**Before:**

```java
@Configuration
public class SecurityConfig extends VaadinWebSecurity {
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        // config
        super.configure(http);
    }
}
```

**After:**

```java
@Configuration
public class SecurityConfig {
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        // config
        http.with(VaadinSecurityConfigurer.vaadin(), configurer -> {});
        return http.build();
    }
}
```

### Issue 2: AntPathRequestMatcher not found

**Symptom:** `cannot find symbol: AntPathRequestMatcher`

**Fix:** Use PathPatternRequestMatcher

**Before:**

```java
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

new AntPathRequestMatcher("/api/**")
```

**After:**

```java
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;

private static final PathPatternRequestMatcher.Builder MATCHER =
    PathPatternRequestMatcher.withDefaults();

MATCHER.matcher("/api/**")
```

### Issue 3: Method-specific matchers

**Before:**

```java
new AntPathRequestMatcher("/api/data", "POST")
```

**After:**

```java
MATCHER.matcher(HttpMethod.POST, "/api/data")
```

## Complete Transformation Example

**Before (Security 6):**

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig extends VaadinWebSecurity {
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(auth -> auth
            .requestMatchers(new AntPathRequestMatcher("/public/**")).permitAll()
            .requestMatchers(new AntPathRequestMatcher("/api/**")).authenticated()
        );
        super.configure(http);
    }
}
```

**After (Security 7):**

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
            .requestMatchers(MATCHER.matcher("/api/**")).authenticated()
        );
        http.with(VaadinSecurityConfigurer.vaadin(), configurer -> {});
        return http.build();
    }
}
```

## Verification

After fixes:

```bash
mvn clean package -DskipTests
```
