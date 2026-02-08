
-- Migration: Fix RPC bugs discovered during browser simulation testing
-- 1. Fix Enum comparison errors in permission checks (removing 'owner' from Enum lists)
-- 2. Fix Text-to-Enum casting in INSERT statements
-- 3. Add proper ownership checks using the companies table

BEGIN TRANSACTION;

-- ============================================================
-- FIX 1: create_invite_code
-- Problem: 'owner' is not a valid user_role Enum value
-- ============================================================
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
    -- Check if user has permission (Admin/Manager in roles OR Owner in companies table)
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
-- FIX 2: update_company_settings
-- Problem: 'owner' is not a valid user_role Enum value
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_company_settings(
    p_company_id UUID,
    p_settings JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_settings JSONB;
BEGIN
    -- Check permission (Admin in roles OR Owner in companies table)
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND company_id = p_company_id
        AND role = 'admin'
    ) AND NOT EXISTS (
        SELECT 1 FROM public.companies
        WHERE id = p_company_id
        AND user_id = auth.uid()
    ) THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'No permission');
    END IF;

    -- Upsert settings
    INSERT INTO public.company_settings (
        company_id,
        theme,
        primary_color,
        email_notifications,
        job_created_notifications,
        job_completed_notifications,
        invite_sent_notifications,
        default_role,
        auto_assign_jobs,
        require_approval_for_jobs,
        timezone,
        date_format,
        currency,
        enable_client_portal,
        enable_dispatch_board,
        enable_inventory,
        updated_at
    )
    VALUES (
        p_company_id,
        COALESCE((p_settings->>'theme')::TEXT, 'system'),
        COALESCE(p_settings->>'primary_color', '#3b82f6'),
        COALESCE((p_settings->>'email_notifications')::BOOLEAN, TRUE),
        COALESCE((p_settings->>'job_created_notifications')::BOOLEAN, TRUE),
        COALESCE((p_settings->>'job_completed_notifications')::BOOLEAN, TRUE),
        COALESCE((p_settings->>'invite_sent_notifications')::BOOLEAN, TRUE),
        COALESCE((p_settings->>'default_role')::TEXT, 'tech'),
        COALESCE((p_settings->>'auto_assign_jobs')::BOOLEAN, FALSE),
        COALESCE((p_settings->>'require_approval_for_jobs')::BOOLEAN, FALSE),
        COALESCE(p_settings->>'timezone', 'America/New_York'),
        COALESCE(p_settings->>'date_format', 'MM/dd/yyyy'),
        COALESCE(p_settings->>'currency', 'USD'),
        COALESCE((p_settings->>'enable_client_portal')::BOOLEAN, TRUE),
        COALESCE((p_settings->>'enable_dispatch_board')::BOOLEAN, TRUE),
        COALESCE((p_settings->>'enable_inventory')::BOOLEAN, FALSE),
        NOW()
    )
    ON CONFLICT (company_id)
    DO UPDATE SET
        theme = COALESCE(EXCLUDED.theme, company_settings.theme),
        primary_color = COALESCE(EXCLUDED.primary_color, company_settings.primary_color),
        email_notifications = COALESCE(EXCLUDED.email_notifications, company_settings.email_notifications),
        job_created_notifications = COALESCE(EXCLUDED.job_created_notifications, company_settings.job_created_notifications),
        job_completed_notifications = COALESCE(EXCLUDED.job_completed_notifications, company_settings.job_completed_notifications),
        invite_sent_notifications = COALESCE(EXCLUDED.invite_sent_notifications, company_settings.invite_sent_notifications),
        default_role = COALESCE(EXCLUDED.default_role, company_settings.default_role),
        auto_assign_jobs = COALESCE(EXCLUDED.auto_assign_jobs, company_settings.auto_assign_jobs),
        require_approval_for_jobs = COALESCE(EXCLUDED.require_approval_for_jobs, company_settings.require_approval_for_jobs),
        timezone = COALESCE(EXCLUDED.timezone, company_settings.timezone),
        date_format = COALESCE(EXCLUDED.date_format, company_settings.date_format),
        currency = COALESCE(EXCLUDED.currency, company_settings.currency),
        enable_client_portal = COALESCE(EXCLUDED.enable_client_portal, company_settings.enable_client_portal),
        enable_dispatch_board = COALESCE(EXCLUDED.enable_dispatch_board, company_settings.enable_dispatch_board),
        enable_inventory = COALESCE(EXCLUDED.enable_inventory, company_settings.enable_inventory),
        updated_at = NOW();

    -- Log the change
    PERFORM public.log_audit_event(
        'settings_changed',
        p_company_id,
        auth.uid(),
        'company_settings',
        p_company_id,
        p_settings
    );

    SELECT to_jsonb(cs) INTO v_settings
    FROM public.company_settings cs
    WHERE cs.company_id = p_company_id;

    RETURN jsonb_build_object('success', TRUE, 'settings', v_settings);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FIX 3: use_invite_code
-- Problem: Explicit casting needed for user_role Enum
-- ============================================================
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
        (v_validation->>'role')::public.user_role -- Explicit cast here
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

COMMIT;
