## 2024-05-22 - [Critical] Hardcoded Fallback Secret in Production
**Vulnerability:** The application was configured to use a hardcoded fallback secret (`"fallback-secret-change-in-production"`) for JWT verification if `JWT_SECRET` was missing, even in production.
**Learning:** A "fail-secure" policy must be enforced explicitly in code, not just assumed. The memory stated it was fail-secure, but the implementation was fail-open (using fallback).
**Prevention:** Added a strict check in `server/utils/supabaseAuth.ts` to block requests and return 500 if running in production without configured secrets.
