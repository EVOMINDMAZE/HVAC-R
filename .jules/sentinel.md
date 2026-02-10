# Sentinel's Journal

## 2025-02-15 - JWT Verification Bypass in Supabase Auth Middleware
**Vulnerability:** `server/utils/supabaseAuth.ts` was using `jwt.decode()` to parse Supabase tokens without verifying the signature, allowing any forged token to be accepted.
**Learning:** Developers might use `jwt.decode()` for convenience or debugging and forget to replace it with proper verification (`getUser()`) in production.
**Prevention:** Always use `supabase.auth.getUser()` or `jwt.verify()` (with secret) to validate tokens. Never trust `jwt.decode()` for authentication.
