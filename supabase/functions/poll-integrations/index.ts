
import { createClient } from 'jsr:@supabase/supabase-js@2'

// Configuration
const HONEYWELL_BASE_URL = 'https://api.honeywellhome.com/v2/devices/thermostats'

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

        // 1. Fetch Active Integrations
        const { data: integrations, error: fetchError } = await supabaseAdmin
            .from('integrations')
            .select('*')
            .eq('status', 'active')

        if (fetchError) throw fetchError

        console.log(`Polling ${integrations.length} active integrations...`)
        const results = []

        // 2. Loop & Fetch Data
        for (const integration of integrations) {
            try {
                const provider = integration.provider.toLowerCase()
                let telemetryData = [] // Array of { value, type, unit }

                // --- PROVIDER LOGIC START ---
                if (provider === 'honeywell') {
                    // HONEYWELL IMPLEMENTATION (Based on Docs)
                    // URL: /v2/devices/thermostats?locationId={locationId}
                    // For now, we fetch ALL devices for the user token

                    const apiKey = Deno.env.get('HONEYWELL_CLIENT_ID')
                    if (!apiKey) throw new Error('Missing Honeywell API Key')

                    const response = await fetch(`${HONEYWELL_BASE_URL}?apikey=${apiKey}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${integration.access_token}`,
                            'Accept': 'application/json'
                        }
                    })

                    if (!response.ok) {
                        const errText = await response.text()
                        throw new Error(`Honeywell API Error: ${response.status} - ${errText}`)
                    }

                    const data = await response.json()

                    // Parse Devices
                    // Honeywell returns an array of devices
                    if (data && Array.isArray(data)) {
                        for (const device of data) {
                            // Extract Key Metrics
                            if (device.indoorTemperature) {
                                telemetryData.push({
                                    asset_id: null, // We need to match this to our internal Asset ID later
                                    external_id: device.deviceID,
                                    value: device.indoorTemperature,
                                    type: 'temperature',
                                    unit: device.units // 'Fahrenheit' or 'Celsius'
                                })
                            }
                            if (device.indoorHumidity) {
                                telemetryData.push({
                                    asset_id: null,
                                    external_id: device.deviceID,
                                    value: device.indoorHumidity,
                                    type: 'humidity',
                                    unit: '%'
                                })
                            }
                        }
                    }

                } else if (provider === 'google_nest') {
                    // GOOGLE NEST IMPLEMENTATION
                    // URL: https://smartdevicemanagement.googleapis.com/v1/enterprises/{projectId}/devices

                    const projectId = Deno.env.get('NEST_PROJECT_ID')
                    if (!projectId) throw new Error('Missing Nest Project ID')

                    const response = await fetch(`https://smartdevicemanagement.googleapis.com/v1/enterprises/${projectId}/devices`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${integration.access_token}`,
                            'Content-Type': 'application/json'
                        }
                    })

                    if (!response.ok) {
                        const errText = await response.text()
                        throw new Error(`Nest API Error: ${response.status} - ${errText}`)
                    }

                    const data = await response.json()
                    const devices = data.devices || []

                    for (const device of devices) {
                        const traits = device.traits || {}
                        const deviceName = device.name // "enterprises/xyz/devices/123"
                        const deviceId = deviceName.split('/').pop()

                        // Trait: Temperature
                        if (traits['sdm.devices.traits.Temperature']) {
                            const celsius = traits['sdm.devices.traits.Temperature'].ambientTemperatureCelsius
                            if (celsius !== undefined) {
                                telemetryData.push({
                                    asset_id: null,
                                    external_id: deviceId,
                                    value: celsius,
                                    type: 'temperature',
                                    unit: 'Celsius'
                                })
                            }
                        }

                        // Trait: Humidity
                        if (traits['sdm.devices.traits.Humidity']) {
                            const humidity = traits['sdm.devices.traits.Humidity'].ambientHumidityPercent
                            if (humidity !== undefined) {
                                telemetryData.push({
                                    asset_id: null,
                                    external_id: deviceId,
                                    value: humidity,
                                    type: 'humidity',
                                    unit: '%'
                                })
                            }
                        }
                    }

                } else if (provider === 'sensibo') {
                    // TODO: Implement Sensibo Real Polling
                    // Placeholder for now
                    console.log('Skipping Sensibo (Not Implemented)')
                    continue

                } else if (provider === 'ke2') {
                    // TODO: Implement KE2 Therm Real Polling
                    // Placeholder for now
                    console.log('Skipping KE2 (Not Implemented)')
                    continue
                }
                // --- PROVIDER LOGIC END ---

                // 3. Save to Database
                if (telemetryData.length > 0) {
                    // Note: Ideally we map 'external_id' to our internal 'asset_id'.
                    // For this MVP, we will log it. In production, we need a mapping table.

                    // Saving raw payload for debugging
                    results.push({
                        integration_id: integration.id,
                        count: telemetryData.length,
                        sample: telemetryData[0]
                    })

                    // Ideally:
                    // await supabaseAdmin.from('telemetry_readings').insert(...) 
                }

            } catch (innerError: any) {
                console.error(`Error polling ${integration.provider}:`, innerError.message)
                results.push({ id: integration.id, status: 'error', message: innerError.message })
            }
        }

        return new Response(JSON.stringify({ success: true, results }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error: any) {
        console.error('Polling Error:', error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
