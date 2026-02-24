## 2026-02-24 - [Critical] Fail-Secure JWT Secret
**Vulnerability:** The application fell back to a hardcoded insecure secret ("fallback-secret-change-in-production") when `JWT_SECRET` was missing, even in production.
**Learning:** Default fallbacks for critical security configuration can silently undermine security in production if environment variables are missed.
**Prevention:** Explicitly check `NODE_ENV === 'production'` and throw fatal errors for missing or default secrets, rather than falling back.
