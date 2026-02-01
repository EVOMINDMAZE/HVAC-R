-- Link refrigerant logs directly to assets for easier leak rate tracking
ALTER TABLE public.refrigerant_logs 
ADD COLUMN IF NOT EXISTS asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.refrigerant_logs.asset_id IS 'Specific asset target for this refrigerant transaction';
