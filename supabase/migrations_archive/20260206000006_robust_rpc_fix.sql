
-- Migration: Robust RPC fixes for Cloud environment
-- Fixes JSON parsing and null constraint issues in Invite system

BEGIN TRANSACTION;

-- 1. Fix create_invite_code
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
    v_can_add BOOLEAN;
BEGIN
    -- Permission Check
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND company_id = p_company_id
        AND role IN ('admin', 'manager')
    ) AND NOT EXISTS (
        SELECT 1 FROM public.companies
        WHERE id = p_company_id
        AND user_id = auth.uid()
    ) THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'No permission');
    END IF;

    -- Seat Limit Check (Direct Assignment)
    v_seat_check := public.check_seat_limit(p_company_id);
    v_can_add := COALESCE((v_seat_check->>'can_add')::BOOLEAN, FALSE);

    IF NOT v_can_add THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'Seat limit reached',
            'details', v_seat_check
        );
    END IF;

    -- Generate Unique Code
    LOOP
        v_code := encode(gen_random_bytes(8), 'hex');
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.invite_codes WHERE code = v_code);
    END LOOP;

    -- Insert with explicit handling
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
        'role', p_role,
        'company_id', p_company_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fix use_invite_code
CREATE OR REPLACE FUNCTION public.use_invite_code(p_code TEXT)
RETURNS JSONB AS $$
DECLARE
    v_validation JSONB;
    v_result JSONB;
    v_role_text TEXT;
    v_company_id UUID;
BEGIN
    -- Validate (Direct Assignment)
    v_validation := public.validate_invite_code(p_code);

    IF COALESCE((v_validation->>'valid')::BOOLEAN, FALSE) != TRUE THEN
        RETURN v_validation;
    END IF;

    v_role_text := v_validation->>'role';
    v_company_id := (v_validation->>'company_id')::UUID;

    IF v_role_text IS NULL OR v_company_id IS NULL THEN
        RETURN jsonb_build_object('valid', FALSE, 'error', 'Malformed invite data');
    END IF;

    -- Prevent duplicates
    IF EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND company_id = v_company_id
    ) THEN
        RETURN jsonb_build_object('valid', FALSE, 'error', 'Already a member');
    END IF;

    -- Insert with explicit casting
    INSERT INTO public.user_roles (user_id, company_id, role)
    VALUES (
        auth.uid(),
        v_company_id,
        v_role_text::public.user_role
    );

    -- Update usage
    UPDATE public.invite_codes
    SET current_uses = current_uses + 1
    WHERE code = p_code;

    -- Switch context
    v_result := public.switch_company_context(v_company_id);

    RETURN jsonb_build_object('valid', TRUE, 'joined_company', v_result);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
