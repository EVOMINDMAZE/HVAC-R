## 2024-05-22 - Insecure Fallback Secret in Production
**Vulnerability:** `authenticateSupabaseToken` middleware used a hardcoded fallback secret if `JWT_SECRET` was missing, even in production.
**Learning:** The logic intended for development convenience ("warn but proceed") was not scoped to non-production environments, creating a critical vulnerability where an attacker could forge tokens if secrets were unset.
**Prevention:** Always enforce fail-secure defaults in production. Use `process.env.NODE_ENV === 'production'` to trigger fatal errors instead of warnings for missing security configuration.
