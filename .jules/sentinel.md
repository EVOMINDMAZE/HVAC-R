## 2024-05-24 - Hardcoded Fallback Secrets
**Vulnerability:** The application used a hardcoded fallback secret (`"fallback-secret-change-in-production"`) when environment variables were missing, allowing authentication bypass if the server was misconfigured.
**Learning:** Developers sometimes add fallback secrets for "easier local dev" but forget to remove them or ensure they are never used in production. `jwt.verify` accepting a fallback string is dangerous.
**Prevention:** Never use fallbacks for security-critical secrets. Fail fast and crash the server if required secrets are missing.
