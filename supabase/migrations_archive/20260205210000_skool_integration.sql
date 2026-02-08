-- Migration: Skool Subscription Integration
-- Phase 5: Skool Integration
-- Requires: multi_company_core.sql to be applied first

BEGIN TRANSACTION;

-- ============================================================
-- STEP 1: Create skool_subscriptions table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.skool_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    skool_community_id TEXT NOT NULL,
    skool_community_name TEXT,
    subscription_status TEXT DEFAULT 'active',
    subscription_tier TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_skool_community UNIQUE (user_id, skool_community_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_skool_subs_user ON public.skool_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_skool_subs_community ON public.skool_subscriptions(skool_community_id);

-- ============================================================
-- STEP 2: Update companies table to track Skool community
-- ============================================================
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS skool_community_id TEXT,
ADD COLUMN IF NOT EXISTS skool_community_name TEXT;

-- ============================================================
-- STEP 3: Skool verification functions
-- ============================================================

-- verify_skool_subscription: Check if user has active Skool subscription
DROP FUNCTION IF EXISTS public.verify_skool_subscription(TEXT);
CREATE OR REPLACE FUNCTION public.verify_skool_subscription(p_skool_community_id TEXT DEFAULT NULL::TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_result BOOLEAN;
BEGIN
    -- If no community specified, check if user has ANY active subscription
    IF p_skool_community_id IS NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM public.skool_subscriptions ss
            WHERE ss.user_id = auth.uid()
            AND ss.subscription_status = 'active'
            AND (ss.expires_at IS NULL OR ss.expires_at > NOW())
        ) INTO v_result;
        RETURN v_result;
    END IF;
    
    -- Check specific community
    SELECT EXISTS (
        SELECT 1 FROM public.skool_subscriptions ss
        WHERE ss.user_id = auth.uid()
        AND ss.skool_community_id = p_skool_community_id
        AND ss.subscription_status = 'active'
        AND (ss.expires_at IS NULL OR ss.expires_at > NOW())
    ) INTO v_result;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- get_user_skool_subscriptions: Get all user's Skool subscriptions
DROP FUNCTION IF EXISTS public.get_user_skool_subscriptions();
CREATE OR REPLACE FUNCTION public.get_user_skool_subscriptions()
RETURNS TABLE (
    id UUID,
    skool_community_id TEXT,
    skool_community_name TEXT,
    subscription_status TEXT,
    subscription_tier TEXT,
    expires_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ss.id,
        ss.skool_community_id,
        ss.skool_community_name,
        ss.subscription_status,
        ss.subscription_tier,
        ss.expires_at
    FROM public.skool_subscriptions ss
    WHERE ss.user_id = auth.uid()
    ORDER BY ss.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- link_skool_subscription: Link a Skool subscription to user
DROP FUNCTION IF EXISTS public.link_skool_subscription(TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.link_skool_subscription(
    p_skool_community_id TEXT,
    p_skool_community_name TEXT DEFAULT NULL::TEXT,
    p_subscription_tier TEXT DEFAULT NULL::TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    -- Upsert subscription
    INSERT INTO public.skool_subscriptions (
        user_id, skool_community_id, skool_community_name, 
        subscription_status, subscription_tier, expires_at
    ) VALUES (
        auth.uid(), p_skool_community_id, p_skool_community_name,
        'active', p_subscription_tier, NOW() + INTERVAL '30 days'
    )
    ON CONFLICT (user_id, skool_community_id)
    DO UPDATE SET
        skool_community_name = COALESCE(p_skool_community_name, EXCLUDED.skool_community_name),
        subscription_status = 'active',
        subscription_tier = COALESCE(p_subscription_tier, EXCLUDED.subscription_tier),
        updated_at = NOW(),
        expires_at = NOW() + INTERVAL '30 days';
    
    SELECT jsonb_build_object(
        'success', TRUE,
        'community_id', p_skool_community_id,
        'community_name', p_skool_community_name
    ) INTO v_result;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STEP 4: Require Skool for company operations
-- ============================================================

-- check_company_requires_skool: Check if company requires Skool subscription
DROP FUNCTION IF EXISTS public.company_requires_skool(UUID);
CREATE OR REPLACE FUNCTION public.company_requires_skool(p_company_id UUID DEFAULT NULL::UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_requires BOOLEAN;
    v_community_id TEXT;
BEGIN
    v_community_id := COALESCE(
        p_company_id,
        (SELECT raw_user_meta_data->>'active_company_id' FROM auth.users WHERE id = auth.uid())::UUID
    )::TEXT;
    
    -- Check if any invite in company requires Skool
    SELECT EXISTS (
        SELECT 1 FROM public.invite_codes ic
        WHERE ic.company_id = v_community_id::UUID
        AND ic.skool_subscription_required = TRUE
        AND ic.expires_at > NOW()
        AND ic.current_uses < ic.max_uses
    ) INTO v_requires;
    
    RETURN v_requires;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- check_user_can_access_company: Comprehensive access check
DROP FUNCTION IF EXISTS public.check_user_can_access_company(UUID);
CREATE OR REPLACE FUNCTION public.check_user_can_access_company(p_company_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_has_access BOOLEAN := FALSE;
    v_reason TEXT := 'Access denied';
    v_requires_skool BOOLEAN := FALSE;
    v_has_skool BOOLEAN := FALSE;
    v_company_name TEXT;
BEGIN
    -- Check basic membership
    IF EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND company_id = p_company_id
    ) THEN
        v_has_access := TRUE;
        v_reason := 'Direct member';
    ELSIF EXISTS (
        SELECT 1 FROM public.companies
        WHERE user_id = auth.uid() AND id = p_company_id
    ) THEN
        v_has_access := TRUE;
        v_reason := 'Company owner';
    END IF;
    
    -- Check if company requires Skool
    SELECT c.skool_community_id, c.name
    INTO v_requires_skool, v_company_name
    FROM public.companies c
    WHERE c.id = p_company_id;
    
    IF v_requires_skool IS NOT NULL AND v_requires_skool != '' THEN
        SELECT verify_skool_subscription(v_requires_skool) INTO v_has_skool;
        
        IF NOT v_has_skool THEN
            v_has_access := FALSE;
            v_reason := 'Active Skool subscription required for ' || v_company_name;
        ELSE
            v_reason := v_reason || ' + Skool verified';
        END IF;
    END IF;
    
    RETURN jsonb_build_object(
        'has_access', v_has_access,
        'reason', v_reason,
        'requires_skool', v_requires_skool IS NOT NULL AND v_requires_skool != '',
        'skool_verified', v_has_skool
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STEP 5: Updated RLS policies with Skool support
-- ============================================================

-- Jobs RLS with multi-company and Skool support
DROP POLICY IF EXISTS "RBAC: View Jobs Multi-Company" ON public.jobs;
CREATE POLICY "RBAC: View Jobs Multi-Company" ON public.jobs
    FOR SELECT USING (
        -- Check access via company
        EXISTS (
            SELECT 1 FROM public.check_user_can_access_company(jobs.company_id)
            WHERE (check_user_can_access_company(jobs.company_id)->>'has_access')::BOOLEAN = TRUE
        )
        OR
        -- Tech viewing assigned job
        jobs.technician_id = auth.uid()
        OR
        -- Client viewing own job
        jobs.client_id IN (
            SELECT client_id FROM public.user_roles
            WHERE user_id = auth.uid()
        )
    );

-- Update similar policies for other tables
-- (clients, invoices, etc.)

COMMIT;
