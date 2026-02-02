-- Trigger function to queue a Job Scheduled Workflow when a job status changes to 'scheduled'
CREATE OR REPLACE FUNCTION public.process_job_scheduling()
RETURNS TRIGGER AS $$
DECLARE
    client_email TEXT;
    client_name TEXT;
    company_owner_id UUID;
BEGIN
    -- Only trigger when status changes to 'scheduled'
    IF NEW.status = 'scheduled' AND (OLD.status IS NULL OR OLD.status != 'scheduled') THEN
        
        -- Fetch Client Email & Owner ID
        SELECT 
            cl.email,
            cl.name,
            c.user_id
        INTO 
            client_email,
            client_name,
            company_owner_id
        FROM public.clients cl
        JOIN public.companies c ON cl.company_id = c.id
        WHERE cl.id = NEW.client_id;

        -- Insert into Workflow Queue
        IF client_email IS NOT NULL AND company_owner_id IS NOT NULL THEN
             INSERT INTO public.workflow_requests (
                user_id,
                workflow_type,
                status,
                input_payload
            ) VALUES (
                company_owner_id,
                'job_scheduled',
                'pending',
                jsonb_build_object(
                    'job_id', NEW.id,
                    'title', NEW.title,
                    'start_time', NEW.start_time,
                    'client_name', client_name,
                    'client_email', client_email,
                    'created_at', NOW()
                )
            );
        END IF;

    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_job_scheduled ON public.jobs;
CREATE TRIGGER on_job_scheduled
    AFTER INSERT OR UPDATE ON public.jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.process_job_scheduling();
