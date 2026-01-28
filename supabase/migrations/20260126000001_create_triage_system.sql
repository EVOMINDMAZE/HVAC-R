
-- 1. Create Triage Submissions Table
CREATE TABLE IF NOT EXISTS public.triage_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    homeowner_name TEXT,
    homeowner_phone TEXT,
    problem_description TEXT,
    media_urls TEXT[], -- Array of Storage URLs
    ai_analysis JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'analyzed', 'converted')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.triage_submissions ENABLE ROW LEVEL SECURITY;

-- Allow Public Insert (Anon users)
CREATE POLICY "Allow public submissions"
ON public.triage_submissions FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow Admins to View
CREATE POLICY "Admins can view triage"
ON public.triage_submissions FOR SELECT
USING (auth.role() = 'authenticated'); 
-- (Assuming only staff are authenticated in this app context, or we filter by company. For now, authenticated is fine for MVP)

-- 2. Create Storage Bucket (triage-uploads)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('triage-uploads', 'triage-uploads', true) 
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- Allow Anon Uploads
CREATE POLICY "Public Uploads Triage"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'triage-uploads');

-- Allow Public Read (for AI to access)
CREATE POLICY "Public Read Triage"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'triage-uploads');
