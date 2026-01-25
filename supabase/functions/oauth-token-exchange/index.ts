
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { code, state, redirect_uri } = await req.json()

        // 'state' is the integration_id passed during the OAuth handshake
        if (!code || !state) {
            throw new Error('Missing code or state (integration_id)')
        }

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Fetch the Integration Request to identify the Provider
        const { data: integration, error: fetchError } = await supabaseAdmin
            .from('integrations')
            .select('provider')
            .eq('id', state)
            .single()

        if (fetchError || !integration) {
            throw new Error('Invalid Integration ID (state). Request not found.')
        }

        const provider = integration.provider.toLowerCase()
        let tokenResponse = null
        let expiresAt = null


        console.log(`Processing ${provider} integration for ID: ${state}`)
        console.log(`Received redirect_uri: ${redirect_uri}`)
        console.log(`Received code (start): ${code?.substring(0, 10)}...`)
        console.log(`Received code (length): ${code?.length}`)

        // 2. Exchange Code for Token (Provider Specific)
        if (provider === 'honeywell') {
            const clientId = Deno.env.get('HONEYWELL_CLIENT_ID')
            const clientSecret = Deno.env.get('HONEYWELL_CLIENT_SECRET')

            if (!clientId || !clientSecret) {
                throw new Error('Honeywell environment variables not configured.')
            }

            const authHeader = btoa(`${clientId}:${clientSecret}`)
            const body = new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: redirect_uri || 'https://thermoneural.com/callback/honeywell',
            })

            const response = await fetch('https://api.honeywell.com/oauth2/token', {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${authHeader}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                },
                body: body.toString()
            })

            const data = await response.json()

            if (!response.ok) {
                console.error('Honeywell Token Error:', data)
                throw new Error(data.error_description || 'Failed to exchange token with Honeywell')
            }

            // Honeywell returns: access_token, refresh_token, expires_in (seconds)
            tokenResponse = {
                access_token: data.access_token,
                refresh_token: data.refresh_token,
            }

            // Calculate expiry (Current Time + Expires In Seconds)
            const expiresIn = data.expires_in || 1799 // Default to ~30 mins if missing
            const now = new Date()
            now.setSeconds(now.getSeconds() + expiresIn)
            expiresAt = now.toISOString()

        } else if (provider === 'google_nest' || provider === 'nest') {
            const clientId = Deno.env.get('NEST_CLIENT_ID')
            const clientSecret = Deno.env.get('NEST_CLIENT_SECRET')

            // Reverting rewrite: Trust the frontend's redirect_uri if it was sufficient to get the code.
            // However, ensure we handle the 'nest' vs 'google_nest' alias in the URI if strictly needed, 
            // but for now, rely on what passed the initial auth.
            const redirectUri = redirect_uri || 'https://thermoneural.com/callback/google_nest'

            // FIX: Common issue where '+' in code is converted to ' ' (space) by simple URL decoding.
            // Google codes often have '+'. If we see spaces, put the '+' back.
            let safeCode = code;
            if (safeCode && safeCode.includes(' ')) {
                console.log('Detected spaces in auth code, replacing with "+"');
                safeCode = safeCode.replace(/ /g, '+');
            }

            if (!clientId || !clientSecret) {
                throw new Error('Nest environment variables not configured.')
            }

            // Google requires a POST to oauth2.googleapis.com
            const response = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: clientId,
                    client_secret: clientSecret,
                    code: safeCode,
                    grant_type: 'authorization_code',
                    redirect_uri: redirectUri,
                }).toString()
            })

            const data = await response.json()

            if (!response.ok) {
                console.error('Nest Token Error:', data)
                throw new Error(data.error_description || JSON.stringify(data))
            }

            tokenResponse = {
                access_token: data.access_token,
                refresh_token: data.refresh_token, // Google only sends this ONCE (on first connect)
            }

            const expiresIn = data.expires_in || 3599
            const now = new Date()
            now.setSeconds(now.getSeconds() + expiresIn)
            expiresAt = now.toISOString()

        } else if (provider === 'sensibo') {
            // Sensibo usually uses API Keys, but if using OAuth:
            throw new Error('Sensibo OAuth flow not yet implemented')
        } else {
            throw new Error(`Provider '${provider}' not supported yet.`)
        }

        // 3. Save Tokens to Database
        const { error: updateError } = await supabaseAdmin
            .from('integrations')
            .update({
                access_token: tokenResponse.access_token,
                refresh_token: tokenResponse.refresh_token,
                expires_at: expiresAt,
                status: 'active',
                updated_at: new Date().toISOString()
            })
            .eq('id', state)

        if (updateError) {
            throw updateError
        }

        return new Response(JSON.stringify({ success: true, provider }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error: any) {
        console.error('OAuth Error:', error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200, // Return 200 so client can parse the error message
        })
    }
})
