# G. Recovery & Resumption

> ← [Back to Use Cases home](README.md)

Migrations fail. Laptops die mid-run. Hook scripts block a commit. Your boss
interrupts you. This group is for picking up the pieces.

---

<details id="g1">
<summary><strong>G1.</strong> Pick up a migration that crashed or was interrupted</summary>

**What's happening.** Something stopped the migration partway through — a failed
test, a network hiccup, a hook that blocked a commit, you hit Ctrl-C, or the
marketplace itself got upgraded. The migration left a `.migration-state.yaml` file in
the project recording what's done and what's pending. Resume picks up from there
instead of re-running the whole thing.

**Easiest thing to say:**

> "Resume the migration on this project."

**Other ways you might phrase it:**

> "Pick up where the migration left off."
>
> "Continue the migration."
>
> "Run `/resume`."

**What gets used under the hood:**

- Command: [`/resume`](../../commands/resume.md)
- Skill:
  [`resume-migration`](../../skills/resume-migration/SKILL.md)
- Underlying state:
  [`migration-state`](../../skills/migration-state/SKILL.md)

**What you get.** Resume reads `.migration-state.yaml`, checks out the recorded
migration branch (re-using it, not re-creating), figures out which skills/transformations
were applied at which version, and runs **only** the missing ones. If you've also
upgraded the marketplace between attempts, resume picks up new transformations from
the newer skill versions too.

**Concrete examples of when to use resume:**

- _"I was migrating to Boot 4 and the Spring AI step failed compile."_ Fix the
  compile error (or let Claude fix it), then resume.
- _"My laptop crashed mid-migration."_ Pull the branch, run resume — every applied
  skill is committed atomically, so nothing is lost.
- _"I upgraded the marketplace from v1.10 to v1.11 — are there new transformations
  to apply?"_ Yes. Run resume on existing migration branches; it diffs the skill
  versions and applies what's new.

**What if something goes wrong?**

- _"It says `.migration-state.yaml` is missing."_ The migration probably never
  started (or you're in the wrong branch). Run [A1](a-diagnostic.md#a1) on the project
  first to confirm state, then start the migration normally with
  [`/migrate`](../../commands/migrate.md) or one of the focused commands.
- _"Resume says everything is up-to-date but my project clearly still has issues."_
  The state file thinks everything was applied. Either it's correct and the remaining
  issues are unrelated (run [A1](a-diagnostic.md#a1) to see), or the state file is
  stale — delete it and re-run the migration command from scratch. State files are
  per-branch, so deleting and re-creating doesn't affect main.
- _"I want to undo a specific transformation."_ The cleanest path is `git revert` on
  that specific commit, then manually edit `.migration-state.yaml` to remove the
  matching entry from `appliedTransformations`. Resume will pick it up on the next
  run because the detection pattern will still match.
- _"Two of us were both migrating the same project on different branches."_ State
  files are branch-specific, so this works by design. Each branch has its own state.
  Merging two migration branches is a normal git merge; conflicts in
  `.migration-state.yaml` should be resolved by keeping both `appliedTransformations`
  entries (the file is additive).

</details>
