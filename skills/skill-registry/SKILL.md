---
name: skill-registry
description: Central version catalog that tracks all migration skills and their versions. Use when checking skill versions, detecting upgrades, or coordinating multi-skill migrations.
allowed-tools: Read, Glob, Grep
---

# Skill Registry

Central registry for tracking migration skill versions and capabilities.

## Purpose

The skill registry provides:

1. **Version Tracking** - Catalog of all migration skills with current versions
2. **Upgrade Detection** - Compare installed vs available skill versions
3. **Metadata Lookup** - Access skill metadata for orchestration
4. **Dependency Resolution** - Understand skill dependencies

## Registry Schema

Each skill entry contains:

```yaml
skill:
  name: <skill-name>
  version: <semver>
  description: <brief-description>
  transformations:
    - id: <transformation-id>
      version: <semver>
      description: <what-it-does>
      detection: <regex-pattern>
  dependencies:
    - skill: <dependency-skill>
      minVersion: <semver>
```

## Core Migration Skills

### jackson-migrator

**Version:** 1.1.0
**Location:** `skills/jackson-migrator/metadata.yaml`

Migrate Jackson 2.x to 3.x including groupId changes, import updates, and exception handling.

**Transformations:**

- `jackson-imports` (v1.0.0) - Update import statements
- `jackson-groupid` (v1.0.0) - Update Maven/Gradle groupId
- `jackson-exception-handling` (v1.1.0) - Update exception references
- `jackson-bom` (v1.0.0) - Add Jackson BOM
- `jackson-annotations-preserve` (v1.0.0) - Verify annotations unchanged

**Dependencies:**

- build-runner >= 1.0.0
- migration-state >= 1.0.0

---

### security-config-migrator

**Version:** 1.0.0
**Location:** `skills/security-config-migrator/metadata.yaml`

Migrate Spring Security configurations for Spring Boot 4.x compatibility.

**Transformations:**

- `security-config` (v1.0.0) - Update deprecated security configuration methods
- `authorizations` (v1.0.0) - Update authorization rule syntax
- `csrf-config` (v1.0.0) - Update CSRF configuration
- `session-management` (v1.0.0) - Update session management configuration

**Dependencies:**

- build-runner >= 1.0.0
- migration-state >= 1.0.0

---

### spring-ai-migrator

**Version:** 2.0.0
**Location:** `skills/spring-ai-migrator/metadata.yaml`

Migrate Spring AI 1.x to 2.0.x including TTS API changes, speed parameter type change, chat memory
advisor constant renames, and autoconfigure migration for Spring Boot 4 compatibility.

**Transformations:**

- `tts-model-rename` (v1.0.0) - Replace SpeechModel with TextToSpeechModel
- `speed-parameter` (v1.0.0) - Update speed parameter from Float to Double
- `advisor-constants` (v1.0.0) - Update chat memory advisor constant names
- `autoconfigure-provider-selection` (v2.0.0) - Migrate to spring.ai.model.\* provider selection
- `autoconfigure-class-split` (v2.0.0) - Update monolithic OpenAiAutoConfiguration to split classes
- `milestones-repository` (v2.0.0) - Add Spring Milestones repository

**Dependencies:**

- build-runner >= 1.0.0
- migration-state >= 1.0.0

---

### vaadin-migrator

**Version:** 1.0.0
**Location:** `skills/vaadin-migrator/metadata.yaml`

Migrate Vaadin 24 to Vaadin 25 for Spring Boot 4 compatibility including theme changes and security configuration.

**Transformations:**

- `vaadin-theme-material-to-lumo` (v1.0.0) - Replace Material theme with Lumo
- `vaadin-security-configurer` (v1.0.0) - Replace VaadinWebSecurity with VaadinSecurityConfigurer
- `vaadin-version-upgrade` (v1.0.0) - Update Vaadin version to 25.x

**Dependencies:**

- security-config-migrator >= 1.0.0
- build-runner >= 1.0.0
- migration-state >= 1.0.0

---

### openfeign-compatibility-detector

**Version:** 1.0.0
**Location:** `skills/openfeign-compatibility-detector/SKILL.md`

Detect Spring Cloud OpenFeign usage and compatibility issues with Spring Boot 4.x.

**Detections:**

