---
description: Clone and migrate multiple GitHub repositories to Spring Boot 4.x with parallel processing and automatic PR creation
argument-hint: [repo-list-or-file] [--parallel] [--branch name] [--workspace path] [--dry-run] [--skip-pr]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task
---

# Migrate GitHub Repositories

Clone, migrate, and create PRs for GitHub repositories specified in `$ARGUMENTS`.

## Input Formats

### Comma-Separated URLs

```bash
/migrate-github https://github.com/org/repo1,https://github.com/org/repo2,https://github.com/org/repo3
```

### From File (repos.txt)

```bash
/migrate-github repos.txt --parallel
```

**repos.txt format:**

```urls
https://github.com/org/repo1
https://github.com/org/repo2
https://github.com/org/repo3
```

### From JSON File (repos.json)

```bash
/migrate-github repos.json --parallel
```

**repos.json format:**

```json
{
  "workspace": "/tmp/migration-workspace",
  "branchName": "feature/spring-boot-4-migration",
  "parallel": true,
  "createPRs": true,
  "repos": [
    {
      "url": "https://github.com/org/repo1",
      "priority": 1,
      "tier": "library",
      "labels": ["core-library"]
    },
    {
      "url": "https://github.com/org/repo2",
      "dependsOn": ["repo1"],
      "tier": "application"
    }
  ]
}
```

## Options

| Option               | Description                            | Default                           |
| -------------------- | -------------------------------------- | --------------------------------- |
| `--parallel`         | Run independent migrations in parallel | false                             |
| `--branch <name>`    | Feature branch name                    | `feature/spring-boot-4-migration` |
| `--workspace <path>` | Local directory for cloned repos       | `/tmp/migration-workspace`        |
| `--dry-run`          | Show plan without executing            | false                             |
| `--skip-pr`          | Skip PR creation after migration       | false                             |
| `--labels <list>`    | PR labels (comma-separated)            | `spring-boot-4,dependencies`      |

## Workflow

### Phase 1: Setup

1. Parse input (URLs, file, or JSON)
2. Create workspace directory
3. Verify GitHub CLI authentication (`gh auth status`)
4. Validate all repository URLs are accessible

### Phase 2: Clone

1. Clone all repositories to workspace
2. In parallel mode: clone concurrently using background processes
3. Report clone status for each repo

```bash
# Parallel clone example
WORKSPACE="/tmp/migration-workspace"
mkdir -p "$WORKSPACE"

for repo_url in "${REPOS[@]}"; do
  repo_name=$(basename "$repo_url" .git)
  gh repo clone "$repo_url" "$WORKSPACE/$repo_name" &
done
wait
```

### Phase 3: Discovery

1. Run discovery-agent on each repository
2. Identify migration requirements (Jackson, Security, Vaadin, Spring AI)
3. Build dependency graph between repositories
4. Sort into migration tiers

```json
{
  "tiers": {
    "1": ["common-lib", "utils-lib"],
    "2": ["app-service", "api-gateway"],
    "3": ["frontend-app"]
  },
  "dependencies": {
    "app-service": ["common-lib"],
    "api-gateway": ["common-lib", "utils-lib"]
  }
}
```

### Phase 4: Migration

Execute migrations respecting dependency order:

1. **Tier 1** (libraries with no deps): Migrate in parallel
2. **Tier 2** (depends on Tier 1): Wait for Tier 1, then migrate in parallel
3. **Tier 3** (external deps): Migrate after Tier 2

For each repository:

```bash
cd "$WORKSPACE/$repo_name"

# Create feature branch
git checkout -b "$BRANCH_NAME"

# Run migration (delegate to migration-agent)
# - Update build files
# - Migrate imports
# - Update configurations

# Validate build
./mvnw clean verify -DskipTests || ./gradlew clean build -x test
```

### Phase 5: Validation

1. Run full build with tests for each repo
2. Capture any failures or warnings
3. Mark repos as COMPLETE or FAILED

