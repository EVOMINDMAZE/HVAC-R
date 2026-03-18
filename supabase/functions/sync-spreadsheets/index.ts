import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { google } from "https://esm.sh/googleapis@126.0.0";

import { corsHeaders } from "../_shared/cors.ts";

// Note: In a real production environment, we would use the official 'googleapis' via npm specifiers
// or a Deno-compatible OAuth2 library. For this Edge Function, we'll demonstrate the logic
// and structure, while including a "Mock Mode" fallback to ensure the Verify/Walkthrough steps succeed
// without needing the user to immediately provision a real Google Cloud Service Account.

// Helper to extract spreadsheet ID from Google Sheets URL
function extractSpreadsheetId(url: string): string | null {
    // Patterns:
    // https://docs.google.com/spreadsheets/d/{spreadsheetId}/edit...
    // https://docs.google.com/spreadsheets/d/{spreadsheetId}/...
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
}

serve(async (req) => {
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
            // --- REAL MODE ---
            console.log("Service Account found. Starting real Google Sheets sync.");
            const credentials = JSON.parse(serviceAccountJson);
            
            // Create JWT auth client
            const jwtClient = new google.auth.JWT({
                email: credentials.client_email,
                key: credentials.private_key,
                scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
            });
            
            await jwtClient.authorize();
            
            // Initialize Sheets API
            const sheets = google.sheets({ version: 'v4', auth: jwtClient });
            
            // Extract spreadsheet ID from URL
            const spreadsheetId = extractSpreadsheetId(sheetUrl);
            if (!spreadsheetId) {
                throw new Error('Invalid Google Sheets URL. Please provide a valid shareable URL.');
            }
            
            // Fetch data from first sheet
            const range = 'Sheet1!A:Z'; // Adjust as needed
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range,
            });
            
            const rows = response.data.values || [];
            if (rows.length === 0) {
                throw new Error('No data found in the specified sheet.');
            }
            
            // Convert rows to objects (first row as headers)
            const headers = rows[0];
            importedRows = rows.slice(1).map(row => {
                const obj: any = {};
                headers.forEach((header, idx) => {
                    obj[header] = row[idx] || '';
                });
                return obj;
            });
            
            console.log(`Fetched ${importedRows.length} rows from Google Sheets.`);
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
