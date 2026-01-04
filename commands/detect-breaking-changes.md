# Detect Breaking Changes Command

**Command:** `/detect-breaking-changes`
**Description:** Analyze project for Spring Boot 4.x breaking changes and migration blockers
**Version:** 1.0.0

---

## Purpose

Proactively detect all Spring Boot 4.x breaking changes, OpenFeign incompatibilities, and migration blockers BEFORE attempting migration.
Provides comprehensive risk assessment and remediation roadmap.

---

## Usage

```bash
/detect-breaking-changes
```

**Options:**

```bash
/detect-breaking-changes --detailed    # Detailed report with all code locations
/detect-breaking-changes --summary     # Summary report only
/detect-breaking-changes --auto-fix    # Auto-fix remediable issues
```

---

## What It Does

Invokes the **breaking-changes-analyzer** agent to perform:

1. **Version Detection** - Extract current framework versions
2. **Breaking Changes Scan** - Detect Spring Boot 4.x API removals
3. **OpenFeign Analysis** - Assess Feign client compatibility
4. **Risk Categorization** - Classify by severity (CRITICAL, HIGH, MEDIUM, LOW)
5. **Feasibility Assessment** - Calculate migration feasibility score
6. **Remediation Roadmap** - Generate prioritized action plan

---

## Output

Generates comprehensive breaking changes report:

```yaml
Breaking Changes Analysis Report
================================

Project: my-spring-app
Current Version: Spring Boot 3.5.7
Target Version: Spring Boot 4.0.1

CRITICAL ISSUES (2):
  ❌ [BOOT4-003] Undertow starter incompatible with Servlet 6.1
     Location: pom.xml:45
     Impact: Runtime failure
     Fix: Remove spring-boot-starter-undertow (100% automated)
     Effort: 2 minutes

  ❌ [BOOT4-002] HttpMessageConverters removed from Spring Boot 4.x
     Location: FeignConfiguration.java:23
     Impact: Blocks custom Feign configurations
     Fix: Upgrade Spring Cloud to 2025.1.0+ or migrate to HTTP Interface
     Effort: 4-6 hours

HIGH PRIORITY (3):
  ⚠️ [BOOT4-001] RestClientCustomizer removed in Spring Boot 4.0.1
     Location: RestConfig.java:15
     Impact: Compilation failure
     Fix: Migrate to RestClient.Builder bean (90% automated)
     Effort: 15 minutes

OpenFeign Analysis:
  Clients Detected: 3
  Compatibility: INCOMPATIBLE (Spring Cloud 2025.0.0)
  Recommendation: Upgrade to Spring Cloud 2025.1.0+ or migrate to HTTP Interface

Migration Feasibility:
  Score: 70/100 (FEASIBLE)
  Auto-Remediable: 70%
  Manual Effort: 6-8 hours
  Total Effort: 8-12 hours

Recommended Actions:
  1. Auto-fix: Remove Undertow starter
  2. Decide: OpenFeign strategy (upgrade Spring Cloud or migrate)
  3. Migrate: RestClientCustomizer patterns
  4. Validate: Run full test suite

Ready to proceed with migration? (y/n)
```

---

## Integration

**Uses:**

- **breaking-changes-analyzer** agent (primary)
- **spring-boot-4-breaking-changes-detector** skill
- **openfeign-compatibility-detector** skill

**Triggers Before:**

- `/migrate` command (optionally)
- `/migrate-github` command (optionally)

---

## Use Cases

**Before Migration:**

```bash
# Assess migration feasibility
/detect-breaking-changes

# Review report
# Make informed decision about migration approach
# Plan remediation strategy
```

**During Troubleshooting:**

```bash
# Diagnose why migration failed
/detect-breaking-changes --detailed

# Identify specific blockers
# Get remediation guidance
```

---

## Exit Codes

| Code | Meaning                                        |
| ---- | ---------------------------------------------- |
| 0    | No breaking changes detected (safe to migrate) |
| 1    | Breaking changes detected (review required)    |
| 2    | Critical blockers detected (migration blocked) |

---

## Examples

### Example 1: Clean Project

```bash
$ /detect-breaking-changes

Analyzing project for Spring Boot 4.x breaking changes...

✅ No breaking changes detected!
✅ No OpenFeign usage detected
✅ Project is ready for Spring Boot 4.x migration

Recommendation: Proceed with /migrate command
```

### Example 2: Blockers Detected

```bash
$ /detect-breaking-changes

Analyzing project for Spring Boot 4.x breaking changes...

❌ CRITICAL: 2 blockers detected
⚠️  HIGH: 3 issues detected
ℹ️  MEDIUM: 1 warning

See full report above for remediation guidance.

Recommendation: Fix critical blockers before attempting migration
```

---

## References

- **Spring Boot 4.0 Migration Guide:** <https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Migration-Guide>
- **Related Commands:** /migrate, /analyze
- **Related Agents:** breaking-changes-analyzer

---

## Version History

- **1.0.0** (2026-01-04): Initial command for proactive breaking changes detection
