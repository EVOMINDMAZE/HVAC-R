-- Fix Infinite Recursion in RLS by using SECURITY DEFINER functions
-- Expanded to include 'admin' role access
-- This is a FIX FORWARD migration (applying changes that were missed in 000000)

-- 1. Create Helper Functions to bypass RLS safely
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
    
    -- Fallback for Owners (who might not have user_roles entry or linked via companies table)
    IF cid IS NULL THEN
        SELECT id INTO cid
        FROM public.companies
        WHERE user_id = auth.uid();
    END IF;
    
    RETURN cid;
END;
$$;

-- 2. Drop the recursive/restrictive policies
DROP POLICY IF EXISTS "Managers can view company user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Managers can view company clients" ON public.clients;
DROP POLICY IF EXISTS "Managers can view company assets" ON public.assets;
DROP POLICY IF EXISTS "Managers can view company jobs" ON public.jobs;

-- 3. Re-create Policies using functions (Allowing ADMIN and MANAGER)

-- User Roles
CREATE POLICY "Managers can view company user roles" ON public.user_roles
    FOR SELECT USING (
        company_id = public.get_my_company_id()
        AND
        public.get_my_role() IN ('admin', 'manager')
    );

-- Clients
CREATE POLICY "Managers can view company clients" ON public.clients
    FOR SELECT USING (
        company_id = public.get_my_company_id()
        AND
        public.get_my_role() IN ('admin', 'manager')
    );

-- Assets
CREATE POLICY "Managers can view company assets" ON public.assets
    FOR SELECT USING (
         client_id IN (
            SELECT id FROM public.clients 
            WHERE company_id = public.get_my_company_id()
        )
        AND
        public.get_my_role() IN ('admin', 'manager')
    );

-- Jobs
CREATE POLICY "Managers can view company jobs" ON public.jobs
    FOR SELECT USING (
        client_id IN (
            SELECT id FROM public.clients 
            WHERE company_id = public.get_my_company_id()
        )
        AND
        public.get_my_role() IN ('admin', 'manager')
    );
