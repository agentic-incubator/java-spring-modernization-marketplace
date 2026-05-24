# A. Diagnostic / Read-Only Use Cases

> ← [Back to Use Cases home](README.md)

This group is **read-only**. Nothing here will change a single file. Use it first when
you're not sure what migration work a project needs, or when you just want a sanity
check before kicking off something bigger.

---

<details>
<summary><strong>A1.</strong> Figure out what migration work this project needs</summary>

**What's happening.** Maybe you inherited a Spring project, or you haven't touched it
in a year, or you just want a checklist before committing to an upgrade. This is the
"please give me a report card" prompt.

**Easiest thing to say:**

> "Analyze this Spring project for migration requirements."

**Other ways you might phrase it:**

> "What needs updating in this codebase?"
>
> "Tell me what's outdated and what to migrate."
>
> "Run `/analyze` on this repo."

**What gets used under the hood:**

- Command: [`/analyze`](../../commands/analyze.md)
- Agent: [`discovery-agent`](../../agents/discovery-agent.md)
- Skills (composed): [`build-tool-detector`](../../skills/build-tool-detector/SKILL.md),
  [`version-detector`](../../skills/version-detector/SKILL.md),
  [`dependency-scanner`](../../skills/dependency-scanner/SKILL.md),
  [`pattern-detector`](../../skills/pattern-detector/SKILL.md),
  [`multi-module-dependency-analyzer`](../../skills/multi-module-dependency-analyzer/SKILL.md)

**What you get back.** A report listing current versions, dependencies needing
attention, code patterns that need updating (Jackson imports, Security configs, Spring
AI APIs, etc.), and a recommended migration order. No code changes.

**What if something goes wrong?**

- _"It says my build tool wasn't detected."_ You're probably running this from the
  wrong directory. Pass the project path explicitly: `/analyze /path/to/project`.
- _"The report is huge and overwhelming."_ That's normal for older projects. Look at
  the "Recommended migration order" section at the bottom — start at item 1 and ignore
  the rest until that's done.
- _"It missed my multi-module project's submodule."_ Run analyze on each submodule
  individually. The
  [`multi-module-dependency-analyzer`](../../skills/multi-module-dependency-analyzer/SKILL.md)
  skill handles this if the parent POM is structured normally.

</details>

---

<details>
<summary><strong>A2.</strong> Just tell me what versions I'm on</summary>

**What's happening.** You want a one-liner answer to "what version of Spring Boot is
this?" without a big report.

**Easiest thing to say:**

> "What versions of Spring Boot, Cloud, and Java is this project on?"

**Other ways you might phrase it:**

> "Show me the framework versions."
>
> "Quick version check."
>
> "Run `/version-check`."

**What gets used under the hood:**

- Command: [`/version-check`](../../commands/version-check.md)
- Skill: [`version-detector`](../../skills/version-detector/SKILL.md)

**What you get back.** Spring Boot, Spring Cloud, Spring Security, Jackson, Java, and
Spring AI versions detected from your build file. That's it — no recommendations, no
diff.

**What if something goes wrong?**

- _"It says version 'unknown' for Spring Cloud."_ Your project probably doesn't import
  the Spring Cloud BOM. That's fine — it just means you're not using Spring Cloud.
- _"It detected the wrong Java version."_ Check both `<java.version>` in your
  `pom.xml` and `<maven.compiler.source>` — they sometimes disagree, and the skill
  reports the property version first.

</details>

---

<details>
<summary><strong>A3.</strong> Scan all my repos at once</summary>

**What's happening.** You manage a fleet of microservices and you want to know which
ones are behind on Spring Boot, which are ready to migrate, and which are already
modern.

**Easiest thing to say:**

> "Scan every project under `~/code/myorg/` and tell me which ones need migration."

**Other ways you might phrase it:**

> "Audit my whole portfolio's Spring versions."
>
> "Which of these repos still need to move to Boot 4?"
>
> "Run `/portfolio-scan ~/code/myorg/`."

**What gets used under the hood:**

- Command: [`/portfolio-scan`](../../commands/portfolio-scan.md)
- Agent: [`orchestrator`](../../agents/orchestrator.md) (coordinates parallel scans)
- Skills: [`version-detector`](../../skills/version-detector/SKILL.md),
  [`library-migration-classifier`](../../skills/library-migration-classifier/SKILL.md),
  [`version-comparator`](../../skills/version-comparator/SKILL.md)

**What you get back.** A table listing every project, its current versions, its
migration status (up-to-date / needs migration / outdated), and which projects depend
on others. Use the "recommended migration order" to know what to migrate first
(libraries before apps that use them).

**What if something goes wrong?**

- _"It scanned too much — there are random projects I didn't want included."_ Give it
  a narrower path or move unrelated projects out of the directory.
- _"It marked an internal library as up-to-date but its consumers are behind."_ That's
  fine — start with the consumers. The classifier sorts by _upgrade urgency_, not by
  dependency direction.

</details>

---

<details>
<summary><strong>A4.</strong> Will Spring Boot 4 break my code?</summary>

**What's happening.** Before you commit to a Boot 3 → Boot 4 migration, you want to
know what's likely to break: deprecated APIs, removed dependencies, Servlet 6.1
incompatibilities, etc.

