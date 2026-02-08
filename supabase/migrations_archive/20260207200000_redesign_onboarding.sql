-- Migration: Redesign onboarding and invitation system
-- Phase 1: Remove token-based invitation system
-- Phase 2: Implement direct invitation links
-- Phase 3: Update subscription tiers and seat limits

BEGIN TRANSACTION;

-- ============================================================
-- STEP 1: Create invitation_links table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.invitation_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'tech', 'technician', 'client')),
    expires_at TIMESTAMPTZ,
    max_uses INTEGER DEFAULT 1,
    current_uses INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invitation_links_slug ON public.invitation_links(slug);
CREATE INDEX IF NOT EXISTS idx_invitation_links_company ON public.invitation_links(company_id);

-- ============================================================
-- STEP 2: Copy existing invite_codes data to invitation_links
-- ============================================================

INSERT INTO public.invitation_links (slug, company_id, role, expires_at, max_uses, current_uses, created_by, created_at, updated_at)
SELECT 
    code AS slug,
    company_id,
    role,
    expires_at,
    max_uses,
    current_uses,
    created_by,
    created_at,
    updated_at
FROM public.invite_codes;

-- ============================================================
-- STEP 3: Drop existing invite code functions and triggers
-- ============================================================

-- Drop trigger first (depends on function)
DROP TRIGGER IF EXISTS trigger_invite_codes_updated ON public.invite_codes;

-- Drop functions that depend on invite_codes table
DROP FUNCTION IF EXISTS public.update_invite_codes_timestamp();
DROP FUNCTION IF EXISTS public.validate_invite_code(TEXT);
DROP FUNCTION IF EXISTS public.use_invite_code(TEXT);
DROP FUNCTION IF EXISTS public.create_invite_code(UUID, TEXT, BOOLEAN, TIMESTAMPTZ, INTEGER);

-- ============================================================
-- STEP 4: Drop invite_codes table (cascade will drop dependent objects)
-- ============================================================

DROP TABLE IF EXISTS public.invite_codes CASCADE;

-- ============================================================
-- STEP 5: RLS policies for invitation_links
-- ============================================================

ALTER TABLE public.invitation_links ENABLE ROW LEVEL SECURITY;

-- Policy: Admins/Managers can manage invitation links for their company
CREATE POLICY "RBAC: Manage Invitation Links" ON public.invitation_links
    FOR ALL
    TO authenticated
    USING (
        company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND company_id = invitation_links.company_id
            AND role IN ('admin', 'manager')
        )
    )
    WITH CHECK (
        company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND company_id = invitation_links.company_id
            AND role IN ('admin', 'manager')
        )
    );

-- Policy: Authenticated users can view active invitation links for their company
CREATE POLICY "View Active Company Invitation Links" ON public.invitation_links
    FOR SELECT
    TO authenticated
    USING (
        company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND company_id = invitation_links.company_id
        )
    );

-- ============================================================
-- STEP 6: Create updated_at trigger for invitation_links
-- ============================================================

CREATE OR REPLACE FUNCTION update_invitation_links_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_invitation_links_updated
    BEFORE UPDATE ON public.invitation_links
    FOR EACH ROW
    EXECUTE FUNCTION update_invitation_links_timestamp();

-- ============================================================
-- STEP 7: Update subscription_tier constraint (rename enterprise to business)
-- ============================================================

-- Drop old constraint first to allow updates
ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_subscription_tier_check;

-- Update existing enterprise tiers to business
UPDATE public.companies
SET subscription_tier = 'business'
WHERE subscription_tier = 'enterprise';

-- Update any other unknown tiers to 'free' (default)
UPDATE public.companies
SET subscription_tier = 'free'
WHERE subscription_tier NOT IN ('free', 'pro', 'business');

-- Add new constraint with free, pro, business
ALTER TABLE public.companies ADD CONSTRAINT companies_subscription_tier_check 
    CHECK (subscription_tier IN ('free', 'pro', 'business'));

-- ============================================================
-- STEP 8: Update seat limit defaults based on tier
-- ============================================================

