import fetch from "node-fetch";

export interface TroubleshootPayload {
  calculationId?: string;
  symptom?: string;
  ambient?: any;
  measurements?: any;
  attachments?: Array<{ url: string; filename?: string; caption?: string }>;
  answers?: any;
  notes?: string;
  severity?: string;
  model?: string;
  serial?: string;
  [k: string]: any;
}

const SYSTEM_PROMPT = `You are an expert HVAC troubleshooting assistant being integrated into a web application called Simulateon. Users (technicians, engineers, or homeowners) will describe HVAC system issues, provide measurements, and upload photos. Based on this information, generate clear, step-by-step diagnostics, identify possible causes, and suggest next actions or tests. Always prioritize safety and clarity, and ask for clarification if needed. Your advice will be shown to users after they submit their troubleshooting form in the Troubleshooting Wizards section. Adapt detail level to user type if specified.`;

function roleInstruction(userRole?: string) {
  if (!userRole) return "";
  switch (userRole) {
    case "homeowner":
      return "\nUser role: homeowner. Use plain language, avoid technical jargon, provide clear safety steps and when to call a professional.";
    case "technician":
      return "\nUser role: technician. Provide practical diagnostic steps, measurement checks, acceptable ranges, and likely component-level faults.";
    case "engineer":
      return "\nUser role: engineer. Provide root-cause hypotheses, system-level interactions, and recommend tests with expected numerical ranges when applicable.";
    default:
      return "";
  }
}

export function buildMessages(payload: TroubleshootPayload, userRole?: string) {
  const messages: any[] = [];
  messages.push({ role: "system", content: SYSTEM_PROMPT });

  // Provide a concise JSON context as the user message to the LLM
  const context = {
    calculationId: payload.calculationId || null,
    symptom: payload.symptom || null,
    model: payload.model || null,
    serial: payload.serial || null,
    ambient: payload.ambient || null,
    measurements: payload.measurements || null,
    attachments: (payload.attachments || []).map((a) => ({ url: a.url, filename: a.filename || null, caption: a.caption || null })),
    answers: payload.answers || null,
    notes: payload.notes || null,
    severity: payload.severity || null,
    timestamp: new Date().toISOString(),
  };

  let userContent = "Here is the structured troubleshooting context (JSON):\n" + JSON.stringify(context, null, 2) + "\n";
  userContent += roleInstruction(userRole);
  userContent += "\nPlease analyze the information, list probable root causes (with confidence), recommend prioritized diagnostic or corrective steps (with urgency), and explain reasoning step-by-step. If critical information is missing, list the exact follow-up questions needed.";

  messages.push({ role: "user", content: userContent });
  return messages;
}

export async function callOllama(messages: any[], opts?: { model?: string; timeoutMs?: number }) {
  const base = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const model = opts?.model || process.env.OLLAMA_MODEL || "llama3";
  const url = `${base.replace(/\/+$/, "")}/api/chat`;
  const body = {
    model,
    messages,
    stream: false,
    // request a single response; use options if needed (temperature etc.)
  };

  const headers: any = { "Content-Type": "application/json" };
  const apiKey = process.env.OLLAMA_API_KEY;
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

  const controller = new AbortController();
  const timeout = opts?.timeoutMs ?? 30000;
  const t = setTimeout(() => controller.abort(), timeout);

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(t);

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Ollama API error ${resp.status}: ${text}`);
    }

    const json = await resp.json();
    return json;
  } catch (err: any) {
    clearTimeout(t);
    throw err;
  }
}

export function normalizeOllamaResponse(resp: any) {
  // Ollama returns { model, created_at, message: { role, content, images }, done }
  const out: any = {
    raw: resp,
    summary: null,
    probable_causes: [],
    steps: [],
    urgency: null,
    explanation: null,
    follow_up_questions: [],
    conversationId: resp?.conversationId || null,
  };

  const message = resp?.message;
  const content = message?.content ?? "";

  // Try to parse JSON embedded in content
  let parsed: any = null;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    parsed = null;
  }

  if (parsed && typeof parsed === "object") {
    out.summary = parsed.summary || null;
    out.probable_causes = parsed.probable_causes || parsed.causes || [];
    out.steps = parsed.steps || [];
    out.urgency = parsed.urgency || null;
    out.explanation = parsed.explanation || null;
    out.follow_up_questions = parsed.follow_up_questions || parsed.questions || [];
  } else {
    // Fallback: try to heuristically split text into sections
    out.explanation = String(content);
    // Create a short summary (first line)
    const lines = out.explanation.trim().split(/\n+/);
    out.summary = lines[0] || null;

    // Attempt to extract follow-up questions (lines ending with '?')
    out.follow_up_questions = out.explanation.match(/[^\n\r?.!]+\?/g) || [];
  }

  return out;
}
