-- Consolidate RBAC Policies (Admin > Manager > Tech > Client)
-- Replaces fragmented policies with a unified hierarchical approach.

-- 1. Helper Functions (Ensure they exist and are secure)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.user_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    r public.user_role;
BEGIN
    SELECT role INTO r
    FROM public.user_roles
    WHERE user_id = auth.uid()
    LIMIT 1;
    RETURN r;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    cid UUID;
BEGIN
    SELECT company_id INTO cid
    FROM public.user_roles
    WHERE user_id = auth.uid()
    LIMIT 1;
    
    -- Fallback for Owners (who exist in companies table but maybe not user_roles initially)
    IF cid IS NULL THEN
        SELECT id INTO cid
        FROM public.companies
        WHERE user_id = auth.uid();
    END IF;
    
    RETURN cid;
END;
$$;

-- 2. Clean Slate: Drop related policies to avoid conflicts
DROP POLICY IF EXISTS "Managers can view company user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
DROP POLICY IF EXISTS "Service Role full access" ON public.user_roles;
-- Drop old fragmented policies
DROP POLICY IF EXISTS "Admins can manage all company roles" ON public.user_roles;
DROP POLICY IF EXISTS "Techs can view generic company info" ON public.user_roles; 

-- 3. USER_ROLES Policies
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Manage: Admin/Manager view company roles" ON public.user_roles
    FOR SELECT USING (
        (public.get_my_role() IN ('admin', 'manager') AND company_id = public.get_my_company_id())
        OR user_id = auth.uid() -- View self
    );

CREATE POLICY "Manage: Admin/Manager update company roles" ON public.user_roles
    FOR UPDATE USING (
        public.get_my_role() IN ('admin', 'manager') AND company_id = public.get_my_company_id()
    );

CREATE POLICY "Manage: Admin ONLY create/delete roles" ON public.user_roles
    FOR ALL USING (
        public.get_my_role() = 'admin' AND company_id = public.get_my_company_id()
    );


-- 4. JOBS Policies
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
-- Drop old policies
DROP POLICY IF EXISTS "Managers can view company jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can view jobs" ON public.jobs; -- Generic old one
DROP POLICY IF EXISTS "Admins have full access to jobs" ON public.jobs;

-- A. SELECT (View)
CREATE POLICY "RBAC: View Jobs" ON public.jobs
    FOR SELECT USING (
        -- 1. Admin/Manager/Tech: Can see ALL jobs in their company
        (
            public.get_my_role() IN ('admin', 'manager', 'tech') 
            AND client_id IN (SELECT id FROM public.clients WHERE company_id = public.get_my_company_id())
        )
        OR
        -- 2. Client: Can see ONLY their own jobs
        (
            public.get_my_role() = 'client'
            AND client_id IN (SELECT client_id FROM public.user_roles WHERE user_id = auth.uid())
        )
    );

-- B. INSERT (Create)
CREATE POLICY "RBAC: Create Jobs" ON public.jobs
    FOR INSERT WITH CHECK (
        -- Admin and Manager only
        public.get_my_role() IN ('admin', 'manager') 
        AND client_id IN (SELECT id FROM public.clients WHERE company_id = public.get_my_company_id())
    );

-- C. UPDATE (Edit)
CREATE POLICY "RBAC: Update Jobs" ON public.jobs
    FOR UPDATE USING (
        -- 1. Admin/Manager: Full Update
        (public.get_my_role() IN ('admin', 'manager') AND client_id IN (SELECT id FROM public.clients WHERE company_id = public.get_my_company_id()))
        OR
        -- 2. Tech: Can update jobs assigned to them (status, notes)
        -- Note: We trust the app to limit fields, or use separate triggers for strict field-level security if needed.
        (public.get_my_role() = 'tech' AND technician_id = auth.uid())
    )
    WITH CHECK (
        -- Same logic for the new row state
        (public.get_my_role() IN ('admin', 'manager') AND client_id IN (SELECT id FROM public.clients WHERE company_id = public.get_my_company_id()))
        OR
        (public.get_my_role() = 'tech' AND technician_id = auth.uid())
    );

-- D. DELETE
CREATE POLICY "RBAC: Delete Jobs" ON public.jobs
    FOR DELETE USING (
        -- Only Admin can delete (or Manager if desired, currently restricting to Admin for safety)
        public.get_my_role() = 'admin' 
        AND client_id IN (SELECT id FROM public.clients WHERE company_id = public.get_my_company_id())
    );


-- 5. ASSETS Policies
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Managers can view company assets" ON public.assets;

CREATE POLICY "RBAC: View Assets" ON public.assets
    FOR SELECT USING (
        -- Admin/Manager/Tech: View all company assets
        (
             public.get_my_role() IN ('admin', 'manager', 'tech') 
             AND client_id IN (SELECT id FROM public.clients WHERE company_id = public.get_my_company_id())
        )
        OR
        -- Client: View own assets
        (
            public.get_my_role() = 'client'
             AND client_id IN (SELECT client_id FROM public.user_roles WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "RBAC: Manage Assets" ON public.assets
    FOR ALL USING (
        public.get_my_role() IN ('admin', 'manager')
        AND client_id IN (SELECT id FROM public.clients WHERE company_id = public.get_my_company_id())
    );
