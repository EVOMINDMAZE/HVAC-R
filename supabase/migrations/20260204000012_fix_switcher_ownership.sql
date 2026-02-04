-- Fix for Company Switcher to include Company Owners
-- Previously, it strictly checked user_roles, missing owners who don't have a self-reference in user_roles.

-- 1. Updated get_my_companies: Include Owned Companies
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
    -- 1. Active Roles
    SELECT c.id, c.name, ur.role::TEXT
    FROM public.companies c
    JOIN public.user_roles ur ON c.id = ur.company_id
    WHERE ur.user_id = auth.uid()
    
    UNION
    
    -- 2. Owned Companies (Implicit Admin/Owner role)
    SELECT c.id, c.name, 'owner'::TEXT as role
    FROM public.companies c
    WHERE c.user_id = auth.uid()
    
    ORDER BY company_name ASC;
END;
$$;

-- 2. Updated switch_company: Allow switching if User IS Owner
CREATE OR REPLACE FUNCTION public.switch_company(target_company_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    is_member BOOLEAN;
BEGIN
    -- Verify membership OR ownership
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND company_id = target_company_id
        UNION
        SELECT 1 FROM public.companies
        WHERE user_id = auth.uid() AND id = target_company_id
    ) INTO is_member;

    IF NOT is_member THEN
        RAISE EXCEPTION 'User is not a member of this company';
    END IF;

    -- Update Metadata
    UPDATE auth.users
    SET raw_user_meta_data = 
        COALESCE(raw_user_meta_data, '{}'::jsonb) || 
        jsonb_build_object('active_company_id', target_company_id)
    WHERE id = auth.uid();
END;
$$;

-- 3. Updated get_my_company_id: Verify ownership in metadata check
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

    -- 2. If present, verify membership OR ownership
    IF active_id IS NOT NULL THEN
        -- Check Role
        SELECT company_id INTO valid_id
        FROM public.user_roles
        WHERE user_id = auth.uid() AND company_id = active_id;
        
        -- Check Ownership if no role found
        IF valid_id IS NULL THEN
            SELECT id INTO valid_id
            FROM public.companies
            WHERE user_id = auth.uid() AND id = active_id;
        END IF;

        -- If valid, return it
        IF valid_id IS NOT NULL THEN
            RETURN valid_id;
        END IF;
    END IF;

    -- 3. Fallback: Return first company found (Role)
    SELECT company_id INTO valid_id
    FROM public.user_roles
    WHERE user_id = auth.uid()
    ORDER BY created_at ASC
    LIMIT 1;

    -- 4. Fallback: Return first company found (Ownership)
    IF valid_id IS NULL THEN
        SELECT id INTO valid_id
        FROM public.companies
        WHERE user_id = auth.uid()
        LIMIT 1;
    END IF;

    RETURN valid_id;
END;
$$;
