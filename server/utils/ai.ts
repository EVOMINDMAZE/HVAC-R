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

import {
  SYSTEM_PROMPT,
  getRoleInstruction,
  SAFETY_GUIDELINES,
} from "../config/ai-prompts.ts";

function roleInstruction(userRole?: string) {
  const instr = getRoleInstruction(userRole);
  return instr ? "\n" + instr : "";
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
    attachments: (payload.attachments || []).map((a) => ({
      url: a.url,
      filename: a.filename || null,
      caption: a.caption || null,
    })),
    answers: payload.answers || null,
    notes: payload.notes || null,
    severity: payload.severity || null,
    timestamp: new Date().toISOString(),
  };

  let userContent =
    "Here is the structured troubleshooting context (JSON):\n" +
    JSON.stringify(context, null, 2) +
    "\n";
  userContent += roleInstruction(userRole);
  userContent += "\n" + SAFETY_GUIDELINES + "\n";
  userContent +=
    "\nPlease analyze the information, list probable root causes (with confidence as a number between 0 and 1), recommend prioritized diagnostic or corrective steps (with urgency: urgent|routine|monitor), and explain reasoning step-by-step. If critical information is missing, list the exact follow-up questions needed. Return results as JSON when possible, with keys: summary, probable_causes, steps, urgency, explanation, follow_up_questions.";

  messages.push({ role: "user", content: userContent });
  return messages;
}

export async function callOllama(
  messages: any[],
  opts?: { model?: string; timeoutMs?: number },
) {
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
    out.follow_up_questions =
      parsed.follow_up_questions || parsed.questions || [];
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
