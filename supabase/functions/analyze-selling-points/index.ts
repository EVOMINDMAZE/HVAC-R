import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

interface SellingPoint {
    id: string;
    title: string;
    description: string;
    severity: "low" | "medium" | "high" | "critical";
    actionLabel: string;
    actionUrl?: string;
}

serve(async (req) => {
    const origin = req.headers.get('origin');
    const corsHeaders = getCorsHeaders(origin);
    
    // Handle CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { context, data } = await req.json();
        const sellingPoints: SellingPoint[] = [];

        // ---------------------------------------------------------
        // STRATEGY 1: R-22 PHASE-OUT DETECTOR ("The Green Upgrade")
        // ---------------------------------------------------------
        // Target: Old equipment that uses phased-out refrigerant.
        // Value: High (Equipment Replacement Sale).

        // Check Client Equipment
        if (context === "client" && data?.equipment) {
            const equipment = Array.isArray(data.equipment) ? data.equipment : [data.equipment];

            for (const unit of equipment) {
                const specs = (unit.specs || "").toLowerCase();
                const name = (unit.name || "").toLowerCase();

                if (specs.includes("r-22") || specs.includes("r22") ||
                    name.includes("r-22") || name.includes("r22") ||
                    (unit.refrigerant_type && unit.refrigerant_type.includes("22"))) {

                    sellingPoints.push({
                        id: `r22-phaseout-${unit.id || "detected"}`,
                        title: "Urgent Upgrade Opportunity (R-22 Detected)",
                        description: `Unit "${unit.name}" appears to use R-22 (HCFC-22), which is phased out. Parts and refrigerant are becoming critically expensive. Propose a high-efficiency system upgrade now to save them money.`,
                        severity: "high", // High value sale
                        actionLabel: "Draft Upgrade Proposal",
                        actionUrl: `/proposals/new?type=replacement&unit=${unit.id}`
                    });
                }
            }
        }

        // Check Inventory Assets (User's View)
        if (context === "inventory" && data?.items) {
            const items = Array.isArray(data.items) ? data.items : [data.items];
            console.log(`Analyzing ${items.length} inventory items for selling points.`);

            for (const item of items) {
                // Map potential field names
                const name = (item.name || item.tag || "").toLowerCase();
                const type = (item.type || item.refrigerant_type || item.refrigerantType || "").toLowerCase();

                if (name.includes("r-22") || name.includes("r22") || type.includes("r-22") || type.includes("r22")) {
                    sellingPoints.push({
                        id: `r22-asset-${item.id || "detected"}`,
                        title: "High Value Asset (R-22 Inventory)",
                        description: "You are holding R-22 inventory. As supply dwindles, the market value of this cylinder increases. Ensure it is securely tracked and billed at premium 'Vintage' rates.",
                        severity: "medium", // Efficiency/Security insight
                        actionLabel: "Update Price",
                    });
                }
            }
        }

        // ---------------------------------------------------------
        // STRATEGY 2: WEATHER SALES BOT ⛈️ ("Impact Detection")
        // ---------------------------------------------------------
        if (context === "client" && data?.client) {
            const client = data.client;
            const location = client.zip_code || client.address;

            if (location) {
                try {
                    // 1. Geocode location (Open-Meteo Geocoding)
                    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`);
                    const geoData = await geoRes.json();

                    if (geoData.results?.[0]) {
                        const { latitude, longitude, name: cityName } = geoData.results[0];

                        // 2. Fetch Forecast
                        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max&timezone=auto&temperature_unit=fahrenheit`);
                        const weatherData = await weatherRes.json();

                        const maxTemps = weatherData.daily?.temperature_2m_max || [];
                        console.log(`Weather Data for ${cityName}:`, maxTemps); // Debug Log
                        const hasHeatwave = maxTemps.some((t: number) => t > 0); // TEMPORARY TESTING THRESHOLD

                        if (hasHeatwave) {
                            const peakTemp = Math.max(...maxTemps);

                            // Check for old equipment (Age > 10y or R-22)
                            const equipment = Array.isArray(data.equipment) ? data.equipment : [data.equipment];
                            const vulnerableUnits = equipment.filter((u: any) => {
                                if (!u) return false;
                                // Simple age check if install_date exists
                                if (u.install_date) {
                                    const ageYears = (new Date().getTime() - new Date(u.install_date).getTime()) / (1000 * 60 * 60 * 24 * 365);
                                    if (ageYears > 10) return true;
                                }
                                // Fallback: if it uses R-22 it's definitely vulnerable
                                return (u.refrigerant_type || "").includes("22");
                            });

                            if (vulnerableUnits.length > 0) {
                                sellingPoints.push({
                                    id: `weather-alert-${client.id}`,
                                    title: `Heatwave Alert: ${peakTemp.toFixed(0)}°F Incoming!`,
                                    description: `A major heatwave is forecasted for ${cityName}. You have ${vulnerableUnits.length} aging units at this site that are likely to fail under high load. Propose a "Pre-Heatwave Tune-up" or upgrade immediately.`,
                                    severity: "critical",
                                    actionLabel: "Schedule Emergency Service",
                                    actionUrl: `/jobs/new?client_id=${client.id}&priority=high&reason=heatwave`
                                });
                            }
                        }
                    }
                } catch (err) {
                    console.error("Weather lookup failed:", err);
                }
            }
        }

        return new Response(JSON.stringify({ sellingPoints }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message || "Internal Error" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
