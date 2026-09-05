-- Phase 6 (Catalog Outward): count scans of the printable department sheets.
-- Each sheet's QR points at the catalog-track edge function with ?p=<slug>.
-- The fn records one row per scan (service role) and 302-redirects the scanner
-- to the product page with UTM tags, so real-world leaflet traffic becomes
-- countable end-to-end.
--
-- No client access path exists: RLS enabled, no policies => default DENY ALL
-- for anon/authenticated (same stance as 20260901000000_rls_lockdown.sql).
-- The edge function uses SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS.

create table if not exists public.catalog_scans (
  id bigint generated always as identity primary key,
  slug text not null,
  scanned_at timestamptz not null default now(),
  user_agent text,
  referer text
);

alter table public.catalog_scans enable row level security;

create index if not exists catalog_scans_slug_time_idx
  on public.catalog_scans (slug, scanned_at desc);
