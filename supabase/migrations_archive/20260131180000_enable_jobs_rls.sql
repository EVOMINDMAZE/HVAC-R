-- Enable RLS on jobs table (was missing)
-- This migration fixes the issue where technicians couldn't see their assigned jobs
-- because RLS policies were defined but RLS itself was never enabled.

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
