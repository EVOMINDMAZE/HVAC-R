-- Create table for Refrigerant Asset (Cylinders)
create table if not exists public.refrigerant_cylinders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  cylinder_code text not null, -- Manual ID written on the tank (e.g., "T-101")
  refrigerant_type text not null, -- R-410A, R-22, etc.
  initial_weight_lbs numeric not null,
  current_weight_lbs numeric not null,
  status text check (status in ('active', 'empty', 'returned')) default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create table for Usage Logs (The Ledger)
create table if not exists public.refrigerant_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  cylinder_id uuid references public.refrigerant_cylinders(id) on delete set null,
  job_id text, -- Optional link to a specific job/project
  transaction_type text check (transaction_type in ('charge', 'recover', 'disposal', 'addition')) not null,
  amount_lbs numeric not null,
  notes text,
  technician_name text, -- For tracking *who* did it if multi-user
  created_at timestamptz default now()
);

-- RLS Policies
alter table public.refrigerant_cylinders enable row level security;
alter table public.refrigerant_logs enable row level security;

create policy "Users can view their own cylinders" 
  on public.refrigerant_cylinders for select 
  using (auth.uid() = user_id);

create policy "Users can insert their own cylinders" 
  on public.refrigerant_cylinders for insert 
  with check (auth.uid() = user_id);

create policy "Users can update their own cylinders" 
  on public.refrigerant_cylinders for update 
  using (auth.uid() = user_id);

create policy "Users can view their own logs" 
  on public.refrigerant_logs for select 
  using (auth.uid() = user_id);

create policy "Users can insert their own logs" 
  on public.refrigerant_logs for insert 
  with check (auth.uid() = user_id);

-- Trigger to update Current Weight on Log Entry
create or replace function public.update_cylinder_weight()
returns trigger as $$
begin
  if NEW.transaction_type = 'charge' then
    update public.refrigerant_cylinders
    set current_weight_lbs = current_weight_lbs - NEW.amount_lbs
    where id = NEW.cylinder_id;
  elsif NEW.transaction_type = 'recover' then
    -- Recovering INTO a cylinder adds weight
    update public.refrigerant_cylinders
    set current_weight_lbs = current_weight_lbs + NEW.amount_lbs
    where id = NEW.cylinder_id;
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger on_log_entry
  after insert on public.refrigerant_logs
  for each row execute procedure public.update_cylinder_weight();
