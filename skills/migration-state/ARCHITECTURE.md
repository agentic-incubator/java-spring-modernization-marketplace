# Migration State Architecture

## Component Overview

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MIGRATION STATE SKILL                                │
│                         (Phase 1, Part A)                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
         ┌──────────────┐ ┌───────────────┐ ┌──────────────────┐
         │   SKILL.md   │ │ metadata.yaml │ │  README.md       │
         │  (1,132 L)   │ │   (89 L)      │ │   (407 L)        │
         └──────────────┘ └───────────────┘ └──────────────────┘
         │ Functions    │ │ Metadata      │ │ User Guide       │
         │ - Initialize │ │ - Version     │ │ - Quick Start.   │
         │ - Read       │ │ - Transforms  │ │ - Workflows      │
         │ - Validate   │ │ - Dependencies│ │ - Troubleshooting│
         │ - Commit     │ │ - Integrations│ │ - Reference      │
         └──────────────┘ └───────────────┘ └──────────────────┘
                    │               │               │
                    └───────────────┼───────────────┘
                                    │
                                    ▼
                        ┌──────────────────────┐
                        │ example-state.yaml   │
                        │      (74 L)          │
                        ├──────────────────────┤
                        │ - migrationId        │
                        │ - branch             │
                        │ - timestamps         │
                        │ - versions           │
                        │ - transformations    │
                        │ - validation         │
                        └──────────────────────┘
