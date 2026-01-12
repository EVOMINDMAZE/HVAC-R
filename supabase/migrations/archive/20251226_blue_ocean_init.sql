-- Create projects table
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  address text,
  status text default 'active' check (status in ('active', 'archived', 'completed')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.projects enable row level security;

-- RLS Policies
create policy "Users can view their own projects"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "Users can insert their own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own projects"
  on public.projects for update
  using (auth.uid() = user_id);

create policy "Users can delete their own projects"
  on public.projects for delete
  using (auth.uid() = user_id);

-- Add trigger for updated_at (reusing existing function)
drop trigger if exists handle_projects_updated_at on public.projects;
create trigger handle_projects_updated_at
  before update on public.projects
  for each row
  execute procedure public.handle_updated_at();

-- Add project_id to calculations
alter table public.calculations 
add column if not exists project_id uuid references public.projects(id) on delete set null;
