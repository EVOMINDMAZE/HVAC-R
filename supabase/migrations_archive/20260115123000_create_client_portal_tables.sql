-- Create Clients Table (CRM)
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    contact_name TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Assets Table (Equipment)
CREATE TABLE IF NOT EXISTS public.assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'Freezer', 'Chiller', 'HVAC', 'Sensor'
    serial_number TEXT,
    location_on_site TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Automation Rules Table (The Brains)
CREATE TABLE IF NOT EXISTS public.automation_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL, -- Denormalized for RLS ease
    trigger_type TEXT NOT NULL, -- 'temperature_high', 'temperature_low', 'offline'
    threshold_value FLOAT,
    action_type TEXT NOT NULL DEFAULT 'sms',
    action_config JSONB DEFAULT '{}'::jsonb, -- e.g. { "phone": "+123..." }
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Telemetry Readings Table (IoT Data)
CREATE TABLE IF NOT EXISTS public.telemetry_readings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE NOT NULL,
    reading_type TEXT NOT NULL, -- 'temperature', 'humidity', 'pressure'
    value FLOAT NOT NULL,
    unit TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telemetry_readings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Companies can only see their own CLIENTS
CREATE POLICY "Users can view their own clients" ON public.clients
    FOR SELECT USING (company_id IN (
        SELECT id FROM public.companies WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can insert their own clients" ON public.clients
    FOR INSERT WITH CHECK (company_id IN (
        SELECT id FROM public.companies WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own clients" ON public.clients
    FOR UPDATE USING (company_id IN (
        SELECT id FROM public.companies WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can delete their own clients" ON public.clients
    FOR DELETE USING (company_id IN (
        SELECT id FROM public.companies WHERE user_id = auth.uid()
    ));

-- Assets: inherited access via client -> company
CREATE POLICY "Users can view assets of their clients" ON public.assets
    FOR SELECT USING (client_id IN (
        SELECT id FROM public.clients WHERE company_id IN (
            SELECT id FROM public.companies WHERE user_id = auth.uid()
        )
    ));

CREATE POLICY "Users can manage assets of their clients" ON public.assets
    FOR ALL USING (client_id IN (
        SELECT id FROM public.clients WHERE company_id IN (
            SELECT id FROM public.companies WHERE user_id = auth.uid()
        )
    ));

-- Rules: direct access via company_id (denormalized) or inherited
CREATE POLICY "Users can manage automation rules" ON public.automation_rules
    FOR ALL USING (company_id IN (
        SELECT id FROM public.companies WHERE user_id = auth.uid()
    ));

-- Telemetry: viewable by owner
CREATE POLICY "Users can view telemetry" ON public.telemetry_readings
    FOR SELECT USING (asset_id IN (
        SELECT id FROM public.assets WHERE client_id IN (
            SELECT id FROM public.clients WHERE company_id IN (
                SELECT id FROM public.companies WHERE user_id = auth.uid()
            )
        )
    ));
    
-- Allow Service Role to Insert Telemetry (for Ingestion Worker)
CREATE POLICY "Service Role can insert telemetry" ON public.telemetry_readings
    FOR INSERT WITH CHECK (true); -- Service role bypasses RLS anyway, but good to be explicit if using anon key? No, service role bypasses.

-- Grant permissions (if needed)
GRANT ALL ON public.clients TO authenticated;
GRANT ALL ON public.assets TO authenticated;
GRANT ALL ON public.automation_rules TO authenticated;
GRANT ALL ON public.telemetry_readings TO authenticated;
GRANT ALL ON public.telemetry_readings TO service_role;
