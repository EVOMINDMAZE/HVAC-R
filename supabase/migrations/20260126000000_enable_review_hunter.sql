
-- Enable Review Hunter & Create Invoices System

-- 1. Create Invoices Table
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_number TEXT DEFAULT ('INV-' || to_char(now(), 'YYYY') || '-' || substring(gen_random_uuid()::text from 1 for 6)),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    status TEXT CHECK (status IN ('draft', 'sent', 'paid', 'unpaid', 'overdue', 'cancelled')) DEFAULT 'draft',
    total_amount NUMERIC(10,2) DEFAULT 0.00,
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company Admins can manage invoices"
ON public.invoices FOR ALL
USING (company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid()));

CREATE POLICY "Clients can view their own invoices"
ON public.invoices FOR SELECT
USING (client_id IN (SELECT client_id FROM public.user_roles WHERE user_id = auth.uid()));


-- 2. Create Trigger Function for Review Hunter
CREATE OR REPLACE FUNCTION public.trigger_review_hunter()
RETURNS TRIGGER AS $$
DECLARE
    client_phone TEXT;
    client_name TEXT;
    tech_name TEXT;
    company_owner_id UUID;
    job_desc TEXT;
BEGIN
    -- Only fire when status changes to 'completed'
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    
        -- Fetch Client Info & Company Owner (for the user_id of the request)
        SELECT 
            cl.contact_phone,
            cl.first_name || ' ' || cl.last_name,
            co.user_id
        INTO 
            client_phone,
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
        -- workflow_type = 'review_hunter'
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
                'client_phone', client_phone,
                'tech_name', tech_name,
                'completed_at', NOW()
            )
        );
        
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach Trigger to Jobs Table
DROP TRIGGER IF EXISTS on_job_completed ON public.jobs;
CREATE TRIGGER on_job_completed
    AFTER UPDATE ON public.jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_review_hunter();
