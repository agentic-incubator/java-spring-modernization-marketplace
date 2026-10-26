# Spring Modernization Marketplace

A Claude Code plugin marketplace (`spring-m11n`) for Spring ecosystem modernization. The repo is the
plugin: it ships Markdown only, with no application code.

## Layout

- `skills/<name>/SKILL.md`: the skills. Each needs YAML frontmatter with `name` (lowercase kebab-case, at most
  63 characters, equal to the folder name) and `description`, so Codex can load them too.
- `agents/`, `commands/`: the plugin's agents and slash commands.
- `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`: the plugin and marketplace manifests.
- `.claude/agents/`, `.claude/commands/`: tools for working on this repo, not part of the plugin.
- `docs/`: user documentation. `scripts/validate-skills.mjs`: the skill frontmatter check.

## Before you commit

- Run `pnpm check` (skill validation, Prettier, markdownlint): CI's Format & Lint job runs the same.
  `pnpm fix` applies Prettier and markdownlint fixes.
- `pnpm audit --audit-level moderate` must pass: CI's Security Audit job.
- `pnpm link-check` checks links with lychee; CI runs it on its own workflow.
- The pre-commit hook (`.githooks/`, set by `pnpm install`) lints and formats staged Markdown.

## Releases

A release bumps the same version in `package.json`, `.claude-plugin/plugin.json` and both entries in
`.claude-plugin/marketplace.json`, and adds a `CHANGELOG.md` entry (Keep a Changelog, Semantic Versioning).

## Rules

- Do what was asked; nothing more. Read a file before editing it.
- Never commit secrets or `.env` files.
- AI tool output (`.claude-flow/`, `.swarm/`, `.agentic-qe/`, `.mcp.json`, `.codex/`) is gitignored; keep it
  out of commits.
