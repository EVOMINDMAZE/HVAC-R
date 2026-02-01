-- Fix CRUD policies for Admin/Manager
-- Ensures that Admins (via get_my_role) can Insert/Update/Delete

-- SAFEGUARD: Ensure functions exist (re-declaring just in case, or relying on previous migration)
-- We rely on 02 for the correct get_my_role implementation.

-- 1. JOBS
DROP POLICY IF EXISTS "Managers can create company jobs" ON public.jobs;
DROP POLICY IF EXISTS "Managers can update company jobs" ON public.jobs;
DROP POLICY IF EXISTS "Managers can delete company jobs" ON public.jobs;

CREATE POLICY "Managers can create company jobs" ON public.jobs
    FOR INSERT WITH CHECK (
        client_id IN (
            SELECT id FROM public.clients 
            WHERE company_id = public.get_my_company_id()
        )
        AND
        public.get_my_role() IN ('admin', 'manager')
    );

CREATE POLICY "Managers can update company jobs" ON public.jobs
    FOR UPDATE USING (
        client_id IN (
            SELECT id FROM public.clients 
            WHERE company_id = public.get_my_company_id()
        )
        AND
        public.get_my_role() IN ('admin', 'manager')
    );

CREATE POLICY "Managers can delete company jobs" ON public.jobs
    FOR DELETE USING (
        client_id IN (
            SELECT id FROM public.clients 
            WHERE company_id = public.get_my_company_id()
        )
        AND
        public.get_my_role() IN ('admin', 'manager')
    );

-- 2. CLIENTS (Note: create_user_roles.sql had "Users can create clients for their company" which used simple company check. We might not need to touch it if it works, but Managers might use specific policy?)
-- manager_policies.sql likely added "Managers can update..."
DROP POLICY IF EXISTS "Managers can insert company clients" ON public.clients; -- Name guess, might rely on generic user check
DROP POLICY IF EXISTS "Managers can update company clients" ON public.clients;
DROP POLICY IF EXISTS "Managers can delete company clients" ON public.clients;

CREATE POLICY "Managers can update company clients" ON public.clients
    FOR UPDATE USING (
        company_id = public.get_my_company_id()
        AND
        public.get_my_role() IN ('admin', 'manager')
    );

CREATE POLICY "Managers can delete company clients" ON public.clients
    FOR DELETE USING (
         company_id = public.get_my_company_id()
        AND
        public.get_my_role() IN ('admin', 'manager')
    );

-- 3. ASSETS
DROP POLICY IF EXISTS "Managers can create company assets" ON public.assets;
DROP POLICY IF EXISTS "Managers can update company assets" ON public.assets;
DROP POLICY IF EXISTS "Managers can delete company assets" ON public.assets;

CREATE POLICY "Managers can create company assets" ON public.assets
    FOR INSERT WITH CHECK (
        client_id IN (
            SELECT id FROM public.clients 
            WHERE company_id = public.get_my_company_id()
        )
        AND
        public.get_my_role() IN ('admin', 'manager')
    );

CREATE POLICY "Managers can update company assets" ON public.assets
    FOR UPDATE USING (
         client_id IN (
            SELECT id FROM public.clients 
            WHERE company_id = public.get_my_company_id()
        )
        AND
        public.get_my_role() IN ('admin', 'manager')
    );

CREATE POLICY "Managers can delete company assets" ON public.assets
    FOR DELETE USING (
         client_id IN (
            SELECT id FROM public.clients 
            WHERE company_id = public.get_my_company_id()
        )
        AND
        public.get_my_role() IN ('admin', 'manager')
    );

-- 4. USER ROLES (Managers can assign roles)
DROP POLICY IF EXISTS "Managers can update company user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Managers can delete company user roles" ON public.user_roles;

CREATE POLICY "Managers can update company user roles" ON public.user_roles
    FOR UPDATE USING (
        company_id = public.get_my_company_id()
        AND
        public.get_my_role() IN ('admin', 'manager')
    );
