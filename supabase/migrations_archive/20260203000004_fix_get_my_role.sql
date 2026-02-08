-- Fix get_my_role to fallback to 'admin' for company owners
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
    SELECT role INTO r
    FROM public.user_roles
    WHERE user_id = auth.uid()
    LIMIT 1;

    IF r IS NULL THEN
        -- Check if they are an owner in companies table
        SELECT EXISTS(SELECT 1 FROM public.companies WHERE user_id = auth.uid()) INTO is_owner;
        IF is_owner THEN
            RETURN 'admin'::public.user_role;
        END IF;
    END IF;

    RETURN r;
END;
$$;
