-- Remove Skool verification requirements for company creation
BEGIN TRANSACTION;

-- Drop the Skool verification trigger
DROP TRIGGER IF EXISTS enforce_skool_on_create_company ON public.companies;

-- Drop the Skool verification function
DROP FUNCTION IF EXISTS public.check_skool_before_create_company();

COMMIT;