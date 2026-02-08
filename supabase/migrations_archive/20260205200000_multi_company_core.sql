-- Migration: Multi-Company, Multi-Role Core Schema
-- Phase 1: Database Schema Changes

BEGIN TRANSACTION;

-- ============================================================
-- PRE-STEP: Fix ALL constraint violations FIRST - Before adding constraint
-- ============================================================
DO $$
DECLARE
    v_default_company UUID;
    v_default_client UUID;
    v_count INTEGER;
BEGIN
    -- Get a default company
    SELECT id INTO v_default_company
    FROM public.companies
    WHERE name ILIKE '%HVAC%' OR name ILIKE '%Thermo%'
    LIMIT 1;

    IF v_default_company IS NULL THEN
        SELECT id INTO v_default_company
        FROM public.companies LIMIT 1;
    END IF;

    -- Get a default client
    SELECT id INTO v_default_client
    FROM public.clients
    LIMIT 1;

    RAISE NOTICE 'Using default company: % and client: %', v_default_company, v_default_client;

    -- Phase 0: Fix invalid roles first
    UPDATE public.user_roles
    SET role = 'tech'
    WHERE role NOT IN ('client', 'tech', 'technician', 'manager', 'admin');

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Phase 0: Fixed % rows with invalid roles', v_count;

    -- Phase 1: Fix ALL null company_id values for known roles
    UPDATE public.user_roles
    SET company_id = COALESCE(
        (SELECT c.company_id FROM public.clients c WHERE c.id = user_roles.client_id LIMIT 1),
        v_default_company
    )
    WHERE company_id IS NULL
      AND role IN ('tech', 'technician', 'manager', 'admin');

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Phase 1: Fixed % rows with null company_id', v_count;

    -- Phase 2: Fix ALL null client_id values for 'client' role
    UPDATE public.user_roles
    SET client_id = COALESCE(
        (SELECT c.id FROM public.clients c WHERE c.company_id = user_roles.company_id LIMIT 1),
        v_default_client
    )
    WHERE role = 'client'
      AND client_id IS NULL;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Phase 2: Fixed % client rows with null client_id', v_count;

    -- Phase 3: If still null company_id, use company_id from client
    UPDATE public.user_roles ur
    SET company_id = c.company_id
    FROM public.clients c
    WHERE ur.client_id = c.id
      AND ur.company_id IS NULL;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Phase 3: Updated % rows via client company_id', v_count;

    -- Phase 4: Final pass - set remaining nulls to defaults
    UPDATE public.user_roles
    SET company_id = COALESCE(company_id, v_default_company),
        client_id = COALESCE(client_id, v_default_client)
    WHERE company_id IS NULL OR (role = 'client' AND client_id IS NULL);

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Phase 4: Final pass fixed % rows', v_count;

    -- Final verification - using only known valid enum values
    SELECT COUNT(*) INTO v_count
    FROM public.user_roles
    WHERE NOT (
        (role = 'client' AND client_id IS NOT NULL) OR
        (role IN ('tech', 'technician', 'manager', 'admin') AND company_id IS NOT NULL)
    );

    IF v_count > 0 THEN
        RAISE EXCEPTION 'CRITICAL: Still have % rows violating constraint!', v_count;
    END IF;

    RAISE NOTICE 'SUCCESS: All constraint violations fixed';
END;
$$;

-- ============================================================
-- STEP 1: Create helper function first
-- ============================================================
CREATE OR REPLACE FUNCTION update_user_roles_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- STEP 2: Create invite_codes table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.invite_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'tech', 'technician', 'client')),
    expires_at TIMESTAMPTZ,
    max_uses INTEGER DEFAULT 1,
    current_uses INTEGER DEFAULT 0,
    skool_subscription_required BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON public.invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_company ON public.invite_codes(company_id);

-- ============================================================
-- STEP 3: Modify user_roles table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_roles_backup AS
SELECT * FROM public.user_roles;

ALTER TABLE public.user_roles
DROP CONSTRAINT IF EXISTS user_roles_pkey;

ALTER TABLE public.user_roles
ADD COLUMN IF NOT EXISTS id SERIAL;

