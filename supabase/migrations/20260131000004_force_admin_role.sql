-- Force Admin Role for specific User ID (Emergency Fix for Test Environment)
-- Mirrors the client-side recovery to ensure DB policies respect the Admin user.

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
    -- 0. EMERGENCY OVERRIDE for Main Admin
    IF auth.uid() = 'e74f92ab-9c58-45d7-9a0c-4adbe6460f65' THEN
        RETURN 'admin'::public.user_role;
    END IF;

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
