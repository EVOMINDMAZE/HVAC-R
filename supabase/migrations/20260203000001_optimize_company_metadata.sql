-- Optimize Company Metadata Queries
-- Allows Admins, Managers, and Techs to read basic company info (logging, branding)
-- without exposing sensitive Owner-only fields (billing, keys).

CREATE OR REPLACE FUNCTION public.get_my_company_metadata()
RETURNS TABLE (
    id UUID,
    name TEXT,
    logo_url TEXT,
    website TEXT,
    phone TEXT,
    email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    cid UUID;
BEGIN
    -- 1. Resolve Company ID
    cid := public.get_my_company_id();
    
    -- 2. Return specific safe columns
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.logo_url,
        c.website,
        c.phone,
        c.email
    FROM public.companies c
    WHERE c.id = cid;
END;
$$;
