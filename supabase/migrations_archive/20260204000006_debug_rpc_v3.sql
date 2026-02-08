-- Debug RPC V3: Static Return to verify plumbing
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
    req_role := public.get_my_role()::TEXT;
    req_company := public.get_my_company_id();
    
    -- 2. Verify Permissions
    IF req_role NOT IN ('admin', 'manager') OR req_company IS NULL THEN
        RAISE EXCEPTION 'Access Denied: Only Admins and Managers can view team details. (Role: %, Company: %)', req_role, req_company;
    END IF;

    -- 3. Return STATIC DATA (Debug mode)
    RETURN QUERY
    SELECT 
        req_company as user_id, 
        'admin'::text as role, 
        'force_static@debug.com'::text as email, 
        'Static Debug User'::text as full_name;
END;
$$;
