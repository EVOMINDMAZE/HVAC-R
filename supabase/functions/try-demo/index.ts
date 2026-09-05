// try-demo — public "window display" AI troubleshooter demo for The Box.
// Phase 3 (Window Display): walk in free, try before you buy.
// Public: NO auth. Sliding-window cap of 3 runs per IP per 24h, enforced via
// Supabase Storage (private bucket "try-demo-caps", one JSON object per
// SHA-256-hashed IP) so the cap survives restarts and is shared across isolates.
//
// HONEST RESIDUAL LIMITATIONS (documented in SPEC-try-window.md + docs/phase3-window-display.md):
// - a same-IP burst can race the read-then-write window (bounded overshoot, not unbounded);
// - if Storage is unreachable the demo fails OPEN (no cap) rather than blocking
//   legitimate visitors — availability over strict quota; errors are logged.

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

interface DemoPayload {
  symptom?: string;
  role?: string;
  equipment?: string;
}

const DEMO_SYSTEM_PROMPT =
  "You are the public demo of an expert HVAC troubleshooting assistant for a product called Simulateon (The Box). A visitor with no account is trying the product for free. Give a SHORT, honest sample verdict — this is a demo, not a full diagnostic. Structure: a 2-3 sentence summary, the top 2 probable causes only, the FIRST 2 diagnostic steps only, and an urgency rating. Always prioritize safety. If the description is too vague for even a sample verdict, say what one clarifying detail would be most useful. Adapt language to the user role: homeowners get plain language (explain any term like 'Delta T' or 'Subcooling' in simplest words), technicians/engineers get standard industry terms.";

const SAFETY_GUIDELINES =
  "Always prioritize safety. If any recommended action involves electrical isolation, hazardous refrigerants, or pressurized components, explicitly instruct the user to follow lockout-tagout procedures and manufacturer safety instructions. If unsure, recommend contacting a licensed technician.";

const ROLE_INSTRUCTIONS: Record<string, string> = {
  homeowner:
    "User role: homeowner. Use plain, non-technical language. Explain any jargon in the simplest terms. Explicitly warn about electrical or pressure hazards. If the issue seems complex, recommend calling a professional.",
  technician:
    "User role: technician. Assume professional knowledge. Use standard industry terms (SH, SC, Delta T, vsat, lsat). Focus on narrowing the root cause; give expected ranges when refrigerant is implied.",
  engineer:
    "User role: engineer. Give root-cause hypotheses and system-level reasoning with expected numerical ranges where applicable.",
};

const MAX_RUNS_PER_WINDOW = 3;
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24h sliding window
const CAP_BUCKET = "try-demo-caps";

let bucketEnsured: Promise<void> | null = null;

function storageContext() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !serviceKey) throw new Error("storage env missing");
  return { supabaseUrl, serviceKey };
}

async function hashIp(ip: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`try-demo:${ip}`),
  );
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function capObjectUrl(ipHash: string): string {
  const { supabaseUrl } = storageContext();
  return `${supabaseUrl}/storage/v1/object/${CAP_BUCKET}/caps/${ipHash}.json`;
}

// Create the private bucket once per isolate; 4xx (already exists) is fine.
async function ensureBucket(): Promise<void> {
  if (!bucketEnsured) {
    bucketEnsured = (async () => {
      try {
        const { supabaseUrl, serviceKey } = storageContext();
        await fetch(`${supabaseUrl}/storage/v1/bucket`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({ name: CAP_BUCKET, public: false }),
        });
      } catch (err) {
        console.error("try-demo: bucket ensure failed", err);
      }
    })();
  }
  await bucketEnsured;
}

async function readRuns(ipHash: string): Promise<{ runs: number[]; status: number }> {
  try {
    await ensureBucket();
    const { serviceKey } = storageContext();
    const res = await fetch(capObjectUrl(ipHash), {
      headers: { Authorization: `Bearer ${serviceKey}` },
    });
    if (!res.ok) return { runs: [], status: res.status }; // 404 (first visit) or storage error
    const body = await res.json();
    const runs = Array.isArray(body?.runs) ? body.runs : [];
    const now = Date.now();
    return {
      runs: runs.filter(
        (ts: unknown) => typeof ts === "number" && now - (ts as number) < WINDOW_MS,
      ),
      status: res.status,
    };
  } catch (err) {
    console.error("try-demo: cap read failed (failing open)", err);
    return { runs: [], status: -1 };
  }
}

