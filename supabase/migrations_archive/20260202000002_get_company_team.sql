-- Secure function to get team members with email/name (which live in auth.users)
-- Only accessible to Admins and Managers of the company.

CREATE OR REPLACE FUNCTION public.get_company_team()
RETURNS TABLE (
    user_id UUID,
    role TEXT,
    email TEXT,
    full_name TEXT
) 
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
    requesting_user_role TEXT;
    requesting_user_company UUID;
BEGIN
    -- 1. Get Requester's Context
    SELECT role, company_id INTO requesting_user_role, requesting_user_company
    FROM public.user_roles
    WHERE user_id = auth.uid();

    -- 2. Verify Permissions
    IF requesting_user_role NOT IN ('admin', 'manager') THEN
        RAISE EXCEPTION 'Access Denied: Only Admins and Managers can view team details.';
    END IF;

    -- 3. Return Team Data
    RETURN QUERY
    SELECT 
        ur.user_id,
        ur.role,
        au.email::TEXT,
        (au.raw_user_meta_data->>'full_name')::TEXT
    FROM 
        public.user_roles ur
    JOIN 
        auth.users au ON ur.user_id = au.id
    WHERE 
        ur.company_id = requesting_user_company
    ORDER BY 
        ur.role = 'admin' DESC, ur.role = 'manager' DESC, au.email ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_company_team() TO authenticated;
