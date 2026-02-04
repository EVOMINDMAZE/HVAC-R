-- Debug RPC: Check JOIN and Auth Table visibility
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
    v_ur_count INT;
    v_au_count INT;
    v_result_count INT;
BEGIN
    -- 1. Get Requester's Context
    req_role := public.get_my_role()::TEXT;
    req_company := public.get_my_company_id();
    
    -- DEBUG: Count rows in tables
    SELECT count(*) INTO v_ur_count FROM public.user_roles WHERE company_id = req_company;
    SELECT count(*) INTO v_au_count FROM auth.users WHERE id = auth.uid();
    
    -- DEBUG: Count result of JOIN
    SELECT count(*) INTO v_result_count FROM (
        SELECT ur.user_id 
        FROM public.user_roles ur
        JOIN auth.users au ON ur.user_id = au.id
        WHERE ur.company_id = req_company
    ) sub;

    -- RAISE DATA
    RAISE EXCEPTION 'DEBUG JOIN: Role: %, Company: %, UR: %, AU: %, Result: %', 
        req_role, req_company, v_ur_count, v_au_count, v_result_count;

    -- Rest of logic is unreachable due to exception
    RETURN QUERY SELECT NULL::uuid, NULL::text, NULL::text, NULL::text WHERE 1=0;
END;
$$;
