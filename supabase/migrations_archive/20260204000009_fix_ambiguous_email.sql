-- Fix Ambiguous Email Parameter in get_user_id_by_email
DROP FUNCTION IF EXISTS public.get_user_id_by_email(text);

CREATE OR REPLACE FUNCTION public.get_user_id_by_email(user_email TEXT)
RETURNS UUID
SECURITY DEFINER
SET search_path = auth, public
LANGUAGE plpgsql
AS $$
DECLARE
  ret_id UUID;
BEGIN
  -- Check if requester is admin/manager (optional check bypassed for now to rely on caller)
  IF auth.role() = 'anon' THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT id INTO ret_id FROM auth.users WHERE email = user_email;
  RETURN ret_id;
END;
$$;
