
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const XAI_API_KEY = Deno.env.get("XAI_API_KEY") || Deno.env.get("OPENAI_API_KEY");
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (!XAI_API_KEY) {
            throw new Error("Missing XAI_API_KEY");
        }

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

        const response = await fetch("https://api.x.ai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${XAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: "grok-2-vision-1212", // Using standard vision model from xAI
                messages,
                stream: false,
                response_format: { type: "json_object" }
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
