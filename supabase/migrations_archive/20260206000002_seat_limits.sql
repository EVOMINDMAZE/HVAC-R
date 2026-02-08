-- Migration: Add subscription tiers and seat limits
-- Phase 4.3: Seat Limits & Subscription Tiers

BEGIN TRANSACTION;

-- ============================================================
-- STEP 1: Add subscription columns to companies table
-- ============================================================
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
ADD COLUMN IF NOT EXISTS seat_limit INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS seat_usage INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'past_due', 'canceled', 'trialing')),
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- Update default values for existing companies
UPDATE public.companies
SET subscription_tier = 'free',
    seat_limit = 1,
    seat_usage = (
        SELECT COUNT(*) FROM public.user_roles WHERE company_id = companies.id
    ),
    subscription_status = 'active'
WHERE subscription_tier IS NULL;

-- ============================================================
-- STEP 2: Create check_seat_limit function
-- ============================================================
DROP FUNCTION IF EXISTS public.check_seat_limit(UUID);
CREATE OR REPLACE FUNCTION public.check_seat_limit(p_company_id UUID DEFAULT NULL::UUID)
RETURNS JSONB AS $$
DECLARE
    v_company_id UUID;
    v_seat_limit INTEGER;
    v_seat_usage INTEGER;
    v_result JSONB;
BEGIN
    v_company_id := COALESCE(
        p_company_id,
        (SELECT raw_user_meta_data->>'active_company_id' FROM auth.users WHERE id = auth.uid())::UUID
    );

    SELECT subscription_tier, seat_limit, seat_usage
    INTO v_result
    FROM public.companies
    WHERE id = v_company_id;

    IF v_result IS NULL THEN
        RETURN jsonb_build_object(
            'can_add', FALSE,
            'error', 'Company not found',
            'seat_limit', 0,
            'seat_usage', 0,
            'tier', 'unknown'
        );
    END IF;

    v_seat_limit := (v_result->>'seat_limit')::INTEGER;
    v_seat_usage := (v_result->>'seat_usage')::INTEGER;

    RETURN jsonb_build_object(
        'can_add', v_seat_usage < v_seat_limit,
        'seat_limit', v_seat_limit,
        'seat_usage', v_seat_usage,
        'available', v_seat_limit - v_seat_usage,
        'tier', v_result->>'tier',
        'company_id', v_company_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STEP 3: Update seat_usage when user_roles change
-- ============================================================
CREATE OR REPLACE FUNCTION update_company_seat_usage()
RETURNS TRIGGER AS $$
DECLARE
    v_company_id UUID;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_company_id := NEW.company_id;
    ELSIF TG_OP = 'DELETE' THEN
        v_company_id := OLD.company_id;
    ELSE
        v_company_id := NEW.company_id;
    END IF;

    UPDATE public.companies
    SET seat_usage = (
        SELECT COUNT(*) FROM public.user_roles WHERE company_id = v_company_id
    )
    WHERE id = v_company_id;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate triggers
DROP TRIGGER IF EXISTS trigger_user_roles_seat_usage ON public.user_roles;
CREATE TRIGGER trigger_user_roles_seat_usage
    AFTER INSERT OR DELETE ON public.user_roles
    FOR EACH ROW EXECUTE FUNCTION update_company_seat_usage();

-- ============================================================
-- STEP 4: Block invite creation at seat limit
-- ============================================================
DROP FUNCTION IF EXISTS public.create_invite_code(UUID, TEXT, BOOLEAN, TIMESTAMPTZ, INTEGER);
CREATE OR REPLACE FUNCTION public.create_invite_code(
    p_company_id UUID,
    p_role TEXT,
    p_skool_required BOOLEAN DEFAULT FALSE,
    p_expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days',
    p_max_uses INTEGER DEFAULT 1
)
RETURNS JSONB AS $$
DECLARE
    v_seat_check JSONB;
    v_code TEXT;
BEGIN
    -- Check if user has permission
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND company_id = p_company_id
        AND role IN ('admin', 'owner', 'manager')
    ) THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'No permission');
    END IF;

    -- Check seat limit
    SELECT * INTO v_seat_check FROM public.check_seat_limit(p_company_id);

    IF NOT (v_seat_check->>'can_add')::BOOLEAN THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'Seat limit reached',
            'seat_limit', v_seat_check->>'seat_limit',
            'seat_usage', v_seat_check->>'seat_usage'
        );
    END IF;

    -- Generate invite code
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

    RETURN jsonb_build_object(
        'success', TRUE,
        'code', v_code,
        'company_id', p_company_id,
        'role', p_role,
        'seats_remaining', (v_seat_check->>'available')::INTEGER - 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STEP 5: Get company subscription info
-- ============================================================
DROP FUNCTION IF EXISTS public.get_company_subscription(UUID);
CREATE OR REPLACE FUNCTION public.get_company_subscription(p_company_id UUID DEFAULT NULL::UUID)
RETURNS JSONB AS $$
DECLARE
    v_company_id UUID;
BEGIN
    v_company_id := COALESCE(
        p_company_id,
        (SELECT raw_user_meta_data->>'active_company_id' FROM auth.users WHERE id = auth.uid())::UUID
    );

    RETURN jsonb_build_object(
        'tier', (SELECT subscription_tier FROM public.companies WHERE id = v_company_id),
        'seat_limit', (SELECT seat_limit FROM public.companies WHERE id = v_company_id),
        'seat_usage', (SELECT seat_usage FROM public.companies WHERE id = v_company_id),
        'available', (SELECT seat_limit - seat_usage FROM public.companies WHERE id = v_company_id),
        'status', (SELECT subscription_status FROM public.companies WHERE id = v_company_id),
        'expires_at', (SELECT subscription_expires_at FROM public.companies WHERE id = v_company_id)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
