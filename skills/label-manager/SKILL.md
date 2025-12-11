---
name: label-manager
description: Manage GitHub repository labels including discovery, comparison, and creation. Use before PR creation to ensure required labels exist in target repositories.
allowed-tools: Bash, Read, Glob, Grep
---

# Label Manager Skill

Ensure GitHub repository labels exist before PR creation by discovering existing labels, comparing against required labels, and creating missing ones.

## Prerequisites

- GitHub CLI (`gh`) must be installed and authenticated
- Write access to target repositories (for label creation)
- Repository must exist and be accessible

## Why This Skill Exists

When using `gh pr create --label`, the labels must already exist in the repository. If a label doesn't exist, the PR creation fails with:

```text
could not add label: 'spring-boot-4' not found
```

This skill prevents that failure by pre-creating labels before PR submission.

## Operations

### Discover Repository Labels

List all existing labels in a repository:

```bash
# List labels with details
gh label list --repo owner/repo

# Get labels as JSON for processing
gh label list --repo owner/repo --json name,color,description
```

**Example Output:**

```json
[
  { "name": "bug", "color": "d73a4a", "description": "Something isn't working" },
  { "name": "enhancement", "color": "a2eeef", "description": "New feature or request" },
  {
    "name": "dependencies",
    "color": "0366d6",
    "description": "Pull requests that update a dependency file"
  }
]
```

### Check if Labels Exist

Check if specific labels exist in a repository:

```bash
# Check for a single label
gh label list --repo owner/repo --json name --jq ".[] | select(.name == \"spring-boot-4\")"

# Check for multiple labels
REQUIRED_LABELS=("spring-boot-4" "automated" "needs-review")
EXISTING_LABELS=$(gh label list --repo owner/repo --json name --jq ".[].name")

for label in "${REQUIRED_LABELS[@]}"; do
  if echo "$EXISTING_LABELS" | grep -q "^${label}$"; then
    echo "Label '$label' exists"
  else
    echo "Label '$label' is MISSING"
  fi
done
```

### Create Missing Labels

Create labels that don't exist in the repository:

```bash
# Create a single label
gh label create "spring-boot-4" \
  --repo owner/repo \
  --description "Spring Boot 4.x migration" \
  --color "0E8A16"

# Create with force (update if exists)
gh label create "spring-boot-4" \
  --repo owner/repo \
  --description "Spring Boot 4.x migration" \
  --color "0E8A16" \
  --force
```

### Delete Labels (Cleanup)

```bash
# Delete a label
gh label delete "old-label" --repo owner/repo --yes
```

## Pre-Creation Workflow

### Full Label Pre-Creation for PR

Ensure all required labels exist before creating a PR:

```bash
REPO="owner/repo"
REQUIRED_LABELS=("spring-boot-4" "automated" "needs-review")

# Default label configurations
declare -A LABEL_COLORS=(
  ["spring-boot-4"]="0E8A16"
  ["automated"]="1D76DB"
  ["needs-review"]="FBCA04"
  ["dependencies"]="0366D6"
  ["migration"]="5319E7"
)

declare -A LABEL_DESCRIPTIONS=(
  ["spring-boot-4"]="Spring Boot 4.x migration"
  ["automated"]="Automated change via tooling"
  ["needs-review"]="Requires manual review"
  ["dependencies"]="Dependency updates"
  ["migration"]="Framework migration"
)

# Get existing labels
EXISTING=$(gh label list --repo "$REPO" --json name --jq ".[].name")

# Create missing labels
for label in "${REQUIRED_LABELS[@]}"; do
  if ! echo "$EXISTING" | grep -q "^${label}$"; then
    echo "Creating label: $label"
    gh label create "$label" \
      --repo "$REPO" \
      --description "${LABEL_DESCRIPTIONS[$label]:-$label}" \
      --color "${LABEL_COLORS[$label]:-CCCCCC}"
  else
    echo "Label exists: $label"
  fi
done

echo "All required labels are ready"
```

### Batch Label Pre-Creation for Multiple Repos

Ensure labels exist across multiple repositories:

```bash
REPOS=("owner/repo1" "owner/repo2" "owner/repo3")
REQUIRED_LABELS=("spring-boot-4" "automated" "needs-review")

for repo in "${REPOS[@]}"; do
  echo "Processing labels for $repo..."

  EXISTING=$(gh label list --repo "$repo" --json name --jq ".[].name" 2>/dev/null)

  if [ $? -ne 0 ]; then
    echo "WARNING: Cannot access $repo, skipping..."
    continue
  fi

  for label in "${REQUIRED_LABELS[@]}"; do
    if ! echo "$EXISTING" | grep -q "^${label}$"; then
      echo "  Creating: $label"
      gh label create "$label" --repo "$repo" --color "0E8A16" 2>/dev/null || true
    fi
  done
done

echo "Label pre-creation complete"
```

