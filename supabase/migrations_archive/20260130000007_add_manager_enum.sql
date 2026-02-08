-- Add 'manager' to the user_role enum
-- Note: We cannot use inside a transaction block easily with some postgres versions, 
-- but Supabase handles migration files.
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'manager';


