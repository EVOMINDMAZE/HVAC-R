## 2025-05-18 - [CRITICAL] Fail-Secure Configuration Enforcement
**Vulnerability:** The `authenticateSupabaseToken` middleware allowed the application to start and authenticate requests in production even if the `JWT_SECRET` was missing or set to a default insecure value, by falling back to a hardcoded string.
**Learning:** Hardcoded fallbacks for security-critical secrets create hidden backdoors. If the environment variable is missing, the application should fail loudly rather than silently degrading security.
**Prevention:** In production environments (`NODE_ENV === 'production'`), always validate that critical secrets are present and meet complexity requirements. If validation fails, terminate the process or return fatal errors immediately. Do not use fallbacks in production.
