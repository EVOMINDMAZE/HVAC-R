CREATE OR REPLACE FUNCTION public.get_user_companies_v2()
RETURNS TABLE (
    company_id UUID,
    company_name TEXT,
    role TEXT,
    is_owner BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH user_companies AS (
        -- 1. Explicit Roles
        SELECT 
            c.id, 
            c.name, 
            ur.role::TEXT,
            FALSE as is_owner_flag
        FROM public.companies c
        JOIN public.user_roles ur ON c.id = ur.company_id
        WHERE ur.user_id = auth.uid()
        
        UNION ALL
        
        -- 2. Owned Companies
        SELECT 
            c.id, 
            c.name, 
            'owner'::TEXT as role,
            TRUE as is_owner_flag
        FROM public.companies c
        WHERE c.user_id = auth.uid()
    )
    SELECT DISTINCT ON (id)
        id as company_id,
        name as company_name,
        role,
        is_owner_flag as is_owner
    FROM user_companies
    ORDER BY id, is_owner_flag DESC; -- Prioritize owner status if both exist
END;
$$;
