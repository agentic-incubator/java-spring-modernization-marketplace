# F. Portfolio / Multi-Repo Use Cases

> ← [Back to Use Cases home](README.md)

You have a fleet of Spring repos to migrate, not just one. This group handles cloning,
analyzing, migrating, and PR-creating across many repos in parallel.

---

<details id="f1">
<summary><strong>F1.</strong> Migrate a list of GitHub repos in parallel, with automatic PRs</summary>

**What's happening.** You have 5, 10, or 30 microservices to migrate. Doing them one
at a time is painful and error-prone. This use case clones them all, migrates them in
parallel (respecting inter-repo dependencies — libraries before consumers), and opens
PRs on each one.

**Easiest thing to say:**

> "Migrate these repos to Spring Boot 4 in parallel and open PRs:
> <https://github.com/myorg/repo-a>, <https://github.com/myorg/repo-b>,
> <https://github.com/myorg/repo-c>"

**Other ways you might phrase it:**

> "Clone these 8 repos and migrate them all to Boot 4."
>
> "Run the migration across my whole portfolio."
>
> "Run `/migrate-github` against this list."

**With a manifest file:**

```bash
/migrate-github repos.json --parallel
```

Where `repos.json` lists repos and optional inter-repo dependencies:

```json
{
  "repos": [
    { "url": "https://github.com/myorg/shared-lib", "tier": 1 },
    { "url": "https://github.com/myorg/api-gateway", "tier": 2, "dependsOn": ["shared-lib"] },
    { "url": "https://github.com/myorg/web-app", "tier": 2, "dependsOn": ["shared-lib"] }
  ]
}
```

**What gets used under the hood:**

- Command: [`/migrate-github`](../../commands/migrate-github.md)
- Agent:
  [`parallel-orchestrator`](../../agents/parallel-orchestrator.md)
- Skills:
  [`github-workflow`](../../skills/github-workflow/SKILL.md) (cloning + branching),
  [`pr-submitter`](../../skills/pr-submitter/SKILL.md) (PR creation),
  [`label-manager`](../../skills/label-manager/SKILL.md) (ensures the PR labels exist
  in each target repo), and everything the regular [`/migrate`](../../commands/migrate.md)
  uses underneath.

**What you get.** Repos cloned to `/tmp/migration-workspace/` (configurable), each
migrated on its own branch, PRs opened with consistent titles + bodies + labels.
Tier 1 libraries finish before tier 2 apps start, so by the time the app migration
runs, the new library version is available.

**Useful flags:**

| Flag                 | What it does                                                     |
| -------------------- | ---------------------------------------------------------------- |
| `--parallel`         | Run independent operations in parallel (default sequential)      |
| `--dry-run`          | Plan only — no clones, no PRs                                    |
| `--branch <name>`    | Override the default migration branch name                       |
| `--skip-pr`          | Migrate locally without opening PRs                              |
| `--labels <list>`    | Comma-separated PR labels (default `spring-boot-4,dependencies`) |
| `--workspace <path>` | Where to clone repos (default `/tmp/migration-workspace`)        |

**What if something goes wrong?**

- _"It says I'm rate-limited by GitHub."_ You have too many parallel API calls. Drop
  the `--parallel` flag (or set `MAX_PARALLEL=3` if your `gh` CLI supports it) and
  rerun. The orchestrator picks up where it left off if you also pass
  [`/resume`](../../commands/resume.md) per-repo.
- _"One repo failed and now nothing else moves."_ Use the per-repo state file in
  `.migration-state.yaml` inside each cloned repo to see which ones succeeded. Re-run
  with a filtered repo list excluding the bad one; investigate the bad one with
  [A1](a-diagnostic.md#a1) inside its directory.
- _"A repo I depend on isn't in the list — the orchestrator built it on tier 0."_ If
  the dependency relationship isn't in your `repos.json`, the orchestrator can't see
  it. Either add it to the manifest, or migrate the missing repo first as a one-off.
- _"PRs were opened but with wrong labels."_ The
  [`label-manager`](../../skills/label-manager/SKILL.md) skill creates labels in the
  target repo if they don't exist. If you need different labels, pass `--labels` to
  override the defaults.
- _"I don't have a GitHub token."_ The `gh` CLI handles auth — run `gh auth login`
  once and the workflow uses your credentials.

</details>
