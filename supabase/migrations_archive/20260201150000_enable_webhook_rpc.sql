-- Enable pg_net for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- RPC Function to safely setup the webhook trigger without hardcoding secrets in migration
CREATE OR REPLACE FUNCTION public.setup_email_automation_webhook(
    service_key TEXT,
    endpoint_url TEXT
)
RETURNS JSONB AS $$
DECLARE
    trigger_func_sql TEXT;
BEGIN
    -- 1. Create the Trigger Function dynamically to include the Secret Key
    --    We use net.http_post to send the payload to the Edge Function
    trigger_func_sql := format($func$
        CREATE OR REPLACE FUNCTION public.trigger_email_dispatcher()
        RETURNS TRIGGER AS $t$
        BEGIN
            PERFORM extensions.net_http_post(
                url := '%s',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer %s'
                ),
                body := jsonb_build_object(
                    'record', row_to_json(NEW)
                )
            );
            RETURN NEW;
        END;
        $t$ LANGUAGE plpgsql SECURITY DEFINER;
    $func$, endpoint_url, service_key);

    EXECUTE trigger_func_sql;

    -- 2. Create the Trigger on workflow_requests
    DROP TRIGGER IF EXISTS on_workflow_request_insert ON public.workflow_requests;
    
    CREATE TRIGGER on_workflow_request_insert
        AFTER INSERT ON public.workflow_requests
        FOR EACH ROW
        EXECUTE FUNCTION public.trigger_email_dispatcher();

    RETURN jsonb_build_object('success', true, 'message', 'Webhook Trigger Configured');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
