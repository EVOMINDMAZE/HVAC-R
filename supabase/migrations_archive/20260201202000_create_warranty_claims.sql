-- Create warranty_claims table
CREATE TABLE IF NOT EXISTS public.warranty_claims (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'processed')),
    equipment_info JSONB DEFAULT '{}'::jsonb,
    fault_details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.warranty_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own warranty claims"
    ON public.warranty_claims FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own warranty claims"
    ON public.warranty_claims FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own warranty claims"
    ON public.warranty_claims FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own warranty claims"
    ON public.warranty_claims FOR DELETE
    USING (auth.uid() = user_id);

-- Create updated_at trigger
-- Create updated_at trigger
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.warranty_claims
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
