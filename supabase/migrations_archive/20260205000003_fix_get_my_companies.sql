-- Fix get_my_companies function to handle UNION type mismatch
DROP FUNCTION IF EXISTS public.get_my_companies();

CREATE OR REPLACE FUNCTION public.get_my_companies()
RETURNS TABLE (
    company_id UUID,
    company_name TEXT,
    role TEXT,
    is_owner BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ur.company_id,
        c.name AS company_name,
        ur.role::TEXT AS role,
        FALSE::BOOLEAN AS is_owner
    FROM public.user_roles ur
    JOIN public.companies c ON c.id = ur.company_id
    WHERE ur.user_id = auth.uid()

    UNION ALL

    SELECT
        c.id,
        c.name,
        'owner'::TEXT,
        TRUE::BOOLEAN
    FROM public.companies c
    WHERE c.user_id = auth.uid()
    AND NOT EXISTS (
        SELECT 1 FROM public.user_roles ur2
        WHERE ur2.user_id = auth.uid()
        AND ur2.company_id = c.id
    )
    ORDER BY company_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
