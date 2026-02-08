-- Drop the ambiguous RPC function that takes an argument
-- We want to standardize on get_my_companies() without arguments which uses auth.uid()
-- This resolves PGRST203 errors when calling without arguments.

DROP FUNCTION IF EXISTS public.get_my_companies(uuid);
