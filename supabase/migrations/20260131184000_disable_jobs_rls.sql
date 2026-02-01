-- DIAGNOSTIC: Disable RLS entirely on jobs table
-- This will help us determine if the hang is caused by RLS policies or something else.

ALTER TABLE public.jobs DISABLE ROW LEVEL SECURITY;
