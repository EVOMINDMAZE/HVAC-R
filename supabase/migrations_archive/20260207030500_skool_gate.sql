-- Trigger function to check Skool membership before creating a company
CREATE OR REPLACE FUNCTION public.check_skool_before_create_company()
RETURNS TRIGGER AS $$
DECLARE
    v_has_skool BOOLEAN;
BEGIN
    -- Check if the user has an active Skool subscription
    -- Using the existing helper or direct query
    SELECT EXISTS (
        SELECT 1 FROM public.skool_subscriptions
        WHERE user_id = auth.uid()
        AND subscription_status = 'active'
    ) INTO v_has_skool;

    -- Allow if user is admin (bypass) or has skool
    -- You might want to check a specific community ID here if you have multiple
    IF NOT v_has_skool THEN
        RAISE EXCEPTION 'Access Denied: You must be a verified Skool community member to create an organization.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply Trigger
DROP TRIGGER IF EXISTS enforce_skool_on_create_company ON public.companies;
CREATE TRIGGER enforce_skool_on_create_company
    BEFORE INSERT ON public.companies
    FOR EACH ROW
    EXECUTE FUNCTION public.check_skool_before_create_company();