### Phase 5.5: Label Pre-Creation

Before creating PRs, ensure all required labels exist in each target repository:

1. Parse labels from `--labels` option (comma-separated)
2. For each repository that will receive a PR:
   - Query existing labels: `gh label list --repo owner/repo`
   - Compare against required labels
   - Create missing labels: `gh label create --repo owner/repo --name <label>`
3. Log label creation status (non-blocking on failures)

```bash
# Pre-create labels for each repo
LABELS="spring-boot-4,automated,needs-review"
IFS=',' read -ra LABEL_ARRAY <<< "$LABELS"

# Default configurations for common migration labels
declare -A LABEL_COLORS=(
  ["spring-boot-4"]="0E8A16"
  ["automated"]="1D76DB"
  ["needs-review"]="FBCA04"
)

for repo_path in "${SUCCESSFUL_REPOS[@]}"; do
  REPO_URL=$(git -C "$repo_path" remote get-url origin)
  REPO=$(echo "$REPO_URL" | sed -E 's|.*github\.com[:/]([^/]+/[^/.]+).*|\1|')

  EXISTING=$(gh label list --repo "$REPO" --json name --jq ".[].name")

  for label in "${LABEL_ARRAY[@]}"; do
    if ! echo "$EXISTING" | grep -q "^${label}$"; then
      echo "Creating label '$label' in $REPO..."
      gh label create "$label" --repo "$REPO" \
        --color "${LABEL_COLORS[$label]:-CCCCCC}" 2>/dev/null || true
    fi
  done
done
```

**Note:** Label creation failures are non-blocking. PRs will be created without labels if permission issues prevent label creation.

### Phase 6: PR Creation

For each successfully migrated repository, automatically detecting if fork-based workflow is needed:

```bash
cd "$WORKSPACE/$repo_name"
CURRENT_USER=$(gh api user --jq ".login")
UPSTREAM_REPO=$(git remote get-url origin | sed -E 's|.*github\.com[:/]([^/]+/[^/.]+).*|\1|')

# Stage and commit
git add -A
git commit -m "chore: migrate to Spring Boot 4.x

- Update Spring Boot parent to 4.0.0
- Migrate Jackson 2.x to 3.x
- Update Spring Security 6 to 7
- Update Spring Cloud BOM to 2025.1.0

Generated by Spring Modernization Marketplace"

# Check permissions to determine workflow
PERMISSION=$(gh repo view "$UPSTREAM_REPO" --json viewerPermission --jq ".viewerPermission")

if [[ "$PERMISSION" =~ ^(ADMIN|MAINTAIN|WRITE)$ ]]; then
  # Direct push workflow
  git push -u origin "$BRANCH_NAME"
  gh pr create \
    --title "chore: Migrate to Spring Boot 4.x" \
    --body "$PR_BODY" \
    --label "$LABELS"
else
  # Fork-based workflow (READ-only access)
  gh repo fork "$UPSTREAM_REPO" --clone=false 2>/dev/null || true
  git remote add fork "https://github.com/$CURRENT_USER/$repo_name.git" 2>/dev/null || true
  git push -u fork "$BRANCH_NAME"
  gh pr create \
    --repo "$UPSTREAM_REPO" \
    --head "$CURRENT_USER:$BRANCH_NAME" \
    --title "chore: Migrate to Spring Boot 4.x" \
    --body "$PR_BODY" \
    --label "$LABELS"
fi
```

**Permission-Based Workflow Selection:**

| Permission Level     | Workflow   | Push Target | Notes                                   |
| -------------------- | ---------- | ----------- | --------------------------------------- |
| ADMIN/MAINTAIN/WRITE | Direct     | `origin`    | Standard contributor access             |
| READ/none            | Fork-based | `fork`      | Creates fork, uses `--head user:branch` |

## Parallel Execution

When `--parallel` is specified:

