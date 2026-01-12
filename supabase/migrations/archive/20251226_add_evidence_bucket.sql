-- Create storage bucket for evidence
insert into storage.buckets (id, name, public)
values ('calculation-evidence', 'calculation-evidence', true)
on conflict (id) do nothing;

-- Policies for the bucket
create policy "Authenticated users can upload evidence"
  on storage.objects for insert
  with check (
    bucket_id = 'calculation-evidence' and
    auth.role() = 'authenticated'
  );

create policy "Authenticated users can view evidence"
  on storage.objects for select
  using (
    bucket_id = 'calculation-evidence' and
    auth.role() = 'authenticated'
  );

-- Add attachments/location columns to calculations table
alter table public.calculations 
add column if not exists location_lat float,
add column if not exists location_lng float,
add column if not exists weather_data jsonb,
add column if not exists evidence_urls text[]; -- Array of image URLs
