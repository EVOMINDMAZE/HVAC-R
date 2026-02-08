CREATE OR REPLACE FUNCTION public.process_telemetry()
RETURNS TRIGGER AS $$
DECLARE
    rule RECORD;
    triggered BOOLEAN;
    alert_msg TEXT;
    
    -- Variables for Queue Insertion
    asset_owner_id UUID;
    client_phone TEXT;
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

        -- If Triggered, Create Alert AND Request Automation
        IF triggered THEN
            -- 1. Create Internal Alert Record
            INSERT INTO public.rules_alerts (rule_id, asset_id, reading_id, message, severity, status)
            VALUES (rule.id, NEW.asset_id, NEW.id, alert_msg, 'mod', 'new');
            
            -- 2. Fetch Context (Owner & Phone)
            SELECT 
                co.user_id, 
                cl.contact_phone
            INTO 
                asset_owner_id, 
                client_phone
            FROM public.assets a
            JOIN public.clients cl ON a.client_id = cl.id
            JOIN public.companies co ON cl.company_id = co.id
            WHERE a.id = NEW.asset_id;

            -- 3. Trigger Native Automation via Queue (workflow_requests)
            -- This inserts a row, which Supabase Edge Function 'webhook-dispatcher' picks up
            IF asset_owner_id IS NOT NULL THEN
                -- Default phone fallback if missing
                IF client_phone IS NULL THEN
                    client_phone := '';
                END IF;

                INSERT INTO public.workflow_requests (
                    user_id, 
                    workflow_type, 
                    status, 
                    input_payload
                ) VALUES (
                    asset_owner_id,
                    'system_alert', -- Standardized native alert type
                    'pending',
                    jsonb_build_object(
                        'phone', client_phone,
                        'message', alert_msg,
                        'asset_id', NEW.asset_id,
                        'reading_value', NEW.value,
                        'timestamp', NOW()
                    )
                );
            END IF;
            
        END IF;
        
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
