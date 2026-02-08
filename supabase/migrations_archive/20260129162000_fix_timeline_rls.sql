-- Enable RLS on job_timeline if not already (it is, hence the error)
ALTER TABLE public.job_timeline ENABLE ROW LEVEL SECURITY;

-- Allow technicians to view timeline for their jobs (or all, but let's restrict)
-- For now, let's allow read for authenticated to simplify UI fetching (which usually joins)
create policy "Read access for authenticated users"
on public.job_timeline for select
to authenticated
using ( true );

-- Allow technicians to insert timeline entries for their assigned jobs
CREATE POLICY "Techs can insert timeline for own jobs" ON public.job_timeline
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.jobs 
            WHERE jobs.id = job_timeline.job_id 
            AND jobs.technician_id = auth.uid()
        )
    );
