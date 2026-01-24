-- Add dynamic alert configuration columns to companies table
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS alert_phone TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS alert_config JSONB DEFAULT '{}'::jsonb;
