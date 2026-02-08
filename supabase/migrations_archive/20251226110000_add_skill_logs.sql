-- Create skill_logs table
create table if not exists public.skill_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  project_id uuid references public.projects(id) on delete set null,
  skill_type text not null,
  xp_value integer default 10,
  metadata jsonb,
  verified_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.skill_logs enable row level security;

-- Policies
create policy "Users can view their own skill logs"
  on public.skill_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert their own skill logs"
  on public.skill_logs for insert
  with check (auth.uid() = user_id);
