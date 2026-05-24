# Use Cases & Sample Prompts

Welcome! This guide answers the question: **"What can I actually ask Claude to do with
this marketplace?"** Each use case is something a real developer wanted help with at
some point — paired with the simplest way to ask for it, plus what's running behind
the scenes.

> 💡 **Every use case below is collapsible.** Click the ▸ next to a heading to expand
> it. You'll see the prompts you can copy-paste, what runs under the hood, and how to
> recover when something goes sideways.

## Pick your starting point

| If you want to…                                         | Go to                                            |
| ------------------------------------------------------- | ------------------------------------------------ |
| Find out what state your project is in (no changes yet) | [A. Diagnostic](a-diagnostic.md)                 |
| Upgrade a single project's framework version            | [B. Framework upgrades](b-framework-upgrades.md) |
| Deal with Spring AI specifically                        | [C. Spring AI](c-spring-ai.md)                   |
| Fix one specific thing (Jackson, Security, Vaadin, …)   | [D. Targeted fixes](d-targeted-fixes.md)         |
| Run periodic dependency hygiene                         | [E. Maintenance](e-maintenance.md)               |
| Migrate many repos at once                              | [F. Portfolio](f-portfolio.md)                   |
| Resume a migration that crashed or stalled              | [G. Recovery](g-recovery.md)                     |
| Touch build tools, wrappers, or deployment manifests    | [H. Build tooling](h-build-tooling.md)           |

## How these prompts work

You can talk to Claude Code two ways, and both work for everything in this guide:

1. **Just say what you want, in plain English.**
   _"Upgrade this project to Spring Boot 4."_
   Claude looks at the marketplace, picks the right agent or command, and runs it.

2. **Use a slash command directly.**
   _`/spring-m11n:migrate /path/to/project`_
   Faster and more explicit when you already know which command you want.

Either form works. Use whichever feels more natural for you.

## A few ground rules

- **Nothing here touches `main`.** Every migration runs on its own branch so you can
  inspect the diff before merging.
- **Migrations are resumable.** If your laptop dies mid-migration, run
  [`/resume`](../../commands/resume.md) on the same project — work continues from the
  last checkpoint.
- **Dry-runs exist.** Most commands accept `--dry-run` so you can preview without
  changing anything.
- **It's okay if a migration partially succeeds.** Every step writes to
  `.migration-state.yaml` so you (and Claude) can see what's done.

## New to the marketplace?

If you're brand new, start by running the **Diagnostic** group on your project — it
tells you exactly what's outdated and what migrations apply, without changing any
files. Then come back to the appropriate "upgrade" or "fix" group.
