-- Complete fix for ambiguous column reference "role" in get_user_companies_v2
-- Use distinct column names in CTE and explicitly map to output column names

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
            ur.role::TEXT as user_role,  -- Distinct name to avoid ambiguity
            FALSE as is_owner_flag
        FROM public.companies c
        JOIN public.user_roles ur ON c.id = ur.company_id
        WHERE ur.user_id = auth.uid()
        
        UNION ALL
        
        -- 2. Owned Companies
        SELECT 
            c.id, 
            c.name, 
            'owner'::TEXT as user_role,   -- Same distinct name
            TRUE as is_owner_flag
        FROM public.companies c
        WHERE c.user_id = auth.uid()
    )
    SELECT DISTINCT ON (id)
        id as company_id,
        name as company_name,
        user_role as role,                -- Map to output column name
        is_owner_flag as is_owner
    FROM user_companies
    ORDER BY id, is_owner_flag DESC; -- Prioritize owner status if both exist
END;
$$;