async function recordRun(
  ipHash: string,
  runs: number[],
): Promise<{ ok: boolean; status: number }> {
  try {
    await ensureBucket();
    const { serviceKey } = storageContext();
    const pruned = runs
      .filter((ts) => Date.now() - ts < WINDOW_MS)
      .slice(-50);
    pruned.push(Date.now());
    const res = await fetch(capObjectUrl(ipHash), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
        "x-upsert": "true",
      },
      body: JSON.stringify({ runs: pruned }),
    });
    if (!res.ok) {
      console.error(
        "try-demo: cap write failed",
        res.status,
        await res.text().catch(() => ""),
      );
    }
    return { ok: res.ok, status: res.status };
  } catch (err) {
    console.error("try-demo: cap write failed (exception)", err);
    return { ok: false, status: -1 };
  }
}

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const firstHop = forwarded.split(",")[0]?.trim();
    if (firstHop) return firstHop;
  }
  return req.headers.get("cf-connecting-ip") ?? "unknown";
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

  // --- Rate cap (before any AI spend) ---
  const ip = getClientIp(req);
  const ipHash = await hashIp(ip);
  const capRead = await readRuns(ipHash);
  const priorRuns = capRead.runs;
  if (priorRuns.length >= MAX_RUNS_PER_WINDOW) {
    return new Response(
      JSON.stringify({
        error: "daily_limit_reached",
        message:
          "You've used all 3 free demos for today. The full troubleshooter is inside The Box.",
      }),
      {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // --- Payload (lean: no auth, no attachments, no wizard answers) ---
  let payload: DemoPayload;
  try {
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
    const parsed = JSON.parse(rawBody) as DemoPayload;
    if (!parsed || typeof parsed !== "object") {
      throw new Error("not an object");
    }
    payload = parsed;
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON payload" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const symptom = typeof payload.symptom === "string" ? payload.symptom.trim() : "";
  if (symptom.length < 10) {
    return new Response(
      JSON.stringify({
        error: "symptom_too_short",
        message:
          "Describe the symptom in at least 10 characters so the demo has something to work with.",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const role =
    typeof payload.role === "string" && ROLE_INSTRUCTIONS[payload.role]
      ? payload.role
      : "homeowner";
  const equipment =
    typeof payload.equipment === "string" && payload.equipment.trim().length > 0
      ? payload.equipment.trim().slice(0, 200)
      : "not specified";

  // --- AI call (same gateway contract as ai-troubleshoot) ---
  let raw;
  try {
    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: DEMO_SYSTEM_PROMPT },
      {
        role: "user",
        content:
          `Public demo request from a walk-in visitor.\n` +
          `Equipment: ${equipment}\n` +
          `Symptom: ${symptom}\n\n` +
          `${ROLE_INSTRUCTIONS[role]}\n\n` +
          `${SAFETY_GUIDELINES}\n\n` +
          `Return JSON only, with keys: summary (string), probable_causes (array of exactly 2 short strings), ` +
          `steps (array of exactly 2 short strings), urgency ("urgent" | "soon" | "routine"), ` +
          `note (one short string reminding this is a free sample of the full product).`,
      },
    ];
    raw = await callAIGateway(messages);
  } catch (aiError) {
    console.error("try-demo: AI provider request failed", aiError);
    return new Response(
      JSON.stringify({
        error: "ai_unavailable",
        message: "The demo assistant is temporarily unavailable. Please try again shortly.",
      }),
      {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // Record the run only after a successful AI round-trip — failed calls don't burn quota.
  const capWrite = await recordRun(ipHash, priorRuns);
  const runsLeft = Math.max(0, MAX_RUNS_PER_WINDOW - (priorRuns.length + 1));

  const normalized = normalizeOllamaResponse(raw);
  return new Response(
    JSON.stringify({
      demo: true,
      runs_left: runsLeft,
      cap_debug: { read: capRead.status, write: capWrite },
      ...normalized,
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});

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
      mode: "general", // DeepSeek-V3 — same model as the full troubleshooter
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
    summary: null,
    probable_causes: [],
    steps: [],
    urgency: null,
    note: null,
  };

  let content = resp?.message?.content ?? "";
  const originalContent = content;

  // 1. JSON block wrapped in triple backticks.
  const codeBlockMatch =
    content.match(/```json\s*(\{[\s\S]*\}|\[[\s\S]*\])\s*```/i) ||
    content.match(/```\s*(\{[\s\S]*\}|\[[\s\S]*\])\s*```/i);
  if (codeBlockMatch) {
    content = codeBlockMatch[1];
  } else {
    // 2. First `{` to last `}` for unwrapped embedded JSON.
    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");
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
    out.note = parsed.note ?? null;
  } else {
    // Parsing failed: honest plain-text fallback — show what we got.
    out.summary = String(originalContent).trim().slice(0, 600) || null;
  }

  return out;
}

function tryParseJson(str: string) {
  try {
    return JSON.parse(str);
  } catch {
    try {
      const cleaned = str
        .replace(/\/\/.*$/gm, "")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/,(\s*[}\]])/g, "$1");
      return JSON.parse(cleaned);
    } catch {
      return null;
    }
  }
}
