-- Create asset audit logs table
CREATE TABLE IF NOT EXISTS public.asset_audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE,
    changed_by UUID REFERENCES auth.users(id),
    change_type TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_data JSONB,
    new_data JSONB,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on audit logs
ALTER TABLE public.asset_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only Admins and Managers can view audit logs
CREATE POLICY "RBAC: View Asset Audit Logs" ON public.asset_audit_logs
    FOR SELECT USING (
        public.get_my_role() IN ('admin', 'manager')
    );

-- Trigger function to log asset changes
CREATE OR REPLACE FUNCTION public.log_asset_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.asset_audit_logs (asset_id, changed_by, change_type, new_data)
        VALUES (NEW.id, auth.uid(), TG_OP, row_to_json(NEW)::jsonb);
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.asset_audit_logs (asset_id, changed_by, change_type, old_data, new_data)
        VALUES (NEW.id, auth.uid(), TG_OP, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.asset_audit_logs (asset_id, changed_by, change_type, old_data)
        VALUES (OLD.id, auth.uid(), TG_OP, row_to_json(OLD)::jsonb);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on assets table
DROP TRIGGER IF EXISTS tr_log_asset_changes ON public.assets;
CREATE TRIGGER tr_log_asset_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.assets
    FOR EACH ROW EXECUTE FUNCTION public.log_asset_changes();
