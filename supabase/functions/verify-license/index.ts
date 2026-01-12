import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

console.log("Verify License Function Invoked")

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-license-key',
            }
        })
    }

    const { headers } = req;
    // n8n might send it in headers, or body. Let's support Header 'x-license-key'
    let licenseKey = headers.get('x-license-key');

    // Fallback: Check Body if not in header
    if (!licenseKey) {
        try {
            const body = await req.json();
            licenseKey = body.license_key;
        } catch (e) {
            // ignore JSON parse error
        }
    }

    if (!licenseKey) {
        return new Response(JSON.stringify({ error: 'Missing x-license-key header or body parameter' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }

    // Create Supabase Client (Service Role needed to read all licenses)
    const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Query License
    const { data, error } = await supabaseClient
        .from('licenses')
        .select('status, plan_tier')
        .eq('key', licenseKey)
        .single()

    if (error || !data) {
        return new Response(JSON.stringify({ valid: false, error: 'License not found' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }

    if (data.status !== 'active') {
        return new Response(JSON.stringify({ valid: false, error: 'License inactive', status: data.status }), {
            status: 403,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }

    // Success
    return new Response(JSON.stringify({ valid: true, plan: data.plan_tier }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
})
