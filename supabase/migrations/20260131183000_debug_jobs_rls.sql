-- Temporarily disable Company Admins policy to test for RLS recursion/hang
-- This is to verify if the subquery in the Company Admins policy is causing the hang.

DROP POLICY IF EXISTS "Company Admins can manage all company jobs" ON public.jobs;

-- Keep only the technician policy active for testing
-- CREATE POLICY "Technicians can view assigned jobs"
-- ON public.jobs FOR SELECT
-- USING (technician_id = auth.uid());
