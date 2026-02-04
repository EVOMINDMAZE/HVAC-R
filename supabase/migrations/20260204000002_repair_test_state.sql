-- Repair test state: Ensure admin exists, has company, and is in user_roles
-- User ID: e74f92ab-9c58-45d7-9a0c-4adbe6460f65

DO $$
DECLARE
    v_user_id UUID := 'e74f92ab-9c58-45d7-9a0c-4adbe6460f65';
    v_company_id UUID;
BEGIN
    -- 1. Get or Create Company
    SELECT id INTO v_company_id FROM public.companies WHERE user_id = v_user_id;
    
    IF v_company_id IS NULL THEN
        INSERT INTO public.companies (user_id, name, seat_limit)
        VALUES (v_user_id, 'Test Company', 100)
        RETURNING id INTO v_company_id;
        RAISE NOTICE 'Created new company % for user %', v_company_id, v_user_id;
    ELSE
        UPDATE public.companies SET seat_limit = 100 WHERE id = v_company_id;
        RAISE NOTICE 'Updated seat limit for company %', v_company_id;
    END IF;

    -- 2. Ensure Admin in user_roles
    -- Use ON CONFLICT to upsert. Assuming user_id is unique or PK in user_roles?
    -- If user_id is not unique (one user many roles?), we delete and insert.
    -- Constraint "user_roles_user_id_key" usually exists for 1-1 mapping in simple apps, 
    -- but usually user_roles is (user_id, company_id).
    -- Let's check constraints? Safer to DELETE THEN INSERT for this specific user/role.
    
    DELETE FROM public.user_roles WHERE user_id = v_user_id;
    
    INSERT INTO public.user_roles (user_id, role, company_id)
    VALUES (v_user_id, 'admin', v_company_id);
    
    RAISE NOTICE 'Upserted admin role for user % in company %', v_user_id, v_company_id;
    
END $$;
