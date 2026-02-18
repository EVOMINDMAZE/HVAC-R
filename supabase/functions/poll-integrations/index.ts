
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { getCorsHeaders } from "../_shared/cors.ts";

// Configuration
const HONEYWELL_BASE_URL = 'https://api.honeywellhome.com/v2/devices/thermostats'

Deno.serve(async (req) => {
    const origin = req.headers.get('origin');
    const corsHeaders = getCorsHeaders(origin);
    
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
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
                const telemetryData = [] // Array of { value, type, unit }

                // --- PROVIDER LOGIC START ---
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
                    if (data && Array.isArray(data)) {
                        for (const device of data) {
                            if (device.indoorTemperature) {
                                telemetryData.push({
                                    external_id: device.deviceID,
                                    name: device.name || `Honeywell ${device.deviceID}`,
                                    type: 'Thermostat',
                                    value: device.indoorTemperature,
                                    reading_type: 'temperature',
                                    unit: device.units // 'Fahrenheit' or 'Celsius'
                                })
                            }
                            if (device.indoorHumidity) {
                                telemetryData.push({
                                    external_id: device.deviceID,
                                    name: device.name || `Honeywell ${device.deviceID}`,
                                    type: 'Thermostat',
                                    value: device.indoorHumidity,
                                    reading_type: 'humidity',
                                    unit: '%'
                                })
                            }
                        }
                    }

                } else if (provider === 'google_nest') {
                    // GOOGLE NEST IMPLEMENTATION

                    // --- MOCK MODE START ---
                    if (integration.access_token === 'mock_nest_token') {
                        console.log('Using MOCK MODE for Nest Integration')
                        // Inject Fake Device
                        telemetryData.push({
                            external_id: 'mock-nest-001',
                            name: 'Living Room Nest (Demo)',
                            type: 'Thermostat',
                            value: 72 + Math.random(), // Randomize slightly
                            reading_type: 'temperature',
                            unit: 'Fahrenheit'
                        })
                        telemetryData.push({
                            external_id: 'mock-nest-001',
                            name: 'Living Room Nest (Demo)',
                            type: 'Thermostat',
                            value: 45 + Math.random(),
                            reading_type: 'humidity',
                            unit: '%'
                        })
                    }
                    // --- MOCK MODE END ---
                    else {
                        // REAL API CALL
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
                            // Get friendly name from 'sdm.devices.traits.Info' if available, else ID
                            const friendlyName = traits['sdm.devices.traits.Info']?.customName || `Nest ${deviceId.substring(0, 4)}`

                            // Trait: Temperature
                            if (traits['sdm.devices.traits.Temperature']) {
                                const celsius = traits['sdm.devices.traits.Temperature'].ambientTemperatureCelsius
                                if (celsius !== undefined) {
                                    telemetryData.push({
                                        external_id: deviceId,
                                        name: friendlyName,
                                        type: 'Thermostat',
                                        value: (celsius * 9 / 5) + 32, // Convert to F for dashboard consistency
                                        reading_type: 'temperature',
                                        unit: 'Fahrenheit'
                                    })
                                }
                            }

                            // Trait: Humidity
                            if (traits['sdm.devices.traits.Humidity']) {
                                const humidity = traits['sdm.devices.traits.Humidity'].ambientHumidityPercent
                                if (humidity !== undefined) {
                                    telemetryData.push({
                                        external_id: deviceId,
                                        name: friendlyName,
                                        type: 'Thermostat',
                                        value: humidity,
                                        reading_type: 'humidity',
                                        unit: '%'
                                    })
                                }
                            }
                        }
                    } // end real api
                } else if (provider === 'sensibo') {
                    console.log('Skipping Sensibo (Not Implemented)')
                    continue
                } else if (provider === 'ke2') {
                    console.log('Skipping KE2 (Not Implemented)')
                    continue
                }
                // --- PROVIDER LOGIC END ---

                // 3. Save to Database (Upsert Logic)
                if (telemetryData.length > 0) {

                    // Group by Device to minimize Asset upserts
                    const devices = {}
                    for (const t of telemetryData) {
                        if (!devices[t.external_id]) {
                            devices[t.external_id] = { name: t.name, type: t.type, readings: [] }
                        }
                        devices[t.external_id].readings.push(t)
                    }

                    for (const extId in devices) {
                        const deviceProps = devices[extId]

                        // A. Check Mapping
                        let assetId = null
                        const { data: mapping, error: mapError } = await supabaseAdmin
                            .from('asset_mappings')
                            .select('asset_id')
                            .eq('integration_id', integration.id)
                            .eq('external_device_id', extId)
                            .single()

                        if (mapping) {
                            assetId = mapping.asset_id
                        } else {
                            // Create New Asset
                            console.log(`Creating new asset for ${extId}`)
                            const { data: newAsset, error: createError } = await supabaseAdmin
                                .from('assets')
                                .insert({
                                    client_id: integration.client_id,
                                    name: deviceProps.name,
                                    type: deviceProps.type,
                                    serial_number: extId // Store external ID as serial for easy reference
                                })
                                .select('id')
                                .single()

                            if (createError) {
                                console.error('Error creating asset:', createError)
                                continue
                            }
                            assetId = newAsset.id

                            // Create Mapping
                            await supabaseAdmin.from('asset_mappings').insert({
                                asset_id: assetId,
                                integration_id: integration.id,
                                external_device_id: extId
                            })
                        }

                        // B. Insert Readings
                        if (assetId) {
                            const readingsPayload = deviceProps.readings.map((r: any) => ({
                                asset_id: assetId,
                                reading_type: r.reading_type,
                                value: r.value,
                                unit: r.unit
                            }))

                            const { error: insertError } = await supabaseAdmin
                                .from('telemetry_readings')
                                .insert(readingsPayload)

                            if (insertError) console.error('Error inserting readings:', insertError)
                        }
                    }

                    results.push({
                        integration_id: integration.id,
                        status: 'success',
                        devices_processed: Object.keys(devices).length
                    })
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
