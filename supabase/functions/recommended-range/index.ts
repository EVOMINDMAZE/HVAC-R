import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std/http/server.ts";

const createCorsHeaders = (origin: string | null) => {
  const allowedOrigin = origin && origin !== "null" ? origin : "*";
  const headers: Record<string, string> = {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    Vary: "Origin",
  };

  if (allowedOrigin !== "*") {
    headers["Access-Control-Allow-Credentials"] = "true";
  }

  return headers;
};

interface RecommendedRangeRequest {
  refrigerant?: string | null;
  context?: Record<string, unknown> | null;
  model?: string | null;
}

interface RecommendedRangeResult {
  evap_temp_c?: number | null;
  cond_temp_c?: number | null;
  superheat_c?: number | null;
  subcooling_c?: number | null;
  notes?: string | null;
  raw?: unknown;
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = createCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error(
        "Supabase credentials missing in edge function environment",
      );
      return new Response(
        JSON.stringify({
          error: "Edge function not fully configured",
          details:
            "Set SUPABASE_URL and SUPABASE_ANON_KEY secrets for the recommended-range function.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const rawBody = await req.text();
    if (!rawBody || rawBody.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Request body required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    let body: any = null;
    try {
      body = JSON.parse(rawBody);
    } catch (err) {
      try {
        // attempt nested parse
        body = JSON.parse(JSON.parse(rawBody));
      } catch (_e) {
        return new Response(
          JSON.stringify({ error: "Invalid JSON payload" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    const payload: RecommendedRangeRequest = body;

    // Basic validation: refrigerant optional but helpful
    if (payload.refrigerant && typeof payload.refrigerant !== "string") {
      return new Response(
        JSON.stringify({ error: "refrigerant must be a string" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Build messages for Ollama
    const messages: Array<{ role: string; content: string }> = [];
    messages.push({
      role: "system",
      content:
        "You are an expert refrigeration cycle engineer assistant. When given a refrigerant and optional context (ambient, load, application), recommend safe, practical operating parameters for a typical vapor-compression refrigeration cycle. Return results as a JSON object with keys: evap_temp_c, cond_temp_c, superheat_c, subcooling_c, notes. Provide numeric values in degrees Celsius and numbers for superheat/subcooling. If uncertain, give a reasonable range and explain in notes.",
    });

    let userContent = "Please produce recommended operating parameters as JSON.";
    if (payload.refrigerant) {
      userContent += ` Refrigerant: ${String(payload.refrigerant)}.`;
    }
    if (payload.context && typeof payload.context === "object") {
      userContent += ` Context: ${JSON.stringify(payload.context)}.`;
    }

    messages.push({ role: "user", content: userContent });

    let rawResp: any = null;
    try {
      rawResp = await callOllama(messages, payload?.model);
    } catch (aiError) {
      console.error("AI provider request failed", aiError);
      const detail =
        aiError instanceof Error && aiError.message
          ? aiError.message
          : String(aiError ?? "Unknown error");
      return new Response(
        JSON.stringify({ error: "AI provider unavailable", details: detail }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const normalized = normalizeRecommendedRangeResponse(rawResp);

    return new Response(JSON.stringify({ success: true, data: normalized }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("recommended-range function error:", error);
    const message = error instanceof Error && error.message ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

async function callOllama(
  messages: Array<{ role: string; content: string }>,
  modelHint?: string | null,
) {
  const base = (Deno.env.get("OLLAMA_BASE_URL") ?? "http://localhost:11434").replace(/\/+$/, "");
  const model = modelHint || Deno.env.get("OLLAMA_MODEL") || "gpt-oss:120b";
  const url = `${base}/api/chat`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const apiKey = Deno.env.get("OLLAMA_API_KEY");
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const controller = new AbortController();
  const timeoutMs = Number(Deno.env.get("OLLAMA_TIMEOUT_MS") ?? 30000);
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ model, messages, stream: false }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const bodyText = await response.text();

    if (!response.ok) {
      throw new Error(`Ollama API error ${response.status}: ${bodyText}`);
    }

    if (!bodyText || bodyText.trim().length === 0) {
      return { message: { content: "{}" } };
    }

    try {
      return JSON.parse(bodyText);
    } catch (parseError) {
      throw new Error(
        `Failed to parse Ollama response: ${
          parseError instanceof Error ? parseError.message : String(parseError)
        } | body: ${bodyText.slice(0, 500)}`,
      );
    }
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

function normalizeRecommendedRangeResponse(resp: any): RecommendedRangeResult {
  const out: RecommendedRangeResult = { raw: resp };

  const message = resp?.message;
  const content = message?.content ?? "";

  // Try to parse JSON directly
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === "object") {
      out.evap_temp_c = maybeNumber(parsed.evap_temp_c);
      out.cond_temp_c = maybeNumber(parsed.cond_temp_c);
      out.superheat_c = maybeNumber(parsed.superheat_c);
      out.subcooling_c = maybeNumber(parsed.subcooling_c);
      out.notes = typeof parsed.notes === "string" ? parsed.notes : null;
      return out;
    }
  } catch (_e) {
    // fallthrough
  }

  // Fallback: attempt to extract numbers using regex patterns
  const nums = extractNumbersFromText(content);
  if (nums.evap !== undefined) out.evap_temp_c = nums.evap;
  if (nums.cond !== undefined) out.cond_temp_c = nums.cond;
  if (nums.superheat !== undefined) out.superheat_c = nums.superheat;
  if (nums.subcooling !== undefined) out.subcooling_c = nums.subcooling;

  // Put the raw text as notes if no structured notes present
  out.notes = String(content).trim().slice(0, 2000);

  return out;
}

function maybeNumber(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^0-9.-]+/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function extractNumbersFromText(text: string) {
  const out: Record<string, number | undefined> = {};
  const lower = text.toLowerCase();

  // Evaporator temperature (look for evap or evaporator)
  const evapMatch = lower.match(/(?:evap|evaporator)[^0-9\-\n]*([-+]?[0-9]{1,3}(?:\.[0-9]+)?)/);
  if (evapMatch) out.evap = Number(evapMatch[1]);

  const condMatch = lower.match(/(?:cond|condenser)[^0-9\-\n]*([-+]?[0-9]{1,3}(?:\.[0-9]+)?)/);
  if (condMatch) out.cond = Number(condMatch[1]);

  const superheatMatch = lower.match(/superheat[^0-9\-\n]*([-+]?[0-9]{1,3}(?:\.[0-9]+)?)/);
  if (superheatMatch) out.superheat = Number(superheatMatch[1]);

  const subcoolMatch = lower.match(/subcool(?:ing)?[^0-9\-\n]*([-+]?[0-9]{1,3}(?:\.[0-9]+)?)/);
  if (subcoolMatch) out.subcooling = Number(subcoolMatch[1]);

  // As a last resort, capture first two temperature-like numbers as evap/cond
  if (out.evap === undefined || out.cond === undefined) {
    const temps = Array.from(text.matchAll(/([-+]?[0-9]{1,3}(?:\.[0-9]+)?)[\s]*°?[cC]?/g)).map((m) => Number(m[1]));
    if (temps.length >= 1 && out.evap === undefined) out.evap = temps[0];
    if (temps.length >= 2 && out.cond === undefined) out.cond = temps[1];
  }

  return out;
}
