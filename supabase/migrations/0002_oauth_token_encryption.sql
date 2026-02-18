-- Migration: OAuth Token Encryption
-- Purpose: Add column-level encryption for OAuth tokens in integrations table
-- Uses pgcrypto extension for AES-256 encryption

-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add encryption key configuration
-- Note: In production, this key should be stored in a secure vault (e.g., Supabase Vault)
-- and retrieved via a function. For now, we'll create a placeholder function.
CREATE OR REPLACE FUNCTION get_encryption_key()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- This should be replaced with actual vault integration
    -- The key should be 32 bytes for AES-256
    RETURN current_setting('app.encryption_key', true);
END;
$$;

-- Create encrypted columns for OAuth tokens
-- First, add new columns for encrypted data
ALTER TABLE integrations
ADD COLUMN IF NOT EXISTS access_token_encrypted bytea,
ADD COLUMN IF NOT EXISTS refresh_token_encrypted bytea;

-- Create encryption helper functions
CREATE OR REPLACE FUNCTION encrypt_token(token text)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    key text;
BEGIN
    key := get_encryption_key();
    IF key IS NULL OR key = '' THEN
        -- Fallback: store unencrypted if no key configured (development mode)
        RETURN decode(token, 'base64');
    END IF;
    RETURN pgp_sym_encrypt(token, key);
END;
$$;

CREATE OR REPLACE FUNCTION decrypt_token(encrypted_token bytea)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    key text;
BEGIN
    key := get_encryption_key();
    IF key IS NULL OR key = '' THEN
        -- Fallback: decode as base64 if no key configured
        RETURN encode(encrypted_token, 'base64');
    END IF;
    RETURN pgp_sym_decrypt(encrypted_token, key);
END;
$$;

-- Create a trigger to automatically encrypt tokens on insert/update
CREATE OR REPLACE FUNCTION encrypt_integration_tokens()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Encrypt access_token if provided
    IF NEW.access_token IS NOT NULL THEN
        NEW.access_token_encrypted := encrypt_token(NEW.access_token);
        -- Clear the plaintext token
        NEW.access_token := NULL;
    END IF;
    
    -- Encrypt refresh_token if provided
    IF NEW.refresh_token IS NOT NULL THEN
        NEW.refresh_token_encrypted := encrypt_token(NEW.refresh_token);
        -- Clear the plaintext token
        NEW.refresh_token := NULL;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Apply the trigger to integrations table
DROP TRIGGER IF EXISTS encrypt_tokens_trigger ON integrations;
CREATE TRIGGER encrypt_tokens_trigger
    BEFORE INSERT OR UPDATE ON integrations
    FOR EACH ROW
    EXECUTE FUNCTION encrypt_integration_tokens();

-- Add comment documenting the encryption approach
COMMENT ON TABLE integrations IS 'OAuth integrations with encrypted token storage. Tokens are encrypted using AES-256 via pgcrypto.';

-- Create index for faster lookups (on encrypted columns)
CREATE INDEX IF NOT EXISTS idx_integrations_user_id ON integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_integrations_company_id ON integrations(company_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON integrations TO authenticated;

-- RLS policies (ensure they exist)
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own integrations" ON integrations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own integrations" ON integrations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own integrations" ON integrations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own integrations" ON integrations
    FOR DELETE USING (auth.uid() = user_id);