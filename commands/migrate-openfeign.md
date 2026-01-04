# Migrate OpenFeign Command

**Command:** `/migrate-openfeign`
**Description:** Migrate Spring Cloud OpenFeign clients to Spring HTTP Interface
**Version:** 1.0.0

---

## Purpose

Automate migration from Spring Cloud OpenFeign to Spring's native HTTP Interface clients (`@HttpExchange`). This resolves Spring Boot 4.x
compatibility issues with OpenFeign and aligns with Spring's recommended HTTP client approach.

---

## Usage

```bash
/migrate-openfeign
```

**Options:**

```bash
/migrate-openfeign --analyze-only    # Analysis only, no migration
/migrate-openfeign --client UserClient    # Migrate specific client only
/migrate-openfeign --auto-approve    # Skip confirmation prompts
```

---

## What It Does

Invokes the **openfeign-to-httpinterface-migrator** skill to perform:

1. **Analysis** - Inventory all @FeignClient interfaces and custom configurations
2. **Planning** - Generate migration plan with effort estimates
3. **Confirmation** - Get user approval for migration approach
4. **Migration** - Transform interfaces, configurations, and dependencies
5. **Validation** - Compile and test migrated clients
6. **Cleanup** - Remove OpenFeign dependencies and configurations

---

## Migration Phases

### Phase 1: Analysis

Scans project for:

- @FeignClient interfaces
- Custom Decoder/Encoder configurations
- RequestInterceptor beans
- ErrorDecoder beans
- Timeout configurations

**Output:**

```text
Analyzing OpenFeign usage...

Found 3 Feign clients:
  - UserClient (5 methods, no custom config)
  - ProductClient (8 methods, uses custom Jackson config)
  - OrderClient (3 methods, custom error handling)

Custom Configurations:
  - FeignConfiguration.java (Jackson, Error Handling)

Estimated Effort: 4-6 hours
Automation Potential: 85%
```

### Phase 2: Migration Planning

Generates step-by-step migration plan:

```text
Migration Plan:
==============

1. Setup (5 minutes):
   - Add spring-boot-starter-restclient dependency
   - Create shared RestClient.Builder configuration

2. Migrate Clients (30-45 minutes):
   - UserClient: Simple (10 min)
   - ProductClient: Moderate (20 min)
   - OrderClient: Moderate (15 min)

3. Migrate Configurations (1-2 hours):
   - Jackson configuration → ClientHttpMessageConvertersCustomizer
   - Error handling → RestClient error handler

4. Cleanup (10 minutes):
   - Remove @EnableFeignClients
   - Remove spring-cloud-starter-openfeign
   - Delete FeignConfiguration.java

5. Validation (30 minutes):
   - Compile and test each client
   - Integration testing

Proceed with migration? (y/n)
```

### Phase 3: Migration Execution

Performs incremental migration:

```text
Migrating OpenFeign clients to HTTP Interface...

✅ Setup complete: RestClient dependency added
✅ UserClient migrated (10 minutes)
   - Interface annotations updated
   - HttpServiceProxyFactory bean created
   - Tests passing

✅ ProductClient migrated (18 minutes)
   - Interface annotations updated
   - Jackson configuration migrated
   - HttpServiceProxyFactory bean created
   - Tests passing

✅ OrderClient migrated (14 minutes)
   - Interface annotations updated
   - Error handling migrated
   - HttpServiceProxyFactory bean created
   - Tests passing

✅ Cleanup complete
   - @EnableFeignClients removed
   - OpenFeign dependency removed
   - Feign configurations deleted

✅ Validation successful
   - Compilation: PASSED
   - Tests: 45/45 passed

Migration Complete! (42 minutes total)
```

---

## Pre-Migration Checklist

Before running this command, ensure:

- ✅ Project uses Spring Cloud OpenFeign
- ✅ Spring Boot 4.x compatibility is required
- ✅ All code committed (clean working directory)
- ✅ Tests are passing with current Feign setup
- ⚠️ Backup created or feature branch used

---

## Post-Migration Validation

Command automatically validates:

1. **Compilation** - Ensure all code compiles
2. **Test Execution** - Run full test suite
3. **HTTP Calls** - Verify API calls still work
4. **Integration Tests** - Run integration tests if available

**If Validation Fails:**

- Rollback to checkpoint
- Report specific failure
- Provide remediation guidance

---

## Rollback

If migration fails or needs to be undone:

```bash
# Automatic rollback on failure
# OR manual rollback:
git log --oneline | grep "migration(openfeign"
git revert <commit-sha>
```

Each client migrated in separate commit for granular rollback.

---

## Integration Points

**Uses:**

- **openfeign-to-httpinterface-migrator** skill (primary)
- **openfeign-compatibility-detector** skill (pre-analysis)

**Triggers After:**

- `/detect-breaking-changes` (recommended to run first)
- `/analyze` (for project analysis)

---

## Use Cases

### Use Case 1: Spring Boot 4.x Migration Blocked by OpenFeign

```bash
# Detected OpenFeign incompatibility
/detect-breaking-changes
# Shows: OpenFeign + Spring Boot 4.x incompatible

# Migrate to HTTP Interface
/migrate-openfeign
# Automated migration resolves blocker
```

### Use Case 2: Proactive Modernization

```bash
# Modernize HTTP clients to Spring native approach
/migrate-openfeign

# Benefits:
# - Remove third-party dependency
# - Better Spring Boot integration
# - Future-proof architecture
```

---

## Expected Outcomes

**Before Migration:**

- Uses Spring Cloud OpenFeign
- spring-cloud-starter-openfeign dependency
- @FeignClient interfaces
- @EnableFeignClients annotation
- Custom Feign configurations

**After Migration:**

- Uses Spring HTTP Interface
- spring-boot-starter-restclient dependency
- @HttpExchange interfaces
- HttpServiceProxyFactory beans
- ClientHttpMessageConvertersCustomizer

**Code Changes:**

- Interface annotations updated
- Configuration beans converted
- Dependencies replaced
- Cleanup performed

**Testing:**

- All HTTP calls still functional
- Tests passing
- API contracts preserved

---

## References

- **Spring HTTP Interface:** <https://docs.spring.io/spring-framework/reference/integration/rest-clients.html#rest-http-interface>
- **RestClient:** <https://docs.spring.io/spring-boot/reference/io/rest-client.html>
- **Related Commands:** /detect-breaking-changes, /migrate

---

## Version History

- **1.0.0** (2026-01-04): Initial command for OpenFeign → HTTP Interface migration
