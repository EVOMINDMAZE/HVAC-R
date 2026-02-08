
-- STRICT MULTI-TENANCY RLS POLICIES
-- This migration enforces the 'active_company_id' as the single source of truth for business data access.

-- A generic policy function isn't always possible due to table differences, so we'll apply policies per table.
-- The Golden Rule: "WHERE company_id = public.get_my_company_id()"

-- 1. JOBS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Technicians can view their jobs" ON public.jobs;
DROP POLICY IF EXISTS "Admins can view company jobs" ON public.jobs;
DROP POLICY IF EXISTS "Strict Company Isolation" ON public.jobs; -- Safety for rerun

CREATE POLICY "Strict Company Isolation" ON public.jobs
FOR ALL
TO authenticated
USING (
  company_id = public.get_my_company_id()
)
WITH CHECK (
  company_id = public.get_my_company_id()
);

-- 2. CLIENTS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users see their company clients" ON public.clients;

CREATE POLICY "Strict Company Isolation" ON public.clients
FOR ALL
TO authenticated
USING (
  company_id = public.get_my_company_id()
)
WITH CHECK (
  company_id = public.get_my_company_id()
);

-- 3. INVOICES
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view invoices of their company" ON public.invoices;

CREATE POLICY "Strict Company Isolation" ON public.invoices
FOR ALL
TO authenticated
USING (
  company_id = public.get_my_company_id()
)
WITH CHECK (
  company_id = public.get_my_company_id()
);

/*
-- 4. QUOTES (Table does not exist yet)
-- ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Users can view quotes of their company" ON public.quotes;

-- CREATE POLICY "Strict Company Isolation" ON public.quotes
-- FOR ALL
-- TO authenticated
-- USING (
--   company_id = public.get_my_company_id()
-- )
-- WITH CHECK (
--   company_id = public.get_my_company_id()
-- );

-- 5. ESTIMATES (Pending verification)
-- ALTER TABLE public.estimates ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Users can view estimates of their company" ON public.estimates;

-- CREATE POLICY "Strict Company Isolation" ON public.estimates
-- FOR ALL
-- TO authenticated
-- USING (
--   company_id = public.get_my_company_id()
-- )
-- WITH CHECK (
--   company_id = public.get_my_company_id()
-- );
*/


-- 6. SPECIAL HANDLING: TEAM MEMBERS (USER_ROLES view usually)
-- We need to see team members of the ACTIVE company.
-- Assuming 'user_roles' is the table mapping users to companies.
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view company roles" ON public.user_roles;

CREATE POLICY "View Members of Active Company" ON public.user_roles
FOR SELECT
TO authenticated
USING (
  company_id = public.get_my_company_id() -- See colleagues in current context
  OR
  user_id = auth.uid() -- ALWAYS see your own roles (needed for switching/login!)
);

-- 7. SPECIAL HANDLING: COMPANIES
-- You must be able to see companies you are a member of (to switch TO them).
-- But you should only see details of the active one? No, for the switcher to work, you need to see the list.
-- The RPC `get_my_companies` bypasses RLS if it's SECURITY DEFINER (which it is).
-- So valid RLS on `companies` table can be strict for general querying.

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their companies" ON public.companies;

CREATE POLICY "View Active Company Details" ON public.companies
FOR SELECT
TO authenticated
USING (
  id = public.get_my_company_id() -- Can only query details of the ACTIVE company standardly
  OR
  id IN ( -- OR companies you belong to (for listing if not using RPC)
    SELECT company_id 
    FROM public.user_roles 
    WHERE user_id = auth.uid()
  )
  OR
  user_id = auth.uid() -- OR owned companies
);
