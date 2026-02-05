-- Create AI Learning Patterns Table
CREATE TABLE IF NOT EXISTS public.ai_learning_patterns (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    pattern_type text NOT NULL CHECK (pattern_type IN ('symptom_outcome', 'equipment_failure', 'measurement_anomaly', 'seasonal_pattern')),
    pattern_data jsonb NOT NULL,
    confidence_score integer CHECK (confidence_score >= 0 AND confidence_score <= 100),
    occurrence_count integer DEFAULT 1,
    last_seen timestamptz DEFAULT now(),
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
    equipment_model text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create Diagnostic Outcomes Table
CREATE TABLE IF NOT EXISTS public.diagnostic_outcomes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    troubleshooting_session_id uuid REFERENCES public.calculations(id) ON DELETE CASCADE,
    ai_recommendations jsonb NOT NULL,
    technician_actions jsonb,
    final_resolution jsonb,
    success_rating integer CHECK (success_rating >= 1 AND success_rating <= 5),
    followup_required boolean DEFAULT false,
    notes text,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now()
);

-- Add session_context and learning_version to calculations table
ALTER TABLE public.calculations 
ADD COLUMN IF NOT EXISTS session_context jsonb,
ADD COLUMN IF NOT EXISTS learning_version integer DEFAULT 1;

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_ai_learning_patterns_type ON public.ai_learning_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_ai_learning_patterns_company ON public.ai_learning_patterns(company_id);
CREATE INDEX IF NOT EXISTS idx_ai_learning_patterns_model ON public.ai_learning_patterns(equipment_model);
CREATE INDEX IF NOT EXISTS idx_ai_learning_patterns_last_seen ON public.ai_learning_patterns(last_seen);
CREATE INDEX IF NOT EXISTS idx_diagnostic_outcomes_session ON public.diagnostic_outcomes(troubleshooting_session_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_outcomes_company ON public.diagnostic_outcomes(company_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_outcomes_success ON public.diagnostic_outcomes(success_rating);

-- Enable RLS
ALTER TABLE public.ai_learning_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostic_outcomes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for AI Learning Patterns
CREATE POLICY "Company can view own patterns" ON public.ai_learning_patterns 
    FOR SELECT USING (company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid()));

CREATE POLICY "Company can insert own patterns" ON public.ai_learning_patterns 
    FOR INSERT WITH CHECK (company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid()));

CREATE POLICY "Company can update own patterns" ON public.ai_learning_patterns 
    FOR UPDATE USING (company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid()));

CREATE POLICY "Service Role full access patterns" ON public.ai_learning_patterns 
    FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- RLS Policies for Diagnostic Outcomes
CREATE POLICY "Company can view own outcomes" ON public.diagnostic_outcomes 
    FOR SELECT USING (company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid()));

CREATE POLICY "Company can insert own outcomes" ON public.diagnostic_outcomes 
    FOR INSERT WITH CHECK (company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid()));

CREATE POLICY "Company can update own outcomes" ON public.diagnostic_outcomes 
    FOR UPDATE USING (company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid()));

CREATE POLICY "Service Role full access outcomes" ON public.diagnostic_outcomes 
    FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Trigger for updated_at on ai_learning_patterns
CREATE TRIGGER handle_ai_learning_patterns_updated_at
    BEFORE UPDATE ON public.ai_learning_patterns
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();

-- Function to update pattern occurrence
CREATE OR REPLACE FUNCTION public.update_pattern_occurrence(
    p_pattern_type text,
    p_pattern_data jsonb,
    p_company_id uuid,
    p_equipment_model text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    pattern_id uuid;
BEGIN
    -- Try to find existing pattern
    SELECT id INTO pattern_id 
    FROM public.ai_learning_patterns 
    WHERE pattern_type = p_pattern_type 
      AND pattern_data @> p_pattern_data
      AND company_id = p_company_id
      AND COALESCE(equipment_model = p_equipment_model, true);
    
    IF pattern_id IS NOT NULL THEN
        -- Update existing pattern
        UPDATE public.ai_learning_patterns 
        SET 
            occurrence_count = occurrence_count + 1,
            confidence_score = LEAST(confidence_score + 5, 100),
            last_seen = now()
        WHERE id = pattern_id;
    ELSE
        -- Create new pattern
        INSERT INTO public.ai_learning_patterns (pattern_type, pattern_data, company_id, equipment_model, confidence_score)
        VALUES (p_pattern_type, p_pattern_data, p_company_id, p_equipment_model, 50)
        RETURNING id INTO pattern_id;
    END IF;
    
    RETURN pattern_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get related patterns for troubleshooting
CREATE OR REPLACE FUNCTION public.get_related_patterns(
    p_company_id uuid,
    p_symptoms text[],
    p_equipment_model text DEFAULT NULL
)
RETURNS TABLE (
    pattern_id uuid,
    pattern_type text,
    pattern_data jsonb,
    confidence_score integer,
    occurrence_count integer,
    relevance_score numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.pattern_type,
        p.pattern_data,
        p.confidence_score,
        p.occurrence_count,
        -- Calculate relevance score based on symptom overlap and recency
        (
            (p.confidence_score::numeric / 100.0 * 0.4) +
            (LEAST(p.occurrence_count::numeric, 20) / 20.0 * 0.3) +
            (EXTRACT(EPOCH FROM (now() - p.last_seen)) / (30 * 24 * 3600.0) * -0.3) -- More recent = higher score
        )::numeric as relevance_score
    FROM public.ai_learning_patterns p
    WHERE p.company_id = p_company_id
      AND COALESCE(p.equipment_model = p_equipment_model, true)
      AND (
        -- Match symptom patterns
        p.pattern_type = 'symptom_outcome' 
        AND p.pattern_data ? 'symptoms'
        AND p.pattern_data->'symptoms' ?| p_symptoms
        OR
        -- Match equipment failure patterns
        p.pattern_type = 'equipment_failure'
        AND COALESCE(p.equipment_model = p_equipment_model, true)
        OR
        -- Match measurement anomalies
        p.pattern_type = 'measurement_anomaly'
      )
    ORDER BY relevance_score DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;