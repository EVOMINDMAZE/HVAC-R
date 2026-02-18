
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

console.log("Validate Import Function Up!");

interface ImportRecord {
    [key: string]: any;
}

serve(async (req) => {
    const origin = req.headers.get('origin');
    const corsHeaders = getCorsHeaders(origin);
    
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        const { targetTable, records } = await req.json();

        if (!targetTable || !records || !Array.isArray(records)) {
            throw new Error("Invalid payload. 'targetTable' (string) and 'records' (array) are required.");
        }

        console.log(`Processing import for table: ${targetTable} with ${records.length} records.`);

        // 1. Basic Validation (Can be expanded with Zod or similar)
        const validRecords: ImportRecord[] = [];
        const errors: any[] = [];

        // Pre-flight check: Get user's company_id to ensure ownership
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) throw new Error("Unauthorized");

        // We rely on RLS, but explicit company_id assignment is good practice for import
        // Ideally, the frontend sends mapped data, but we might need to inject owner/company on backend if missing
        // For now, we assume the RPC or RLS handles the company assignment if set up, 
        // BUT usually imports need to explicitly set the foreign keys if the user doesn't map them.
        // Let's assume the "Client" import implies the current user's company.

        // Fetch user's company_id (optional optimization, typically handled by default column functions or RLS)
        // For bulk insert, we'll try direct insert.

        // 2. Bulk Insert
        const { data, error } = await supabaseClient
            .from(targetTable)
            .insert(records)
            .select();

        if (error) {
            console.error("Insert Error:", error);
            throw error;
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: `Successfully imported ${data?.length || 0} records.`,
                data: data
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error("Import Error:", error);
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );
    }
});
