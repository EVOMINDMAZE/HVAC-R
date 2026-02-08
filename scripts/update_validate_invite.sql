-- Update validate_invite_code function to fix boolean string comparison
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