-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  price_monthly numeric NOT NULL,
  price_yearly numeric NOT NULL,
  calculations_limit integer NOT NULL, -- Interpret as per-week in logic if needed, or update column name
  limit_period text DEFAULT 'monthly', -- 'weekly', 'monthly', 'unlimited'
  features jsonb NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS for plans
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read plans" ON public.subscription_plans FOR SELECT USING (true);

-- Seed Plans
INSERT INTO public.subscription_plans (name, display_name, price_monthly, price_yearly, calculations_limit, limit_period, features)
VALUES
  ('free', 'Free', 0, 0, 5, 'weekly', '["5 calculations per week", "Basic calculations", "Email support"]'),
  ('solo', 'Solo', 29, 290, 100, 'monthly', '["100 calculations per month", "Advanced calculations", "Priority support"]'),
  ('professional', 'Professional', 99, 990, -1, 'monthly', '["Unlimited calculations", "All features", "24/7 support"]');

-- Calculations Table (Replicating schema for Supabase)
CREATE TABLE IF NOT EXISTS public.calculations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  name text,
  notes text,
  parameters jsonb NOT NULL,
  results jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS for calculations
ALTER TABLE public.calculations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own calculations" ON public.calculations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own calculations" ON public.calculations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own calculations" ON public.calculations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own calculations" ON public.calculations FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_calculations_updated_at
BEFORE UPDATE ON public.calculations
FOR EACH ROW
EXECUTE PROCEDURE public.handle_updated_at();
