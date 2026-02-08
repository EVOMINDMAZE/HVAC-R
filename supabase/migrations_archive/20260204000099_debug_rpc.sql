
-- Debug fetch function that takes explicit user_id
CREATE OR REPLACE FUNCTION public.debug_get_companies(target_user_id UUID)
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
    WHERE ur.user_id = target_user_id
    
    UNION
    
    -- 2. Owned Companies
    SELECT c.id, c.name as company_name, 'owner'::TEXT as role
    FROM public.companies c
    WHERE c.user_id = target_user_id
    
    ORDER BY company_name ASC;
END;
$$;
