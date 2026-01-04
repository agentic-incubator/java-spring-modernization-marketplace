# Spring AI Version Validator Skill

**Skill ID:** `spring-ai-version-validator`
**Version:** 1.0.0
**Category:** Validation
**Priority:** MEDIUM
**Automation:** 100%

---

## Purpose

Validate Spring AI version format to prevent Maven dependency resolution failures. Spring AI uses semantic versioning with milestone/RC format
`X.Y.Z-M#` (e.g., `2.0.0-M1`) NOT `X.Y-M#` (e.g., `2.0-M1`). Invalid formats cause silent Maven cache failures.

---

## Problem Statement

Spring AI version format validation prevents Maven dependency resolution failures:

**Issue:**

```xml
<!-- WRONG - Maven fails to resolve -->
<spring-ai.version>2.0-M1</spring-ai.version>

Maven Error:
Could not find artifact org.springframework.ai:spring-ai-bom:pom:2.0-M1
in spring-milestones (https://repo.spring.io/milestone)
```

**Impact:**

- Maven caches failed artifact lookups
- Retries fail even after fixing version
- Silent failure blocks migrations

---

## Validation Rules

### Valid Version Formats

**Pattern:** `^\d+\.\d+\.\d+(-M\d+|-RC\d+|-SNAPSHOT)?$`

**Valid Examples:**

```text
2.0.0-M1      ✅ Milestone with full version
2.0.0-RC1     ✅ Release candidate with full version
2.0.0-SNAPSHOT ✅ Snapshot with full version
2.0.0         ✅ Stable release
1.0.0-M5      ✅ Milestone 5
```

**Invalid Examples:**

```text
2.0-M1        ❌ Missing patch version
2.0-RC1       ❌ Missing patch version
2-M1          ❌ Missing minor and patch
2.0.M1        ❌ Wrong separator
2.0.0-M       ❌ Missing milestone number
```

---

## Detection Patterns

### Maven (pom.xml)

```xml
<!-- Detect version property -->
<properties>
    <spring-ai.version>2.0-M1</spring-ai.version>  <!-- INVALID -->
</properties>

<!-- Detect in dependency -->
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-bom</artifactId>
    <version>2.0-M1</version>  <!-- INVALID -->
</dependency>
```

**Detection:**

```bash
grep -E "spring-ai.*version.*2\.\d+-M\d+" pom.xml
grep -E "spring-ai.*version.*2\.\d+-RC\d+" pom.xml
```

### Gradle (build.gradle / build.gradle.kts)

```gradle
// Groovy DSL
ext {
    set('springAiVersion', "2.0-M1")  // INVALID
}

// Kotlin DSL
extra["springAiVersion"] = "2.0-M1"  // INVALID
```

**Detection:**

```bash
grep -E "springAiVersion.*2\.\d+-M\d+" build.gradle build.gradle.kts
grep -E "spring-ai.*version.*2\.\d+-RC\d+" build.gradle build.gradle.kts
```

---

## Validation Algorithm

```text
1. EXTRACT Spring AI version from build file
   - Parse Maven pom.xml for <spring-ai.version> property
   - Parse Gradle build files for springAiVersion variable
   - Parse dependency declarations

2. VALIDATE version format
   - Apply regex: ^\d+\.\d+\.\d+(-M\d+|-RC\d+|-SNAPSHOT)?$
   - IF matches: VALID
   - IF doesn't match: INVALID

3. IDENTIFY issue type
   - Missing patch version: "2.0-M1" → needs "2.0.0-M1"
   - Missing minor version: "2-M1" → needs "2.0.0-M1"
   - Wrong separator: "2.0.M1" → needs "2.0.0-M1"
   - Missing milestone number: "2.0.0-M" → malformed

4. AUTO-CORRECT (if possible)
   - Missing patch: Add ".0" before milestone
     2.0-M1 → 2.0.0-M1
     2.0-RC1 → 2.0.0-RC1

   - Missing minor and patch: Add ".0.0" before milestone
     2-M1 → 2.0.0-M1

5. GENERATE validation report
   - Original version
   - Validation status
   - Issue description
   - Corrected version
   - Automation potential
```

---

## Auto-Correction Patterns

### Maven pom.xml

**Before:**

```xml
<properties>
    <spring-ai.version>2.0-M1</spring-ai.version>
</properties>
```

**After:**

```xml
<properties>
    <spring-ai.version>2.0.0-M1</spring-ai.version>
</properties>
```

