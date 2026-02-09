## 2025-02-18 - Supabase JWT Verification Bypass
**Vulnerability:** The `authenticateSupabaseToken` middleware was using `jwt.decode()` to parse Supabase tokens without verifying their signature. This allowed any forged token with a valid payload structure to authenticate as any user.
**Learning:** Manual JWT handling for Supabase requires careful verification using the Supabase client or verifying the JWT signature with the project secret. `jwt.decode` is never safe for authentication.
**Prevention:** Always use `supabase.auth.getUser()` to verify tokens on the server side when the JWT secret is not directly available or when you want to ensure the session is active (not revoked).
