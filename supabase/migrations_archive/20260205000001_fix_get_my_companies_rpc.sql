-- Fix get_my_companies RPC function
-- This ensures the function exists and returns the correct data

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.get_my_companies();

-- Create the function fresh
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
    SELECT c.id, c.name, ur.role::TEXT
    FROM public.companies c
    INNER JOIN public.user_roles ur ON c.id = ur.company_id
    WHERE ur.user_id = auth.uid()
    ORDER BY c.name ASC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_my_companies() TO authenticated, anon;

-- Verify the function works
-- This should return companies for the current user
COMMENT ON FUNCTION public.get_my_companies()
IS 'Returns all companies the current user is a member of with their role';
