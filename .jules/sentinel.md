## 2026-02-11 - Hardcoded JWT Fallback Secret
**Vulnerability:** A hardcoded fallback string `"fallback-secret-change-in-production"` was used in `server/utils/supabaseAuth.ts` when environment variables `JWT_SECRET` or `SUPABASE_JWT_SECRET` were missing.
**Learning:** Fallback defaults for critical security parameters (like signing keys) are dangerous because they can silently enable insecurity if configuration is missed, allowing potential attackers to sign tokens with the known fallback.
**Prevention:** Always fail securely (crash or return 500) when critical security configuration is missing, rather than using a default.
