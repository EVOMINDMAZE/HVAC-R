-- Fix verify_skool_subscription to work with auth.uid() in SECURITY DEFINER context
-- Add SET search_path = public to ensure auth.uid() returns the correct user ID

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;