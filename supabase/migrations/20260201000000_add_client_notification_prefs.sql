-- Add notification_preferences column to clients table
-- This allows per-client control of SMS and Email notifications

ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "sms_enabled": true,
  "email_enabled": true
}'::jsonb;

-- Add index for faster JSON queries
CREATE INDEX IF NOT EXISTS idx_clients_notification_prefs 
ON public.clients USING GIN (notification_preferences);

-- Add comment for documentation
COMMENT ON COLUMN public.clients.notification_preferences IS 
'Per-client notification preferences. Structure: { "sms_enabled": boolean, "email_enabled": boolean }';

-- Backfill existing clients with default preferences (all enabled)
UPDATE public.clients 
SET notification_preferences = '{
  "sms_enabled": true,
  "email_enabled": true
}'::jsonb
WHERE notification_preferences IS NULL;
