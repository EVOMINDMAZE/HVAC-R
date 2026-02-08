-- Drop the UNIQUE constraint on user_id to allow users to own multiple companies
ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_user_id_key;