# Sentinel's Journal

This journal records CRITICAL security learnings, vulnerabilities, and patterns discovered during security audits and fixes.

**Guidelines:**
- Only add entries for UNIQUE or CRITICAL learnings.
- Do not log routine fixes.
- Format: `## YYYY-MM-DD - [Title]` followed by Vulnerability, Learning, and Prevention.

---

## 2025-02-17 - [Global State Rate Limit Vulnerability]
**Vulnerability:** The `createSlidingWindowRateLimiter` function used a `requests` array defined in the closure scope, shared across ALL requests. This meant that the rate limit was applied globally to the entire application, not per-user or per-IP. A single user could exhaust the limit for everyone, causing a Denial of Service (DoS).
**Learning:** Closure-based state in middleware factories must be carefully scoped. If state is intended to be per-request or per-user, it must be stored in a data structure keyed by the user/IP (like a `Map`), not in a simple variable captured by the closure.
**Prevention:** Always verify the scope of state variables in Express middleware factories. Use `Map` or external stores (Redis) keyed by user identifier for rate limiting. Write tests that simulate concurrent users to detect global state leakage.
