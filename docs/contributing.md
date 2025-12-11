# Contributing

How to contribute to the Spring Modernization Marketplace.

## Overview

This marketplace is open for contributions. You can add:

- New slash commands
- New agents
- New skills
- Bug fixes
- Documentation improvements

## Directory Structure

```text
spring-modernization-marketplace/
├── agents/           # Sub-agents (*.md)
├── commands/         # Slash commands (*.md)
├── skills/           # Skills (*/SKILL.md)
├── docs/             # Documentation
└── .claude-plugin/   # Plugin configuration
```

## Adding a Slash Command

Create a new file in `commands/`:

```markdown
---
description: Brief description shown in help
argument-hint: [args] [--options]
allowed-tools: Read, Glob, Grep, Bash
---

# Command Name

What this command does.

## Usage

\`\`\`bash
/command-name [args]
\`\`\`

## Workflow

1. Step one
2. Step two
3. Step three
```

### Frontmatter Fields

| Field           | Required | Description                |
| --------------- | -------- | -------------------------- |
| `description`   | Yes      | Help text for the command  |
| `argument-hint` | Yes      | Shows expected arguments   |
| `allowed-tools` | Yes      | Tools this command can use |

## Adding an Agent

Create a new file in `agents/`:

```markdown
---
name: my-agent
description: What this agent does
tools: Read, Write, Edit, Glob, Grep, Bash
model: sonnet
skills: skill-one, skill-two
---

# Agent Name

You are [agent role]. You [agent purpose].

## Your Role

What this agent is responsible for.

## Workflow

How this agent operates.

## Delegation

What skills/agents this one uses.
```

### Frontmatter Fields

| Field         | Required | Description                     |
| ------------- | -------- | ------------------------------- |
| `name`        | Yes      | Agent identifier                |
| `description` | Yes      | Purpose and use case            |
| `tools`       | Yes      | Tools available to this agent   |
| `model`       | No       | `sonnet`, `haiku`, or `inherit` |
| `skills`      | No       | Comma-separated skill names     |

## Adding a Skill

Create a new directory in `skills/` with a `SKILL.md` file:

```text
skills/
└── my-skill/
    └── SKILL.md
```

Skill format:

```markdown
---
name: my-skill
description: What this skill does
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Skill Name

What this skill does.

## Critical Rules

Important constraints and rules.

## Examples

### Before

\`\`\`java
// old code
\`\`\`

### After

\`\`\`java
// new code
\`\`\`

## Steps

1. Step one
2. Step two
```

### Frontmatter Fields

| Field           | Required | Description              |
| --------------- | -------- | ------------------------ |
| `name`          | Yes      | Skill identifier         |
| `description`   | Yes      | Purpose and use case     |
| `allowed-tools` | Yes      | Tools this skill can use |

## Code Style

### Markdown

This project uses Prettier and markdownlint:

```bash
# Check formatting
pnpm run check

# Auto-fix issues
pnpm run fix
```

### Conventions

- Use kebab-case for file names
- Use clear, descriptive names
- Include examples with before/after patterns
- Document critical rules prominently
- Add tables for reference information

## Testing Your Contribution

1. Install the plugin locally:

   ```bash
   claude plugin install /path/to/spring-modernization-marketplace
   ```

1. Test your command/agent/skill:

   ```bash
   # For commands
   /your-command /path/to/test/project

   # For agents - they're invoked by the orchestrator or other agents
   ```

1. Verify with a real Spring project

## Pull Request Process

1. Fork the repository

1. Create a feature branch:

   ```bash
   git checkout -b feature/my-new-skill
   ```

1. Make your changes

1. Run formatting:

   ```bash
   pnpm run fix
   ```

1. Commit with clear message:

   ```bash
   git commit -m "feat: add my-new-skill for XYZ migration"
   ```

1. Push and create PR:

   ```bash
   git push origin feature/my-new-skill
   gh pr create
   ```

### PR Guidelines

- Clear title describing the change
- Description of what and why
- Link to any related issues
- Test results or examples

## Ideas for Contributions

### New Migration Skills

- Hibernate 6 to 7
- JUnit 4 to 5
- Log4j to SLF4J
- Apache HttpClient 4 to 5

### New Commands

- `/rollback` - Undo a migration
- `/diff` - Show migration changes
- `/report` - Generate migration report

### Improvements

- Better error messages
- More OpenRewrite recipes
- Performance optimizations
- Additional test coverage

## Questions?

Open an issue on GitHub for:

- Feature requests
- Bug reports
- Questions about contributing
