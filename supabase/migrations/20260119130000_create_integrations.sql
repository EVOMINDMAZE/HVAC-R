-- Integrations Table: Stores the link between a Client and a Provider (e.g. Honeywell)
CREATE TABLE IF NOT EXISTS public.integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    provider TEXT NOT NULL, -- 'honeywell', 'tuya', 'smartthings', 'nest'
    
    -- Auth Data
    access_token TEXT, 
    refresh_token TEXT,
    expires_at TIMESTAMPTZ,
    
    -- State
    status TEXT DEFAULT 'pending', -- 'active', 'pending_invite', 'error'
    invited_email TEXT, -- If using "Invite" method
    
    metadata JSONB DEFAULT '{}'::jsonb, -- Store account email, friendly name, etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Integrations
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view integrations for their clients" ON public.integrations
    FOR SELECT USING (client_id IN (
        SELECT id FROM public.clients WHERE company_id IN (
            SELECT id FROM public.companies WHERE user_id = auth.uid()
        )
    ));

CREATE POLICY "Users can insert integrations for their clients" ON public.integrations
    FOR INSERT WITH CHECK (client_id IN (
        SELECT id FROM public.clients WHERE company_id IN (
            SELECT id FROM public.companies WHERE user_id = auth.uid()
        )
    ));

CREATE POLICY "Users can update integrations for their clients" ON public.integrations
    FOR UPDATE USING (client_id IN (
        SELECT id FROM public.clients WHERE company_id IN (
            SELECT id FROM public.companies WHERE user_id = auth.uid()
        )
    ));

CREATE POLICY "Users can delete integrations for their clients" ON public.integrations
    FOR DELETE USING (client_id IN (
        SELECT id FROM public.clients WHERE company_id IN (
            SELECT id FROM public.companies WHERE user_id = auth.uid()
        )
    ));


-- Asset Mappings: Maps our internal Asset ID to the External Device ID
CREATE TABLE IF NOT EXISTS public.asset_mappings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE NOT NULL,
    integration_id UUID REFERENCES public.integrations(id) ON DELETE CASCADE NOT NULL,
    
    external_device_id TEXT NOT NULL,
    external_device_name TEXT,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(asset_id) -- One external device per asset
);

-- RLS for Mappings
ALTER TABLE public.asset_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage asset mappings" ON public.asset_mappings
    USING (asset_id IN (
        SELECT id FROM public.assets WHERE client_id IN (
            SELECT id FROM public.clients WHERE company_id IN (
                SELECT id FROM public.companies WHERE user_id = auth.uid()
            )
        )
    ));
