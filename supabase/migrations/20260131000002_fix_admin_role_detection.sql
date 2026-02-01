-- Fix Admin Role Detection for Owners
-- If a user is an Owner (in companies table) but not in user_roles, they should be treated as 'admin'

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.user_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    r public.user_role;
    is_owner BOOLEAN;
BEGIN
    -- 1. Check user_roles
    SELECT role INTO r
    FROM public.user_roles
    WHERE user_id = auth.uid()
    LIMIT 1;
    
    -- 2. If not found, check if they are an Owner
    IF r IS NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM public.companies WHERE user_id = auth.uid()
        ) INTO is_owner;
        
        IF is_owner THEN
            r := 'admin';
        END IF;
    END IF;
    
    RETURN r;
END;
$$;
