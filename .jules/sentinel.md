## 2025-02-21 - Critical: Insecure JWT Handling
**Vulnerability:** Found `jwt.decode()` used to "verify" Supabase tokens in `server/utils/supabaseAuth.ts`. This allows any attacker to bypass authentication by crafting a token with arbitrary claims, as the signature was ignored.
**Learning:** Middleware intended to support multiple auth providers (Supabase vs Legacy) was implemented insecurely for the Supabase path. Developers might assume `jwt.decode` is sufficient if they trust the source, but without verification, the source cannot be trusted.
**Prevention:** Always use `jwt.verify()` with a secret or an identity provider's verification endpoint (like `supabase.auth.getUser()`) to validate tokens. Never trust the payload of an unverified token.
