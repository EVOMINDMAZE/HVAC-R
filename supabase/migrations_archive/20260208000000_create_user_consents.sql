-- Create user consents table for tracking privacy consent and preferences
CREATE TABLE IF NOT EXISTS public.user_consents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    consent_type TEXT NOT NULL CHECK (consent_type IN (
        'privacy_policy',
        'marketing_emails',
        'analytics_tracking',
        'essential_cookies',
        'functional_cookies',
        'performance_cookies',
        'advertising_cookies'
    )),
    consent_version TEXT NOT NULL, -- e.g., 'v1.0', '2026-02-08'
    granted BOOLEAN NOT NULL DEFAULT false,
    granted_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    
    -- Each user should have only one record per consent_type and version
    UNIQUE(user_id, consent_type, consent_version)
);

-- Enable Row Level Security
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

-- Policies: Users can view their own consents
CREATE POLICY "Users can view their own consents"
    ON public.user_consents
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policies: Users can insert their own consents
CREATE POLICY "Users can insert their own consents"
    ON public.user_consents
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policies: Users can update their own consents
CREATE POLICY "Users can update their own consents"
    ON public.user_consents
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policies: Users can delete their own consents
CREATE POLICY "Users can delete their own consents"
    ON public.user_consents
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON public.user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_type_version ON public.user_consents(consent_type, consent_version);

-- Add updated_at trigger
CREATE TRIGGER handle_user_consents_updated_at
    BEFORE UPDATE ON public.user_consents
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();

-- Create a function to record consent (simplifies backend calls)
CREATE OR REPLACE FUNCTION public.record_consent(
    p_user_id UUID,
    p_consent_type TEXT,
    p_consent_version TEXT,
    p_granted BOOLEAN,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_consent_id UUID;
BEGIN
    INSERT INTO public.user_consents (
        user_id,
        consent_type,
        consent_version,
        granted,
        granted_at,
        ip_address,
        user_agent
    )
    VALUES (
        p_user_id,
        p_consent_type,
        p_consent_version,
        p_granted,
        CASE WHEN p_granted THEN NOW() ELSE NULL END,
        p_ip_address,
        p_user_agent
    )
    ON CONFLICT (user_id, consent_type, consent_version)
    DO UPDATE SET
        granted = EXCLUDED.granted,
        granted_at = CASE WHEN EXCLUDED.granted THEN NOW() ELSE NULL END,
        ip_address = EXCLUDED.ip_address,
        user_agent = EXCLUDED.user_agent,
        updated_at = NOW()
    RETURNING id INTO v_consent_id;
    
    RETURN v_consent_id;
END;
$$;

-- Create a function to get user's consent status
CREATE OR REPLACE FUNCTION public.get_user_consents(p_user_id UUID)
RETURNS TABLE (
    consent_type TEXT,
    consent_version TEXT,
    granted BOOLEAN,
    granted_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        consent_type,
        consent_version,
        granted,
        granted_at
    FROM public.user_consents
    WHERE user_id = p_user_id
    ORDER BY consent_type, consent_version DESC;
$$;

-- Create a function to check if user has granted a specific consent
CREATE OR REPLACE FUNCTION public.has_consent(
    p_user_id UUID,
    p_consent_type TEXT,
    p_consent_version TEXT DEFAULT 'latest'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_granted BOOLEAN;
BEGIN
    IF p_consent_version = 'latest' THEN
        SELECT granted INTO v_granted
        FROM public.user_consents
        WHERE user_id = p_user_id
          AND consent_type = p_consent_type
        ORDER BY consent_version DESC
        LIMIT 1;
    ELSE
        SELECT granted INTO v_granted
        FROM public.user_consents
        WHERE user_id = p_user_id
          AND consent_type = p_consent_type
          AND consent_version = p_consent_version;
    END IF;
    
    RETURN COALESCE(v_granted, false);
END;
$$;