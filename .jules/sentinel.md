## 2024-05-20 - Auth Bypass in Supabase Verification
**Vulnerability:** The `authenticateSupabaseToken` middleware used `jwt.decode()` without verifying the signature, allowing attackers to forge tokens.
**Learning:** Never assume a JWT is valid just because it decodes. Always verify the signature. In Supabase context, `supabase.auth.getUser(token)` is a robust verification method.
**Prevention:** Use `getUser()` or verify JWT signature with the secret.
