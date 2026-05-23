# D. Targeted Fixes

> ← [Back to Use Cases home](README.md)

You don't need a full framework upgrade — you just need to fix _one specific thing_.
Pick the use case that matches what's broken.

---

<details id="d1">
<summary><strong>D1.</strong> Jackson 2 → Jackson 3 (groupId, exception rename, BOM)</summary>

**What's happening.** Jackson 3 moved from `com.fasterxml.jackson` to `tools.jackson`,
renamed `JsonProcessingException` to `JacksonException`, and introduced a new BOM.
Annotations (`com.fasterxml.jackson.annotation.*`) stay the same — that's the part
people often migrate by mistake.

**Easiest thing to say:**

> "Migrate Jackson 2 to 3 in this project."

**Other ways you might phrase it:**

> "Fix my Jackson imports for Spring Boot 4."
>
> "Update Jackson to 3.x."
>
> "Run `/fix-jackson`."

**What gets used under the hood:**

- Command: [`/fix-jackson`](../../commands/fix-jackson.md)
- Skill: [`jackson-migrator`](../../skills/jackson-migrator/SKILL.md)
- Helper skills:
  [`import-migrator`](../../skills/import-migrator/SKILL.md),
  [`pattern-detector`](../../skills/pattern-detector/SKILL.md),
  [`application-property-migrator`](../../skills/application-property-migrator/SKILL.md)
  (for the `spring.jackson.read.*` → `spring.jackson.json.read.*` namespace shift)

**What you get.** GroupIds updated, imports rewritten (preserving `annotation.*`), the
exception rename done, Jackson BOM added, `spring.jackson.*` properties updated, and
logging package paths updated (`com.fasterxml.jackson` → `tools.jackson`).

**What if something goes wrong?**

- _"It changed my `@JsonProperty` annotation imports."_ It shouldn't — those stay on
  the `com.fasterxml.jackson.annotation` package. If they got changed, that's a bug;
  revert those changes and report it.
- _"My custom `JsonDeserializer` doesn't compile anymore."_ The class is in
  `tools.jackson.databind` now. Update the import and adjust method signatures if you
  overrode anything that changed in Jackson 3.
- _"Tests fail with `No bean of type ObjectMapper`."_ If you're on Spring AI 2.0.0-M6
  - Boot 4, you need the Jackson 2 compatibility layer because Spring AI M6 still
    imports the Jackson 2 ObjectMapper. The
    [`spring-ai-migrator`](../../skills/spring-ai-migrator/SKILL.md) `jackson-2-compatibility-layer`
    transformation handles this automatically — re-run the Spring AI migration. (On M7+
    the layer is no longer needed.)

</details>

---

<details id="d2">
<summary><strong>D2.</strong> Spring Security 6 → 7 (bean-based config, PathPattern)</summary>

**What's happening.** Spring Security 7 ships with Spring Boot 4. The big changes:
`AntPathRequestMatcher` is replaced by `PathPatternRequestMatcher`, and old
`extends WebSecurityConfigurerAdapter` / `configure(HttpSecurity)` patterns must
become `@Bean SecurityFilterChain`. Vaadin's `VaadinWebSecurity` base class is also
replaced with the `VaadinSecurityConfigurer` bean.

**Easiest thing to say:**

> "Fix Spring Security 7 issues."

**Other ways you might phrase it:**

> "Migrate Spring Security from 6 to 7."
>
> "Convert my `configure(HttpSecurity)` to `SecurityFilterChain`."
>
> "Run `/fix-security`."

**What gets used under the hood:**

- Command: [`/fix-security`](../../commands/fix-security.md)
- Skill:
  [`security-config-migrator`](../../skills/security-config-migrator/SKILL.md)
- Helper skills:
  [`import-migrator`](../../skills/import-migrator/SKILL.md),
  [`pattern-detector`](../../skills/pattern-detector/SKILL.md)

**What you get.** Imports updated to `PathPatternRequestMatcher`, security configs
rewritten as `@Bean SecurityFilterChain`, Vaadin security configurers replaced if
applicable.

