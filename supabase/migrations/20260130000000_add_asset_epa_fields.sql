-- Add refrigerant details to assets for EPA 608 compliance
ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS refrigerant_type TEXT,
ADD COLUMN IF NOT EXISTS full_charge_lbs NUMERIC;

-- Optional: Add a comment to explain the columns
COMMENT ON COLUMN public.assets.refrigerant_type IS 'Type of refrigerant used in the asset (e.g., R-410A, R-22)';
COMMENT ON COLUMN public.assets.full_charge_lbs IS 'Total design refrigerant charge in pounds (used for leak rate calculations)';