**Easiest thing to say:**

> "Will Spring Boot 4 break anything in this codebase?"

**Other ways you might phrase it:**

> "Find Spring Boot 4 breaking changes in my code."
>
> "What's incompatible with Boot 4?"
>
> "Run `/detect-breaking-changes`."

**What gets used under the hood:**

- Command: [`/detect-breaking-changes`](../../commands/detect-breaking-changes.md)
- Agent: [`breaking-changes-analyzer`](../../agents/breaking-changes-analyzer.md)
- Skills:
  [`spring-boot-4-breaking-changes-detector`](../../skills/spring-boot-4-breaking-changes-detector/SKILL.md),
  [`openfeign-compatibility-detector`](../../skills/openfeign-compatibility-detector/SKILL.md)

**What you get back.** A catalog of detected issues with severity (HIGH / MEDIUM /
LOW), file:line references, and the migration path for each. Includes Boot 4.0 items
(RestClientCustomizer removal, HttpMessageConverters removal, Undertow
incompatibility) AND Boot 4.1.0-RC1 items (Micrometer 1.17 drift,
ReactorClientHttpRequestFactoryBuilder proxy default change).

**What if something goes wrong?**

- _"It flagged 30 things — where do I even start?"_ Sort by severity. Fix HIGH first.
  Many MEDIUM items are auto-handled by the migration commands later, so don't panic.
- _"It says I'm using Undertow but I'm not."_ Check transitive dependencies — Undertow
  sometimes sneaks in via a starter. Run `./mvnw dependency:tree | grep undertow`.

</details>

---

<details>
<summary><strong>A5.</strong> Do my GitHub Actions Java versions match my pom?</summary>

**What's happening.** Your `pom.xml` says Java 25, but your CI workflow files still
ask for Java 21. Builds work locally but fail in CI (or worse — pass in CI on a wrong
JDK and fail in production).

**Easiest thing to say:**

> "Do my GitHub Actions Java versions match my build file?"

**Other ways you might phrase it:**

> "Check my CI/CD Java version alignment."
>
> "Are my workflows on the right JDK?"
>
> "Run `/check-github-actions`."

**What gets used under the hood:**

- Command: [`/check-github-actions`](../../commands/check-github-actions.md)
- Skill: [`github-actions-detector`](../../skills/github-actions-detector/SKILL.md)

**What you get back.** A status per workflow file: ALIGNED / MISALIGNED / MIXED /
NO_CI. If something's off, you'll see which file and which line. Read-only — no fix
applied. To fix automatically, follow up with the
[`github-actions-updater`](../../skills/github-actions-updater/SKILL.md) skill (or run
the maintenance workflow in [E1](e-maintenance.md#e1)).

**What if something goes wrong?**

- _"It says MIXED — what does that mean?"_ Different workflow files in your repo use
  different Java versions. Common when you have a matrix build with multiple JDKs,
  which is fine. But if it's accidental, decide on one version and align them.
- _"My workflow is in a non-standard location and it didn't find it."_ The skill looks
  in `.github/workflows/*.yml`. If your workflows live elsewhere, move them or pass
  the path explicitly.

</details>

---

<details>
<summary><strong>A6.</strong> Is my Spring AI app at risk of crashing on startup?</summary>

**What's happening.** Spring AI 2.0 has a subtle landmine: when more than one provider
starter (OpenAI + Ollama, for example) is on the classpath, every unset
`spring.ai.model.<type>` property silently defaults to OpenAI. If you don't have an
OpenAI API key set for _every_ model type, the app dies on boot. This skill tells you
if you're at risk **without changing anything**.

**Easiest thing to say:**

> "Will my Spring AI app crash on startup with the OpenAI credentials error?"

**Other ways you might phrase it:**

> "Check if I have a Spring AI multi-provider collision."
>
> "Is Spring AI silently defaulting to OpenAI somewhere?"
>
> "Run `/detect-multi-provider-collision`."

**What gets used under the hood:**

- Command:
  [`/detect-multi-provider-collision`](../../commands/detect-multi-provider-collision.md)
- Skill:
  [`spring-ai-model-selector-enforcer`](../../skills/spring-ai-model-selector-enforcer/SKILL.md)
  (in `--mode=detect`)

**What you get back.** A list of providers detected on the classpath, every Spring
profile in your project, and for each profile which of the six
`spring.ai.model.{chat,embedding,image,moderation,audio.speech,audio.transcription}`
selectors are missing. If everything's set, you'll get a clean ✅. To actually fix it,
see [C2](c-spring-ai.md#c2).

**What if something goes wrong?**

- _"It says I have a collision but my app starts fine."_ You probably have a real
  `OPENAI_API_KEY` set in your environment, so the silent OpenAI fallback works by
  accident. The fix is still worth applying — the next environment without that key
  will crash.
- _"It says no providers detected, but I'm clearly using Spring AI."_ You may be using
  the older 1.x starter names (`spring-ai-openai-spring-boot-starter`). The skill
  recognizes those too; if it doesn't, check that the dependency is actually in your
  build file and not just declared in a profile that isn't active.

</details>
