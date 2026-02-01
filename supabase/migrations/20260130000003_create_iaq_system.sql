-- Create IAQ Audits Table
CREATE TABLE IF NOT EXISTS public.iaq_audits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
    technician_id UUID REFERENCES auth.users(id),
    
    -- Measurements
    temperature_f FLOAT,
    humidity_percent FLOAT,
    co2_ppm INTEGER,
    voc_level TEXT, -- low, medium, high
    pm25_level FLOAT,
    
    -- Assessment Checklist (JSON)
    checklist JSONB DEFAULT '{}'::jsonb,
    
    -- Scoring
    overall_score INTEGER,
    wellness_score INTEGER,
    comfort_score INTEGER,
    unit_health_score INTEGER,
    
    notes TEXT,
    media_urls TEXT[],
    
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'sent')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.iaq_audits ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Manage IAQ Audits"
ON public.iaq_audits FOR ALL
USING (company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid()));

-- Storage Bucket for IAQ Media
INSERT INTO storage.buckets (id, name, public) 
VALUES ('iaq-reports', 'iaq-reports', true) 
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "IAQ Media Storage"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'iaq-reports');