- `@FeignClient` annotation usage
- Custom Decoder/Encoder configurations
- HttpMessageConverters usage (blocker in Boot 4.x)
- Spring Cloud version compatibility

**Dependencies:**

- version-detector >= 1.0.0

---

### spring-boot-4-breaking-changes-detector

**Version:** 1.0.0
**Location:** `skills/spring-boot-4-breaking-changes-detector/SKILL.md`

Comprehensive detector for all Spring Boot 4.x breaking changes including API removals, dependency incompatibilities, and starter changes.

**Detections:**

- RestClientCustomizer removal
- HttpMessageConverters removal
- Spring Retry transitive dependency removal
- Undertow starter incompatibility
- Web starter rename

**Dependencies:**

- version-detector >= 1.0.0

---

### junit4-to-junit5-migrator

**Version:** 1.0.0
**Location:** `skills/junit4-to-junit5-migrator/SKILL.md`

Automate JUnit4 to JUnit5 migration including imports, annotations, runners, and build configuration.

**Transformations:**

- `junit-imports` (v1.0.0) - Update import statements
- `junit-annotations` (v1.0.0) - Update test annotations
- `junit-runners` (v1.0.0) - Migrate Spring runners
- `junit-build-config` (v1.0.0) - Add useJUnitPlatform()

**Dependencies:**

- build-file-updater >= 1.0.0
- migration-state >= 1.0.0

---

### gradle-9-syntax-migrator

**Version:** 1.0.0
**Location:** `skills/gradle-9-syntax-migrator/SKILL.md`

Migrate Gradle build files to Gradle 9.x syntax requirements.

**Transformations:**

- `gradle-java-block-migration` (v1.0.0) - Move sourceCompatibility to java {} block
- `gradle-test-platform-config` (v1.0.0) - Add test { useJUnitPlatform() }
- `gradle-wrapper-version-fix` (v1.0.0) - Validate wrapper version precision

**Dependencies:**

- build-tool-detector >= 1.0.0
- migration-state >= 1.0.0

---

### dependency-conflict-analyzer

**Version:** 1.0.0
**Location:** `skills/dependency-conflict-analyzer/SKILL.md`

Detect transitive dependency conflicts, particularly Jackson 2.x vs 3.x version conflicts.

**Detections:**

- Mixed Jackson versions in dependency tree
- Transitive dependency conflicts
- BOM requirement validation

**Dependencies:**

- version-detector >= 1.0.0

---

### spring-ai-version-validator

**Version:** 1.0.0
**Location:** `skills/spring-ai-version-validator/SKILL.md`