```

## State File Lifecycle

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                        STATE FILE LIFECYCLE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. INITIALIZATION                                                          │
│     ┌────────────────────────────────────────────────────────────────────┐  │
│     │ git checkout -b feature/spring-boot-4-migration                    │  │
│     │ initialize_state "." "feature/spring-boot-4-migration" "1.3.0"     │  │
│     │                                                                    │  │
│     │ Creates: .migration-state.yaml                                     │  │
│     │   - migrationId: sb4-20260103-abc12345                             │  │
│     │   - appliedTransformations: []                                     │  │
│     │   - validationStatus: NOT_RUN                                      │  │
│     └────────────────────────────────────────────────────────────────────┘  │
│                              │                                              │
│                              ▼                                              │
│  2. TRANSFORMATION APPLICATION                                              │
│     ┌────────────────────────────────────────────────────────────────────┐  │
│     │ [jackson-migrator applies transformations]                         │  │
│     │                                                                    │  │
│     │ update_applied_transformations                                     │  │
│     │   "jackson-migrator" "1.0.0"                                       │  │
│     │   "jackson-imports,jackson-groupid"                                │  │
│     │   "abc123def456"                                                   │  │
│     │                                                                    │  │
│     │ State updated:                                                     │  │
│     │   - appliedTransformations: [jackson-migrator v1.0.0]              │  │
│     │   - lastUpdatedAt: 2026-01-03T10:35:00Z                            │  │
│     └────────────────────────────────────────────────────────────────────┘  │
│                              │                                              │
│                              ▼                                              │
│  3. VALIDATION                                                              │
│     ┌────────────────────────────────────────────────────────────────────┐  │
│     │ mvn clean test                                                     │  │
│     │                                                                    │  │
│     │ update_validation_status                                           │  │
│     │   "PASSED" "true" "0" "" "150" "0"                                 │  │
│     │                                                                    │  │
│     │ State updated:                                                     │  │
│     │   - validationStatus: PASSED                                       │  │
│     │   - validationDetails.compile.success: true                        │  │
│     │   - validationDetails.tests.passed: 150                            │  │
│     └────────────────────────────────────────────────────────────────────┘  │
│                              │                                              │
│                              ▼                                              │
│  4. ATOMIC COMMIT                                                           │
│     ┌────────────────────────────────────────────────────────────────────┐  │
│     │ atomic_commit_state                                                │  │
│     │   "." "jackson-migrator" "1.0.0"                                   │  │
│     │   "jackson-imports,jackson-groupid"                                │  │
│     │   "Migrate Jackson 2.x to 3.x"                                     │  │
│     │                                                                    │  │
│     │ Commits:                                                           │  │
│     │   - Code changes                                                   │  │
│     │   - .migration-state.yaml                                          │  │
│     │   Together in one atomic commit                                    │  │
│     └────────────────────────────────────────────────────────────────────┘  │
│                              │                                              │
│                              ▼                                              │
│  5. RESUME / RETRY                                                          │
│     ┌────────────────────────────────────────────────────────────────────┐  │
│     │ git checkout feature/spring-boot-4-migration                       │  │
│     │ read_state "."                                                     │  │
│     │                                                                    │  │
│     │ State shows:                                                       │  │
│     │   - jackson-migrator v1.0.0: ✅ Applied                            │  │
│     │   - spring-security-migrator: ⏳ Pending                           │  │
│     │                                                                    │  │
│     │ is_transformation_applied "." "jackson-migrator"                   │  │
│     │   → Returns: true                                                  │  │
│     │   → Skip re-applying Jackson migration                             │  │
│     └────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Integration Architecture

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                          SKILL INTEGRATIONS                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────┐              ┌─────────────────────┐                │
│  │  github-workflow    │──────────────│  migration-state    │                │
│  │                     │              │                     │                │
│  │ - Create branch     │  Calls:      │ - initialize_state  │                │
│  │ - Check existing    │  - init      │ - read_state        │                │
│  │ - Checkout branch   │  - read      │                     │                │
│  └─────────────────────┘              └─────────────────────┘                │
│                                                │                             │
│                                                │                             │
│  ┌─────────────────────┐                       │                             │
│  │ jackson-migrator    │───────────────────────┤                             │
│  │                     │              Calls:   │                             │
│  │ - Transform imports │  - check_applied      │                             │
│  │ - Update groupId    │  - update_applied     │                             │
│  │ - Fix exceptions    │  - get_skill_version  │                             │
│  └─────────────────────┘                       │                             │
│                                                │                             │
│  ┌─────────────────────┐                       │                             │
│  │ spring-security-    │───────────────────────┤                             │
│  │ migrator            │              Calls:   │                             │
│  │                     │  - check_applied      │                             │
│  │ - Update config     │  - update_applied     │                             │
│  │ - Fix authorization │                       │                             │
│  └─────────────────────┘                       │                             │
│                                                │                             │
│  ┌─────────────────────┐                       │                             │
│  │ spring-ai-migrator  │───────────────────────┤                             │
│  │                     │              Calls:   │                             │
│  │ - Rename TTS model  │  - check_applied      │                             │
│  │ - Fix speed param   │  - update_applied     │                             │
│  └─────────────────────┘                       │                             │
│                                                │                             │
│  ┌─────────────────────┐                       │                             │
│  │  build-runner       │───────────────────────┤                             │
│  │                     │              Calls:   │                             │
│  │ - Run mvn/gradle    │  - update_validation  │                             │
│  │ - Report results    │                       │                             │
│  └─────────────────────┘                       │                             │
│                                                │                             │
│  ┌─────────────────────┐                       │                             │
│  │ resume-migration    │───────────────────────┘                             │
│  │                     │              Calls:                                 │
│  │ - Read state        │  - read_state                                       │
│  │ - Compare versions  │  - get_skill_version                                │
│  │ - Apply pending     │  - check_applied                                    │
│  └─────────────────────┘                                                     │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DATA FLOW DIAGRAM                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  USER REQUEST                                                               │
│       │                                                                     │
│       ▼                                                                     │
│  ┌──────────────────┐                                                       │
│  │ /spring-m11n:    │                                                       │
│  │ migrate          │                                                       │
│  └──────────────────┘                                                       │
│       │                                                                     │
│       ▼                                                                     │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │ github-workflow: Create/checkout branch                          │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│       │                                                                     │
│       ▼                                                                     │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │ migration-state: Initialize or read state                        │       │
│  │                                                                  │       │
│  │ IF new branch:                                                   │       │
│  │   - Create .migration-state.yaml                                 │       │
│  │   - Set appliedTransformations = []                              │       │
│  │                                                                  │       │
│  │ IF existing branch:                                              │       │
│  │   - Read .migration-state.yaml                                   │       │
│  │   - Load appliedTransformations                                  │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│       │                                                                     │
│       ▼                                                                     │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │ FOR EACH migrator skill (jackson, security, spring-ai, etc.)     │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│       │                                                                     │
│       ▼                                                                     │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │ migration-state: Check if already applied                        │       │
│  │                                                                  │       │
│  │ is_transformation_applied(skill_name)                            │       │
│  │   → Returns: true/false                                          │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│       │                                                                     │
│       ├─── IF true ──► SKIP (already applied)                               │
│       │                                                                     │
│       └─── IF false ─► APPLY TRANSFORMATION                                 │
│                              │                                              │
│                              ▼                                              │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │ Migrator skill: Apply transformations                            │       │
│  │   - Update imports                                               │       │
│  │   - Update dependencies                                          │       │
│  │   - Update code patterns                                         │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                              │                                              │
│                              ▼                                              │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │ migration-state: Update applied transformations                  │       │
│  │                                                                  │       │
│  │ update_applied_transformations(                                  │       │
│  │   skill, version, transformations, commit_sha                    │       │
│  │ )                                                                │       │
│  │                                                                  │       │
│  │ State updated:                                                   │       │
│  │   appliedTransformations += new entry                            │       │
│  │   lastUpdatedAt = now                                            │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                              │                                              │
│                              ▼                                              │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │ build-runner: Validate migration                                 │       │
│  │   - mvn clean compile                                            │       │
│  │   - mvn test                                                     │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                              │                                              │
│                              ▼                                              │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │ migration-state: Update validation status                        │       │
│  │                                                                  │       │
│  │ update_validation_status(                                        │       │
│  │   status, compile_success, errors, tests_passed, tests_failed    │       │
│  │ )                                                                │       │
│  │                                                                  │       │
│  │ State updated:                                                   │       │
│  │   validationStatus = PASSED/FAILED                               │       │
│  │   validationDetails = results                                    │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                              │                                              │
│                              ▼                                              │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │ migration-state: Atomic commit                                   │       │
│  │                                                                  │       │
│  │ git add -A                                                       │       │
│  │ git commit -m "migration(skill): description"                    │       │
│  │   - Code changes                                                 │       │
│  │   - .migration-state.yaml                                        │       │
│  │   Committed together atomically                                  │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                              │                                              │
│                              ▼                                              │
│                         MIGRATION COMPLETE                                  │
│                    (or partially complete if failed)                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## File Relationships

```text
Project Root
│
├── .git/                          # Git repository
│
├── .gitignore                     # Contains: .migration-state.yaml
│   └── .migration-state.yaml      # (gitignored on main branch)
│
├── .migration-state.yaml          # State file (tracked on migration branch)
│   ├── migrationId
│   ├── branch: "feature/spring-boot-4-migration"
│   ├── appliedTransformations[]   # Populated by migration-state skill
│   └── validationStatus           # Updated by build-runner via migration-state
│
└── pom.xml / build.gradle         # Modified by migrator skills
```

## Key Design Principles

### 1. Separation of Concerns

- **migration-state**: State management only
- **Migrator skills**: Code transformations only
- **build-runner**: Validation only
- **github-workflow**: Git operations only

### 2. Single Source of Truth

- `.migration-state.yaml` is the authoritative record
- All skills read/write through migration-state skill
- No duplicate state tracking

### 3. Idempotency

- Check before apply: `is_transformation_applied()`
- Skip if already done
- Safe to run multiple times

### 4. Atomicity

- State + code committed together
- Never state without code
- Never code without state

### 5. Branch Isolation

- Each branch has independent state
- No cross-branch state sharing
- Parallel migrations supported

## Error Recovery

```text
ERROR SCENARIO                    RECOVERY MECHANISM
─────────────────────────────────────────────────────────────────────────
Corrupted state file         →    1. Check .backup file
                                  2. Retrieve from git history
                                  3. Manual intervention if needed

State/code drift             →    1. Compare commit SHAs
                                  2. Reset to last known good state
                                  3. Re-apply from checkpoint

Partial transformation       →    1. Read state to find last success
                                  2. Resume from that point
                                  3. Skip already-applied work

Marketplace upgrade          →    1. Compare versions
                                  2. Detect new transformations
                                  3. Apply only delta

Build failure                →    1. Record in validationStatus
                                  2. Keep state for retry
                                  3. Resume without re-applying
```

## Future Phases

```text
PHASE 1A (CURRENT)          PHASE 1B                  PHASE 2
─────────────────────────────────────────────────────────────────────────
Core state management   →   Branch reuse logic    →   Skill metadata
- Initialize                - Check existing          - Version tracking
- Read                      - Resume vs new           - Transformation defs
- Update                    - State validation        - Skill registry
- Validate
- Commit                    PHASE 3                   PHASE 4
                            ─────────────────────────────────────────────────
                            Resume command        →   Full idempotency
                            - /spring-m11n:resume     - All skills check state
                            - Upgrade detection       - No duplicate work
                            - Delta application       - Safe retries
```
