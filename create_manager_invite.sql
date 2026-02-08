-- Create Manager Invite Code for Test Company Inc. (8-digit format)
-- Run this in local Supabase database

-- Company ID for Test Company Inc.
DO $$
DECLARE
    v_company_id UUID := 'feaa0e30-2a90-4049-97ec-eca7e451298a';
    v_company_name TEXT;
    v_owner_id UUID := 'd2aaef88-fe41-4f6b-8c1a-8dbd869f1bd3'; -- test@example.com
BEGIN
    -- Verify company exists
    SELECT name INTO v_company_name FROM public.companies WHERE id = v_company_id;
    IF v_company_name IS NULL THEN
        RAISE EXCEPTION 'Company not found with ID: %', v_company_id;
    END IF;

    RAISE NOTICE 'Creating manager invite for company: % (%)', v_company_name, v_company_id;

    -- Delete existing manager invite if any
    DELETE FROM public.invite_codes WHERE code = 'MGR88888';

    -- Insert new manager invite code (8 characters)
    INSERT INTO public.invite_codes (
        code,
        company_id,
        role,
        expires_at,
        max_uses,
        current_uses,
        skool_subscription_required,
        created_by
    ) VALUES (
        'MGR88888',
        v_company_id,
        'manager',
        now() + interval '1 year',  -- Expires in 1 year
        10,                          -- Can be used 10 times
        0,                           -- Current uses
        false,                       -- No Skool subscription required
        v_owner_id                   -- Created by owner user
    );

    RAISE NOTICE 'Manager invite created successfully!';
    RAISE NOTICE 'Code: MGR88888';
    RAISE NOTICE 'Role: manager';
    RAISE NOTICE 'Company: %', v_company_name;
END $$;

-- Verify the invite was created
SELECT code, role, company_id, expires_at, max_uses, current_uses
FROM public.invite_codes
WHERE code = 'MGR88888';