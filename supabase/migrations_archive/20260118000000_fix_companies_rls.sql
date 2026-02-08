-- Enable RLS on Companies if not already enabled
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- COMPANIES POLICIES
-- Allow users to insert their own company profile
DROP POLICY IF EXISTS "Users can create their own company" ON public.companies;
CREATE POLICY "Users can create their own company" ON public.companies
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own company
DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;
CREATE POLICY "Users can view their own company" ON public.companies
    FOR SELECT USING (auth.uid() = user_id);

-- Allow users to update their own company
DROP POLICY IF EXISTS "Users can update their own company" ON public.companies;
CREATE POLICY "Users can update their own company" ON public.companies
    FOR UPDATE USING (auth.uid() = user_id);


-- CLIENTS POLICIES (Ensure Insert is allowed)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Allow users to insert clients if they own the company linked to the client
DROP POLICY IF EXISTS "Users can create clients for their company" ON public.clients;
CREATE POLICY "Users can create clients for their company" ON public.clients
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT id FROM public.companies WHERE user_id = auth.uid()
        )
    );

-- Ensure users can select the clients they just created (and others in their company)
-- (Refining the existing policy if needed, or adding a complementary one)
DROP POLICY IF EXISTS "Users can view their company clients" ON public.clients;
CREATE POLICY "Users can view their company clients" ON public.clients
    FOR SELECT USING (
        company_id IN (
            SELECT id FROM public.companies WHERE user_id = auth.uid()
        )
    );
