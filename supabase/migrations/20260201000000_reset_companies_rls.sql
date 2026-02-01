-- Reset Companies RLS to ensure no hidden recursion or deadlock
-- This drops all existing policies and re-creates simple Owner-only policies.

ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;

-- Drop standard policies
DROP POLICY IF EXISTS "Users can create their own company" ON public.companies;
DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;
DROP POLICY IF EXISTS "Users can update their own company" ON public.companies;

-- Drop potential lingering policies (safety cleanup)
DROP POLICY IF EXISTS "Managers can view company details" ON public.companies;
DROP POLICY IF EXISTS "Managers can update company details" ON public.companies;
DROP POLICY IF EXISTS "Managers can view companies" ON public.companies;

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Re-create Simple Policies (Non-Recursive)

CREATE POLICY "Users can create their own company" ON public.companies
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own company" ON public.companies
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own company" ON public.companies
    FOR UPDATE USING (auth.uid() = user_id);
