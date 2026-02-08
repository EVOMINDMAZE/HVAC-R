-- Create usage tracking table for tier-based feature limits
-- Tracks usage per user per company per feature per month

CREATE TABLE IF NOT EXISTS public.usage_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id TEXT REFERENCES public.companies(id) ON DELETE CASCADE,
  feature TEXT NOT NULL, -- e.g., 'calculation', 'export', 'api_call'
  period TEXT NOT NULL, -- YYYY-MM format for monthly tracking
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  PRIMARY KEY (id),
  UNIQUE (user_id, company_id, feature, period)
);

-- Enable RLS
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view their own usage"
  ON public.usage_tracking FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage all usage
CREATE POLICY "Service role can manage all usage"
  ON public.usage_tracking FOR ALL
  USING (auth.role() = 'service_role');

-- Create index for efficient lookups
CREATE INDEX usage_tracking_user_feature_period_idx 
  ON public.usage_tracking (user_id, feature, period);

CREATE INDEX usage_tracking_company_feature_period_idx 
  ON public.usage_tracking (company_id, feature, period);

-- Updated at trigger
CREATE TRIGGER handle_usage_tracking_updated_at
  BEFORE UPDATE ON public.usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to increment usage and check limit
CREATE OR REPLACE FUNCTION public.increment_usage(
  p_user_id UUID,
  p_company_id TEXT,
  p_feature TEXT,
  p_limit INTEGER DEFAULT NULL -- NULL means unlimited
)
RETURNS JSONB AS $$
DECLARE
  v_period TEXT;
  v_current_count INTEGER;
  v_new_count INTEGER;
  v_result JSONB;
BEGIN
  -- Get current period (YYYY-MM)
  v_period := to_char(CURRENT_DATE, 'YYYY-MM');
  
  -- Get or create usage record
  INSERT INTO public.usage_tracking (user_id, company_id, feature, period, count)
  VALUES (p_user_id, p_company_id, p_feature, v_period, 1)
  ON CONFLICT (user_id, company_id, feature, period) 
  DO UPDATE SET count = usage_tracking.count + 1
  RETURNING count INTO v_new_count;
  
  -- Check if limit is exceeded
  IF p_limit IS NOT NULL AND v_new_count > p_limit THEN
    v_result := jsonb_build_object(
      'success', FALSE,
      'limit_exceeded', TRUE,
      'current_count', v_new_count,
      'limit', p_limit,
      'period', v_period,
      'message', 'Usage limit exceeded for ' || p_feature || ' in period ' || v_period
    );
  ELSE
    v_result := jsonb_build_object(
      'success', TRUE,
      'current_count', v_new_count,
      'limit', p_limit,
      'period', v_period
    );
  END IF;
  
  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', FALSE, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current usage for a user/feature
CREATE OR REPLACE FUNCTION public.get_usage(
  p_user_id UUID,
  p_company_id TEXT,
  p_feature TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_period TEXT;
  v_record RECORD;
BEGIN
  v_period := to_char(CURRENT_DATE, 'YYYY-MM');
  
  SELECT count, period
  INTO v_record
  FROM public.usage_tracking
  WHERE user_id = p_user_id
    AND company_id = p_company_id
    AND feature = p_feature
    AND period = v_period;
  
  IF v_record.count IS NULL THEN
    RETURN jsonb_build_object(
      'current_count', 0,
      'limit', NULL,
      'period', v_period,
      'limit_exceeded', FALSE
    );
  ELSE
    RETURN jsonb_build_object(
      'current_count', v_record.count,
      'limit', NULL,
      'period', v_record.period,
      'limit_exceeded', FALSE
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', FALSE, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset usage for old periods (to be called by cron)
CREATE OR REPLACE FUNCTION public.cleanup_old_usage()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Delete records older than 3 months (keep some history)
  DELETE FROM public.usage_tracking
  WHERE period < to_char(CURRENT_DATE - INTERVAL '3 months', 'YYYY-MM');
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
EXCEPTION
  WHEN OTHERS THEN
    RETURN -1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a cron job to run monthly (requires pg_cron extension)
-- Note: This requires pg_cron extension to be enabled
-- SELECT cron.schedule('reset-usage-monthly', '0 0 1 * *', 'SELECT public.cleanup_old_usage()');