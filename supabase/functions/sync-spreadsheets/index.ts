import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
    const origin = req.headers.get('origin');
    const corsHeaders = getCorsHeaders(origin);
    
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { sheetUrl } = await req.json();

        if (!sheetUrl) {
            throw new Error("Missing 'sheetUrl' in request body.");
        }

        console.log(`Sync requested for Sheet: ${sheetUrl}`);

        // 1. Initialize Supabase
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        // 2. Check for Service Account Credentials
        // In production, you would paste your JSON key into this secret
        const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
        let importedRows = [];
        let isMock = false;

        if (serviceAccountJson) {
            // --- REAL MODE (Placeholder logic for when keys exist) ---
            // const credentials = JSON.parse(serviceAccountJson);
            // const jwtClient = new JWT({ ... });
            // await jwtClient.authorize();
            // const sheets = google.sheets({ version: 'v4', auth: jwtClient });
            // ... fetch data ...
            console.log("Service Account found. (Real sync logic would trigger here)");
            // For now, even if keys exist, we defer to mock because we don't have the full googleapis setup in this snippet.
            // In a full implementation, we'd add 'npm:googleapis' to imports.
            throw new Error("Real Google Sync not fully configured. Using Mock Logic for demo.");
        } else {
            // --- MOCK MODE (For V1 Verification) ---
            console.log("No Google Service Account found. Using DEMO/MOCK mode.");
            isMock = true;

            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Generate "Mock" Rows derived from the Sheet URL to make it feel responsive
            // e.g., if URL contains "pricing", import pricing data. Default to Clients.
            const isInventory = sheetUrl.toLowerCase().includes('inventory') || sheetUrl.toLowerCase().includes('pricing');

            if (isInventory) {
                importedRows = [
                    { refrigerant_type: 'R-410A', weight: 25, status: 'Active' },
                    { refrigerant_type: 'R-22', weight: 12, status: 'Empty' },
                    { refrigerant_type: 'R-32', weight: 24, status: 'Active' }
                ];
            } else {
                // Default Clients
                importedRows = [
                    { name: 'Google Synced Client 1', email: 'sync1@google.com', address: '123 Cloud Way' },
                    { name: 'Google Synced Client 2', email: 'sync2@google.com', address: '456 Sheet St' },
                    { name: 'Google Synced Client 3', email: 'sync3@google.com', address: '789 Row Rd' }
                ];
            }
        }

        // 3. Upsert Data into Supabase
        // We reuse the logic from 'validate-import' ideally, or just insert directly here.
        // For this demo, we'll insert into 'clients' (if client data) or return the preview.
        // To be safe and "Read Only" for the demo, we won't write to DB yet, just return the data for the UI to preview/confirm.
        // In Phase 4, we will automate the write.

        return new Response(
            JSON.stringify({
                success: true,
                isMock,
                message: isMock ? "Demo Mode: Simulated sync from Google Sheet" : "Synced successfully",
                data: importedRows,
                count: importedRows.length
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );

    } catch (error: any) {
        console.error("Sync Error:", error);
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );
    }
});
