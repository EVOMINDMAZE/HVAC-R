
-- Fix syntax error in UNION query (ORDER BY requires explicit column names)

CREATE OR REPLACE FUNCTION public.get_my_companies()
RETURNS TABLE (
    company_id UUID,
    company_name TEXT,
    role TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    -- 1. Active Roles
    SELECT c.id, c.name as company_name, ur.role::TEXT
    FROM public.companies c
    JOIN public.user_roles ur ON c.id = ur.company_id
    WHERE ur.user_id = auth.uid()
    
    UNION
    
    -- 2. Owned Companies (Implicit Admin/Owner role)
    SELECT c.id, c.name as company_name, 'owner'::TEXT as role
    FROM public.companies c
    WHERE c.user_id = auth.uid()
    
    ORDER BY company_name ASC;
END;
$$;
