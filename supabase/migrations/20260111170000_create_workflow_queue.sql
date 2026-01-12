-- Create the workflow_requests table (The "Queue")
CREATE TABLE IF NOT EXISTS public.workflow_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    workflow_type TEXT NOT NULL, -- e.g., 'whatsapp_alert', 'generate_report'
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    input_payload JSONB NOT NULL DEFAULT '{}'::jsonb, -- Data sent to n8n
    result_payload JSONB DEFAULT '{}'::jsonb, -- Data returned from n8n
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Realtime for this table (Critical for UI updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.workflow_requests;

-- Enable RLS
ALTER TABLE public.workflow_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can create workflow requests"
    ON public.workflow_requests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own requests"
    ON public.workflow_requests FOR SELECT
    USING (auth.uid() = user_id);

-- Depending on your setup, you might want n8n (Service Role) to update these
-- Regular users usually shouldn't update status, but for now we allow them to View.
-- Updates should strictly come from the Backend/Service Role (n8n).
