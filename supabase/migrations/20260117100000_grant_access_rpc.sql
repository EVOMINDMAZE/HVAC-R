-- Function to grant client access to a user by email
-- Only capable if the executor is an 'admin'
CREATE OR REPLACE FUNCTION public.grant_client_access(
    target_email TEXT,
    target_client_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of creator (postgres) to read auth.users
SET search_path = public, auth
AS $$
DECLARE
    target_user_id UUID;
    executor_role public.user_role;
    result JSONB;
BEGIN
    -- 1. Check if the executing user is an Admin
    SELECT role INTO executor_role
    FROM public.user_roles
    WHERE user_id = auth.uid();

    IF executor_role IS DISTINCT FROM 'admin' THEN
        -- Fallback: Check companies table for legacy admins
        IF NOT EXISTS (SELECT 1 FROM public.companies WHERE user_id = auth.uid()) THEN
            RAISE EXCEPTION 'Access Denied: Only Admins can grant access.';
        END IF;
    END IF;

    -- 2. Find the user by email
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = target_email;

    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found. Please ask the client to Sign Up first.';
    END IF;

    -- 3. Insert or Update user_roles
    INSERT INTO public.user_roles (user_id, role, client_id)
    VALUES (target_user_id, 'client', target_client_id)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        role = 'client',
        client_id = target_client_id,
        updated_at = now();

    result := jsonb_build_object(
        'success', true,
        'message', 'Access granted successfully',
        'user_id', target_user_id
    );

    RETURN result;
END;
$$;