**Transformation:**

```text
REPLACE: <spring-ai.version>2.0-M1</spring-ai.version>
WITH:    <spring-ai.version>2.0.0-M1</spring-ai.version>
```

### Gradle (Groovy DSL)

**Before:**

```gradle
ext {
    set('springAiVersion', "2.0-M1")
}
```

**After:**

```gradle
ext {
    set('springAiVersion', "2.0.0-M1")
}
```

**Transformation:**

```text
REPLACE: set('springAiVersion', "2.0-M1")
WITH:    set('springAiVersion', "2.0.0-M1")
```

### Gradle (Kotlin DSL)

**Before:**

```kotlin
extra["springAiVersion"] = "2.0-M1"
```

**After:**

```kotlin
extra["springAiVersion"] = "2.0.0-M1"
```

**Transformation:**

```text
REPLACE: extra["springAiVersion"] = "2.0-M1"
WITH:    extra["springAiVersion"] = "2.0.0-M1"
```

---

## Output Format

```yaml
springAiVersionValidation:
  detected: true
  buildFile: 'pom.xml'

  validations:
    - location: 'properties/spring-ai.version'
      line: 45
      originalVersion: '2.0-M1'
      valid: false
      issue: 'MISSING_PATCH_VERSION'
      issueDescription: 'Version format must be X.Y.Z-M# not X.Y-M#'
      correctedVersion: '2.0.0-M1'
      automationPotential: '100%'
      fix:
        type: 'REPLACE_TEXT'
        searchPattern: '<spring-ai.version>2.0-M1</spring-ai.version>'
        replacement: '<spring-ai.version>2.0.0-M1</spring-ai.version>'

    - location: 'dependencies/spring-ai-bom/version'
      line: 120
      originalVersion: '2.0-RC1'
      valid: false
      issue: 'MISSING_PATCH_VERSION'
      issueDescription: 'RC version format must be X.Y.Z-RC# not X.Y-RC#'
      correctedVersion: '2.0.0-RC1'
      automationPotential: '100%'
      fix:
        type: 'REPLACE_TEXT'
        searchPattern: '<version>2.0-RC1</version>'
        replacement: '<version>2.0.0-RC1</version>'

  summary:
    totalValidations: 2
    invalidVersions: 2
    autoFixable: 2
    requiresManualReview: 0
    estimatedEffort: '2 minutes'
```

---

## Execution Logic

### Phase 1: Detection

**Tools Used:** Read, Grep

**Maven Detection:**

```bash
# Find Spring AI version properties
grep -n "spring-ai.version" pom.xml

# Find Spring AI dependencies
grep -A 5 "spring-ai" pom.xml | grep -E "<version>"
```

**Gradle Detection:**

```bash
# Find version declarations
grep -n "springAiVersion" build.gradle build.gradle.kts

# Find Spring AI dependencies
grep -A 5 "spring-ai" build.gradle | grep "version"
```

### Phase 2: Validation

**Read Build File:**

```bash
# Read entire pom.xml or build.gradle
# Extract Spring AI versions using regex
# Validate each version against pattern
```

**Validation Logic:**

```python
import re

def validate_spring_ai_version(version):
    # Valid pattern: X.Y.Z-M#, X.Y.Z-RC#, X.Y.Z-SNAPSHOT, X.Y.Z
    pattern = r'^\d+\.\d+\.\d+(-M\d+|-RC\d+|-SNAPSHOT)?$'

    if re.match(pattern, version):
        return {
            'valid': True,
            'issue': None
        }

    # Detect specific issues
    if re.match(r'^\d+\.\d+-M\d+$', version):
        return {
            'valid': False,
            'issue': 'MISSING_PATCH_VERSION',
            'corrected': re.sub(r'^(\d+\.\d+)-M', r'\1.0-M', version)
        }

    if re.match(r'^\d+\.\d+-RC\d+$', version):
        return {
            'valid': False,
            'issue': 'MISSING_PATCH_VERSION',
            'corrected': re.sub(r'^(\d+\.\d+)-RC', r'\1.0-RC', version)
        }

    return {
        'valid': False,
        'issue': 'MALFORMED_VERSION',
        'corrected': None
    }
```

### Phase 3: Auto-Correction

**Tools Used:** Edit

**For Each Invalid Version:**

1. Generate corrected version
2. Build search pattern (exact match from file)
3. Build replacement string
4. Apply Edit tool with old_string and new_string

