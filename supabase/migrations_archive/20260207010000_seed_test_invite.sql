DO $$
DECLARE
    v_user_id uuid;
    v_company_id uuid;
BEGIN
    -- 1. Get or Create User
    SELECT id INTO v_user_id FROM auth.users LIMIT 1;
    
    IF v_user_id IS NULL THEN
        v_user_id := gen_random_uuid();
        -- Insert a dummy user if none exists (password: password123)
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, aud, role, created_at, updated_at)
        VALUES (
            v_user_id, 
            '00000000-0000-0000-0000-000000000000',
            'test@example.com', 
            '$2a$10$wL.s.t.w.t.w.t.w.t.w.t.w.t.w.t.w.t.w.t.w.t.w.t.w.t.w.', -- Dummy hash
            now(), 
            'authenticated', 
            'authenticated',
            now(),
            now()
        );
    END IF;

    -- 2. Get or Create Company
    SELECT id INTO v_company_id FROM public.companies LIMIT 1;
    
    IF v_company_id IS NULL THEN
        v_company_id := gen_random_uuid();
        INSERT INTO public.companies (
            id, 
            user_id, 
            name, 
            subscription_tier, 
            created_at, 
            updated_at
        )
        VALUES (
            v_company_id, 
            v_user_id, 
            'Test Company Inc.', 
            'enterprise', 
            now(), 
            now()
        );
    END IF;

    -- 3. Insert/Reset Invite Code
    DELETE FROM public.invite_codes WHERE code = 'TEST8888';
    
    INSERT INTO public.invite_codes (
        code,
        company_id,
        role,
        expires_at,
        max_uses,
        current_uses,
        skool_subscription_required
    ) VALUES (
        'TEST8888',
        v_company_id,
        'technician',
        now() + interval '1 year',
        100,
        0,
        false
    );
END $$;