**What if something goes wrong?**

- _"My custom `AuthenticationProvider` no longer works."_ Spring Security 7 made some
  authentication API changes; the migrator covers the common cases but custom providers
  may need a manual review. Check the
  [Spring Security 7 migration guide](https://docs.spring.io/spring-security/reference/migration-7/index.html)
  for the specific API.
- _"My method-level security (`@PreAuthorize`) annotations stopped working."_
  Method-level security has its own enable annotation in Boot 4 — the migrator handles
  most cases, but custom expression handlers need attention.
- _"It changed a path matcher but my tests fail with 'no match'."_
  `PathPatternRequestMatcher` is slightly stricter about path syntax than
  `AntPathRequestMatcher`. Patterns ending in `/` behave differently. Compare the test
  failure URL to the configured pattern.

</details>

---

<details id="d3">
<summary><strong>D3.</strong> OpenFeign → Spring HTTP Interface clients</summary>

**What's happening.** OpenFeign isn't going away, but Spring HTTP Interface
(`@HttpExchange`) is the modern alternative and plays nicer with Spring Boot 4 and
Spring Cloud 2025.1.x. The migrator converts your `@FeignClient` interfaces into
`@HttpExchange` interfaces and wires up `HttpServiceProxyFactory` beans.

**Easiest thing to say:**

> "Migrate from OpenFeign to Spring HTTP Interface."

**Other ways you might phrase it:**

> "Replace my Feign clients with `@HttpExchange`."
>
> "Get rid of OpenFeign."
>
> "Run `/migrate-openfeign`."

**What gets used under the hood:**

- Command: [`/migrate-openfeign`](../../commands/migrate-openfeign.md)
- Skill:
  [`openfeign-to-httpinterface-migrator`](../../skills/openfeign-to-httpinterface-migrator/SKILL.md)
- Detector:
  [`openfeign-compatibility-detector`](../../skills/openfeign-compatibility-detector/SKILL.md)

**What you get.** Each `@FeignClient` becomes an `@HttpExchange` interface,
`@FeignClient(name="x", url="...")` becomes proxy configuration in a `@Configuration`
class, and custom `Decoder`/`Encoder`/`ErrorDecoder` configurations get translated to
WebClient customizations.

**What if something goes wrong?**

- _"My custom `RequestInterceptor` didn't carry over."_ Feign interceptors aren't a
  direct one-to-one with HTTP Interface. Add a `WebClient` interceptor (or
  `ExchangeFilterFunction`) in the `HttpServiceProxyFactory` configuration.
- _"My fallback / circuit breaker stopped working."_ OpenFeign integrates with
  Resilience4j via Spring Cloud Circuit Breaker. HTTP Interface clients need explicit
  resilience wrapping — wrap the client method call in a `CircuitBreaker.run(...)`
  yourself.
- _"The migrator says it can't migrate because I'm on Spring Cloud 2025.0.x."_
  OpenFeign on Spring Cloud 2025.0.x has compatibility issues with Boot 4. The
  detector flags this — you'll need to bump Spring Cloud first (the
  [`/migrate`](../../commands/migrate.md) command handles this) or migrate to HTTP
  Interface (this skill) to escape.

</details>

---

<details id="d4">
<summary><strong>D4.</strong> Vaadin 24 → Vaadin 25 (Lumo theme, security configurer)</summary>

**What's happening.** Vaadin 25 ships alongside Spring Boot 4. The big code-visible
changes: Material theme is replaced by Lumo, and `extends VaadinWebSecurity` becomes
a `VaadinSecurityConfigurer` bean.

**Easiest thing to say:**

> "Upgrade Vaadin to 25."

**Other ways you might phrase it:**

> "Replace my Material theme with Lumo."
>
> "Fix Vaadin security for Spring Boot 4."
>
> "Migrate Vaadin 24 to 25."

**What gets used under the hood:**

- Skill: [`vaadin-migrator`](../../skills/vaadin-migrator/SKILL.md)
- Helpers:
  [`security-config-migrator`](../../skills/security-config-migrator/SKILL.md)
  (for the security shift),
  [`import-migrator`](../../skills/import-migrator/SKILL.md) (for the theme imports)

