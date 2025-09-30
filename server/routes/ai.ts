import { Request, Response } from "express";
import { buildMessages, callOllama, normalizeOllamaResponse, TroubleshootPayload } from "../utils/ai.ts";

export async function handleAiTroubleshoot(req: Request, res: Response) {
  try {
    const body: { payload?: TroubleshootPayload; userRole?: string } = req.body || {};
    const payload = body.payload || {};
    const userRole = body.userRole || undefined;

    // Basic validation
    if (!payload || Object.keys(payload).length === 0) {
      return res.status(400).json({ error: "Missing troubleshooting payload" });
    }

    // Build messages for the LLM
    const messages = buildMessages(payload, userRole);

    // Call Ollama
    const raw = await callOllama(messages, { model: payload?.model });

    // Normalize response
    const normalized = normalizeOllamaResponse(raw);

    return res.json({ success: true, data: normalized });
  } catch (err: any) {
    console.error("AI troubleshoot error:", err);
    const message = err?.message || String(err);
    return res.status(500).json({ success: false, error: "AI service error: " + message });
  }
}
