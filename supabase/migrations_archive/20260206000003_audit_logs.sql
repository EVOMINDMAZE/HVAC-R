-- Migration: Audit logging system
-- Phase 4.4: Audit Logging

BEGIN TRANSACTION;

-- ============================================================
-- STEP 1: Create audit_logs table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN (
        'company_created',
        'company_updated',
        'role_assigned',
        'role_changed',
        'role_removed',
        'invite_created',
        'invite_used',
        'invite_revoked',
        'company_switched',
        'subscription_upgraded',
        'subscription_downgraded',
        'settings_changed',
        'member_removed',
        'skool_linked',
        'skool_unlinked'
    )),
    entity_type TEXT,
    entity_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_company ON public.audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- ============================================================
-- STEP 2: Create audit logging function
-- ============================================================
DROP FUNCTION IF EXISTS public.log_audit_event(TEXT, UUID, UUID, TEXT, UUID, JSONB);
CREATE OR REPLACE FUNCTION public.log_audit_event(
    p_action TEXT,
    p_company_id UUID,
    p_user_id UUID DEFAULT NULL::UUID,
    p_entity_type TEXT DEFAULT NULL::TEXT,
    p_entity_id UUID DEFAULT NULL::UUID,
    p_details JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO public.audit_logs (
        company_id,
        user_id,
        action,
        entity_type,
        entity_id,
        details
    ) VALUES (
        p_company_id,
        COALESCE(p_user_id, auth.uid()),
        p_action,
        p_entity_type,
        p_entity_id,
        p_details
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STEP 3: Create trigger functions for automatic logging
-- ============================================================

-- Log when user_role is inserted (role assigned)
CREATE OR REPLACE FUNCTION audit_log_role_assigned()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.log_audit_event(
        'role_assigned',
        NEW.company_id,
        NEW.user_id,
        'user_role',
        NEW.user_id,
        jsonb_build_object(
            'role', NEW.role,
            'client_id', NEW.client_id
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_audit_role_assigned ON public.user_roles;
CREATE TRIGGER trigger_audit_role_assigned
    AFTER INSERT ON public.user_roles
    FOR EACH ROW EXECUTE FUNCTION audit_log_role_assigned();

-- Log when user_role is deleted (role removed)
CREATE OR REPLACE FUNCTION audit_log_role_removed()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.log_audit_event(
        'role_removed',
        OLD.company_id,
        OLD.user_id,
        'user_role',
        OLD.user_id,
        jsonb_build_object(
            'role', OLD.role
        )
    );
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_audit_role_removed ON public.user_roles;
CREATE TRIGGER trigger_audit_role_removed
    AFTER DELETE ON public.user_roles
    FOR EACH ROW EXECUTE FUNCTION audit_log_role_removed();

-- Log when user_role is updated (role changed)
CREATE OR REPLACE FUNCTION audit_log_role_changed()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.role != NEW.role THEN
        PERFORM public.log_audit_event(
            'role_changed',
            NEW.company_id,
            NEW.user_id,
            'user_role',
            NEW.user_id,
            jsonb_build_object(
                'old_role', OLD.role,
                'new_role', NEW.role
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_audit_role_changed ON public.user_roles;
CREATE TRIGGER trigger_audit_role_changed
    AFTER UPDATE ON public.user_roles
    FOR EACH ROW EXECUTE FUNCTION audit_log_role_changed();

-- ============================================================
-- STEP 4: Functions to query audit logs
-- ============================================================

-- Get audit logs for a company
DROP FUNCTION IF EXISTS public.get_company_audit_logs(UUID, INTEGER, INTEGER);
CREATE OR REPLACE FUNCTION public.get_company_audit_logs(
    p_company_id UUID DEFAULT NULL::UUID,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    action TEXT,
    entity_type TEXT,
    entity_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        al.id,
        al.user_id,
        al.action,
        al.entity_type,
        al.entity_id,
        al.details,
        al.created_at
    FROM public.audit_logs al
    WHERE al.company_id = COALESCE(p_company_id, al.company_id)
    ORDER BY al.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get recent activity for display
DROP FUNCTION IF EXISTS public.get_recent_activity(UUID, INTEGER);
CREATE OR REPLACE FUNCTION public.get_recent_activity(
    p_company_id UUID DEFAULT NULL::UUID,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    action TEXT,
    details JSONB,
    created_at TIMESTAMPTZ,
    user_email TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        al.id,
        al.action,
        al.details,
        al.created_at,
        au.email AS user_email
    FROM public.audit_logs al
    LEFT JOIN auth.users au ON au.id = al.user_id
    WHERE al.company_id = COALESCE(p_company_id, al.company_id)
    ORDER BY al.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STEP 5: Log invite creation automatically
-- ============================================================
DROP FUNCTION IF EXISTS public.log_invite_created();
CREATE OR REPLACE FUNCTION public.log_invite_created()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.log_audit_event(
        'invite_created',
        NEW.company_id,
        NEW.created_by,
        'invite_code',
        NEW.id,
        jsonb_build_object(
            'role', NEW.role,
            'expires_at', NEW.expires_at,
            'max_uses', NEW.max_uses,
            'skool_required', NEW.skool_subscription_required
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_audit_invite_created ON public.invite_codes;
CREATE TRIGGER trigger_audit_invite_created
    AFTER INSERT ON public.invite_codes
    FOR EACH ROW EXECUTE FUNCTION public.log_invite_created();

-- ============================================================
-- STEP 6: RLS for audit_logs (admin only)
-- ============================================================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
    FOR SELECT
    TO authenticated
    USING (
        company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND company_id = audit_logs.company_id
            AND role IN ('admin', 'manager')
        )
    );

COMMIT;
