-- Migration: Company settings table and functions
-- Phase 4.5: Company Settings

BEGIN TRANSACTION;

-- ============================================================
-- STEP 1: Create company_settings table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.company_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL UNIQUE,
    
    -- Theme settings
    theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    primary_color TEXT DEFAULT '#3b82f6',
    
    -- Notification preferences
    email_notifications BOOLEAN DEFAULT TRUE,
    job_created_notifications BOOLEAN DEFAULT TRUE,
    job_completed_notifications BOOLEAN DEFAULT TRUE,
    invite_sent_notifications BOOLEAN DEFAULT TRUE,
    
    -- Business settings
    default_role TEXT DEFAULT 'tech' CHECK (default_role IN ('tech', 'manager', 'admin')),
    auto_assign_jobs BOOLEAN DEFAULT FALSE,
    require_approval_for_jobs BOOLEAN DEFAULT FALSE,
    
    -- Regional settings
    timezone TEXT DEFAULT 'America/New_York',
    date_format TEXT DEFAULT 'MM/dd/yyyy',
    currency TEXT DEFAULT 'USD',
    
    -- Feature flags
    enable_client_portal BOOLEAN DEFAULT TRUE,
    enable_dispatch_board BOOLEAN DEFAULT TRUE,
    enable_inventory BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STEP 2: Create settings functions
-- ============================================================

-- Get company settings
DROP FUNCTION IF EXISTS public.get_company_settings(UUID);
CREATE OR REPLACE FUNCTION public.get_company_settings(p_company_id UUID DEFAULT NULL::UUID)
RETURNS JSONB AS $$
DECLARE
    v_company_id UUID;
    v_settings JSONB;
BEGIN
    v_company_id := COALESCE(
        p_company_id,
        (SELECT raw_user_meta_data->>'active_company_id' FROM auth.users WHERE id = auth.uid())::UUID
    );

    SELECT to_jsonb(cs) INTO v_settings
    FROM public.company_settings cs
    WHERE cs.company_id = v_company_id;

    IF v_settings IS NULL THEN
        -- Return default settings
        RETURN jsonb_build_object(
            'theme', 'system',
            'primary_color', '#3b82f6',
            'email_notifications', TRUE,
            'job_created_notifications', TRUE,
            'job_completed_notifications', TRUE,
            'invite_sent_notifications', TRUE,
            'default_role', 'tech',
            'auto_assign_jobs', FALSE,
            'require_approval_for_jobs', FALSE,
            'timezone', 'America/New_York',
            'date_format', 'MM/dd/yyyy',
            'currency', 'USD',
            'enable_client_portal', TRUE,
            'enable_dispatch_board', TRUE,
            'enable_inventory', FALSE,
            'company_id', v_company_id
        );
    END IF;

    RETURN v_settings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Upsert company settings
DROP FUNCTION IF EXISTS public.update_company_settings(UUID, JSONB);
CREATE OR REPLACE FUNCTION public.update_company_settings(
    p_company_id UUID,
    p_settings JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_settings JSONB;
BEGIN
    -- Check permission
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND company_id = p_company_id
        AND role IN ('admin', 'owner')
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
-- STEP 3: RLS for company_settings
-- ============================================================
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage settings" ON public.company_settings;
CREATE POLICY "Admins can manage settings" ON public.company_settings
    FOR ALL
    TO authenticated
    USING (
        company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND company_id = company_settings.company_id
            AND role IN ('admin')
        )
    );

-- ============================================================
-- STEP 4: Create settings trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_company_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_company_settings_updated ON public.company_settings;
CREATE TRIGGER trigger_company_settings_updated
    BEFORE UPDATE ON public.company_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_company_settings_timestamp();

COMMIT;
