# E. Maintenance & Hygiene

> ← [Back to Use Cases home](README.md)

These use cases are for the routine "keep things tidy" work — periodic dependency
bumps, Dependabot consolidation, validation passes, and one-off RC opt-ins.

---

<details id="e1">
<summary><strong>E1.</strong> Run the usual periodic dependency maintenance</summary>

**What's happening.** Once a month (or once a quarter — pick your cadence), you bump
stable dependency versions, fold in Dependabot PRs, run quality gates, and open one
clean PR. This use case automates all of that into a single command.

**Easiest thing to say:**

> "Do the usual dependency-maintenance run on this project."

**Other ways you might phrase it:**

> "Update dependencies, run tests, lint, commit, and open a PR."
>
> "Run the maintenance workflow."
>
> "Consolidate Dependabot PRs."
>
> "Perform a security audit and upgrade."

**What gets used under the hood:**

- Skill:
  [`java-maintenance-workflow`](../../skills/java-maintenance-workflow/SKILL.md)
- Composes with:
  [`dependency-updater`](../../skills/dependency-updater/SKILL.md) (stable-only by default),
  [`github-actions-updater`](../../skills/github-actions-updater/SKILL.md),
  [`build-runner`](../../skills/build-runner/SKILL.md),
  [`pr-submitter`](../../skills/pr-submitter/SKILL.md)

**What you get.** A `maintenance/dependency-upgrades-and-security-<date>` branch
with: open Dependabot PRs consolidated and closed, all stable deps bumped, GitHub
Actions versions bumped, SpotBugs exclusions bootstrapped if missing, quality gates
run (Spotless → compile → test → SpotBugs), and one PR opened with a version-change
table in the body.

**What if something goes wrong?**

