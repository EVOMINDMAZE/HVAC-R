-- 1. Get My Companies
-- Returns all companies the current user is a member of (with role)
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
    JOIN public.user_roles ur ON c.id = ur.company_id
    WHERE ur.user_id = auth.uid()
    ORDER BY c.name ASC;
END;
$$;

-- 2. Switch Company
-- Updates the user's active_company_id metadata, verifying membership first.
CREATE OR REPLACE FUNCTION public.switch_company(target_company_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    is_member BOOLEAN;
BEGIN
    -- Verify membership
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND company_id = target_company_id
    ) INTO is_member;

    IF NOT is_member THEN
        RAISE EXCEPTION 'User is not a member of this company';
    END IF;

    -- Update Metadata in auth.users
    -- This requires the function to run as a superuser/admin (SECURITY DEFINER)
    UPDATE auth.users
    SET raw_user_meta_data = 
        COALESCE(raw_user_meta_data, '{}'::jsonb) || 
        jsonb_build_object('active_company_id', target_company_id)
    WHERE id = auth.uid();
END;
$$;

-- 3. Update get_my_company_id
-- Now prioritizes the active_company_id from metadata if valid.
CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    active_id UUID;
    valid_id UUID;
BEGIN
    -- 1. Try to get from metadata
    SELECT (raw_user_meta_data->>'active_company_id')::UUID
    INTO active_id
    FROM auth.users
    WHERE id = auth.uid();

    -- 2. If present, verify membership
    IF active_id IS NOT NULL THEN
        SELECT company_id INTO valid_id
        FROM public.user_roles
        WHERE user_id = auth.uid() AND company_id = active_id;
        
        -- If user is still a member of that active company, return it
        IF valid_id IS NOT NULL THEN
            RETURN valid_id;
        END IF;
    END IF;

    -- 3. Fallback: Return first company found (existing logic)
    SELECT company_id INTO valid_id
    FROM public.user_roles
    WHERE user_id = auth.uid()
    ORDER BY created_at ASC -- consistent ordering
    LIMIT 1;

    -- 4. Fallback for Owners (if not in user_roles)
    IF valid_id IS NULL THEN
        SELECT id INTO valid_id
        FROM public.companies
        WHERE user_id = auth.uid()
        LIMIT 1;
    END IF;

    RETURN valid_id;
END;
$$;
