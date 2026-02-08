-- Add n8n_config and subscription_status to companies table

ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS n8n_config JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'past_due', 'canceled', 'trialing', 'provisioning'));

-- Comment on columns
COMMENT ON COLUMN public.companies.n8n_config IS 'Stores the member''s private n8n instance details (url, webhook_secret)';
COMMENT ON COLUMN public.companies.subscription_status IS 'Tracks the Business-in-a-Box subscription status';
