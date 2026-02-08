-- Fix RLS Policy for Jobs to allow viewing by company_id or technician assignment
-- This fixes the issue where technicians couldn't see jobs with null client_id

-- Drop existing policies
DROP POLICY IF EXISTS "RBAC: View Jobs" ON public.jobs;
DROP POLICY IF EXISTS "RBAC: Create Jobs" ON public.jobs;
DROP POLICY IF EXISTS "RBAC: Update Jobs" ON public.jobs;
DROP POLICY IF EXISTS "RBAC: Delete Jobs" ON public.jobs;

-- A. SELECT (View) - FIXED
CREATE POLICY "RBAC: View Jobs" ON public.jobs
    FOR SELECT USING (
        -- 1. Admin/Manager: Can see ALL jobs in their company (by company_id or client.company_id)
        (
            public.get_my_role() IN ('admin', 'manager')
            AND (
                company_id = public.get_my_company_id()
                OR client_id IN (SELECT id FROM public.clients WHERE company_id = public.get_my_company_id())
            )
        )
        OR
        -- 2. Tech: Can see jobs in their company OR jobs assigned to them
        (
            public.get_my_role() = 'tech'
            AND (
                company_id = public.get_my_company_id()
                OR technician_id = auth.uid()
            )
        )
        OR
        -- 3. Client: Can see ONLY their own jobs
        (
            public.get_my_role() = 'client'
            AND client_id IN (SELECT client_id FROM public.user_roles WHERE user_id = auth.uid())
        )
    );

-- B. INSERT (Create) - FIXED
CREATE POLICY "RBAC: Create Jobs" ON public.jobs
    FOR INSERT WITH CHECK (
        -- Admin and Manager only
        public.get_my_role() IN ('admin', 'manager')
        AND (
            company_id = public.get_my_company_id()
            OR client_id IN (SELECT id FROM public.clients WHERE company_id = public.get_my_company_id())
        )
    );

-- C. UPDATE (Edit) - FIXED
CREATE POLICY "RBAC: Update Jobs" ON public.jobs
    FOR UPDATE USING (
        -- 1. Admin/Manager: Full Update
        (
            public.get_my_role() IN ('admin', 'manager')
            AND (
                company_id = public.get_my_company_id()
                OR client_id IN (SELECT id FROM public.clients WHERE company_id = public.get_my_company_id())
            )
        )
        OR
        -- 2. Tech: Can update jobs assigned to them (status, notes)
        (public.get_my_role() = 'tech' AND technician_id = auth.uid())
    )
    WITH CHECK (
        -- Same logic for the new row state
        (
            public.get_my_role() IN ('admin', 'manager')
            AND (
                company_id = public.get_my_company_id()
                OR client_id IN (SELECT id FROM public.clients WHERE company_id = public.get_my_company_id())
            )
        )
        OR
        (public.get_my_role() = 'tech' AND technician_id = auth.uid())
    );

-- D. DELETE - FIXED
CREATE POLICY "RBAC: Delete Jobs" ON public.jobs
    FOR DELETE USING (
        -- Only Admin can delete
        public.get_my_role() = 'admin'
        AND (
            company_id = public.get_my_company_id()
            OR client_id IN (SELECT id FROM public.clients WHERE company_id = public.get_my_company_id())
        )
    );
