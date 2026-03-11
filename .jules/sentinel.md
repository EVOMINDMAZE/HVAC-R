# Sentinel's Journal

## 2026-02-15 - Hardcoded JWT Secret Fallback
**Vulnerability:** The application was configured to use a hardcoded fallback string ("fallback-secret-change-in-production") if the `JWT_SECRET` environment variable was missing.
**Learning:** This allowed an attacker to forge JWT tokens if they knew the fallback string and the server was misconfigured.
**Prevention:** Fail securely. If a critical security secret is missing, the application should refuse to start or refuse to process requests, rather than falling back to an insecure default.
