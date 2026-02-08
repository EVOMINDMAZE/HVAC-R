# Task: Centralize Credentials & Implement Hybrid Supabase Strategy

## Objective
Ensure the project uses Docker for local Supabase development and Supabase Cloud for production. All credentials are centralized in a single source of truth (`.env`), with all code and documentation synced to this configuration.

## Todo List
- [x] **Analyze Credential Distribution**
    - [x] Audit `.env` files (root vs client).
    - [x] Scan codebase for hardcoded credentials (localhost:54321 is now the standard local development URL).
    - [x] Check `supabase/config.toml` for project linkage.
- [x] **Centralize Credentials**
    - [x] Consolidate necessary variables into the root `.env`.
    - [x] Ensure Client reads from the correct environment variables.
    - [x] Verify Database Password is safe and stored (or referenced) in `.env` if needed for direct connections (mostly handled by Supabase CLI via `link`).
- [x] **Implement Hybrid Supabase Strategy**
    - [x] Support local Docker development with `supabase start` for local testing.
    - [x] Ensure `supabase db push` connects to remote cloud for production deployment.
- [x] **Sync Documentation & Skills**
    - [x] Update `skills/` to include local Docker development references.
    - [x] Ensure `DEVELOPER_GUIDE.md` is aligned with hybrid approach.
- [x] **Verification**
    - [x] Confirm application connects to Cloud DB.
    - [x] Confirm no secrets are leaked in code.
