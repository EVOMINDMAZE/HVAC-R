-- Update RLS Policies to allow Managers to view everything in their company

-- 1. Clients: Managers can view all clients in their company
CREATE POLICY "Managers can view company clients" ON public.clients
    FOR SELECT USING (
        company_id IN (
            SELECT id FROM public.companies 
            WHERE id = (
                SELECT company_id 
                FROM public.user_roles 
                WHERE user_id = auth.uid() 
                AND role = 'manager'
            )
        )
    );

-- 2. Assets: Managers can view all assets in their company
CREATE POLICY "Managers can view company assets" ON public.assets
    FOR SELECT USING (
        client_id IN (
            SELECT id FROM public.clients 
            WHERE company_id IN (
                SELECT id FROM public.companies 
                WHERE id = (
                    SELECT company_id 
                    FROM public.user_roles 
                    WHERE user_id = auth.uid() 
                    AND role = 'manager'
                )
            )
        )
    );

-- 3. Jobs: Managers can view all jobs in their company
-- (Assuming jobs table exists and has client_id or company_id)
-- Based on previous context, jobs link to clients.

CREATE POLICY "Managers can view company jobs" ON public.jobs
    FOR SELECT USING (
        client_id IN (
            SELECT id FROM public.clients 
            WHERE company_id IN (
                SELECT id FROM public.companies 
                WHERE id = (
                    SELECT company_id 
                    FROM public.user_roles 
                    WHERE user_id = auth.uid() 
                    AND role = 'manager'
                )
            )
        )
    );

-- 4. User Roles: Managers can read roles of other users in their company (e.g. technicians)
CREATE POLICY "Managers can view company user roles" ON public.user_roles
    FOR SELECT USING (
        company_id IN (
            SELECT company_id 
            FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'manager'
        )
    );
