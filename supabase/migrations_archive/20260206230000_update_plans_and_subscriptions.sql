-- Update subscription plans to new tier structure (Free, Pro, Business)
-- and add plan column to subscriptions table for tier tracking

-- Update free plan to 10 calculations per month
UPDATE public.subscription_plans 
SET 
  calculations_limit = 10,
  limit_period = 'monthly',
  features = '["10 calculations per month", "Standard cycle analysis (basic parameters)", "Basic refrigerant comparison (2 refrigerants max)", "Compliance reference (read-only)", "Dashboard with usage tracking", "Email support", "1 saved project"]'
WHERE name = 'free';

-- Update solo plan to pro tier
UPDATE public.subscription_plans 
SET 
  name = 'pro',
  display_name = 'Pro',
  price_monthly = 49,
  price_yearly = 490,
  calculations_limit = -1,
  limit_period = 'monthly',
  features = '["Unlimited calculations", "All analysis tools (cascade, advanced cycles)", "Advanced refrigerant comparison (unlimited)", "PDF export & advanced reporting", "API access for integrations", "Priority email support", "10 saved projects", "Basic white-label (personal logo on reports)"]'
WHERE name = 'solo';

-- Update professional plan to business tier
UPDATE public.subscription_plans 
SET 
  name = 'business',
  display_name = 'Business',
  price_monthly = 199,
  price_yearly = 1990,
  calculations_limit = -1,
  limit_period = 'monthly',
  features = '["Everything in Pro", "Team collaboration (up to 5 users included)", "White-label branding (company logo, colors, domain)", "Client portal for customer access", "Automation engine (Review Hunter, Invoice Chaser)", "Advanced analytics & business dashboards", "Custom training sessions", "SLA guarantee", "Unlimited projects", "Dedicated support"]'
WHERE name = 'professional';

-- Add plan column to subscriptions table for easy tier lookup
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS plan text DEFAULT 'free';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS subscriptions_plan_idx ON public.subscriptions (plan);

-- Add comment explaining the column
COMMENT ON COLUMN public.subscriptions.plan IS 'Plan name (free, pro, business) derived from subscription_plans.name';

-- Create a function to automatically update plan when price_id changes
-- This uses pattern matching on price_id (since Stripe price IDs are opaque)
CREATE OR REPLACE FUNCTION public.update_subscription_plan()
RETURNS TRIGGER AS $$
BEGIN
  -- Map price_id to plan name based on common patterns
  -- This should be kept in sync with server-side mapping logic
  NEW.plan = CASE 
    WHEN NEW.price_id LIKE '%professional%' OR NEW.price_id LIKE '%solo%' THEN 'pro'
    WHEN NEW.price_id LIKE '%enterprise%' OR NEW.price_id LIKE '%business%' THEN 'business'
    ELSE 'free'
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set plan on insert/update
DROP TRIGGER IF EXISTS update_subscription_plan_trigger ON public.subscriptions;
CREATE TRIGGER update_subscription_plan_trigger
  BEFORE INSERT OR UPDATE OF price_id ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_subscription_plan();

-- Update existing subscriptions using the same logic
UPDATE public.subscriptions
SET plan = CASE 
  WHEN price_id LIKE '%professional%' OR price_id LIKE '%solo%' THEN 'pro'
  WHEN price_id LIKE '%enterprise%' OR price_id LIKE '%business%' THEN 'business'
  ELSE 'free'
END
WHERE plan IS NULL OR plan = '';