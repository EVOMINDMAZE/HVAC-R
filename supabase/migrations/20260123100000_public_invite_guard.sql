-- Create a "Public Guard" function to safely read invite metadata
-- This allows the landing page to validate an invite WITHOUT logging in.

CREATE OR REPLACE FUNCTION get_public_invite_info(invite_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with admin privileges to bypass RLS (Crucial!)
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'provider', provider,
        'status', status,
        'invited_email', invited_email, -- Show the user which email was invited
        'reply_to', (metadata->>'reply_to') -- Show who invited them (Instructor/Tech)
    )
    INTO result
    FROM public.integrations
    WHERE id = invite_id;

    IF result IS NULL THEN
        RETURN jsonb_build_object('error', 'Invite not found');
    END IF;

    RETURN result;
END;
$$;

-- Grant permission to anonymous users (so the public landing page can call it)
GRANT EXECUTE ON FUNCTION get_public_invite_info(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_public_invite_info(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_public_invite_info(UUID) TO service_role;
