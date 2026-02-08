-- Fix ambiguous function signatures for get_my_companies and get_my_company_id
-- We explicitly drop ALL variations to ensure a clean slate for get_my_companies.
-- For get_my_company_id, we use CREATE OR REPLACE to avoid breaking RLS dependencies.

-- 1. Drop get_my_companies variations
DROP FUNCTION IF EXISTS public.get_my_companies(uuid);
DROP FUNCTION IF EXISTS public.get_my_companies();

-- 2. Recreate get_my_companies (No arguments, uses auth.uid())
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

-- 3. Recreate get_my_company_id (No arguments, uses auth.uid())
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

-- 4. Also recreate the parameterized version to point to the new logic if it exists
-- We MUST keep the parameter name 'p_company_id' AND the default value to match the existing definition.
CREATE OR REPLACE FUNCTION public.get_my_company_id(p_company_id UUID DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- For now, redirect to the session user's company
    RETURN public.get_my_company_id();
END;
$$;
