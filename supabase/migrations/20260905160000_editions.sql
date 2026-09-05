-- The Cold Standard: verified cold-economy intelligence editions (product #5).
-- Public free hook under the ThermoNeural umbrella. sources jsonb from day one
-- (lesson from vanclass 018: corroboration badges live in the row, not a later migration).
create table if not exists public.editions (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,          -- ISO week: 2026-W36
  title text not null,
  summary text not null,              -- 2-line email/teaser summary
  transcript text not null default '',-- full edition text incl. sourced source list
  audio_url text not null,
  lang text not null default 'en',
  sources jsonb not null default '[]'::jsonb,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.editions enable row level security;

drop policy if exists "editions_public_read_published" on public.editions;
create policy "editions_public_read_published"
  on public.editions
  for select
  using (published_at <= now());

-- Service role (producer script) is exempt from RLS by default.
