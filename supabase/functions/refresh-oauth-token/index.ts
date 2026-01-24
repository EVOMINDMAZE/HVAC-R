
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
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Identify Tokens to Refresh
        // Logic: Find tokens expiring in the next 20 minutes (or already expired)
        const now = new Date()
        const bufferTime = new Date(now.getTime() + 20 * 60000) // Now + 20 mins

        const { data: expiringIntegrations, error: fetchError } = await supabaseAdmin
            .from('integrations')
            .select('*')
            .eq('status', 'active')
            .lt('expires_at', bufferTime.toISOString())

        if (fetchError) throw fetchError

        console.log(`Found ${expiringIntegrations.length} tokens to refresh.`)

        const results = []

        // 2. Refresh Each Token
        for (const integration of expiringIntegrations) {
            try {
                const provider = integration.provider.toLowerCase()
                let newTokenData = null

                if (provider === 'honeywell') {
                    const clientId = Deno.env.get('HONEYWELL_CLIENT_ID')
                    const clientSecret = Deno.env.get('HONEYWELL_CLIENT_SECRET')

                    if (!clientId || !clientSecret) {
                        throw new Error(`Missing credentials for ${provider}`)
                    }

                    const authHeader = btoa(`${clientId}:${clientSecret}`)
                    const body = new URLSearchParams({
                        grant_type: 'refresh_token',
                        refresh_token: integration.refresh_token,
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
                        console.error(`Failed to refresh ${integration.id}:`, data)
                        // If invalid_grant, maybe mark as error/disconnected?
                        // For now, just log and skip
                        results.push({ id: integration.id, status: 'failed', error: data })
                        continue
                    }

                    // Honeywell returns: access_token, refresh_token (maybe), expires_in
                    newTokenData = {
                        access_token: data.access_token,
                        refresh_token: data.refresh_token || integration.refresh_token, // Use old one if not rotated
                        expires_in: data.expires_in || 1799
                    }
                } else if (provider === 'google_nest') {
                    const clientId = Deno.env.get('NEST_CLIENT_ID')
                    const clientSecret = Deno.env.get('NEST_CLIENT_SECRET')

                    if (!clientId || !clientSecret) {
                        throw new Error(`Missing credentials for ${provider}`)
                    }

                    const response = await fetch('https://oauth2.googleapis.com/token', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: new URLSearchParams({
                            client_id: clientId,
                            client_secret: clientSecret,
                            refresh_token: integration.refresh_token,
                            grant_type: 'refresh_token',
                        }).toString()
                    })

                    const data = await response.json()

                    if (!response.ok) {
                        console.error(`Failed to refresh ${integration.id}:`, data)
                        results.push({ id: integration.id, status: 'failed', error: data })
                        continue
                    }

                    newTokenData = {
                        access_token: data.access_token,
                        refresh_token: integration.refresh_token, // Google does NOT rotate refresh tokens usually
                        expires_in: data.expires_in || 3599
                    }

                } else {
                    console.log(`Skipping unsupported provider: ${provider}`)
                    continue
                }

                // 3. Update Database
                if (newTokenData) {
                    const newExpiresAt = new Date()
                    newExpiresAt.setSeconds(newExpiresAt.getSeconds() + newTokenData.expires_in)

                    const { error: updateError } = await supabaseAdmin
                        .from('integrations')
                        .update({
                            access_token: newTokenData.access_token,
                            refresh_token: newTokenData.refresh_token,
                            expires_at: newExpiresAt.toISOString(),
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', integration.id)

                    if (updateError) throw updateError
                    results.push({ id: integration.id, status: 'refreshed', expires_at: newExpiresAt })
                }

            } catch (innerError: any) {
                console.error(`Error processing integration ${integration.id}:`, innerError)
                results.push({ id: integration.id, status: 'error', message: innerError.message })
            }
        }

        return new Response(JSON.stringify({ success: true, processed: results.length, results }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error: any) {
        console.error('Refresh Error:', error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
