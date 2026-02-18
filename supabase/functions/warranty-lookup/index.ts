import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
    const origin = req.headers.get('origin');
    const corsHeaders = getCorsHeaders(origin);
    
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { serial_number } = await req.json();

        if (!serial_number) {
            throw new Error("Serial number is required");
        }

        // MOCK LOGIC: Simulate finding a warranty based on patterns
        // In a real scenario, this would call manufacturer APIs (Carrier/Trane/Lennox)

        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        let result = {
            found: false,
            data: null as any
        };

        const sn = serial_number.toUpperCase();

        if (sn.startsWith("50")) {
            // Mock Carrier Pattern
            result = {
                found: true,
                data: {
                    manufacturer: "Carrier",
                    status: "Active",
                    expiryDate: "2029-05-12",
                    modelNumber: "24VNA936A003",
                    notes: "Registered 10-Year Parts Limited Warranty"
                }
            };
        } else if (sn.startsWith("T")) {
            // Mock Trane Pattern
            result = {
                found: true,
                data: {
                    manufacturer: "Trane",
                    status: "Expired",
                    expiryDate: "2023-11-01",
                    modelNumber: "XR14",
                    notes: "Standard 5-Year Warranty Expired"
                }
            };
        } else if (sn.startsWith("L")) {
            // Mock Lennox Pattern
            result = {
                found: true,
                data: {
                    manufacturer: "Lennox",
                    status: "Active",
                    expiryDate: "2031-08-20",
                    modelNumber: "SL28XCV",
                    notes: "Premium Extended Care"
                }
            };
        } else {
            // Fallback for demo purposes - if it's 10 chars, make it "Generic Brand"
            if (sn.length === 10) {
                result = {
                    found: true,
                    data: {
                        manufacturer: "Generic HVAC Co.",
                        status: "Active",
                        expiryDate: "2027-01-01",
                        modelNumber: "GEN-X-1000",
                        notes: "Standard Limited Warranty"
                    }
                };
            }
        }

        if (!result.found) {
            return new Response(
                JSON.stringify({ success: false, error: "Warranty not found" }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        return new Response(
            JSON.stringify({ success: true, data: result.data }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    }
});
