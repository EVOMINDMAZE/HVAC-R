-- Final Fix RPC: Robust Sorting and Null Handling
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

    -- 3. Return Team Data
    RETURN QUERY
    SELECT 
        ft.user_id,
        ft.role,
        COALESCE(ft.email, 'Pending Invite'),
        COALESCE(ft.full_name, 'Unknown')
    FROM (
        SELECT 
            ur.user_id as user_id,
            ur.role::TEXT as role,
            au.email::TEXT as email,
            (au.raw_user_meta_data->>'full_name')::TEXT as full_name
        FROM 
            public.user_roles ur
        JOIN 
            auth.users au ON ur.user_id = au.id
        WHERE 
            ur.company_id = req_company
        
        UNION ALL
        
        -- Also include the company owner if they don't have a record in user_roles
        SELECT 
            c.user_id as user_id,
            'admin'::TEXT as role,
            au.email::TEXT as email,
            (au.raw_user_meta_data->>'full_name')::TEXT as full_name
        FROM 
            public.companies c
        JOIN 
            auth.users au ON c.user_id = au.id
        WHERE 
            c.id = req_company
            AND NOT EXISTS (
                SELECT 1 FROM public.user_roles nested_ur 
                WHERE nested_ur.user_id = c.user_id
            )
    ) ft
    ORDER BY 
        CASE WHEN ft.role = 'admin' THEN 1
             WHEN ft.role = 'manager' THEN 2
             ELSE 3 
        END ASC,
        ft.email ASC;
END;
$$;