-- Create function to set seat_limit based on subscription_tier
CREATE OR REPLACE FUNCTION update_seat_limit_from_tier()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.subscription_tier = 'free' THEN
        NEW.seat_limit = 3;
    ELSIF NEW.subscription_tier = 'pro' THEN
        NEW.seat_limit = 1;
    ELSIF NEW.subscription_tier = 'business' THEN
        NEW.seat_limit = 10;
    ELSE
        NEW.seat_limit = 1; -- fallback
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update seat_limit when subscription_tier changes
DROP TRIGGER IF EXISTS trigger_update_seat_limit_on_tier_change ON public.companies;
CREATE TRIGGER trigger_update_seat_limit_on_tier_change
    BEFORE INSERT OR UPDATE OF subscription_tier ON public.companies
    FOR EACH ROW
    EXECUTE FUNCTION update_seat_limit_from_tier();

-- Update existing companies to have correct seat limits
UPDATE public.companies
SET seat_limit = CASE
    WHEN subscription_tier = 'free' THEN 3
    WHEN subscription_tier = 'pro' THEN 1
    WHEN subscription_tier = 'business' THEN 10
    ELSE 1
END;

-- ============================================================
-- STEP 9: Create new RPC functions for invitation links
-- ============================================================

-- Function to validate an invitation link by slug
CREATE OR REPLACE FUNCTION public.validate_invitation_link(p_slug TEXT)
RETURNS JSONB AS $$
DECLARE
    v_invite JSONB;
BEGIN
    SELECT jsonb_build_object(
        'valid', TRUE,
        'company_id', il.company_id,
        'company_name', c.name,
        'role', il.role,
        'expires_at', il.expires_at,
        'max_uses', il.max_uses,
        'current_uses', il.current_uses
    ) INTO v_invite
    FROM public.invitation_links il
    JOIN public.companies c ON c.id = il.company_id
    WHERE il.slug = p_slug
      AND (il.expires_at IS NULL OR il.expires_at > NOW())
      AND (il.max_uses IS NULL OR il.current_uses < il.max_uses);

    IF v_invite IS NULL THEN
        RETURN jsonb_build_object('valid', FALSE, 'error', 'Invalid or expired invitation link');
    END IF;

    RETURN jsonb_build_object('valid', TRUE, 'invite', v_invite);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to use (redeem) an invitation link
CREATE OR REPLACE FUNCTION public.use_invitation_link(p_slug TEXT)
RETURNS JSONB AS $$
DECLARE
    v_validation JSONB;
    v_result JSONB;
BEGIN
    -- Validate the link
    SELECT * INTO v_validation FROM public.validate_invitation_link(p_slug);
    
    IF NOT (v_validation->>'valid')::BOOLEAN THEN
        RETURN v_validation;
    END IF;

    -- Check seat limit
    SELECT * INTO v_result FROM public.check_seat_limit((v_validation->'invite'->>'company_id')::UUID);
    IF NOT (v_result->>'within_limit')::BOOLEAN THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Seat limit reached for this company');
    END IF;

    -- Add user to company with specified role
    INSERT INTO public.user_roles (user_id, company_id, role)
    VALUES (
        auth.uid(),
        (v_validation->'invite'->>'company_id')::UUID,
        v_validation->'invite'->>'role'
    )
    ON CONFLICT (user_id, company_id) DO UPDATE
    SET role = EXCLUDED.role;

    -- Increment usage count
    UPDATE public.invitation_links
    SET current_uses = current_uses + 1
    WHERE slug = p_slug;

    -- Switch to the company context
    SELECT * INTO v_result FROM public.switch_company_context(
        (v_validation->'invite'->>'company_id')::UUID
    );

    RETURN jsonb_build_object('success', TRUE, 'company_id', v_validation->'invite'->>'company_id');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a new invitation link
CREATE OR REPLACE FUNCTION public.create_invitation_link(
    p_company_id UUID,
    p_role TEXT,
    p_expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days',
    p_max_uses INTEGER DEFAULT 1
)
RETURNS JSONB AS $$
DECLARE
    v_slug TEXT;
    v_has_permission BOOLEAN;
BEGIN
    -- Permission check: user must be admin/manager of the company
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
          AND company_id = p_company_id
          AND role IN ('admin', 'manager')
    ) INTO v_has_permission;

    IF NOT v_has_permission THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'No permission to create invitation links for this company');
    END IF;

    -- Generate unique slug
    LOOP
        v_slug := encode(gen_random_bytes(8), 'hex');
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.invitation_links WHERE slug = v_slug);
    END LOOP;

    -- Insert the invitation link
    INSERT INTO public.invitation_links (
        slug, company_id, role, expires_at, max_uses, created_by
    ) VALUES (
        v_slug, p_company_id, p_role, p_expires_at, p_max_uses, auth.uid()
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'slug', v_slug,
        'link', '/invite/' || v_slug
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;