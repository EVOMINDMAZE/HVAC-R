## 2024-05-24 - Hardcoded fallback secret for JWT
**Vulnerability:** In `server/utils/supabaseAuth.ts`, the middleware to authenticate supabase tokens falls back to an insecure string `fallback-secret-change-in-production` if the environment lacks `JWT_SECRET` and `SUPABASE_JWT_SECRET`.
**Learning:** Relying on insecure strings as fallbacks poses a critical security threat, since any JWT forged with that fallback string would successfully bypass verification.
**Prevention:** Apply a strict fail-secure policy where if the required secrets are not provided in a production environment, the server immediately throws a 500 fatal error.
