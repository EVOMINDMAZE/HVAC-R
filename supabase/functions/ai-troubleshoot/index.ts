
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

interface TroubleshootPayload {
  calculationId?: string;
  symptom?: string;
  ambient?: Record<string, unknown> | null;
  measurements?: Record<string, unknown> | null;
  attachments?: Array<{
    url: string;
    filename?: string | null;
    caption?: string | null;
  }>;
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
    "User role: homeowner. Use plain, non-technical language. Do NOT use jargon like 'Delta T' or 'Subcooling' without explaining it simplest terms. Priority is safety: explicitly warn about electrical or pressure hazards. If a tool is needed, ask if they have it. If the issue seems complex, recommend calling a professional.",
  technician:
    "User role: technician. Assume professional knowledge. Use standard industry terms (SH, SC, Delta T, vsat, lsat). Focus on narrowing down the root cause. Recommend specific component checks (capacitor mfd, resistance ohms, refrigerant charge weight). Provide expected ranges for pressures if R410A or R22 is implied.",
  engineer:
    "User role: engineer. Provide root-cause hypotheses, system-level interactions, and recommend tests with expected numerical ranges when applicable.",
};

const SAFETY_GUIDELINES =
  "Always prioritize safety. If any recommended action involves electrical isolation, hazardous refrigerants, or pressurized components, explicitly instruct the user to follow lockout-tagout procedures and manufacturer safety instructions. If the model is unsure, recommend contacting a licensed technician and list what information would be useful to provide.";

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
            "Set SUPABASE_URL and SUPABASE_ANON_KEY secrets for the ai-troubleshoot function.",
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

    let parsedBody: unknown = null;
    try {
      const rawBody = await req.text();

      // Log body size and a preview to help debugging when functions receive empty/invalid payloads
      try {
        console.log(
          "ai-troubleshoot: incoming request body length=",
          rawBody?.length ?? 0,
        );
        console.log(
          "ai-troubleshoot: content-type=",
          req.headers.get("content-type"),
        );
        console.log(
          "ai-troubleshoot: body preview=",
          rawBody ? rawBody.slice(0, 100) : "<empty>",
        );
      } catch (logErr) {
        // no-op
      }

      if (!rawBody || rawBody.trim().length === 0) {
        return new Response(
          JSON.stringify({
            error: "Request body required",
            details:
              "Empty request body received. Ensure the client sets Content-Type: application/json and calls JSON.stringify(payload) before sending.",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      try {
        parsedBody = JSON.parse(rawBody);
      } catch (jsonErr) {
        console.error("Failed to parse request body as JSON", jsonErr);
        return new Response(
          JSON.stringify({
            error: "Invalid JSON payload",
            details: `Failed to parse body as JSON. content-type=${req.headers.get("content-type")}, body_length=${rawBody.length}, body_preview=${rawBody.slice(0, 200)}`,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      if (Array.isArray(parsedBody)) {
        parsedBody = parsedBody[0] ?? null;
      }

      if (typeof parsedBody === "string") {
        try {
          parsedBody = JSON.parse(parsedBody);
        } catch (nestedError) {
          console.error(
            "Request body was a JSON string but failed nested parsing",
            nestedError,
          );
          return new Response(
            JSON.stringify({
              error: "Invalid JSON payload",
              details:
                "Request body resolved to a string that could not be parsed. Ensure the client sends a JSON object without double stringifying.",
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }
      }

      if (Array.isArray(parsedBody)) {
        parsedBody = parsedBody[0] ?? null;
      }
    } catch (bodyError) {
      console.error("Failed to read request body", bodyError);
      return new Response(
        JSON.stringify({
          error: "Failed to read request body",
          details:
            bodyError instanceof Error ? bodyError.message : String(bodyError),
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!parsedBody || typeof parsedBody !== "object") {
      return new Response(
        JSON.stringify({
          error: "Invalid request payload",
          details: "Expected a JSON object with a payload field.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const container = parsedBody as Record<string, unknown>;

    const userRole =
      typeof container.userRole === "string" ? container.userRole : undefined;
    let rawPayload: unknown = Object.prototype.hasOwnProperty.call(
      container,
      "payload",
    )
      ? (container as Record<string, unknown>).payload
      : container;

    if (Array.isArray(rawPayload)) {
      rawPayload = rawPayload[0] ?? null;
    }

    let troubleshootPayload: TroubleshootPayload | null = null;

    if (typeof rawPayload === "string") {
      try {
        troubleshootPayload = JSON.parse(rawPayload) as TroubleshootPayload;
      } catch (payloadParseError) {
        console.error("Failed to parse payload string", payloadParseError);
        return new Response(
          JSON.stringify({
            error: "Invalid JSON payload",
            details:
              "Payload field was a string that could not be parsed as JSON.",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    } else if (rawPayload && typeof rawPayload === "object") {
      troubleshootPayload = rawPayload as TroubleshootPayload;
    }

    if (
      !troubleshootPayload ||
      (typeof troubleshootPayload === "object" &&
        Object.keys(troubleshootPayload).length === 0)
    ) {
      return new Response(
        JSON.stringify({ error: "Missing troubleshooting payload" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const payload = troubleshootPayload as TroubleshootPayload;

    let raw;
    try {
      const messages = buildMessages(payload, userRole);
      // Construct user content with role instructions
      const systemMessage = messages.shift(); // Remove system prompt to handle it specifically if needed, or keep it. 
      // DeepSeek supports system role.
      if (systemMessage) messages.unshift(systemMessage);

      raw = await callAIGateway(messages);
    } catch (aiError) {
      console.error("AI provider request failed", aiError);
      const detail =
        aiError instanceof Error && aiError.message
          ? aiError.message
          : String(aiError ?? "Unknown error");
      return new Response(
        JSON.stringify({
          error: "AI provider unavailable",
          details: detail,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const normalized = normalizeOllamaResponse(raw); // We can reuse the normalizer as DeepSeek response structure is similar (choices[0].message.content)

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

  let answerSummary = "";
  if (payload.answers && Object.keys(payload.answers).length > 0) {
    answerSummary = "Diagnostic Wizard Answers:\n";
    for (const [key, val] of Object.entries(payload.answers)) {
      answerSummary += `- ${key}: ${val}\n`;
    }
  }

  let userContent =
    "Here is the structured troubleshooting context (JSON):\n" +
    JSON.stringify(context, null, 2) +
    "\n\n" +
    answerSummary +
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

async function callAIGateway(messages: Array<{ role: string; content: string }>) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  const response = await fetch(`${supabaseUrl}/functions/v1/ai-gateway`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${supabaseServiceRoleKey}`,
    },
    body: JSON.stringify({
      mode: "general", // DeepSeek-V3 for diagnostic analysis
      messages,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI Gateway error: ${errorText}`);
  }

  const json = await response.json();
  const content = json.choices?.[0]?.message?.content || "{}";
  return { message: { content } };
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
  let content = message?.content ?? "";
  const originalContent = content; // Keep original for final fallback

  // 1. Try extracting a JSON block wrapped in triple backticks first.
  const codeBlockMatch = content.match(/```json\s*(\{[\s\S]*\}|\[[\s\S]*\])\s*```/i) || content.match(/```\s*(\{[\s\S]*\}|\[[\s\S]*\])\s*```/i);
  if (codeBlockMatch) {
    content = codeBlockMatch[1];
  } else {
    // 2. Fallback: Try to find the first `{` and last `}` to handle unwrapped but embedded JSON.
    const start = content.indexOf('{');
    const end = content.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      content = content.substring(start, end + 1);
    }
  }

  const parsed = tryParseJson(content);

  if (parsed && typeof parsed === "object") {
    out.summary = parsed.summary ?? null;
    out.probable_causes = parsed.probable_causes ?? parsed.causes ?? [];
    out.steps = parsed.steps ?? [];
    out.urgency = parsed.urgency ?? null;
    out.explanation = parsed.explanation ?? null;
    out.follow_up_questions =
      parsed.follow_up_questions ?? parsed.questions ?? [];
  } else {
    // If parsing failed, revert to original content for plain text processing
    const expText = String(originalContent).trim();
    out.explanation = expText;

    // Attempt basic regex extraction for summary if JSON parse failed
    const summaryMatch = expText.match(/"summary"\s*:\s*"([^"]+)"/);
    if (summaryMatch) {
      out.summary = summaryMatch[1];
    } else {
      // Fallback: take first non-empty line that isn't a code block marker
      const lines = expText.split(/\n+/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("```") && !trimmed.startsWith("{")) {
          out.summary = trimmed;
          break;
        }
      }
    }

    const followUps = expText.match(/[^\n\r?.!]+\?/g);
    out.follow_up_questions = followUps ?? [];
  }

  return out;
}

function tryParseJson(str: string) {
  try {
    return JSON.parse(str);
  } catch (e) {
    try {
      // Basic cleaning: remove comments and trailing commas
      const cleaned = str
        .replace(/\/\/.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/,(\s*[}\]])/g, '$1');
      return JSON.parse(cleaned);
    } catch (e2) {
      return null;
    }
  }
}
