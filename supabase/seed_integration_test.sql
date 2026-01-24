
DO $$
DECLARE
    v_client_id UUID;
    v_integration_id UUID;
BEGIN
    -- 1. Get a valid Client ID (just pick the first one)
    SELECT id INTO v_client_id FROM public.clients LIMIT 1;

    IF v_client_id IS NULL THEN
        RAISE EXCEPTION 'No clients found in DB. Cannot seed integration.';
    END IF;

    -- 2. Insert a test integration
    INSERT INTO public.integrations (
        client_id,
        provider,
        status,
        invited_email,
        metadata
    ) VALUES (
        v_client_id,
        'sensibo',
        'pending_invite',
        'test@example.com',
        '{"reply_to": "Technician Bob"}'::jsonb
    )
    RETURNING id INTO v_integration_id;

    RAISE NOTICE 'Created Test Integration ID: %', v_integration_id;
END $$;
