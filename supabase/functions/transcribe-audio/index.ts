import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

console.log("transcribe-audio function active!");

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const apiKey = Deno.env.get("GROQ_API_KEY");
        if (!apiKey) {
            throw new Error("Missing GROQ_API_KEY");
        }

        // 1. Get the FormData from the request
        const formData = await req.formData();
        const audioFile = formData.get('file');

        if (!audioFile) {
            return new Response(JSON.stringify({ error: "No file provided" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        console.log("Received audio file, sending to Groq...");

        // 2. Forward to Groq
        const groqFormData = new FormData();
        groqFormData.append('file', audioFile);
        groqFormData.append('model', 'distill-whisper-large-v3-en'); // Or 'whisper-large-v3' if needed, but distil is faster/cheaper

        const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                // Do NOT set Content-Type here, let fetch set the boundary
            },
            body: groqFormData
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Groq API Error:", data);
            return new Response(JSON.stringify({ error: data }), {
                status: 502,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // 3. Return the text
        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error("Transcription Error:", error);
        return new Response(JSON.stringify({ error: (error as Error).message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