ALTER TABLE public.user_roles
ADD PRIMARY KEY (user_id, company_id);

DROP TRIGGER IF EXISTS trigger_user_roles_updated ON public.user_roles;
CREATE TRIGGER trigger_user_roles_updated
    BEFORE UPDATE ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_user_roles_timestamp();

-- Add constraint after data is clean
ALTER TABLE public.user_roles
ADD CONSTRAINT check_multi_role_mapping CHECK (
    (role = 'client' AND client_id IS NOT NULL) OR
    (role IN ('tech', 'technician', 'manager', 'admin') AND company_id IS NOT NULL)
);

-- ============================================================
-- STEP 4: Create helper functions
-- ============================================================

DROP FUNCTION IF EXISTS public.get_my_companies();
DROP FUNCTION IF EXISTS public.get_my_company_id(UUID);
DROP FUNCTION IF EXISTS public.get_my_role(UUID);
DROP FUNCTION IF EXISTS public.switch_company_context(UUID, TEXT);
DROP FUNCTION IF EXISTS public.validate_invite_code(TEXT);
DROP FUNCTION IF EXISTS public.use_invite_code(TEXT);
DROP FUNCTION IF EXISTS public.create_invite_code(UUID, TEXT, BOOLEAN, TIMESTAMPTZ, INTEGER);

