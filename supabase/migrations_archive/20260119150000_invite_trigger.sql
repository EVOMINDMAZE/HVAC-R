-- Trigger function to queue an Invite Workflow when a new integration with 'pending_invite' is created
CREATE OR REPLACE FUNCTION public.process_integration_invite()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'pending_invite' AND NEW.invited_email IS NOT NULL THEN
        INSERT INTO public.workflow_requests (
            user_id,
            workflow_type,
            status,
            input_payload
        ) VALUES (
            auth.uid(),
            'client_invite',
            'pending',
            jsonb_build_object(
                'integration_id', NEW.id,
                'provider', NEW.provider,
                'email', NEW.invited_email,
                'client_id', NEW.client_id,
                'created_at', NEW.created_at
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_integration_invite ON public.integrations;
CREATE TRIGGER on_integration_invite
    AFTER INSERT ON public.integrations
    FOR EACH ROW
    EXECUTE FUNCTION public.process_integration_invite();
