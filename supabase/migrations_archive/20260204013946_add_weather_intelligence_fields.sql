-- Add zip_code to clients
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS zip_code TEXT;

-- Add install_date to assets
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS install_date DATE;
