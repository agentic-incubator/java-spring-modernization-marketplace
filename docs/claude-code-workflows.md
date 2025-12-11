# Working with Claude Code

This guide demonstrates how to get the most value from the Spring Modernization Marketplace by interacting with Claude Code conversationally.

## Why Claude Code?

Instead of reading through documentation to find answers, you can simply ask Claude Code questions and get immediate, contextual help. Claude Code:

- Searches the codebase and documentation for you
- Generates configurations tailored to your needs
- Explains options and trade-offs
- Helps you build migration plans step by step

## Real-World Example: Building a Migration Configuration

Here's an actual conversation showing how Claude Code helps build a custom `repos.json` for migrating multiple GitHub repositories.

### Step 1: Ask About Input Formats

**User:**

> If I wanted to supply a repos.txt file to /migrate-github command what should it contain? How should it be formatted?

**Claude Code:** _(searches documentation, finds the answer)_

The file should contain one GitHub URL per line:

```text
https://github.com/org/repo1
https://github.com/org/repo2
https://github.com/org/repo3
```

That's it! No special formatting needed.

**Usage:**

```bash
/spring-m11n:migrate-github repos.txt --parallel
```

#### Alternative: JSON Format

If you need more control (dependencies between repos, explicit tiers, priority), use a `repos.json` instead:

```json
{
  "workspace": "/tmp/migration-workspace",
  "branchName": "feature/spring-boot-4-migration",
  "parallel": true,
  "createPRs": true,
  "repos": [
    {
      "url": "https://github.com/org/common-lib",
      "priority": 1,
      "tier": "library"
    },
    {
      "url": "https://github.com/org/app-service",
      "dependsOn": ["common-lib"],
      "tier": "application"
    }
  ]
}
```

### Step 2: Verify Documentation Exists

**User:**

> Is this documented? Where should it be, if not?

**Claude Code:**

Yes, it's documented in two places:

1. `commands/migrate-github.md` (lines 19-31) - The command definition itself
2. `docs/github-workflows.md` (lines 40-68) - Dedicated workflow documentation

### Step 3: Generate Custom Configuration

**User:**

> Can you take that json example and help me build another that contains the following github
> repos (I will only provide the owner/repo-name, I hope you can supplement):
> cf-toolsuite/cf-kaizen, cf-toolsuite/home, cf-toolsuite/sanford, cf-toolsuite/sanford-ui.
> sanford-ui depends on sanford. The tier for all these is application.

**Claude Code:** _(generates complete configuration)_

```json
{
  "workspace": "/tmp/migration-workspace",
  "branchName": "feature/spring-boot-4-migration",
  "parallel": true,
  "createPRs": true,
  "repos": [
    {
      "url": "https://github.com/cf-toolsuite/cf-kaizen",
      "tier": "application"
    },
    {
      "url": "https://github.com/cf-toolsuite/home",
      "tier": "application"
    },
    {
      "url": "https://github.com/cf-toolsuite/sanford",
      "tier": "application"
    },
    {
      "url": "https://github.com/cf-toolsuite/sanford-ui",
      "dependsOn": ["sanford"],
      "tier": "application"
    }
  ]
}
```

This will:

- Migrate `cf-kaizen`, `home`, and `sanford` in parallel (no dependencies)
- Wait for `sanford` to complete before migrating `sanford-ui`
- Create PRs for all successful migrations

## Tips for Effective Interactions

### Be Specific About Your Context

Instead of:

> How do I migrate?

Try:

> I have 4 Spring Boot 3.3 applications that need to migrate to Spring Boot 4. Two of them share a common library. How should I structure the migration?

### Ask Claude Code to Generate Configurations

Instead of manually writing JSON or YAML, describe what you need:

> Create a repos.json for these GitHub repos: org/app1, org/app2, org/shared-lib. Both apps depend on shared-lib.

### Verify Before Executing

Use `--dry-run` to preview what will happen:

```bash
/spring-m11n:migrate-github repos.json --parallel --dry-run
```

### Ask for Explanations

If something isn't clear:

> What does the "tier" field do in repos.json?
> Why would I use JSON instead of a simple text file?

## Common Questions to Ask

| Question                                       | What You'll Get                              |
| ---------------------------------------------- | -------------------------------------------- |
| "What commands are available?"                 | List of all slash commands with descriptions |
| "How do I analyze a project before migrating?" | Guidance on using `/spring-m11n:analyze`     |
| "What does this error mean?"                   | Explanation and suggested fixes              |
| "Can you help me build a migration plan?"      | Step-by-step approach tailored to your repos |
| "What changes will be made to my code?"        | Detailed breakdown of transformations        |

## Next Steps

- Try `/spring-m11n:analyze /path/to/your/project` to assess migration requirements
- Ask Claude Code to help you build a `repos.json` for your specific repositories
- Use `--dry-run` to preview migrations before executing