Validate and auto-correct Spring AI version formats (X.Y.Z-M# not X.Y-M#).

**Transformations:**

- `spring-ai-version-format-fix` (v1.0.0) - Correct milestone version format
- `maven-cache-cleanup` (v1.0.0) - Clear failed artifact cache

**Dependencies:**

- version-detector >= 1.0.0
- migration-state >= 1.0.0

---

### openfeign-to-httpinterface-migrator

**Version:** 1.0.0
**Location:** `skills/openfeign-to-httpinterface-migrator/SKILL.md`

Automate migration from Spring Cloud OpenFeign to Spring HTTP Interface clients.

**Transformations:**

- `feign-interface-annotations` (v1.0.0) - @FeignClient → @HttpExchange
- `feign-method-annotations` (v1.0.0) - @GetMapping → @GetExchange, etc.
- `feign-configuration-migration` (v1.0.0) - Decoder → ClientHttpMessageConvertersCustomizer
- `feign-bean-generation` (v1.0.0) - Create HttpServiceProxyFactory beans
- `feign-dependency-replacement` (v1.0.0) - Replace OpenFeign with RestClient
- `feign-cleanup` (v1.0.0) - Remove Feign artifacts

**Dependencies:**

- openfeign-compatibility-detector >= 1.0.0
- build-file-updater >= 1.0.0
- migration-state >= 1.0.0

---

### library-migration-classifier

**Version:** 1.0.0
**Location:** `skills/library-migration-classifier/SKILL.md`

Classify dependency changes as version upgrade vs library migration for effort estimation.

**Classifications:**

- Version Upgrade (LOW effort)
- Version Upgrade Major (MEDIUM effort)
- Library Migration (HIGH effort)

**Dependencies:**

- version-detector >= 1.0.0

---

### testcontainers-module-validator

**Version:** 1.0.0
**Location:** `skills/testcontainers-module-validator/SKILL.md`

Ensure required Testcontainers modules are declared when containers are used.

**Transformations:**

- `testcontainers-module-addition` (v1.0.0) - Add missing module dependencies

**Dependencies:**

- build-file-updater >= 1.0.0

---

### multi-module-dependency-analyzer

**Version:** 1.0.0
**Location:** `skills/multi-module-dependency-analyzer/SKILL.md`

Build dependency graph for multi-module projects and determine optimal build order.

**Analysis:**

- Module dependency graph (DAG)
- Topological sort for build order
- Blocking module identification
- Parallelization opportunities

**Dependencies:**

- build-tool-detector >= 1.0.0

---

## Usage Patterns

### 1. List All Skills

```bash
# Load registry
grep -l "skill:" skills/*/metadata.yaml

# Parse versions
for file in skills/*/metadata.yaml; do
  skill=$(yq '.skill.name' "$file")
  version=$(yq '.skill.version' "$file")
  echo "$skill: $version"
done
```

### 2. Check Skill Version

```bash
# Get current version of a skill
skill_name="jackson-migrator"
yq '.skill.version' "skills/$skill_name/metadata.yaml"
```

### 3. Compare Versions

```javascript
// Semantic version comparison
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number)
  const parts2 = v2.split('.').map(Number)

  for (let i = 0; i < 3; i++) {
    if (parts1[i] > parts2[i]) return 1
    if (parts1[i] < parts2[i]) return -1
  }
  return 0
}

// Check if upgrade available
const appliedVersion = '1.0.0'
const currentVersion = '1.1.0'
const upgradeAvailable = compareVersions(currentVersion, appliedVersion) > 0
```

### 4. Detect New Transformations

```javascript
// Load metadata
const metadata = YAML.parse(fs.readFileSync('skills/jackson-migrator/metadata.yaml'))

// Load migration state
const state = JSON.parse(fs.readFileSync('.migration-state.json'))

// Find applied skill
const applied = state.appliedTransformations.find((t) => t.skill === 'jackson-migrator')

if (!applied) {
  // Skill never applied - all transformations are new
  console.log(`All transformations needed:`, metadata.skill.transformations)
} else {
  // Compare transformation versions
  const newTransformations = metadata.skill.transformations.filter((t) => {
    const wasApplied = applied.transformations.includes(t.id)
    if (!wasApplied) return true

    // Check if transformation version increased
    const appliedVersion = applied.version
    return compareVersions(t.version, appliedVersion) > 0
  })

  console.log(`New transformations:`, newTransformations)
}
```

### 5. Resolve Dependencies

```javascript
// Load skill metadata
const metadata = YAML.parse(fs.readFileSync('skills/vaadin-migrator/metadata.yaml'))

// Get dependencies
const dependencies = metadata.skill.dependencies || []

// Resolve each dependency
for (const dep of dependencies) {
  const depMetadata = YAML.parse(fs.readFileSync(`skills/${dep.skill}/metadata.yaml`))

  const currentVersion = depMetadata.skill.version
  const requiredVersion = dep.minVersion

  if (compareVersions(currentVersion, requiredVersion) < 0) {
    console.log(`Dependency ${dep.skill} needs upgrade: ${currentVersion} -> ${requiredVersion}`)
  }
}
```

## Registry Operations

### Load Skill Metadata

```javascript
/**
 * Load metadata for a specific skill
 * @param {string} skillName - Name of the skill
 * @returns {Object} Parsed metadata
 */
function loadSkillMetadata(skillName) {
  const metadataPath = `skills/${skillName}/metadata.yaml`
  if (!fs.existsSync(metadataPath)) {
    throw new Error(`Metadata not found for skill: ${skillName}`)
  }
  return YAML.parse(fs.readFileSync(metadataPath, 'utf8'))
}
```

### Get All Skills

```javascript
/**
 * Get list of all registered skills
 * @returns {Array<Object>} Array of skill metadata
 */
function getAllSkills() {
  const skillDirs = fs
    .readdirSync('skills', { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)

  return skillDirs
    .filter((dir) => fs.existsSync(`skills/${dir}/metadata.yaml`))
    .map((dir) => loadSkillMetadata(dir))
}
```

### Check Upgrade Available

```javascript
/**
 * Check if upgrade is available for a skill
 * @param {string} skillName - Name of the skill
 * @param {string} appliedVersion - Currently applied version
 * @returns {boolean} True if upgrade available
 */
function isUpgradeAvailable(skillName, appliedVersion) {
  const metadata = loadSkillMetadata(skillName)
  return compareVersions(metadata.skill.version, appliedVersion) > 0
}
```

### Get New Transformations

```javascript
/**
 * Get transformations that haven't been applied or have newer versions
 * @param {string} skillName - Name of the skill
 * @param {Array<string>} appliedTransformations - List of applied transformation IDs
 * @param {string} appliedVersion - Version that was applied
 * @returns {Array<Object>} List of new/updated transformations
 */
function getNewTransformations(skillName, appliedTransformations, appliedVersion) {
  const metadata = loadSkillMetadata(skillName)

  return metadata.skill.transformations.filter((t) => {
    // New transformation if ID not in applied list
    if (!appliedTransformations.includes(t.id)) {
      return true
    }

    // Updated if transformation version is newer than applied version
    return compareVersions(t.version, appliedVersion) > 0
  })
}
```

## Integration with Migration State

The skill registry integrates with the migration state file (`.migration-state.json`) to enable:

1. **Resume Detection** - Identify which transformations were already applied
2. **Upgrade Detection** - Detect when marketplace has newer skill versions
3. **Incremental Application** - Only apply new/updated transformations
4. **Audit Trail** - Track which skill versions were used

### Example State File

```json
{
  "migrationId": "sb4-2026-01-03-abc123",
  "marketplaceVersion": "1.3.0",
  "appliedTransformations": [
    {
      "skill": "jackson-migrator",
      "version": "1.0.0",
      "transformations": ["jackson-imports", "jackson-groupid"],
      "completedAt": "2026-01-03T10:35:00Z"
    }
  ]
}
```

### Upgrade Detection Flow

```text
1. Load .migration-state.json
2. For each appliedTransformation:
   a. Load current skill metadata from registry
   b. Compare versions: applied.version vs metadata.version
   c. If metadata.version > applied.version:
      - Get new transformations
      - Add to pending list
3. Apply pending transformations
4. Update state file
```

## Version Compatibility Matrix

| Skill                     | Spring Boot 3.3 | Spring Boot 3.5 | Spring Boot 4.0 |
| ------------------------- | --------------- | --------------- | --------------- |
| jackson-migrator v1.0.0   | ✓               | ✓               | ✗               |
| jackson-migrator v1.1.0   | ✓               | ✓               | ✓               |
| security-config v1.0.0    | ✗               | ✓               | ✓               |
| spring-ai-migrator v1.0.0 | ✓               | ✓               | ✗               |
| spring-ai-migrator v2.0.0 | ✗               | ✗               | ✓               |
| vaadin-migrator v1.0.0    | ✗               | ✗               | ✓               |

## Testing

### Validate Metadata Schema

```javascript
function validateMetadata(metadata) {
  const required = ['name', 'version', 'description']
  for (const field of required) {
    if (!metadata.skill[field]) {
      throw new Error(`Missing required field: ${field}`)
    }
  }

  // Validate version is semver
  const versionRegex = /^\d+\.\d+\.\d+$/
  if (!versionRegex.test(metadata.skill.version)) {
    throw new Error(`Invalid version format: ${metadata.skill.version}`)
  }

  // Validate transformations
  if (metadata.skill.transformations) {
    for (const t of metadata.skill.transformations) {
      if (!t.id || !t.version || !t.description || !t.detection) {
        throw new Error(`Invalid transformation: ${JSON.stringify(t)}`)
      }
    }
  }
}
```

## Future Enhancements

1. **Skill Registry API** - REST API for querying skill metadata
2. **Dependency Graph** - Visualize skill dependencies
3. **Version Constraints** - Support version ranges (e.g., ">=1.0.0 <2.0.0")
4. **Transformation Conflicts** - Detect conflicting transformations
5. **Skill Marketplace** - Central repository for community skills
