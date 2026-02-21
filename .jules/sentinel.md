## 2026-02-07 - [CRITICAL] Hardcoded Fallback JWT Secret in Production
**Vulnerability:** The `authenticateSupabaseToken` middleware contained a hardcoded fallback secret (`"fallback-secret-change-in-production"`) that was used if `JWT_SECRET` was missing. This allows attackers to forge tokens if production configuration is incomplete.
**Learning:** Fallback secrets for development convenience can become critical vulnerabilities if they leak into production logic.
**Prevention:** Strictly enforce `NODE_ENV === 'production'` checks. If in production and secrets are missing, the application must fail fast (return 500) rather than falling back to insecure defaults.
