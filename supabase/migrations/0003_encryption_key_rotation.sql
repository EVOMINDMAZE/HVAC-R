-- Migration: Encryption Key Rotation Policy
-- Purpose: Implement key rotation for OAuth token encryption
-- Provides secure key management with versioning and rotation capabilities

-- Create table for encryption key versions
CREATE TABLE IF NOT EXISTS encryption_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_version INTEGER NOT NULL UNIQUE,
    key_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    rotated_by UUID REFERENCES auth.users(id),
    rotation_reason TEXT
);

-- Create table for key rotation audit log
CREATE TABLE IF NOT EXISTS key_rotation_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    old_key_version INTEGER NOT NULL,
    new_key_version INTEGER NOT NULL,
    rotated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    rotated_by UUID REFERENCES auth.users(id),
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'partial')),
    tokens_re_encrypted INTEGER DEFAULT 0,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_encryption_keys_version ON encryption_keys(key_version);
CREATE INDEX IF NOT EXISTS idx_encryption_keys_active ON encryption_keys(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_key_rotation_log_rotated_at ON key_rotation_log(rotated_at);

-- Function to get current active key version
CREATE OR REPLACE FUNCTION get_current_key_version()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_version INTEGER;
BEGIN
    SELECT key_version INTO v_version
    FROM encryption_keys
    WHERE is_active = true
    ORDER BY key_version DESC
    LIMIT 1;
    
    RETURN COALESCE(v_version, 0);
END;
$$;

-- Function to get encryption key for a specific version
CREATE OR REPLACE FUNCTION get_encryption_key_by_version(p_version INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_key_hash TEXT;
BEGIN
    SELECT key_hash INTO v_key_hash
    FROM encryption_keys
    WHERE key_version = p_version AND is_active = true;
    
    RETURN v_key_hash;
END;
$$;

-- Function to initiate key rotation
CREATE OR REPLACE FUNCTION initiate_key_rotation(
    p_new_key_hash TEXT,
    p_rotation_reason TEXT DEFAULT 'Scheduled rotation',
    p_rotated_by UUID DEFAULT auth.uid()
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_version INTEGER;
    v_old_version INTEGER;
    v_rotation_id UUID;
BEGIN
    -- Get current version
    v_old_version := get_current_key_version();
    v_new_version := v_old_version + 1;
    
    -- Insert new key
    INSERT INTO encryption_keys (
        key_version,
        key_hash,
        rotated_by,
        rotation_reason
    ) VALUES (
        v_new_version,
        p_new_key_hash,
        p_rotated_by,
        p_rotation_reason
    )
    RETURNING id INTO v_rotation_id;
    
    -- Log the rotation
    INSERT INTO key_rotation_log (
        old_key_version,
        new_key_version,
        rotated_by,
        status
    ) VALUES (
        v_old_version,
        v_new_version,
        p_rotated_by,
        'success'
    );
    
    -- Set expiration on old key (90 days grace period)
    UPDATE encryption_keys
    SET expires_at = NOW() + INTERVAL '90 days'
    WHERE key_version = v_old_version AND is_active = true;
    
    RETURN v_new_version;
END;
$$;

-- Function to re-encrypt tokens with new key
CREATE OR REPLACE FUNCTION re_encrypt_tokens_with_new_key(
    p_old_version INTEGER,
    p_new_version INTEGER,
    p_batch_size INTEGER DEFAULT 100
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_re_encrypted INTEGER := 0;
    v_token RECORD;
    v_old_key TEXT;
    v_new_key TEXT;
    v_decrypted_token TEXT;
BEGIN
    -- This is a placeholder for the actual re-encryption logic
    -- In production, this would:
    -- 1. Decrypt tokens with old key
    -- 2. Re-encrypt with new key
    -- 3. Update the token record with new key version
    
    -- For security, actual key material should be passed via secure parameters
    -- and not stored in the database
    
    RETURN v_re_encrypted;
END;
$$;

-- Function to cleanup expired keys
CREATE OR REPLACE FUNCTION cleanup_expired_keys()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    -- Only deactivate keys that have expired AND have been replaced
    UPDATE encryption_keys
    SET is_active = false
    WHERE expires_at < NOW()
    AND is_active = true
    AND key_version < (SELECT MAX(key_version) FROM encryption_keys WHERE is_active = true);
    
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    
    RETURN v_deleted;
END;
$$;

-- Create a cron job to cleanup expired keys (requires pg_cron extension)
-- Uncomment if pg_cron is available
-- SELECT cron.schedule('cleanup-expired-keys', '0 0 * * *', 'SELECT cleanup_expired_keys();');

-- Grant permissions
GRANT SELECT ON encryption_keys TO authenticated;
GRANT SELECT ON key_rotation_log TO authenticated;

-- RLS policies
ALTER TABLE encryption_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_rotation_log ENABLE ROW LEVEL SECURITY;

-- Only service role can manage keys
CREATE POLICY "Service role can manage encryption keys" ON encryption_keys
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Authenticated users can view rotation log" ON key_rotation_log
    FOR SELECT USING (auth.role() = 'authenticated');

-- Insert initial key (version 1) - this should be replaced with actual key
-- In production, the key should be generated externally and passed securely
INSERT INTO encryption_keys (key_version, key_hash, rotation_reason)
VALUES (1, 'PLACEHOLDER_KEY_HASH_REPLACE_IN_PRODUCTION', 'Initial key')
ON CONFLICT (key_version) DO NOTHING;

-- Add comment
COMMENT ON TABLE encryption_keys IS 'Encryption key versions for OAuth token encryption. Keys are versioned to support rotation without service interruption.';
COMMENT ON TABLE key_rotation_log IS 'Audit log for encryption key rotation events.';

-- Add key_version column to integrations table if not exists
ALTER TABLE integrations
ADD COLUMN IF NOT EXISTS key_version INTEGER DEFAULT 1;

-- Create index for key version lookups
CREATE INDEX IF NOT EXISTS idx_integrations_key_version ON integrations(key_version);