-- Re-enable RLS on jobs table and define simplified policies
-- This reverts the disable from diagnostic migration and establishes working policies

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Technicians can view assigned jobs" ON public.jobs;
DROP POLICY IF EXISTS "Technicians can update assigned jobs" ON public.jobs;
DROP POLICY IF EXISTS "Clients can view their jobs" ON public.jobs;

-- Create simple policy: Technicians can view jobs assigned to them
CREATE POLICY "Technicians can view their jobs"
ON public.jobs FOR SELECT
TO authenticated
USING (technician_id = auth.uid());

-- Create simple policy: Company Admins can view all jobs in their company
-- Simplified to avoid potential subquery issues
CREATE POLICY "Admins can view company jobs"
ON public.jobs FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.companies
    WHERE companies.id = jobs.company_id
    AND companies.user_id = auth.uid()
  )
);
