-- Cleanup team members and bump seat limit for the test admin user
-- User ID: e74f92ab-9c58-45d7-9a0c-4adbe6460f65

DO $$
DECLARE
    v_company_id UUID;
    v_user_id UUID := 'e74f92ab-9c58-45d7-9a0c-4adbe6460f65';
BEGIN
    -- Get company ID for the admin user
    SELECT id INTO v_company_id FROM public.companies WHERE user_id = v_user_id;

    IF v_company_id IS NOT NULL THEN
        -- 1. Bump limit to ensure tests don't hit it
        UPDATE public.companies SET seat_limit = 100 WHERE id = v_company_id;

        -- 2. Clean up existing team members to ensure fresh state
        -- We delete anyone who is NOT the company owner/admin to free up slots and cleaner UI
        DELETE FROM public.user_roles 
        WHERE company_id = v_company_id 
        AND user_id != v_user_id; 
        
        RAISE NOTICE 'Cleaned up team for company %', v_company_id;
    ELSE
        RAISE NOTICE 'Company not found for test user %', v_user_id;
    END IF;
END $$;
