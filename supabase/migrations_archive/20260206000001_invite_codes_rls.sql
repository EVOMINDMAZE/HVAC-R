-- Migration: Add RLS policies for invite_codes table
-- Phase 4.2: Enhanced RBAC Policies

BEGIN TRANSACTION;

-- Enable RLS on invite_codes
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admins can manage invite codes" ON public.invite_codes;
DROP POLICY IF EXISTS "Users can view active invite codes" ON public.invite_codes;
DROP POLICY IF EXISTS "Manage Invite Codes" ON public.invite_codes;
DROP POLICY IF EXISTS "View Active Company Invite Codes" ON public.invite_codes;
DROP POLICY IF EXISTS "RBAC: Manage Invite Codes" ON public.invite_codes;

-- Policy 1: Admin/Manager can view, create, update invite codes for their company
CREATE POLICY "RBAC: Manage Invite Codes" ON public.invite_codes
    FOR ALL
    TO authenticated
    USING (
        company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND company_id = invite_codes.company_id
            AND role IN ('admin', 'manager')
        )
    )
    WITH CHECK (
        company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND company_id = invite_codes.company_id
            AND role IN ('admin', 'manager')
        )
    );

-- Policy 2: Anyone can SELECT public invite codes (for redemption via RPC)
CREATE POLICY "View Active Company Invite Codes" ON public.invite_codes
    FOR SELECT
    TO authenticated
    USING (
        company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND company_id = invite_codes.company_id
        )
    );

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_invite_codes_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_invite_codes_updated ON public.invite_codes;
CREATE TRIGGER trigger_invite_codes_updated
    BEFORE UPDATE ON public.invite_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_invite_codes_timestamp();

COMMIT;
