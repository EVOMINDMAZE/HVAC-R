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
    let userId = null;

    // Fallback: Check Body if not in header
    if (!licenseKey) {
        try {
            const body = await req.json();
            licenseKey = body.license_key;
            userId = body.user_id; // Support checking by User ID directly
        } catch (e) {
            // ignore JSON parse error
        }
    }

    if (!licenseKey && !userId) {
        return new Response(JSON.stringify({ error: 'Missing x-license-key header OR user_id body parameter' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }

    // Create Supabase Client (Service Role needed to read all licenses)
    const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let data, error;

    if (licenseKey) {
        // Option A: Verify by Key (Direct)
        const result = await supabaseClient
            .from('licenses')
            .select('status, plan_tier')
            .eq('key', licenseKey)
            .single();
        data = result.data;
        error = result.error;
    } else if (userId) {
        // Option B: Verify by User ID (Lookup active license)
        const result = await supabaseClient
            .from('licenses')
            .select('status, plan_tier')
            .eq('user_id', userId)
            .eq('status', 'active') // Only fetch if active
            .limit(1)
            .single();
        data = result.data;
        error = result.error;
    }

    if (error || !data) {
        console.log(`License Check Failed for: ${licenseKey || userId}`);
        return new Response(JSON.stringify({ valid: false, error: 'License not found or inactive' }), {
            status: 200, // Return 200 so n8n handles it logically (true/false) rather than crashing
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }

    if (data.status !== 'active') {
        return new Response(JSON.stringify({ valid: false, error: 'License inactive', status: data.status }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }

    // Success
    return new Response(JSON.stringify({ valid: true, plan: data.plan_tier }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
})
