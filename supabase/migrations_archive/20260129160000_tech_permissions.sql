-- 1. Grant Client Access (Allow authenticated users to view clients)
-- Drop existing policy if it conflicts or just create a new one ensuring no error
DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.clients;
CREATE POLICY "Enable read for authenticated users" ON public.clients
    FOR SELECT
    TO authenticated
    USING (true);

-- 2. Verify Job Updates (Allow technicians to update their own jobs)
-- Specifically for updating status and location
DROP POLICY IF EXISTS "Technicians can update own jobs" ON public.jobs;
CREATE POLICY "Technicians can update own jobs" ON public.jobs
    FOR UPDATE
    TO authenticated
    USING (
        (auth.uid() = technician_id)
    )
    WITH CHECK (
        (auth.uid() = technician_id)
    );
