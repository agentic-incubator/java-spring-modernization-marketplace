# B. Single-Project Framework Upgrades

> ← [Back to Use Cases home](README.md)

You have one project and you want to bump its framework versions. Pick the use case
that matches your starting point.

---

<details>
<summary><strong>B1.</strong> Take this project from Spring Boot 3.x to Spring Boot 4.0</summary>

**What's happening.** Spring Boot 4.0 was a chunky release: Jackson 3 (with the
`tools.jackson` groupId change), Spring Security 7 config patterns, Servlet 6.1
(Undertow removed), starter renames, and the autoconfigure module split. This use
case handles the lot.

**Easiest thing to say:**

> "Migrate this project from Spring Boot 3 to 4."

**Other ways you might phrase it:**

> "Upgrade me to Spring Boot 4."
>
> "Run the Spring Boot 4 migration."
>
> "Run `/migrate /path/to/project`."

**What gets used under the hood:**

- Command: [`/migrate`](../../commands/migrate.md)
- Agent: [`migration-agent`](../../agents/migration-agent.md) (coordinated by
  [`orchestrator`](../../agents/orchestrator.md))
- Skills (lots): [`build-tool-upgrader`](../../skills/build-tool-upgrader/SKILL.md),
  [`build-file-updater`](../../skills/build-file-updater/SKILL.md),
  [`jackson-migrator`](../../skills/jackson-migrator/SKILL.md),
  [`security-config-migrator`](../../skills/security-config-migrator/SKILL.md),
  [`import-migrator`](../../skills/import-migrator/SKILL.md),
  [`application-property-migrator`](../../skills/application-property-migrator/SKILL.md),
  [`spring-ai-migrator`](../../skills/spring-ai-migrator/SKILL.md) (if Spring AI is present),
  [`build-runner`](../../skills/build-runner/SKILL.md)

**What you get.** A `feature/spring-boot-4-migration` branch with atomic per-skill
commits. Compiles, tests run, and `.migration-state.yaml` records what happened. You
review the diff and merge when you're happy.

**What if something goes wrong?**

- _"It changed `@JsonProperty` imports — were those supposed to change?"_ No! Jackson
  _annotations_ (`com.fasterxml.jackson.annotation.*`) stay the same in Jackson 3.
  Only `core`, `databind`, `dataformat`, etc. change to `tools.jackson.*`. If the
  migrator changed annotations, file an issue.
- _"My tests failed on `SecurityFilterChain` config."_ Spring Security 7 wants
  bean-based config, not `extends WebSecurityConfigurerAdapter`. The
  [`security-config-migrator`](../../skills/security-config-migrator/SKILL.md) skill
  usually handles this, but custom configs sometimes need a manual touch. Open the
  failing test and rewrite the config as `@Bean SecurityFilterChain`.
- _"It tried to upgrade Maven wrapper and failed."_ The wrapper upgrade is a "best
  effort" step — if it fails, the rest of the migration continues. Run
  [`build-tool-upgrader`](../../skills/build-tool-upgrader/SKILL.md) standalone after
  the main migration.
- _"My app dies at startup with `RestClientCustomizer` not found."_ That class moved
  in Boot 4. If you're on WebFlux,
  [`restclient-to-webclient-customizer-migrator`](../../skills/restclient-to-webclient-customizer-migrator/SKILL.md)
  has the right rewrite.

</details>

---

<details>
<summary><strong>B2.</strong> Bump from Spring Boot 4.0.x to 4.1.0-RC1</summary>

**What's happening.** You're already on Boot 4.0 and want the latest 4.1 release
candidate. This is a smaller hop than 3→4 but has its own quirks: a
`<pluginRepositories>` block is required for the RC plugin, the Micrometer / Spring
Framework / Spring Security BOM versions all bump, and
`ReactorClientHttpRequestFactoryBuilder` no longer applies proxy defaults
automatically.

**Easiest thing to say:**

> "Upgrade this project to Spring Boot 4.1.0-RC1."

**Other ways you might phrase it:**

> "Take this to the latest Spring Boot 4.1 RC."
>
> "Bump Boot to 4.1 — only Boot, don't mess with Spring AI."
>
> "Run `/migrate-spring-boot-41`."

**What gets used under the hood:**

- Command: [`/migrate-spring-boot-41`](../../commands/migrate-spring-boot-41.md)
- Agent:
  [`spring-boot-41-rc-upgrade-agent`](../../agents/spring-boot-41-rc-upgrade-agent.md)
- Key skills:
  [`build-file-updater`](../../skills/build-file-updater/SKILL.md) (adds the
  `<pluginRepositories>` block),
  [`spring-boot-bom-override-reconciler`](../../skills/spring-boot-bom-override-reconciler/SKILL.md)
  (drops stale `<micrometer.version>` etc. overrides),
  [`dependency-updater`](../../skills/dependency-updater/SKILL.md)
  with `--target-rc=spring-boot:4.1.0-RC1`,
  [`restclient-to-webclient-customizer-migrator`](../../skills/restclient-to-webclient-customizer-migrator/SKILL.md)
  (injects `.withHttpClientDefaults()` where needed)

