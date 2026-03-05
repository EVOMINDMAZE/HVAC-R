# Sentinel Learnings

## 2026-02-07 - Insecure JWT Secret Fallback in Production
**Vulnerability:** The application used insecure fallback keys (`"your_super_secret_jwt_key_change_in_production"` or `"fallback-secret-change-in-production"`) for verifying JWT signatures when environment variables (`JWT_SECRET` or `SUPABASE_JWT_SECRET`) were missing. In production environments, this would allow an attacker to forge JWT tokens and achieve complete authentication bypass.
**Learning:** Hardcoded fallback secrets must never be used in production environments. Critical configurations such as authentication secrets must follow a "fail-secure" model, where the system fails to start or rejects requests rather than operating insecurely.
**Prevention:** Implement explicit environment checks for `process.env.NODE_ENV === "production"`. If critical secrets are missing or match default insecure values, the application should throw a fatal error or return a generic 500 error, refusing to process authentication requests.
