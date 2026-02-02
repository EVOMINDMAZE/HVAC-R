CREATE OR REPLACE FUNCTION public.trigger_review_hunter()
RETURNS TRIGGER AS $$
DECLARE
    client_phone TEXT;
    client_email TEXT;
    client_name TEXT;
    tech_name TEXT;
    company_owner_id UUID;
BEGIN
    -- Only fire when status changes to 'completed'
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    
        -- Fetch Client Info & Company Owner (for the user_id of the request)
        SELECT 
            cl.contact_phone,
            cl.email,
            cl.name,
            co.user_id
        INTO 
            client_phone,
            client_email,
            client_name,
            company_owner_id
        FROM public.clients cl
        JOIN public.companies co ON cl.company_id = co.id
        WHERE cl.id = NEW.client_id;
        
        -- Fetch Tech Name (if assigned)
        IF NEW.technician_id IS NOT NULL THEN
            SELECT email INTO tech_name FROM auth.users WHERE id = NEW.technician_id;
        ELSE
            tech_name := 'Our Technician';
        END IF;

        -- Create Workflow Request
        INSERT INTO public.workflow_requests (
            user_id,
            workflow_type,
            status,
            input_payload
        ) VALUES (
            company_owner_id,
            'review_hunter',
            'pending',
            jsonb_build_object(
                'job_id', NEW.id,
                'client_name', client_name,
                'client_email', client_email,
                'client_phone', client_phone,
                'tech_name', tech_name,
                'completed_at', NOW()
            )
        );
        
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
