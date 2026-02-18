
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
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        const { submission_id } = await req.json();

        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

        // Fetch submission
        const { data: submission, error: fetchError } = await supabase
            .from("triage_submissions")
            .select("media_urls, problem_description")
            .eq("id", submission_id)
            .single();

        if (fetchError || !submission) {
            throw new Error("Submission not found");
        }

        // Construct Grok Request
        const messages = [
            {
                role: "system",
                content: "You are an HVAC expert AI. Analyze the provided images and problem description. Identify the equipment (Model/Serial if visible). Diagnose likely issues based on visual evidence (icing, rust, burnt wires, dirty coils) and the user's description. Output a JSON object with keys: 'equipment_details', 'suspected_issue', 'severity' (low/medium/high), 'technician_notes'.",
            },
            {
                role: "user",
                content: [
                    { type: "text", text: `User Description: ${submission.problem_description}` },
                    ...submission.media_urls.map((url: string) => ({
                        type: "image_url",
                        image_url: { url: url },
                    })),
                ],
            },
        ];

        const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-gateway`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            },
            body: JSON.stringify({
                mode: "vision",
                messages,
                temperature: 0.2
            }),
        });

        const result = await response.json();
        const analysisContent = result.choices[0].message.content;
        const analysis = JSON.parse(analysisContent);

        // Update DB
        const { error: updateError } = await supabase
            .from("triage_submissions")
            .update({ ai_analysis: analysis, status: "analyzed" })
            .eq("id", submission_id);

        if (updateError) throw updateError;

        return new Response(JSON.stringify({ success: true, analysis }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
