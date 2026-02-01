-- Simplify Assets Access
-- Allow all authenticated users (Admins & Techs) to see assets to prevent deep join hangs
DROP POLICY IF EXISTS "Users can view assets of their clients" ON public.assets;
DROP POLICY IF EXISTS "Enable asset read for all authenticated users" ON public.assets;
CREATE POLICY "Enable asset read for all authenticated users" ON public.assets
    FOR SELECT
    TO authenticated
    USING (true);

-- Simplify Clients Access (Ensure robust read)
DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.clients;
DROP POLICY IF EXISTS "Users can view their own clients" ON public.clients;
DROP POLICY IF EXISTS "Enable client read for all authenticated users" ON public.clients;
CREATE POLICY "Enable client read for all authenticated users" ON public.clients
    FOR SELECT
    TO authenticated
    USING (true);

-- Ensure Jobs access is robust and performant
-- Allow admins to see everything, techs to see assigned, and clients to see theirs
DROP POLICY IF EXISTS "Company Admins can manage all company jobs" ON public.jobs;
DROP POLICY IF EXISTS "Technicians can view assigned jobs" ON public.jobs;
DROP POLICY IF EXISTS "Clients can view their jobs" ON public.jobs;

-- 1. Admin Policy (Optimized)
DROP POLICY IF EXISTS "Admins can view all jobs" ON public.jobs;
CREATE POLICY "Admins can view all jobs" ON public.jobs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 2. Tech Policy
DROP POLICY IF EXISTS "Technicians can view assigned jobs" ON public.jobs;
CREATE POLICY "Technicians can view assigned jobs" ON public.jobs
    FOR SELECT
    TO authenticated
    USING (technician_id = auth.uid());

-- 3. Client Policy
DROP POLICY IF EXISTS "Clients can view their jobs" ON public.jobs;
CREATE POLICY "Clients can view their jobs" ON public.jobs
    FOR SELECT
    TO authenticated
    USING (client_id IN (
         SELECT lookup.client_id 
         FROM public.user_roles lookup 
         WHERE lookup.user_id = auth.uid()
    ));

-- Allow updates for technicians
DROP POLICY IF EXISTS "Technicians can update own jobs" ON public.jobs;
CREATE POLICY "Technicians can update own jobs" ON public.jobs
    FOR UPDATE
    TO authenticated
    USING (technician_id = auth.uid())
    WITH CHECK (technician_id = auth.uid());
