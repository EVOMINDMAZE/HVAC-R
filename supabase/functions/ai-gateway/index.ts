import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

import { corsHeaders } from "../_shared/cors.ts";

console.log("ai-gateway router active! (z.ai / GLM)");

// z.ai OpenAI-compatible endpoint. All modes route to GLM; `search` adds the
// server-side web_search tool so answers can pull live sources.
const ZAI_API_URL = "https://api.z.ai/api/paas/v4/chat/completions";
const DEFAULT_MODEL = "glm-5.3-flash";

// Reasoning models spend completion budget on hidden reasoning_content before
// emitting `content`, so defaults are generous. Callers may override max_tokens.
const MODE_DEFAULTS: Record<
  string,
  { max_tokens: number; temperature?: number; web_search?: boolean }
> = {
  // Reasoning models emit large hidden reasoning_content first; budget must
  // cover thinking + the visible answer or content comes back empty.
  "fast-reasoning": { max_tokens: 8000 },
  vision: { max_tokens: 4000 },
  physics: { max_tokens: 8000, temperature: 0.3 },
  general: { max_tokens: 8000 },
  search: { max_tokens: 8000, temperature: 0.4, web_search: true },
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      mode = "general",
      messages,
      temperature,
      max_tokens,
      web_search,
      model,
    } = await req.json();

    const preset = MODE_DEFAULTS[mode] ?? MODE_DEFAULTS.general;
    const useWebSearch = web_search ?? preset.web_search ?? false;

    const apiKey = Deno.env.get("ZAI_API_KEY") ?? "";
    if (!apiKey) {
      console.error("[ai-gateway] Missing ZAI_API_KEY secret");
      throw new Error(
        "Server configuration error: Missing ZAI_API_KEY secret for the ai-gateway function.",
      );
    }

    const payload: Record<string, unknown> = {
      model: model ?? DEFAULT_MODEL,
      messages: messages,
      temperature: temperature ?? preset.temperature ?? 0.7,
      max_tokens: max_tokens ?? preset.max_tokens,
      stream: false,
    };
    if (useWebSearch) {
      payload.tools = [{ type: "web_search", web_search: { enable: true } }];
    }
    // glm-5.3-flash always reasons; the `thinking` param is rejected (err 1210)
    // and its "low/high/max" hint actually refers to OpenAI-style
    // reasoning_effort (verified empirically: 200 + ~3x shorter reasoning).
    // Only applied when the caller didn't pin a specific model.
    if (!model) {
      payload.reasoning_effort = "low";
    }

    console.log(
      `[ai-gateway] Routing request to ${mode} (Model: ${payload.model}, web_search: ${useWebSearch})`,
    );

    const response = await fetch(ZAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[ai-gateway] Upstream API Error:", data);
      return new Response(JSON.stringify({ error: data, provider: mode }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pass through the response directly (OpenAI-compatible shape)
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[ai-gateway] Internal Error:", error);
    return new Response(
      JSON.stringify({ error: error?.message ?? "Unknown error" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
