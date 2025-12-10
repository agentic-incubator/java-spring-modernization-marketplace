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