**What you get.** Vaadin version bumped, `@Theme(themeClass=Material.class)` rewrites
to `@Theme(themeClass=Lumo.class)`, theme imports updated, and your Vaadin security
class refactored.

**What if something goes wrong?**

- _"My custom theme colors got lost when switching from Material to Lumo."_ Material
  and Lumo use different CSS variable names. You'll need to port custom theming
  manually — see the [Vaadin theming docs](https://vaadin.com/docs/latest/styling).
- _"Vaadin 25 requires Node 20+ and I'm on Node 18."_ Vaadin builds use frontend
  tooling. Upgrade your Node before the migration, or set `vaadin.frontend.hotdeploy`
  to skip the build.

</details>

---

<details id="d5">
<summary><strong>D5.</strong> Spring Framework 6 → 7 API (HttpServiceProxyFactory)</summary>

**What's happening.** Spring Framework 7 (which ships with Boot 4) changed
`HttpServiceProxyFactory.builder(adapter)` to `HttpServiceProxyFactory.builderFor(adapter)`
and `WebClientAdapter.forClient(webClient)` to `WebClientAdapter.create(webClient)`.
Small change but it breaks compilation.

**Easiest thing to say:**

> "Update my code to Spring Framework 7 API."

**Other ways you might phrase it:**

> "Fix `HttpServiceProxyFactory.builder` calls for Framework 7."
>
> "Migrate Framework 6 to 7."
>
> "Run `/migrate-framework-7`."

**What gets used under the hood:**

- Command: [`/migrate-framework-7`](../../commands/migrate-framework-7.md)
- Skill:
  [`spring-framework-7-migrator`](../../skills/spring-framework-7-migrator/SKILL.md)
- Helper: optional template injection if you use OpenAPI Generator
  (`--inject-templates` flag)

**What you get.** `.builder()` → `.builderFor()`, `.forClient()` → `.create()`, and
if you use OpenAPI Generator's `spring-http-interface` library, the templates get
updated too.

**What if something goes wrong?**

- _"My custom Mustache template for OpenAPI Generator was overwritten."_ The skill
  shows a diff and asks before overwriting custom templates. If you skipped the
  prompt, your previous template should still be in git history — `git diff HEAD~1` to
  recover.
- _"Compilation still fails after migration."_ Check for non-standard usages of the
  proxy factory builder. The migrator handles the standard idioms; unusual builder
  chains may need manual adjustment.

</details>

---

<details id="d6">
<summary><strong>D6.</strong> OpenAPI Generator plugin compatibility with Framework 7</summary>

**What's happening.** The OpenAPI Generator Maven/Gradle plugin must be at version
7.18.0+ to generate code that uses Spring Framework 7 APIs (`.builderFor()` etc.).
Older plugin versions emit Framework 6 code that won't compile against Boot 4.

**Easiest thing to say:**

> "Update OpenAPI Generator plugin for Spring Framework 7 compatibility."

**Other ways you might phrase it:**

> "Bump OpenAPI Generator to a Framework 7-compatible version."
>
> "My generated API code won't compile against Boot 4 — fix the plugin version."
>
> "Run `/update-openapi-generator`."

**What gets used under the hood:**

- Command: [`/update-openapi-generator`](../../commands/update-openapi-generator.md)
- Skill:
  [`openapi-generator-plugin-updater`](../../skills/openapi-generator-plugin-updater/SKILL.md)
- Detector:
  [`openapi-generator-detector`](../../skills/openapi-generator-detector/SKILL.md)

**What you get.** Plugin bumped to a version that's compatible with your detected
Spring Framework version. Generated code is re-emitted with the right APIs. Custom
templates (if any) get a Framework 7 patch.

**What if something goes wrong?**

- _"It bumped the plugin but my generated code still uses old APIs."_ You probably
  have custom templates overriding the defaults. The skill should detect them and
  prompt for a template update; if it didn't, run
  [`/migrate-framework-7 --inject-templates`](../../commands/migrate-framework-7.md).
- _"My CI build fails because plugin 7.18.0 isn't compatible with my old Java
  version."_ OpenAPI Generator 7.x needs Java 17+. If you're on Java 11 or earlier,
  upgrade Java first.

</details>

---

<details id="d7">
<summary><strong>D7.</strong> OpenAPI Generator library: spring-cloud → spring-http-interface</summary>

**What's happening.** When OpenAPI Generator emits client code, you can pick which
"library" template to use. `spring-cloud` produces Feign clients (which work but pull
in Spring Cloud). `spring-http-interface` produces `@HttpExchange` interfaces, which
fit Boot 4 better and don't need Spring Cloud at all.

**Easiest thing to say:**

> "Switch my OpenAPI Generator from `spring-cloud` to `spring-http-interface` library."

**Other ways you might phrase it:**

> "Generate `@HttpExchange` clients instead of Feign clients."
>
> "Migrate my OpenAPI Generator library."
>
> "Run `/migrate-openapi-library`."

**What gets used under the hood:**

- Command:
  [`/migrate-openapi-library`](../../commands/migrate-openapi-library.md)
- Skill:
  [`openapi-generator-library-migrator`](../../skills/openapi-generator-library-migrator/SKILL.md)

**What you get.** The plugin's `<library>` config switched, the `configPackage`
adjusted, generated code re-emitted as HTTP Interface clients, and any URL config in
your code cleaned up.

**What if something goes wrong?**

- _"My existing service implementations against the generated API don't compile."_
  HTTP Interface generates _interfaces_ and a proxy factory — your consumer code
  shouldn't change much, but if you were extending Feign-generated classes or relying
  on Feign-specific annotations, you'll need to adjust.
- _"My OpenAPI spec has tricky parameter encodings that break HTTP Interface."_ Some
  edge cases (matrix params, form-encoded bodies with arrays) work differently. Check
  the [skill docs](../../skills/openapi-generator-library-migrator/SKILL.md) for
  known gotchas.

</details>

---

<details id="d8">
<summary><strong>D8.</strong> JUnit 4 → JUnit 5 (annotations, runners, Gradle config)</summary>

**What's happening.** JUnit 4 still works, but JUnit 5 is the modern standard and
integrates better with Spring's test slices and parallel execution. The migrator
handles imports, annotations (`@Before` → `@BeforeEach`, etc.), runners
(`@RunWith(SpringRunner.class)` → `@ExtendWith(SpringExtension.class)`), and adds
`useJUnitPlatform()` to Gradle.

**Easiest thing to say:**

> "Migrate my tests from JUnit 4 to JUnit 5."

**Other ways you might phrase it:**

> "Convert my JUnit 4 tests to JUnit 5."
>
> "Upgrade to JUnit Jupiter."
>
> "Replace `@RunWith(SpringRunner.class)` with the JUnit 5 equivalent."

**What gets used under the hood:**

- Skill:
  [`junit4-to-junit5-migrator`](../../skills/junit4-to-junit5-migrator/SKILL.md)
- Helpers:
  [`import-migrator`](../../skills/import-migrator/SKILL.md),
  [`build-file-updater`](../../skills/build-file-updater/SKILL.md)

**What you get.** Imports swapped, annotations renamed, runners migrated, Maven
Surefire / Gradle test config updated, mixed JUnit 4/5 test runs disabled.

**What if something goes wrong?**

- _"My `@Rule` and `@ClassRule` don't have direct JUnit 5 equivalents."_ That's
  true — JUnit 5 uses `@ExtendWith` extensions instead of rules. The migrator handles
  common rules (`TemporaryFolder` → `@TempDir`), but custom rules need a manual
  rewrite as a JUnit 5 extension.
- _"My parameterized tests don't work."_ JUnit 5 parameterized tests need
  `@ParameterizedTest` and `@ValueSource` / `@MethodSource` instead of `@RunWith(Parameterized.class)`.
  The migrator does the common conversions; complex parameterization may need a
  manual touch.

</details>
