## 2025-02-05 - JWT Verification Bypass
**Vulnerability:** The server was decoding JWT tokens using `jwt.decode()` without verifying the signature, allowing any forged token to be accepted.
**Learning:** Developers might assume `jwt.decode()` verifies the token or use it for "fast" local checks without realizing the security implication.
**Prevention:** Always use `supabase.auth.getUser()` to verify Supabase tokens, or verify the signature locally using the correct secret. Never trust the payload of an unverified token.
