## 2024-05-22 - [CRITICAL] Authentication Bypass in Supabase Middleware
**Vulnerability:** The `authenticateSupabaseToken` middleware used `jwt.decode()` to parse tokens without verifying the signature. This allowed attackers to forge valid-looking JWTs with arbitrary user IDs and roles, completely bypassing authentication.
**Learning:** `jwt.decode()` is never safe for authentication decisions. It only parses the payload. Verification requires `jwt.verify()` with a secret or an API call to the provider (e.g., `supabase.auth.getUser()`).
**Prevention:** Always verify token signatures. When using Supabase or other Auth providers, prefer using their official client SDK methods (like `getUser()`) which handle verification securely, especially if local secrets are not available.
