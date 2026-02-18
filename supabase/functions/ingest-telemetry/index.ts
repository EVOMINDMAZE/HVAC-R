
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { getCorsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
    const origin = req.headers.get('origin');
    const corsHeaders = getCorsHeaders(origin);
    
    // 1. Handle CORS Preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // 2. Parse Payload
        const { asset_id, value, type = 'temperature', unit = 'F' } = await req.json()

        if (!asset_id || value === undefined) {
            throw new Error('Missing asset_id or value')
        }

        // 3. Init Supabase (Service Role)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 4. Validate Asset Exists
        const { data: asset, error: assetError } = await supabaseAdmin
            .from('assets')
            .select('id, client_id')
            .eq('id', asset_id)
            .single()

        if (assetError || !asset) {
            return new Response(JSON.stringify({ error: 'Invalid Asset ID' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 404,
            })
        }

        // 5. Insert Telemetry (Bypassing RLS via Service Role)
        const { error: insertError } = await supabaseAdmin
            .from('telemetry_readings')
            .insert({
                asset_id: asset_id,
                value: Number(value),
                reading_type: type,
                unit: unit,
                timestamp: new Date().toISOString()
            })

        if (insertError) {
            throw insertError
        }

        // 6. Success
        return new Response(JSON.stringify({ message: 'Ingested', asset: asset.id }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
