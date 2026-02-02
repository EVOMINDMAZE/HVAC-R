-- 1. Get the admin user ID (assuming we are using the 'admin@admin.com' or similar from memory, or just the first user)
DO $$
DECLARE
    v_user_id UUID;
    v_company_id UUID;
    v_client_id UUID;
    v_job_id UUID;
BEGIN
    -- Get a user (Assuming one exists, otherwise we'd need to create one. failing that just pick the first one)
    SELECT id INTO v_user_id FROM auth.users LIMIT 1;
    
    -- Get or Create Company
    SELECT id INTO v_company_id FROM public.companies WHERE user_id = v_user_id;
    IF v_company_id IS NULL THEN
        INSERT INTO public.companies (user_id, name) VALUES (v_user_id, 'Test Company') RETURNING id INTO v_company_id;
    END IF;

    -- Create/Get Test Client
    INSERT INTO public.clients (company_id, name, email, contact_phone, address)
    VALUES (v_company_id, 'Resend Test Client', 'delivered@resend.dev', '555-0123', '123 Test Lane')
    ON CONFLICT DO NOTHING;
    
    SELECT id INTO v_client_id FROM public.clients WHERE email = 'delivered@resend.dev' LIMIT 1;

    -- Create Job
    INSERT INTO public.jobs (company_id, client_id, title, description, status)
    VALUES (v_company_id, v_client_id, 'Fixing the Flux Capacitor', 'It was leaking plutonium.', 'scheduled')
    RETURNING id INTO v_job_id;

    -- Complete Job (Triggers the function)
    UPDATE public.jobs SET status = 'completed' WHERE id = v_job_id;
    
END $$;
