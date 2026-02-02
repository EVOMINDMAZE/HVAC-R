import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

console.log("ai-gateway router active!");

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { mode, messages, temperature = 0.7, max_tokens = 1000 } = await req.json();

        let apiUrl = "";
        let apiKey = "";
        let model = "";

        // 🧠 ROUTING LOGIC: THE ARBITRAGE ENGINE
        // We select the best provider based on the 'mode' to optimize for cost vs performance.
        switch (mode) {
            case "fast-reasoning":
                // 🚀 xAI (Grok): Best for complex logic, invoice extraction, and reasoning chains.
                // Cost: ~$0.20/M tokens (High value)
                apiUrl = "https://api.x.ai/v1/chat/completions";
                apiKey = Deno.env.get("XAI_API_KEY") ?? "";
                model = "grok-2-1212"; // Using latest stable Grok model
                break;

            case "vision":
                // 👁️ xAI Vision: For analyzing images/media in triage.
                apiUrl = "https://api.x.ai/v1/chat/completions";
                apiKey = Deno.env.get("XAI_API_KEY") ?? "";
                model = "grok-2-vision-1212";
                break;

            case "physics":
                // 📐 DeepSeek: Optimized for thermodynamic calculations and code/logic validation.
                // Cost: Very low for high reasoning capability
                apiUrl = "https://api.deepseek.com/chat/completions";
                apiKey = Deno.env.get("DEEPSEEK_API_KEY") ?? "";
                model = "deepseek-reasoner";
                break;

            case "general":
            default:
                // ⚡ Groq (Llama 3): Ultra-fast, low cost. Best for chat interfaces, simple UI text, and summaries.
                // Cost: ~$0.10/M tokens (Lowest)
                apiUrl = "https://api.groq.com/openai/v1/chat/completions";
                apiKey = Deno.env.get("GROQ_API_KEY") ?? "";
                model = "llama-3.3-70b-versatile";
                break;
        }

        if (!apiKey) {
            console.error(`Missing API Key for provider: ${mode}`);
            throw new Error(`Server configuration error: Missing API Key for ${mode} mode.`);
        }

        const payload = {
            model: model,
            messages: messages,
            temperature: temperature,
            max_tokens: max_tokens,
            stream: false
        };

        console.log(`[ai-gateway] Routing request to ${mode} (Model: ${model})`);

        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("[ai-gateway] Upstream API Error:", data);
            return new Response(JSON.stringify({ error: data, provider: mode }), {
                status: 502,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // Pass through the response directly
        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error("[ai-gateway] Internal Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
