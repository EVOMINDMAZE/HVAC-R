
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

console.log("Hello from Webhook Dispatcher!");

serve(async (req) => {
    // 1. Verify Secret / Auth if needed (Optional for internal database webhooks if secured)

    try {
        const payload = await req.json();
        console.log("Received Webhook Payload:", JSON.stringify(payload));

        // Supabase Database Webhook payload structure:
        // { "type": "INSERT", "table": "workflow_requests", "record": { ... }, "schema": "public", "old_record": null }
        const { record } = payload;

        if (!record || !record.user_id) {
            return new Response("No record or user_id found", { status: 400 });
        }

        const userId = record.user_id;

        // 2. Initialize Supabase Client (Service Role)
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error("Missing Supabase configuration");
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 3. Fetch Company n8n Config
        const { data: company, error: companyError } = await supabase
            .from("companies")
            .select("n8n_config")
            .eq("user_id", userId)
            .single();

        if (companyError || !company) {
            console.error("Error fetching company:", companyError);
            return new Response("Company not found for user", { status: 404 });
        }

        const n8nConfig = company.n8n_config;
        const webhookUrl = n8nConfig?.webhook_url;
        const webhookSecret = n8nConfig?.webhook_secret;

        if (!webhookUrl) {
            console.log("No n8n Webhook URL configured for user:", userId);
            return new Response("No n8n URL configured", { status: 200 }); // Not an error, just no-op
        }

        console.log(`Dispatching to n8n URL: ${webhookUrl}`);

        // 4. Dispatch to n8n
        // We forward the original record payload
        const n8nResponse = await fetch(webhookUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Hvac-Webhook-Secret": webhookSecret || "", // Custom header for validation
            },
            body: JSON.stringify(record),
        });

        if (!n8nResponse.ok) {
            console.error(`n8n Error: ${n8nResponse.status} ${n8nResponse.statusText}`);
            return new Response(`Failed to dispatch to n8n: ${n8nResponse.statusText}`, { status: 502 });
        }

        const responseText = await n8nResponse.text();
        console.log("n8n Response:", responseText);

        return new Response("Dispatched successfully", { status: 200 });

    } catch (err) {
        console.error("Dispatcher Error:", err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
});
