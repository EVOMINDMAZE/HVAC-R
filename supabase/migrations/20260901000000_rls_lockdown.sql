-- RLS lockdown (Supabase linter 0003_rls_disabled_in_public)
-- Tables exposed via PostgREST without row-level security.
--
-- Access paths verified before enabling (2026-09-01):
--   skool_subscriptions  -> SECURITY DEFINER RPCs only:
--     get_user_skool_subscriptions(), link_skool_subscription(), verify_skool_subscription()
--     (definer functions run as owner, unaffected by RLS)
--   user_roles_backup    -> no direct client access anywhere in repos (0 rows, backup table)
--   ai_cache             -> server-side reads use service_role key (bypasses RLS), e.g. VanClass /api/ask
--
-- No policies created => default DENY ALL for anon/authenticated direct access.
-- FORCE RLS intentionally NOT used (would break the definer functions above).

alter table public.skool_subscriptions enable row level security;
alter table public.ai_cache enable row level security;
alter table public.user_roles_backup enable row level security;
