# Fix All Issues — Phased Remediation Design

**Date:** 2026-02-21  
**Initiative:** Stabilization-first remediation with phased convergence and closure  
**Status:** Finalized (Approved)

---

## Executive Summary

This design defines a three-phase remediation initiative to address the "fix all issues" directive without introducing breaking changes in Phase 1. The approach preserves all external endpoint behavior initially, then converges internal implementations to canonical contracts, and finally closes quality, security, and documentation gaps.

The primary strategy is compatibility-layer stabilization first, backed by explicit promotion gates and fallback controls. No phase promotion is allowed unless quality gates are green and external regressions are absent.

## Goals / Non-Goals

### Goals

- Stabilize production behavior quickly with no externally breaking API changes in Phase 1.
- Introduce deterministic compatibility adapters that normalize auth, billing identifiers, and envelopes.
- Converge to canonical service boundaries and shared DTO contracts in Phase 2.
- Close reliability, documentation, and security/dependency issues in Phase 3.
- Enforce phase gate criteria so promotion only occurs with measured parity and regression control.

### Non-Goals

- No endpoint removals or external contract-breaking schema changes in Phase 1.
- No large-scale rewrite of existing Express/Supabase implementations during stabilization.
- No fallback removal before objective parity and error-regression thresholds are satisfied.

## Constraints

- Phase 1 must preserve runtime parity and backward-compatible status semantics.
- Existing endpoints remain externally unchanged through stabilization.
- Fallback behavior is limited to retry-safe operations; non-idempotent operations must fail safely.
- Phase promotion is blocked when gate checks fail or external regressions are detected.

## Architecture

The architecture uses phased remediation:

1. **Phase 1: Compatibility-layer stabilization**
   - Runtime parity focus.
   - Explicit adapter boundaries.
   - No endpoint removals.
2. **Phase 2: Convergence**
   - Default routing shifts toward canonical paths.
   - Shared DTO contract adoption and type hardening advance.
3. **Phase 3: Quality closure**
   - Reliability, docs source-of-truth, and security/dependency closure complete.
   - Fallback removal occurs only after parity and regression criteria are met.

## Components by Phase

### Phase 1 — Stabilization Core

- **Runtime Matrix Unifier**
  - Harmonizes behavior across existing runtime variants.
- **API Compatibility Adapter**
  - Normalizes request/response shape and compatibility semantics.
- **Billing Compatibility Adapter**
  - Maps plan identifiers and billing semantics without external breakage.
- **Auth Compatibility Guard**
  - Normalizes auth context and preserves legacy expectations.

### Phase 2 — Convergence Core

- **Canonical Billing Service Boundary**
  - Establishes the canonical billing interface and ownership boundary.
- **Shared DTO Contract Pack**
  - Aligns cross-path payload contracts to a unified model.
- **Type-Hardening Track**
  - Increases TypeScript strictness incrementally in selected modules.

### Phase 3 — Quality Closure

- **CI/E2E Reliability Pack**
  - Hardens CI reliability and broad E2E confidence.
- **Docs Source-of-Truth Pack**
  - Ensures documentation consistency with implemented behavior.
- **Security/Dependency Closure Pack**
  - Resolves dependency/security gaps and codifies checks in CI.

## Data Flow

1. Incoming traffic continues to use existing external endpoints unchanged.
2. Internal compatibility adapters normalize:
   - Auth context
   - Plan identifiers
   - Response/error envelopes
3. Requests dispatch deterministically to existing Express/Supabase implementations.
4. Telemetry tags each execution path as `legacy`, `compat`, or `canonical`.
5. Migration control by phase:
   - **Phase 1:** Default `compat`, fallback `legacy`
   - **Phase 2:** Default `canonical`, fallback `compat`
   - **Phase 3:** Remove fallback only after parity metrics are consistently met

## Error Handling

- Use a stable normalized error schema across paths.
- Preserve backward-compatible status semantics in Phase 1.
- Allow fallback only for retry-safe operations.
- For non-idempotent operations, fail safely instead of replaying through fallback.
- Attach correlation metadata for traceability.
- Enforce log redaction for sensitive fields.
- Block batch promotion when error-regression thresholds are exceeded.

## Testing & Gates

### Phase 1 Gates

- Runtime parity checks.
- Adapter contract tests.
- Smoke E2E for:
  - Auth flow
  - Billing flow
  - Core technician workflow

### Phase 2 Gates

- Dual-path regression tests (compat and canonical).
- Incremental TypeScript strictness gates in selected modules.
- Expanded E2E coverage for converged paths.

### Phase 3 Gates

- Documentation consistency checks.
- Security/dependency CI checks.
- Shim removal-readiness report.

### Global Promotion Rule

No phase promotion without green gates and zero confirmed external regressions.

## Rollout / Sequencing

1. **Phase 1 rollout**
   - Deploy compatibility layer with default `compat` and `legacy` fallback.
   - Validate parity, status semantics, and smoke E2E.
2. **Phase 2 rollout**
   - Shift default routing to `canonical` with `compat` fallback.
   - Expand regression and E2E gates while increasing type strictness.
3. **Phase 3 rollout**
   - Close CI/E2E reliability, docs consistency, and security/dependency items.
   - Remove fallback only after sustained parity and error-regression compliance.

## Risks & Mitigations

- **Risk:** Hidden divergence between legacy and compat/canonical paths.  
  **Mitigation:** Runtime parity checks, dual-path regression testing, tagged telemetry.

- **Risk:** Breaking behavior in non-idempotent flows during fallback.  
  **Mitigation:** Restrict fallback to retry-safe operations; enforce safe-fail policy otherwise.

- **Risk:** Premature promotion under noisy metrics.  
  **Mitigation:** Hard gate thresholds and promotion blocking on regression signals.

- **Risk:** Drift between implementation and documentation.  
  **Mitigation:** Phase 3 docs source-of-truth checks in CI.

- **Risk:** Security/dependency debt delaying closure.  
  **Mitigation:** Dedicated closure pack and mandatory CI policy checks before exit.

## Exit Criteria

The initiative is complete when all conditions are true:

- Phase 1, 2, and 3 gates are green.
- External endpoint behavior is preserved through stabilization and verified during convergence.
- Canonical paths run as default with validated parity.
- Fallback/shim paths are removed only after sustained readiness evidence.
- Documentation, reliability, and security/dependency closure checks pass continuously in CI.