- _"It skipped Spring Boot even though there's a new RC."_ By default the workflow
  excludes RC, milestone, and snapshot versions. That's intentional — production
  projects should opt in to RCs explicitly. See [E3](#e3) to opt into one RC.
- _"Tests failed after the bump."_ The workflow records the failure in
  `.migration-state.yaml`. Read the test failure, fix or revert the offending bump,
  re-run.
- _"SpotBugs is finding 200 'bugs' I don't care about."_ The workflow bootstraps a
  `spotbugs-exclude.xml` file with sensible defaults for Spring DI patterns and
  framework-generated code. If you have more to suppress, edit that file.
- _"It tried to push but I don't have write access."_ The workflow will commit
  locally but warn you about the push failure. Push the branch manually under your own
  credentials, or run with `--skip-pr` for a local-only run.

</details>

---

<details id="e2">
<summary><strong>E2.</strong> I have 15 open Dependabot PRs — consolidate them</summary>

**What's happening.** Dependabot opens one PR per dependency, which gets noisy fast.
This use case folds them all into one consolidated maintenance PR and closes the
individual ones with a polite comment.

**Easiest thing to say:**

> "Triage all open Dependabot PRs and roll them into a single PR."

**Other ways you might phrase it:**

> "Consolidate the Dependabot bumps."
>
> "Close all those Dependabot PRs and combine them."
>
> "Incorporate Dependabot PRs."

**What gets used under the hood:**

This is actually a sub-step of [E1](#e1) — the
[`java-maintenance-workflow`](../../skills/java-maintenance-workflow/SKILL.md) skill
always does Dependabot consolidation as its second step. Saying "consolidate
Dependabot PRs" triggers the full workflow; if you really only want the
consolidation step, say so explicitly:

> "Just consolidate the open Dependabot PRs — don't bump other dependencies."

**What you get.** Every open Dependabot PR is reviewed, its version bumps are copied
into the consolidated maintenance branch, and the original PR is closed with a
comment like _"Consolidated into maintenance/dependency-upgrades-and-security-2026-05-23.
Thank you, Dependabot!"_

**What if something goes wrong?**

- _"It closed a Dependabot PR I wanted to keep open."_ Re-open it via the GitHub UI.
  The branch should still exist (GitHub auto-deletes only after merge by default;
  closing-without-merge keeps the branch).
- _"Two Dependabot PRs conflict on the same dependency."_ The workflow picks the
  newer version. If you wanted the older one for a reason, edit the consolidated
  branch by hand.
- _"It can't reach the Dependabot API."_ You need the `security_events` token scope
  for full alert access. Without it, the workflow falls back to reading from open PR
  labels — still useful but less complete.

</details>

---

<details id="e3">
<summary><strong>E3.</strong> Bump only Spring Boot to an RC, keep everything else stable</summary>

**What's happening.** You want to try Spring Boot 4.1.0-RC1 (or Spring AI 2.0.0-M7,
or any RC/milestone), but you don't want the maintenance workflow's filter to widen
globally and accidentally pull in unrelated RCs.

**Easiest thing to say:**

> "Bump only Spring Boot to 4.1.0-RC1; keep everything else on stable."

**Other ways you might phrase it:**

> "Opt into the Boot 4.1 RC."
>
> "Do the maintenance run but allow Spring Boot to go to 4.1.0-RC1."
>
> "Run the maintenance workflow with `--target-rc=spring-boot:4.1.0-RC1`."

**What gets used under the hood:**

- Skill (with the new flag):
  [`java-maintenance-workflow`](../../skills/java-maintenance-workflow/SKILL.md) v1.1.0+
  with `--target-rc=spring-boot:4.1.0-RC1`
- Underlying:
  [`dependency-updater`](../../skills/dependency-updater/SKILL.md) v2.1.0+ supports the
  same flag

**What you get.** The global `stable-only` filter stays in effect — so guava, jackson,
etc. only bump to stable. But Spring Boot is allowed to resolve to `4.1.0-RC1`
specifically. The Spring Milestones repository is auto-added to both `<repositories>`
and `<pluginRepositories>` so the RC plugin actually resolves.

**What if something goes wrong?**

- _"Other RCs leaked in."_ Check that you used `--target-rc=` (per-artifact override)
  and not `--filter-strategy=include-milestones` (which widens the global filter).
  The two flags are different.
- _"The plugin still won't resolve."_ You may be missing the
  `<pluginRepositories>` block. The flag should add it; if your `pom.xml` was already
  customized in a way the auto-edit didn't handle, add the block manually (see the
  [migration-protocol](../../skills/migration-protocol/SKILL.md) skill for the exact
  XML).

</details>

---

<details id="e4">
<summary><strong>E4.</strong> Just validate the current state — don't apply anything</summary>

**What's happening.** Maybe you just merged a migration PR and want to confirm
everything still compiles, tests pass, and nothing else is broken. Or you want to
re-check after manually editing files.

**Easiest thing to say:**

> "Validate this project's migration state."

**Other ways you might phrase it:**

> "Run the build and tests."
>
> "Confirm the migration is still good."
>
> "Run `/validate`."

**What gets used under the hood:**

- Command: [`/validate`](../../commands/validate.md)
- Agent:
  [`validation-agent`](../../agents/validation-agent.md)
- Skill: [`build-runner`](../../skills/build-runner/SKILL.md)

**What you get.** Compile and test results, deprecation warnings, Spotless format
check status. No file changes.

**What if something goes wrong?**

- _"Tests pass but I get a Spotless format warning."_ Run `./mvnw spotless:apply`
  (or `./gradlew spotlessApply`) to fix formatting in place.
- _"Compilation works but I see a pile of deprecation warnings."_ That's not a
  validation failure, but it's a hint that future migrations are pending. Run
  [A1](a-diagnostic.md#a1) to see what's deprecated.
- _"`build-runner` says my Maven wrapper version is too old."_ Run the
  [`build-tool-upgrader`](../../skills/build-tool-upgrader/SKILL.md) skill — see
  [H1](h-build-tooling.md#h1).

</details>
