-- Harden RLS for Automation Rules and Workflow Requests
-- Standardizes RBAC using public.get_my_company_id() and public.get_my_role()

-- 1. AUTOMATION_RULES
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

-- Drop old policies (if any exist, using IF EXISTS to be safe)
DROP POLICY IF EXISTS "Users can manage automation rules" ON public.automation_rules;
DROP POLICY IF EXISTS "Users can view automation rules" ON public.automation_rules;

-- View Policy: Admins, Managers, and Techs can see active rules
CREATE POLICY "RBAC: View Rules" ON public.automation_rules
    FOR SELECT USING (
        -- Admin/Manager/Tech: Can see rules for their company
        public.get_my_role() IN ('admin', 'manager', 'tech') 
        AND company_id = public.get_my_company_id()
    );

-- Manage Policy: Only Admins and Managers can create/update/delete
CREATE POLICY "RBAC: Manage Rules" ON public.automation_rules
    FOR ALL USING (
        public.get_my_role() IN ('admin', 'manager')
        AND company_id = public.get_my_company_id()
    );


-- 2. WORKFLOW_REQUESTS
ALTER TABLE public.workflow_requests ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Users can create workflow requests" ON public.workflow_requests;
DROP POLICY IF EXISTS "Users can view their own requests" ON public.workflow_requests;

-- View Policy: 
-- 1. Users see their own.
-- 2. Managers/Admins see all for their company.
CREATE POLICY "RBAC: View Requests" ON public.workflow_requests
    FOR SELECT USING (
        -- 1. View Own
        auth.uid() = user_id
        OR
        -- 2. Manager/Admin View Company
        (
            public.get_my_role() IN ('admin', 'manager')
            AND user_id IN (
                SELECT user_id FROM public.user_roles 
                WHERE company_id = public.get_my_company_id()
            )
        )
    );

-- Create Policy: Users create logs for themselves
CREATE POLICY "RBAC: Create Requests" ON public.workflow_requests
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
    );

-- Update Policy: Generally restricted to System/Service Role, but if we allow status updates/retries:
CREATE POLICY "RBAC: Manager Retry" ON public.workflow_requests
    FOR UPDATE USING (
        public.get_my_role() IN ('admin', 'manager')
        AND user_id IN (
            SELECT user_id FROM public.user_roles 
            WHERE company_id = public.get_my_company_id()
        )
    );
