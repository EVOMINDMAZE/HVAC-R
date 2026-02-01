-- Add Fintech Fields to Companies Table

ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS financing_link text,
ADD COLUMN IF NOT EXISTS financing_enabled boolean DEFAULT false;

-- Comment on columns for clarity
COMMENT ON COLUMN public.companies.financing_link IS 'URL for 3rd party financing (e.g. Wisetack)';
COMMENT ON COLUMN public.companies.financing_enabled IS 'Toggle to show/hide the link on PDFs';