**What you get.** A migration branch with the parent bumped, both repository blocks
in `pom.xml`, stale BOM overrides cleaned up, and any proxy-dependent reactive HTTP
code updated.

**What if something goes wrong?**

- _"Maven says `Plugin spring-boot-maven-plugin:4.1.0-RC1 not found`."_ The
  `<pluginRepositories>` block didn't get added (the regular `<repositories>` block
  alone isn't enough for plugins). Check your `pom.xml` for both blocks pointing at
  `https://repo.spring.io/milestone`.
- _"My HTTP client stopped honoring the proxy setting."_ That's the
  `ReactorClientHttpRequestFactoryBuilder` change in 4.1.
  [`restclient-to-webclient-customizer-migrator`](../../skills/restclient-to-webclient-customizer-migrator/SKILL.md)
  should have caught it; if not, manually add `.withHttpClientDefaults()` to the
  builder chain.
- _"Micrometer methods don't exist anymore."_ You probably had an explicit
  `<micrometer.version>` override that didn't get cleaned up. Re-run
  [`spring-boot-bom-override-reconciler`](../../skills/spring-boot-bom-override-reconciler/SKILL.md)
  with `--strategy=drop`.

</details>

---

<details>
<summary><strong>B3.</strong> Go all the way: Boot 3 → Boot 4.1.0-RC1 + Spring AI 2.0.0-M7 in one session</summary>

**What's happening.** Your project is way behind. You want to do the whole modern
stack — Boot 4.1 RC plus Spring AI 2.0 milestone 7 — in one go.

**Easiest thing to say:**

> "Upgrade this project to Spring Boot 4.1.0-RC1 and Spring AI 2.0.0-M7."

**Other ways you might phrase it:**

> "Take this to the latest Spring Boot 4.1 RC and the latest Spring AI 2.0 milestone."
>
> "Modernize everything."
>
> "Run `/migrate`, then `/migrate-spring-boot-41`, then `/migrate-spring-ai-20`."

**What gets used under the hood:**

- First [`/migrate`](../../commands/migrate.md) handles Boot 3 → 4.0 (see [B1](#b1))
- Then [`/migrate-spring-boot-41`](../../commands/migrate-spring-boot-41.md) jumps to
  4.1.0-RC1 (see [B2](#b2))
- Then [`/migrate-spring-ai-20`](../../commands/migrate-spring-ai-20.md) handles
  Spring AI (see [C1](c-spring-ai.md#c1))

**Why this order matters.** Spring AI 2.0.0-M7 expects the Boot 4.1 BOM (Spring
Framework 7.0.7, Micrometer 1.17.0-RC1, etc.). If you bump Spring AI before Boot 4.1,
you can resolve transitive dependencies that don't line up. The agents won't stop you
from doing it the other way, but the order above is safer.

**What you get.** Three commits/branches (or one branch with three logical commit
groups) covering ~18 skills, full compile + test + per-Spring-profile startup probe.

**What if something goes wrong?**

- _"It got partway and stopped at compile failure."_ That's expected on a big jump.
  Read the error, the agent will have noted which skill it was on. Fix the issue (or
  let Claude fix it), then run [`/resume`](../../commands/resume.md) to pick up where
  it left off — see [G1](g-recovery.md#g1).
- _"`At least one credential source must be specified` at startup."_ That's the
  Spring AI multi-provider crash. Run
  [`/detect-multi-provider-collision`](../../commands/detect-multi-provider-collision.md)
  to confirm, then [C2](c-spring-ai.md#c2) to fix. The Spring AI 2.0-M7 agent normally
  runs this fix automatically as its final step, so if it crashed, something blocked
  that step.

</details>

---

<details>
<summary><strong>B4.</strong> Show me what would change first, without touching anything</summary>

**What's happening.** You're not ready to commit. You want to see the planned diff
before applying it.

**Easiest thing to say:**

> "Show me what would change if I migrated to Boot 4 — don't touch anything."

**Other ways you might phrase it:**

> "Dry-run the migration."
>
> "Preview the Boot 4 upgrade."
>
> "Run `/migrate --dry-run`."

**What gets used under the hood:**

- The same commands/agents as [B1](#b1), [B2](#b2), or [B3](#b3) — every migration
  command accepts `--dry-run`.

**What you get.** A list of planned file changes per skill, no commits, no writes.

**What if something goes wrong?**

- _"The dry-run says no changes will be made — but I know I'm on Boot 3."_ Check that
  your build file is detected (run [A2](a-diagnostic.md#a2) first). If `version-detector`
  doesn't see Boot, the migration agents will pass through as no-ops.
- _"The dry-run output is huge."_ Pipe it to a file:
  `claude /migrate --dry-run > migration-preview.txt` — then read it once at your own
  pace.

</details>