**Example:**

```python
# Maven correction
old_string = "<spring-ai.version>2.0-M1</spring-ai.version>"
new_string = "<spring-ai.version>2.0.0-M1</spring-ai.version>"

# Apply edit
edit_file("pom.xml", old_string, new_string)
```

### Phase 4: Verification

**Post-Correction Validation:**

```bash
# Re-read file
# Validate corrected versions
# Ensure all versions now valid
```

---

## Maven Cache Remediation

After fixing version format, clear Maven cache for Spring AI:

```bash
# Remove cached failed lookups
rm -rf ~/.m2/repository/org/springframework/ai

# Force Maven to re-download with updated version
mvn clean compile -U
```

**Note:** Always use `-U` flag after version corrections to force dependency updates.

---

## Integration Points

### Used by Agents

- **validation-agent** (Phase 7: Version Format Validation)
- **discovery-agent** (Spring AI version detection)

### Uses Skills

- **version-detector** - Extract Spring AI version

### Triggers

- Auto-triggered when Spring AI milestone/RC version detected
- Manual invocation when dependency resolution fails

---

## Validation Rules Summary

| Issue Type          | Pattern   | Correction      | Example                 |
| ------------------- | --------- | --------------- | ----------------------- |
| Missing patch       | `X.Y-M#`  | Add `.0`        | `2.0-M1` → `2.0.0-M1`   |
| Missing patch (RC)  | `X.Y-RC#` | Add `.0`        | `2.0-RC1` → `2.0.0-RC1` |
| Missing minor+patch | `X-M#`    | Add `.0.0`      | `2-M1` → `2.0.0-M1`     |
| Wrong separator     | `X.Y.M#`  | Change to `-M#` | `2.0.M1` → `2.0.0-M1`   |
| Missing milestone # | `X.Y.Z-M` | Manual review   | Cannot auto-fix         |

---

## Exit Criteria

The skill completes successfully when:

1. All Spring AI versions detected
2. All versions validated against format rules
3. Invalid versions corrected (or flagged for manual review)
4. Build file updated
5. Validation report generated
6. Post-correction verification passed

---

## Error Handling

### Build File Access Errors

- If pom.xml/build.gradle cannot be read: Report error, skip validation
- If file is read-only: Report manual correction needed

### Correction Failures

- If pattern not found after correction: Verify file was actually updated
- If multiple occurrences: Use Edit tool with replace_all=false for safety

### Malformed Versions

- If version cannot be auto-corrected: Flag for manual review
- Provide guidance on correct format

---

## Examples

### Example 1: Simple Milestone Correction

**Input (pom.xml):**

```xml
<properties>
    <spring-ai.version>2.0-M1</spring-ai.version>
</properties>
```

**Validation:**

```yaml
originalVersion: '2.0-M1'
valid: false
issue: 'MISSING_PATCH_VERSION'
correctedVersion: '2.0.0-M1'
```

**Output:**

```xml
<properties>
    <spring-ai.version>2.0.0-M1</spring-ai.version>
</properties>
```

---

### Example 2: Multiple Invalid Versions

**Input (pom.xml):**

```xml
<properties>
    <spring-ai.version>2.0-M1</spring-ai.version>
</properties>

<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter</artifactId>
    <version>2.0-RC1</version>
</dependency>
```

**Validation:**

```yaml
validations:
  - originalVersion: '2.0-M1'
    correctedVersion: '2.0.0-M1'
  - originalVersion: '2.0-RC1'
    correctedVersion: '2.0.0-RC1'
```

**Output:**

```xml
<properties>
    <spring-ai.version>2.0.0-M1</spring-ai.version>
</properties>

<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter</artifactId>
    <version>2.0.0-RC1</version>
</dependency>
```

---

### Example 3: Valid Version (No Changes)

**Input:**

```xml
<spring-ai.version>2.0.0-M1</spring-ai.version>
```

**Validation:**

```yaml
originalVersion: '2.0.0-M1'
valid: true
issue: null
```

**Output:** No changes needed

---

## References

- **Spring AI Releases:** <https://github.com/spring-projects/spring-ai/releases>
- **Spring Milestones Repository:** <https://repo.spring.io/milestone>
- **Maven Central Search:** <https://central.sonatype.com/artifact/org.springframework.ai/spring-ai-bom>

---

## Version History

- **1.0.0** (2026-01-04): Initial implementation for Spring AI version format validation
