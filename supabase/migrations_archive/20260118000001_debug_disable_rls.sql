-- DIAGNOSTIC MIGRATION: DISABLE RLS
-- This is temporary to verify if RLS policies are causing the hanging requests.

-- Disable RLS on companies
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;

-- Disable RLS on clients
ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
