-- Fix the trigger to handle cases where auth.uid() is NULL (e.g. Admin/Seed scripts)
-- by looking up the Company Owner ID from the Client.

CREATE OR REPLACE FUNCTION public.process_integration_invite()
RETURNS TRIGGER AS $$
DECLARE
    target_user_id UUID;
BEGIN
    -- 1. Try to get current user ID
    target_user_id := auth.uid();

    -- 2. If NULL (Admin/Seed context), fetch from the Client's Company Owner
    IF target_user_id IS NULL THEN
        SELECT c.user_id 
        INTO target_user_id
        FROM public.clients cl
        JOIN public.companies c ON cl.company_id = c.id
        WHERE cl.id = NEW.client_id;
    END IF;

    -- 3. If still NULL, we proceed (it will likely fail due to NOT NULL constraint, 
    -- which is intended if we can't find an owner).

    IF NEW.status = 'pending_invite' AND NEW.invited_email IS NOT NULL THEN
        INSERT INTO public.workflow_requests (
            user_id,
            workflow_type,
            status,
            input_payload
        ) VALUES (
            target_user_id,
            'client_invite',
            'pending',
            jsonb_build_object(
                'integration_id', NEW.id,
                'provider', NEW.provider,
                'email', NEW.invited_email,
                'client_id', NEW.client_id,
                'created_at', NEW.created_at,
                'reply_to', COALESCE(NEW.metadata->>'reply_to', 'System')
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
