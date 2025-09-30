import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Credentials": "true",
};

interface TroubleshootPayload {
  calculationId?: string;
  symptom?: string;
  ambient?: Record<string, unknown> | null;
  measurements?: Record<string, unknown> | null;
  attachments?: Array<{ url: string; filename?: string | null; caption?: string | null }>;
  answers?: Record<string, unknown> | null;
  notes?: string | null;
  severity?: string | null;
  model?: string | null;
  serial?: string | null;
  [key: string]: unknown;
}

const SYSTEM_PROMPT =
  "You are an expert HVAC troubleshooting assistant being integrated into a web application called Simulateon. Users (technicians, engineers, or homeowners) will describe HVAC system issues, provide measurements, and upload photos. Based on this information, generate clear, step-by-step diagnostics, identify possible causes, and suggest next actions or tests. Always prioritize safety and clarity, and ask for clarification if needed. Your advice will be shown to users after they submit their troubleshooting form in the Troubleshooting Wizards section. Adapt detail level to user type if specified.";

const ROLE_INSTRUCTIONS: Record<string, string> = {
  homeowner:
    "User role: homeowner. Use plain language, avoid technical jargon, provide clear safety steps and when to call a professional.",
  technician:
    "User role: technician. Provide practical diagnostic steps, measurement checks, acceptable ranges, and likely component-level faults.",
  engineer:
    "User role: engineer. Provide root-cause hypotheses, system-level interactions, and recommend tests with expected numerical ranges when applicable.",
};

const SAFETY_GUIDELINES =
  "Always prioritize safety. If any recommended action involves electrical isolation, hazardous refrigerants, or pressurized components, explicitly instruct the user to follow lockout-tagout procedures and manufacturer safety instructions. If the model is unsure, recommend contacting a licensed technician and list what information would be useful to provide.";

serve(async (req) => {
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
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { payload, userRole }: { payload?: TroubleshootPayload; userRole?: string } =
      await req.json();

    if (!payload || Object.keys(payload).length === 0) {
      return new Response(JSON.stringify({ error: "Missing troubleshooting payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const messages = buildMessages(payload, userRole);
    const raw = await callOllama(messages, payload?.model);
    const normalized = normalizeOllamaResponse(raw);

    return new Response(JSON.stringify({ success: true, data: normalized }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("AI troubleshoot function error:", error);
    const message =
      error instanceof Error && error.message ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function buildMessages(payload: TroubleshootPayload, userRole?: string) {
  const messages: Array<{ role: string; content: string }> = [];
  messages.push({ role: "system", content: SYSTEM_PROMPT });

  const context = {
    calculationId: payload.calculationId ?? null,
    symptom: payload.symptom ?? null,
    model: payload.model ?? null,
    serial: payload.serial ?? null,
    ambient: payload.ambient ?? null,
    measurements: payload.measurements ?? null,
    attachments: (payload.attachments ?? []).map((a) => ({
      url: a.url,
      filename: a.filename ?? null,
      caption: a.caption ?? null,
    })),
    answers: payload.answers ?? null,
    notes: payload.notes ?? null,
    severity: payload.severity ?? null,
    timestamp: new Date().toISOString(),
  };

  let userContent =
    "Here is the structured troubleshooting context (JSON):\n" +
    JSON.stringify(context, null, 2) +
    "\n";

  if (userRole && ROLE_INSTRUCTIONS[userRole]) {
    userContent += `\n${ROLE_INSTRUCTIONS[userRole]}`;
  }

  userContent += `\n${SAFETY_GUIDELINES}\n`;
  userContent +=
    "\nPlease analyze the information, list probable root causes (with confidence as a number between 0 and 1), recommend prioritized diagnostic or corrective steps (with urgency: urgent|routine|monitor), and explain reasoning step-by-step. If critical information is missing, list the exact follow-up questions needed. Return results as JSON when possible, with keys: summary, probable_causes, steps, urgency, explanation, follow_up_questions.";

  messages.push({ role: "user", content: userContent });
  return messages;
}

async function callOllama(messages: Array<{ role: string; content: string }>, modelHint?: string | null) {
  const base = (Deno.env.get("OLLAMA_BASE_URL") ?? "http://localhost:11434").replace(/\/+$/, "");
  const model = modelHint || Deno.env.get("OLLAMA_MODEL") || "llama3";
  const url = `${base}/api/chat`;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
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

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Ollama API error ${response.status}: ${text}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

function normalizeOllamaResponse(resp: any) {
  const out: Record<string, unknown> = {
    raw: resp,
    summary: null,
    probable_causes: [],
    steps: [],
    urgency: null,
    explanation: null,
    follow_up_questions: [],
    conversationId: resp?.conversationId ?? null,
  };

  const message = resp?.message;
  const content = message?.content ?? "";

  let parsed: any = null;
  try {
    parsed = JSON.parse(content);
  } catch (_error) {
    parsed = null;
  }

  if (parsed && typeof parsed === "object") {
    out.summary = parsed.summary ?? null;
    out.probable_causes = parsed.probable_causes ?? parsed.causes ?? [];
    out.steps = parsed.steps ?? [];
    out.urgency = parsed.urgency ?? null;
    out.explanation = parsed.explanation ?? null;
    out.follow_up_questions = parsed.follow_up_questions ?? parsed.questions ?? [];
  } else {
    out.explanation = String(content);
    const lines = out.explanation.trim().split(/\n+/);
    out.summary = lines[0] ?? null;
    const followUps = out.explanation.match(/[^\n\r?.!]+\?/g);
    out.follow_up_questions = followUps ?? [];
  }

  return out;
}
