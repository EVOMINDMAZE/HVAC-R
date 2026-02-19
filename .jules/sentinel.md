## 2025-02-18 - Hardcoded Fallback JWT Secret
**Vulnerability:** The application was configured to fall back to a hardcoded "fallback-secret-change-in-production" if `JWT_SECRET` was missing, even in production environments. This allowed trivial JWT forgery.
**Learning:** Default fallbacks for critical security parameters (like secrets) must be strictly avoided in production. "Fail open" or "Fail soft" behavior for authentication secrets is a critical risk.
**Prevention:** Enforce strict configuration checks at startup or runtime. In production, missing secrets must cause the application to crash or refuse to authenticate (Fail Secure).
