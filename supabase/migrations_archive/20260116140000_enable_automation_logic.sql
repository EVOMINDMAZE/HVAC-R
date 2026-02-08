-- Create Alerts Table (History of triggered rules)
CREATE TABLE IF NOT EXISTS public.rules_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rule_id UUID REFERENCES public.automation_rules(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE NOT NULL,
    reading_id UUID REFERENCES public.telemetry_readings(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    severity TEXT DEFAULT 'info', -- 'info', 'warning', 'critical'
    status TEXT DEFAULT 'new', -- 'new', 'viewed', 'resolved'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Alerts
ALTER TABLE public.rules_alerts ENABLE ROW LEVEL SECURITY;

-- Alerts Policy: Users can view alerts for their company's assets
CREATE POLICY "Users can view their alerts" ON public.rules_alerts
    FOR SELECT USING (asset_id IN (
        SELECT id FROM public.assets WHERE client_id IN (
            SELECT id FROM public.clients WHERE company_id IN (
                SELECT id FROM public.companies WHERE user_id = auth.uid()
            )
        )
    ));

CREATE POLICY "Users can update their alerts" ON public.rules_alerts
    FOR UPDATE USING (asset_id IN (
        SELECT id FROM public.assets WHERE client_id IN (
            SELECT id FROM public.clients WHERE company_id IN (
                SELECT id FROM public.companies WHERE user_id = auth.uid()
            )
        )
    ));

-- Function to Process Telemetry and Check Rules
CREATE OR REPLACE FUNCTION public.process_telemetry()
RETURNS TRIGGER AS $$
DECLARE
    rule RECORD;
    triggered BOOLEAN;
    alert_msg TEXT;
BEGIN
    -- Loop through active rules for this asset
    FOR rule IN 
        SELECT * FROM public.automation_rules 
        WHERE asset_id = NEW.asset_id 
        AND is_active = true
    LOOP
        triggered := FALSE;
        
        -- Check Logic based on trigger_type
        -- Note: We currently only support 'temperature' readings for these rules
        IF NEW.reading_type = 'temperature' THEN
        
            -- High Temp Check
            IF rule.trigger_type = 'temperature_high' AND NEW.value > rule.threshold_value THEN
                triggered := TRUE;
                alert_msg := 'Temperature High Alert: ' || NEW.value || '°F (Threshold: ' || rule.threshold_value || '°F)';
                
            -- Low Temp Check
            ELSIF rule.trigger_type = 'temperature_low' AND NEW.value < rule.threshold_value THEN
                triggered := TRUE;
                alert_msg := 'Temperature Low Alert: ' || NEW.value || '°F (Threshold: ' || rule.threshold_value || '°F)';
            END IF;
            
        END IF;

        -- If Triggered, Create Alert
        IF triggered THEN
            INSERT INTO public.rules_alerts (rule_id, asset_id, reading_id, message, severity, status)
            VALUES (rule.id, NEW.asset_id, NEW.id, alert_msg, 'mod', 'new');
            
            -- FUTURE: Call n8n Webhook here via pg_net
            -- PERFORM net.http_post(
            --     url := 'https://n8n.thermoneural.com/webhook/...',
            --     body := jsonb_build_object('alert', alert_msg, 'asset', NEW.asset_id)
            -- );
        END IF;
        
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 
-- SECURITY DEFINER allows the function to access rules even if the inserter (e.g. service key) technically doesn't own them, 
-- though for Service Role it doesn't matter. It ensures consistency.

-- Create Trigger
DROP TRIGGER IF EXISTS trigger_process_telemetry ON public.telemetry_readings;
CREATE TRIGGER trigger_process_telemetry
    AFTER INSERT ON public.telemetry_readings
    FOR EACH ROW
    EXECUTE FUNCTION public.process_telemetry();
