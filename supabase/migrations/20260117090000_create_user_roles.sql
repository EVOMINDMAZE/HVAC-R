-- Create User Role Enum
CREATE TYPE public.user_role AS ENUM ('admin', 'client', 'tech');

-- Create User Roles Table
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.user_role NOT NULL DEFAULT 'client',
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure proper linking based on role
    CONSTRAINT check_role_mapping CHECK (
        (role = 'admin' AND company_id IS NOT NULL) OR
        (role = 'client' AND client_id IS NOT NULL) OR
        (role = 'tech' AND company_id IS NOT NULL) -- Techs probably belong to a company too
    )
);

-- RLS for User Roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own role" ON public.user_roles
    FOR SELECT USING (user_id = auth.uid());

-- Service Role (Supabase Admin) can manage all
CREATE POLICY "Service Role full access" ON public.user_roles
    FOR ALL USING (true) WITH CHECK (true);

-- Functions to Auto-Assign Roles? 
-- specific logic usually handled by application or separate trigger.
-- For now, we manually insert or use invite flow.


-- MIGRATE EXISTING ADMINS
-- Insert existing company owners as 'admin'
INSERT INTO public.user_roles (user_id, role, company_id)
SELECT user_id, 'admin'::public.user_role, id
FROM public.companies
WHERE user_id IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;


-- UPDATE RLS POLICIES FOR CLIENT ACCESS
-- We need to allow 'client' role users to view their own Client Data

-- 1. Clients Table Query
-- Old: company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
-- New: ... OR id IN (SELECT client_id FROM user_roles WHERE user_id = auth.uid() AND role = 'client')

DROP POLICY IF EXISTS "Users can view their own clients" ON public.clients;
CREATE POLICY "Users can view their own clients" ON public.clients
    FOR SELECT USING (
        -- Admin Access (Company Owner)
        company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid())
        OR
        -- Client Access (Self)
        id IN (SELECT client_id FROM public.user_roles WHERE user_id = auth.uid() AND role = 'client')
    );

-- 2. Assets Table Query
DROP POLICY IF EXISTS "Users can view assets of their clients" ON public.assets;
CREATE POLICY "Users can view assets of their clients" ON public.assets
    FOR SELECT USING (
        -- Admin Access
        client_id IN (
            SELECT id FROM public.clients WHERE company_id IN (
                SELECT id FROM public.companies WHERE user_id = auth.uid()
            )
        )
        OR
        -- Client Access
        client_id IN (
            SELECT client_id FROM public.user_roles WHERE user_id = auth.uid() AND role = 'client'
        )
    );

-- 3. Telemetry/Alerts (Rules Aliens, etc.)
-- Similar logic for `rules_alerts`

DROP POLICY IF EXISTS "Users can view alerts" ON public.rules_alerts;
CREATE POLICY "Users can view alerts" ON public.rules_alerts
    FOR SELECT USING (
        -- Admin Access
        asset_id IN (
             SELECT id FROM public.assets WHERE client_id IN (
                SELECT id FROM public.clients WHERE company_id IN (
                    SELECT id FROM public.companies WHERE user_id = auth.uid()
                )
             )
        )
        OR
        -- Client Access
        asset_id IN (
            SELECT id FROM public.assets WHERE client_id IN (
                SELECT client_id FROM public.user_roles WHERE user_id = auth.uid() AND role = 'client'
            )
        )
    );
