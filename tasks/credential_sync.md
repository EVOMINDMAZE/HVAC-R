# Task: Centralize Credentials & Enforce Supabase Cloud

## Objective
Ensure the project exclusively uses Supabase Cloud (no local Docker) and all credentials are centralized in a single source of truth (likely `.env`), with all code and documentation synced to this configuration.

## Todo List
- [x] **Analyze Credential Distribution**
    - [x] Audit `.env` files (root vs client).
    - [x] Scan codebase for hardcoded credentials or local Supabase URLs (localhost:54321, 127.0.0.1).
    - [x] Check `supabase/config.toml` for project linkage.
- [x] **Centralize Credentials**
    - [x] Consolidate necessary variables into the root `.env`.
    - [x] Ensure Client reads from the correct environment variables.
    - [x] Verify Database Password is safe and stored (or referenced) in `.env` if needed for direct connections (mostly handled by Supabase CLI via `link`).
- [x] **Enforce Supabase Cloud**
    - [x] Remove or deprecate package.json scripts that launch local Supabase instances (`supabase start`).
    - [x] Verify `supabase db push` connects to remote.
- [x] **Sync Documentation & Skills**
    - [x] Update `skills/` to remove local env references.
    - [x] Ensure `DEVELOPER_GUIDE.md` is aligned (already started, but verify).
- [x] **Verification**
    - [x] Confirm application connects to Cloud DB.
    - [x] Confirm no secrets are leaked in code.
