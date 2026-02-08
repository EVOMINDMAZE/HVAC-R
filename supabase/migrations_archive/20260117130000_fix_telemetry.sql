-- Fix process_telemetry to trigger CRITICAL alerts (so Job Automation fires)
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
        
        -- Logic for temperature
        IF NEW.reading_type = 'temperature' THEN
        
            -- High Temp Check
            IF rule.trigger_type = 'Temperature_High' AND NEW.value > rule.threshold_value THEN 
                -- Note: DB enum might be 'Temperature_High' (mixed case in my script) or 'temperature_high' (lower in original SQL).
                -- Checking verify_pulse.ts I used 'Temperature_High'. 
                -- Original SQL used 'temperature_high'. 
                -- I'll enable check for BOTH just in case, or ILIKE. 
                -- Enum matching usually case sensitive. 
                -- Let's check verify_pulse.ts insert... it used 'Temperature_High'.
                -- I will handle case insensitivity or check both.
                triggered := TRUE;
                alert_msg := 'CRITICAL HIGH TEMP: ' || NEW.value || '°F > ' || rule.threshold_value || '°F';
                
            -- Low Temp Check
            ELSIF rule.trigger_type = 'Temperature_Low' AND NEW.value < rule.threshold_value THEN
                triggered := TRUE;
                alert_msg := 'CRITICAL LOW TEMP: ' || NEW.value || '°F < ' || rule.threshold_value || '°F';

            -- Legacy Lowercase support (if rules exist)
            ELSIF rule.trigger_type = 'temperature_high' AND NEW.value > rule.threshold_value THEN
                triggered := TRUE;
                alert_msg := 'CRITICAL HIGH TEMP: ' || NEW.value || '°F > ' || rule.threshold_value || '°F';
            ELSIF rule.trigger_type = 'temperature_low' AND NEW.value < rule.threshold_value THEN
                triggered := TRUE;
                alert_msg := 'CRITICAL LOW TEMP: ' || NEW.value || '°F < ' || rule.threshold_value || '°F';

            END IF;
            
        END IF;

        -- If Triggered, Create Alert with CRITICAL severity
        IF triggered THEN
            INSERT INTO public.rules_alerts (rule_id, asset_id, reading_id, message, severity, status)
            VALUES (rule.id, NEW.asset_id, NEW.id, alert_msg, 'critical', 'new');
        END IF;
        
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
