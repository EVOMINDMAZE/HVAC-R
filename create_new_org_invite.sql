-- Create a new organization with an admin invite code
-- Run this in local Supabase database

DO $$
DECLARE
    v_owner_id UUID := 'd2aaef88-fe41-4f6b-8c1a-8dbd869f1bd3'; -- test@example.com
    v_company_id UUID;
    v_company_name TEXT := 'Test Org Creation ' || to_char(now(), 'YYYY-MM-DD HH24:MI');
    v_invite_code TEXT := 'NEWORG888';
BEGIN
    -- Check if owner exists in auth.users (optional)
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_owner_id) THEN
        RAISE WARNING 'Owner user % not found in auth.users', v_owner_id;
    END IF;

    RAISE NOTICE 'Creating new company: %', v_company_name;

    -- Create new company
    INSERT INTO public.companies (
        id,
        user_id,
        name,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        v_owner_id,
        v_company_name,
        now(),
        now()
    ) RETURNING id INTO v_company_id;

    RAISE NOTICE 'Company created with ID: %', v_company_id;

    -- Delete existing invite code if any
    DELETE FROM public.invite_codes WHERE code = v_invite_code;

    -- Insert admin invite code for the new company
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
        v_invite_code,
        v_company_id,
        'admin',
        now() + interval '1 year',  -- Expires in 1 year
        10,                          -- Can be used 10 times
        0,                           -- Current uses
        false,                       -- No Skool subscription required
        v_owner_id                   -- Created by owner user
    );

    RAISE NOTICE 'Admin invite created successfully!';
    RAISE NOTICE 'Code: %', v_invite_code;
    RAISE NOTICE 'Role: admin';
    RAISE NOTICE 'Company ID: %', v_company_id;
    RAISE NOTICE 'Company Name: %', v_company_name;
END $$;

-- Verify the company and invite were created
SELECT c.id, c.name, c.user_id as owner_id, ic.code, ic.role, ic.expires_at
FROM public.companies c
JOIN public.invite_codes ic ON ic.company_id = c.id
WHERE ic.code = 'NEWORG888';