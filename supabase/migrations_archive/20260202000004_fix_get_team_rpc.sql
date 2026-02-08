-- Fix ambiguous column reference "role" in get_company_team
-- The output parameter "role" conflicts with table column "role" if not fully qualified.

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
    req_role TEXT;
    req_company UUID;
BEGIN
    -- 1. Get Requester's Context (Fix: Use alias ur for clarity)
    SELECT ur.role, ur.company_id INTO req_role, req_company
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid();

    -- 2. Verify Permissions
    IF req_role NOT IN ('admin', 'manager') THEN
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
        ur.company_id = req_company
    ORDER BY 
        ur.role = 'admin' DESC, ur.role = 'manager' DESC, au.email ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_company_team() TO authenticated;