CREATE OR REPLACE FUNCTION public.get_my_companies()
RETURNS TABLE (
    company_id UUID,
    company_name TEXT,
    role TEXT,
    is_owner BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ur.company_id,
        c.name AS company_name,
        ur.role::TEXT AS role,
        FALSE::BOOLEAN AS is_owner
    FROM public.user_roles ur
    JOIN public.companies c ON c.id = ur.company_id
    WHERE ur.user_id = auth.uid()

    UNION ALL

    SELECT
        c.id,
        c.name,
        'owner'::TEXT,
        TRUE::BOOLEAN
    FROM public.companies c
    WHERE c.user_id = auth.uid()
    AND NOT EXISTS (
        SELECT 1 FROM public.user_roles ur2
        WHERE ur2.user_id = auth.uid()
        AND ur2.company_id = c.id
    )
    ORDER BY company_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_my_company_id(p_company_id UUID DEFAULT NULL::UUID)
RETURNS UUID AS $$
DECLARE
    v_result UUID;
BEGIN
    IF p_company_id IS NOT NULL THEN
        SELECT company_id INTO v_result
        FROM public.user_roles
        WHERE user_id = auth.uid() AND company_id = p_company_id;

        IF v_result IS NULL THEN
            SELECT id INTO v_result
            FROM public.companies
            WHERE user_id = auth.uid() AND id = p_company_id;
        END IF;

        IF v_result IS NULL THEN
            RAISE EXCEPTION 'Access denied to company %', p_company_id;
        END IF;
        RETURN v_result;
    END IF;

    SELECT raw_user_meta_data->>'active_company_id' INTO v_result
    FROM auth.users
    WHERE id = auth.uid();

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_my_role(p_company_id UUID DEFAULT NULL::UUID)
RETURNS TEXT AS $$
DECLARE
    v_result TEXT;
    v_company_id UUID;
BEGIN
    v_company_id := COALESCE(
        p_company_id,
        (SELECT raw_user_meta_data->>'active_company_id' FROM auth.users WHERE id = auth.uid())::UUID
    );

    SELECT role INTO v_result
    FROM public.user_roles
    WHERE user_id = auth.uid() AND company_id = v_company_id;

    IF v_result IS NULL THEN
        IF EXISTS (SELECT 1 FROM public.companies WHERE user_id = auth.uid() AND id = v_company_id) THEN
            v_result := 'owner';
        END IF;
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.switch_company_context(
    p_company_id UUID,
    p_role_override TEXT DEFAULT NULL::TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_company_id UUID;
    v_role TEXT;
    v_result JSONB;
BEGIN
    SELECT company_id INTO v_company_id
    FROM public.user_roles
    WHERE user_id = auth.uid() AND company_id = p_company_id;

    IF v_company_id IS NULL THEN
        SELECT id INTO v_company_id
        FROM public.companies
        WHERE user_id = auth.uid() AND id = p_company_id;
    END IF;

    IF v_company_id IS NULL THEN
        RAISE EXCEPTION 'You do not have access to company %', p_company_id;
    END IF;

    SELECT role INTO v_role
    FROM public.user_roles
    WHERE user_id = auth.uid() AND company_id = p_company_id;

    IF v_role IS NULL THEN
        v_role := 'owner';
    END IF;

    IF p_role_override IS NOT NULL THEN
        v_role := p_role_override;
    END IF;

    UPDATE auth.users
    SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
        'active_company_id', v_company_id,
        'active_role', v_role
    )
    WHERE id = auth.uid();

    SELECT jsonb_build_object(
        'company_id', v_company_id,
        'company_name', (SELECT name FROM public.companies WHERE id = v_company_id),
        'role', v_role
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.validate_invite_code(p_code TEXT)
RETURNS JSONB AS $$
DECLARE
    v_invite JSONB;
BEGIN
    SELECT jsonb_build_object(
        'valid', FALSE,
        'error', 'Invalid or expired invite code'
    ) INTO v_invite;

    SELECT jsonb_build_object(
        'valid', TRUE,
        'company_id', ic.company_id,
        'company_name', c.name,
        'role', ic.role,
        'expires_at', ic.expires_at,
        'max_uses', ic.max_uses,
        'current_uses', ic.current_uses,
        'skool_required', ic.skool_subscription_required
    ) INTO v_invite
    FROM public.invite_codes ic
    JOIN public.companies c ON c.id = ic.company_id
    WHERE ic.code = p_code;

    IF v_invite->>'valid' = 'true' THEN
        IF (v_invite->>'expires_at') IS NOT NULL AND
           (v_invite->>'expires_at')::TIMESTAMPTZ < NOW() THEN
            v_invite := v_invite || jsonb_build_object('valid', FALSE, 'error', 'Invite expired');
        END IF;

        IF (v_invite->>'current_uses')::INTEGER >= (v_invite->>'max_uses')::INTEGER THEN
            v_invite := v_invite || jsonb_build_object('valid', FALSE, 'error', 'Max uses reached');
        END IF;
    END IF;

    RETURN v_invite;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.use_invite_code(p_code TEXT)
RETURNS JSONB AS $$
DECLARE
    v_validation JSONB;
    v_result JSONB;
BEGIN
    SELECT * INTO v_validation FROM public.validate_invite_code(p_code);

    IF v_validation->>'valid' != 'true' THEN
        RETURN v_validation;
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND company_id = (v_validation->>'company_id')::UUID
    ) THEN
        RETURN jsonb_build_object('valid', FALSE, 'error', 'Already a member');
    END IF;

    INSERT INTO public.user_roles (user_id, company_id, role)
    VALUES (
        auth.uid(),
        (v_validation->>'company_id')::UUID,
        v_validation->>'role'::TEXT
    );

    UPDATE public.invite_codes
    SET current_uses = current_uses + 1
    WHERE code = p_code;

    SELECT * INTO v_result FROM public.switch_company_context(
        (v_validation->>'company_id')::UUID
    );

    RETURN jsonb_build_object('valid', TRUE, 'joined_company', v_result);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.create_invite_code(
    p_company_id UUID,
    p_role TEXT,
    p_skool_required BOOLEAN DEFAULT FALSE,
    p_expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days',
    p_max_uses INTEGER DEFAULT 1
)
RETURNS JSONB AS $$
DECLARE
    v_code TEXT;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND company_id = p_company_id
        AND role IN ('admin', 'owner', 'manager')
    ) THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'No permission');
    END IF;

    LOOP
        v_code := encode(gen_random_bytes(8), 'hex');
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.invite_codes WHERE code = v_code);
    END LOOP;

    INSERT INTO public.invite_codes (
        code, company_id, role, expires_at, max_uses,
        skool_subscription_required, created_by
    ) VALUES (
        v_code, p_company_id, p_role, p_expires_at, p_max_uses,
        p_skool_required, auth.uid()
    );

    RETURN jsonb_build_object('success', TRUE, 'code', v_code, 'company_id', p_company_id, 'role', p_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