## Standard Migration Labels

Recommended labels for Spring Boot migration PRs:

| Label                     | Color                 | Description                    |
| ------------------------- | --------------------- | ------------------------------ |
| `spring-boot-4`           | `0E8A16` (green)      | Spring Boot 4.x migration      |
| `spring-boot-4-migration` | `0E8A16` (green)      | Spring Boot 4.x migration work |
| `automated`               | `1D76DB` (blue)       | Automated change via tooling   |
| `needs-review`            | `FBCA04` (yellow)     | Requires manual review         |
| `dependencies`            | `0366D6` (blue)       | Dependency updates             |
| `migration`               | `5319E7` (purple)     | Framework migration            |
| `jackson-3`               | `E99695` (red)        | Jackson 3.x migration          |
| `spring-security-7`       | `C5DEF5` (light blue) | Spring Security 7 migration    |
| `spring-cloud-2025`       | `BFD4F2` (light blue) | Spring Cloud 2025.x migration  |

### Create All Standard Labels

```bash
REPO="owner/repo"

# Define standard migration labels
gh label create "spring-boot-4" --repo "$REPO" --color "0E8A16" --description "Spring Boot 4.x migration" --force
gh label create "spring-boot-4-migration" --repo "$REPO" --color "0E8A16" --description "Spring Boot 4.x migration work" --force
gh label create "automated" --repo "$REPO" --color "1D76DB" --description "Automated change via tooling" --force
gh label create "needs-review" --repo "$REPO" --color "FBCA04" --description "Requires manual review" --force
gh label create "dependencies" --repo "$REPO" --color "0366D6" --description "Dependency updates" --force
gh label create "migration" --repo "$REPO" --color "5319E7" --description "Framework migration" --force
gh label create "jackson-3" --repo "$REPO" --color "E99695" --description "Jackson 3.x migration" --force
gh label create "spring-security-7" --repo "$REPO" --color "C5DEF5" --description "Spring Security 7 migration" --force
gh label create "spring-cloud-2025" --repo "$REPO" --color "BFD4F2" --description "Spring Cloud 2025.x migration" --force
```

## Integration with PR Creation

### Combined Workflow: Labels + PR

```bash
REPO="owner/repo"
LABELS="spring-boot-4,automated,needs-review"

# Step 1: Pre-create labels
IFS=',' read -ra LABEL_ARRAY <<< "$LABELS"
EXISTING=$(gh label list --repo "$REPO" --json name --jq ".[].name")

for label in "${LABEL_ARRAY[@]}"; do
  if ! echo "$EXISTING" | grep -q "^${label}$"; then
    echo "Creating label: $label"
    gh label create "$label" --repo "$REPO" --color "0E8A16" 2>/dev/null || true
  fi
done

# Step 2: Create PR with labels
gh pr create \
  --repo "$REPO" \
  --title "chore: Migrate to Spring Boot 4.x" \
  --body "$PR_BODY" \
  --label "$LABELS"
```

## Output Format

Report label management status:

```json
{
  "repo": "owner/repo",
  "labels": {
    "required": ["spring-boot-4", "automated", "needs-review"],
    "existing": ["spring-boot-4"],
    "created": ["automated", "needs-review"],
    "failed": []
  },
  "status": "success"
}
```

## Error Handling

### Permission Denied

```bash
# Check if you have write access
gh repo view owner/repo --json viewerPermission --jq ".viewerPermission"
# Should return: ADMIN, MAINTAIN, or WRITE

# If READ only, labels cannot be created
echo "ERROR: Insufficient permissions to create labels in $REPO"
```

### Rate Limiting

```bash
# Check API rate limit
gh api rate_limit --jq ".resources.core"

# Add delays for large batches
for repo in "${REPOS[@]}"; do
  # ... label operations
  sleep 0.5  # Avoid rate limiting
done
```

### Label Already Exists

The `--force` flag handles this gracefully:

```bash
# Without --force: error if exists
gh label create "spring-boot-4" --repo owner/repo

# With --force: updates if exists, creates if not
gh label create "spring-boot-4" --repo owner/repo --force
```

## Critical Rules

1. **Always check permissions** before attempting label creation
2. **Use `--force` flag** to make operations idempotent
3. **Verify label existence** before PR creation
4. **Handle fork scenarios** - labels may need to be created in the upstream repo
5. **Use consistent colors** across repositories for visual organization
6. **Include meaningful descriptions** for team clarity
7. **Run label pre-creation BEFORE migration** to ensure PR creation succeeds
