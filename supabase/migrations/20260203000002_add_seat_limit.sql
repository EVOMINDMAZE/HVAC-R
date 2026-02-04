-- Add seat_limit to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS seat_limit INTEGER DEFAULT 5;

COMMENT ON COLUMN public.companies.seat_limit IS 'Maximum number of paid seats (technicians, admins, managers) allowed for this company.';
