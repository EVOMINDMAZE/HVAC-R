-- Add calculation_type column to calculations table
BEGIN TRANSACTION;

-- Add column (nullable initially)
ALTER TABLE public.calculations ADD COLUMN IF NOT EXISTS calculation_type TEXT;

-- Copy data from type column
UPDATE public.calculations SET calculation_type = type WHERE calculation_type IS NULL;

-- Create a trigger to keep calculation_type in sync with type on insert/update
CREATE OR REPLACE FUNCTION sync_calculation_type()
RETURNS TRIGGER AS $$
BEGIN
    NEW.calculation_type := NEW.type;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_calculation_type_trigger ON public.calculations;
CREATE TRIGGER sync_calculation_type_trigger
    BEFORE INSERT OR UPDATE ON public.calculations
    FOR EACH ROW
    EXECUTE FUNCTION sync_calculation_type();

COMMIT;