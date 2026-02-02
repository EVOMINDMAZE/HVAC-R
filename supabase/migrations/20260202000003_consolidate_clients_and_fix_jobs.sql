-- Consolidate Clients Policies and Fix Jobs Visibility

-- 1. CLIENTS Table RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Drop all known prior policies to ensure clean slate
DROP POLICY IF EXISTS "Users can create clients for their company" ON public.clients;
DROP POLICY IF EXISTS "Users can view their company clients" ON public.clients;
DROP POLICY IF EXISTS "Managers can view company clients" ON public.clients;
DROP POLICY IF EXISTS "Managers can insert company clients" ON public.clients;
DROP POLICY IF EXISTS "Managers can update company clients" ON public.clients;
DROP POLICY IF EXISTS "Managers can delete company clients" ON public.clients;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.clients;
DROP POLICY IF EXISTS "Users can view their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can insert their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete their own clients" ON public.clients;
DROP POLICY IF EXISTS "Enable client read for all authenticated users" ON public.clients;
DROP POLICY IF EXISTS "RBAC: View Clients" ON public.clients;
DROP POLICY IF EXISTS "RBAC: Manage Clients" ON public.clients;

-- A. VIEW (SELECT)
CREATE POLICY "RBAC: View Clients" ON public.clients
    FOR SELECT USING (
        -- Admin/Manager/Tech: View all clients in company
        (
             public.get_my_role() IN ('admin', 'manager', 'tech') 
             AND company_id = public.get_my_company_id()
        )
        OR
        -- Client: View self
        (
            public.get_my_role() = 'client'
            AND id IN (SELECT client_id FROM public.user_roles WHERE user_id = auth.uid())
        )
    );

-- B. MANAGE (INSERT/UPDATE/DELETE)
-- Admins: Full Access
-- Managers: Insert/Update (But maybe not Delete? Let's genericize to Admin/Manager for now per user request "manage")
CREATE POLICY "RBAC: Manage Clients" ON public.clients
    FOR ALL USING (
        public.get_my_role() IN ('admin', 'manager')
        AND company_id = public.get_my_company_id()
    )
    WITH CHECK (
        public.get_my_role() IN ('admin', 'manager')
        AND company_id = public.get_my_company_id()
    );

-- 2. Refine JOBS Visibility (Techs only see assigned)
DROP POLICY IF EXISTS "RBAC: View Jobs" ON public.jobs;

CREATE POLICY "RBAC: View Jobs" ON public.jobs
    FOR SELECT USING (
        -- 1. Admin/Manager: Can see ALL jobs in their company
        (
            public.get_my_role() IN ('admin', 'manager') 
            AND client_id IN (SELECT id FROM public.clients WHERE company_id = public.get_my_company_id())
        )
        OR
        -- 2. Tech: Can see ONLY assigned jobs
        (
             public.get_my_role() = 'tech' 
             AND technician_id = auth.uid()
        )
        OR
        -- 3. Client: Can see ONLY their own jobs
        (
            public.get_my_role() = 'client'
            AND client_id IN (SELECT client_id FROM public.user_roles WHERE user_id = auth.uid())
        )
    );