```text
Timeline:
─────────────────────────────────────────────────────────────────────
Clone:     [repo1]──┬──[repo2]──┬──[repo3]──┬──[repo4]
                    │           │           │
Discovery: [repo1]──┼──[repo2]──┼──[repo3]──┼──[repo4]
                    │           │           │
                    ▼           ▼           ▼
Tier Sort: ─────────[Build dependency graph]─────────
                              │
                              ▼
           ┌─────────────Tier 1─────────────┐
Migrate:   │ [repo1-lib]    [repo2-lib]     │ (parallel)
           └────────────────────────────────┘
                              │
                              ▼ (wait)
           ┌─────────────Tier 2─────────────┐
           │ [repo3-app]    [repo4-app]     │ (parallel)
           └────────────────────────────────┘
                              │
                              ▼
Labels:    [repo1]──┬──[repo2]──┬──[repo3]──┬──[repo4]
           (discover existing, create missing labels)
                              │
                              ▼
PR Create: [repo1]──┬──[repo2]──┬──[repo3]──┬──[repo4]
─────────────────────────────────────────────────────────────────────
```

## Output

### Progress Report

```json
{
  "command": "migrate-github",
  "input": "repos.txt",
  "options": {
    "parallel": true,
    "branch": "feature/spring-boot-4-migration",
    "workspace": "/tmp/migration-workspace"
  },
  "repos": [
    {
      "name": "repo1",
      "url": "https://github.com/org/repo1",
      "status": "COMPLETE",
      "tier": 1,
      "pr": {
        "number": 42,
        "url": "https://github.com/org/repo1/pull/42"
      }
    },
    {
      "name": "repo2",
      "url": "https://github.com/org/repo2",
      "status": "COMPLETE",
      "tier": 1,
      "pr": {
        "number": 18,
        "url": "https://github.com/org/repo2/pull/18"
      }
    },
    {
      "name": "repo3",
      "url": "https://github.com/org/repo3",
      "status": "FAILED",
      "tier": 2,
      "error": "Test failures in UserServiceTest",
      "pr": null
    }
  ],
  "summary": {
    "total": 3,
    "complete": 2,
    "failed": 1,
    "prsCreated": 2
  }
}
```

### Final Summary

```text
=== GitHub Migration Complete ===

Repositories: 3
Successful:   2 (PRs created)
Failed:       1

PRs Created:
  - https://github.com/org/repo1/pull/42
  - https://github.com/org/repo2/pull/18

Failed Repos (require manual attention):
  - repo3: Test failures in UserServiceTest

Workspace: /tmp/migration-workspace
```

## Error Handling

### Clone Failures

- Verify repository exists: `gh repo view org/repo`
- Check authentication: `gh auth status`
- Retry with explicit protocol: `git clone https://...`

### Migration Failures

- Save error log to `$WORKSPACE/$repo/migration-error.log`
- Continue with other repos
- Report failures in final summary

### Label Pre-Creation Failures

- Check repository permissions: `gh repo view owner/repo --json viewerPermission`
- Label creation requires WRITE, MAINTAIN, or ADMIN permission
- If lacking permissions, PRs are created without labels (non-blocking)
- Manual label creation: `gh label create "label-name" --repo owner/repo`

### PR Creation Failures

- Check if branch was pushed: `git ls-remote --heads origin $BRANCH`
- Check for existing PR: `gh pr list --head $BRANCH`
- Retry or report for manual creation

## Examples

### Basic Usage

```bash
# Single repo
/migrate-github https://github.com/myorg/my-app

# Multiple repos (comma-separated)
/migrate-github https://github.com/org/app1,https://github.com/org/app2

# From file with parallel processing
/migrate-github repos.txt --parallel

# Dry run to see plan
/migrate-github repos.json --dry-run

# Custom branch and skip PR
/migrate-github repos.txt --branch upgrade/sb4 --skip-pr
```

### Advanced Usage

```bash
# Full options
/migrate-github repos.json \
  --parallel \
  --branch feature/spring-boot-4 \
  --workspace /home/user/migrations \
  --labels "spring-boot-4,automated,needs-review"
```
