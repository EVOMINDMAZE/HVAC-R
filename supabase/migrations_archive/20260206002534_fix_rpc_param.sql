-- Fix get_my_companies and get_my_company_id to accept user_id parameter
-- The get_my_company_id already has p_company_id parameter, we'll use a different name

-- Update get_my_companies with user_id parameter
CREATE OR REPLACE FUNCTION public.get_my_companies(p_user_id UUID DEFAULT NULL::UUID)
RETURNS TABLE (company_id UUID, company_name TEXT, role TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id UUID;
BEGIN
  IF p_user_id IS NOT NULL THEN
    v_user_id := p_user_id;
  ELSE
    v_user_id := auth.uid();
  END IF;
  
  RETURN QUERY
  SELECT c.id, c.name, ur.role::TEXT
  FROM public.companies c
  INNER JOIN public.user_roles ur ON c.id = ur.company_id
  WHERE ur.user_id = v_user_id
  ORDER BY c.name ASC;
END;
$$;

-- Update get_my_company_id to also try auth.uid() if no parameter provided
-- Note: Can't change parameter name, so we'll keep p_company_id but try auth.uid() first
CREATE OR REPLACE FUNCTION public.get_my_company_id(p_company_id UUID DEFAULT NULL::UUID)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id UUID;
  v_active_id UUID;
  v_valid_id UUID;
BEGIN
  -- Try auth.uid() first
  v_user_id := auth.uid();
  
  -- If auth.uid() returns NULL, try using p_company_id as user_id fallback
  IF v_user_id IS NULL AND p_company_id IS NOT NULL THEN
    v_user_id := p_company_id;
  END IF;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID is required';
  END IF;

  SELECT (raw_user_meta_data->>'active_company_id')::UUID
  INTO v_active_id
  FROM auth.users
  WHERE id = v_user_id;

  IF v_active_id IS NOT NULL THEN
      SELECT company_id INTO v_valid_id
      FROM public.user_roles
      WHERE user_id = v_user_id AND company_id = v_active_id;
      IF v_valid_id IS NOT NULL THEN RETURN v_valid_id; END IF;
  END IF;

  SELECT company_id INTO v_valid_id
  FROM public.user_roles
  WHERE user_id = v_user_id
  ORDER BY created_at ASC LIMIT 1;

  IF v_valid_id IS NULL THEN
      SELECT id INTO v_valid_id
      FROM public.companies
      WHERE user_id = v_user_id LIMIT 1;
  END IF;

  RETURN v_valid_id;
END;
$$;
