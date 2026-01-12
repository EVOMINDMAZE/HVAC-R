-- Create companies table
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    name TEXT NOT NULL,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#000000',
    website TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- Enable RLS on companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Policies for companies
CREATE POLICY "Users can view their own company"
    ON public.companies FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own company"
    ON public.companies FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own company"
    ON public.companies FOR UPDATE
    USING (auth.uid() = user_id);

-- Create licenses table
CREATE TABLE IF NOT EXISTS public.licenses (
    key UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'past_due', 'canceled', 'inactive')),
    plan_tier TEXT DEFAULT 'standard',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on licenses
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

-- Policies for licenses
CREATE POLICY "Users can view their own licenses"
    ON public.licenses FOR SELECT
    USING (auth.uid() = user_id);

-- Only service role can insert/update licenses (via Stripe Webhook), but strictly speaking regular users shouldn't create them.
-- However, for manual testing, we might want to allow it or just rely on the dashboard/service role.
-- We will restrict modification to service_role mostly.

-- Create Storage Bucket for Company Assets if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-assets', 'company-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated uploads to company-assets
CREATE POLICY "Authenticated users can upload company logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'company-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy to allow public viewing of company assets
CREATE POLICY "Public Access to company assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'company-assets');
