-- Fix the RPC function to use the correct schema 'net' and function 'http_post'
CREATE OR REPLACE FUNCTION public.setup_email_automation_webhook(
    service_key TEXT,
    endpoint_url TEXT
)
RETURNS JSONB AS $$
DECLARE
    trigger_func_sql TEXT;
BEGIN
    -- 1. Create the Trigger Function with the dynamic Secret
    --    Uses net.http_post (standard Supabase pg_net)
    trigger_func_sql := format($func$
        CREATE OR REPLACE FUNCTION public.trigger_email_dispatcher()
        RETURNS TRIGGER AS $t$
        BEGIN
            PERFORM net.http_post(
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

    -- 2. Create the Trigger on workflow_requests (INSERT only)
    DROP TRIGGER IF EXISTS on_workflow_request_insert ON public.workflow_requests;
    
    CREATE TRIGGER on_workflow_request_insert
        AFTER INSERT ON public.workflow_requests
        FOR EACH ROW
        EXECUTE FUNCTION public.trigger_email_dispatcher();

    RETURN jsonb_build_object('success', true, 'message', 'Webhook Trigger Configured (net.http_post)');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
