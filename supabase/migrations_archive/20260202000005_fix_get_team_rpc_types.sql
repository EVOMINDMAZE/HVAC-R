-- Fix type mismatch: cast enum user_role to text in get_company_team

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
    -- 1. Get Requester's Context
    -- Cast role to text for the variable assignment to be safe, though loose assignment might work
    SELECT ur.role::TEXT, ur.company_id INTO req_role, req_company
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
        ur.role::TEXT, -- Explicitly cast enum to text to match RETURNS TABLE
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
