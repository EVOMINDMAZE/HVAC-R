import React, { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Save, Copy, AlertTriangle, Clock, CheckCircle, HelpCircle } from "lucide-react";
import { useSupabaseCalculations } from "@/hooks/useSupabaseCalculations";
import { apiClient } from "@/lib/api";
import { consumeCalculationPreset } from "@/lib/historyPresets";

const SYMPTOMS = [
  { id: "no_cooling", label: "No/insufficient cooling" },
  { id: "no_heat", label: "No heat" },
  { id: "short_cycling", label: "Short cycling" },
  { id: "no_startup", label: "No startup" },
  { id: "system_noisy", label: "System noisy" },
  { id: "air_quality", label: "Air quality issues" },
  { id: "condensation", label: "Condensation / water" },
  { id: "poor_airflow", label: "Poor airflow" },
  { id: "odors", label: "Odors" },
  { id: "icing", label: "Evaporator icing" },
  { id: "high_head", label: "High head pressure" },
  { id: "low_suction", label: "Low suction pressure" },
  { id: "noisy", label: "Unusual noise/vibration" },
];

export default function Troubleshooting() {
  const { saveCalculation } = useSupabaseCalculations();
  const [symptom, setSymptom] = useState<string>("no_cooling");
  const [ambient, setAmbient] = useState<string>("25");
  const [unit, setUnit] = useState<"C" | "F">("C");
  const [observations, setObservations] = useState<string>("");
  const [step, setStep] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // AI state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiConversationId, setAiConversationId] = useState<string | null>(null);
  const [copiedQuestionIndex, setCopiedQuestionIndex] = useState<number | null>(null);

  // Structured measurements
  const [suctionPressure, setSuctionPressure] = useState<string>("");
  const [headPressure, setHeadPressure] = useState<string>("");
  const [voltage, setVoltage] = useState<string>("");
  const [current, setCurrent] = useState<string>("");
  const [modelSerial, setModelSerial] = useState<string>("");

  // Apply any preset saved via History 'Re-run'
  useEffect(() => {
    try {
      const preset = consumeCalculationPreset();
      if (!preset || preset.type !== "Troubleshooting" || !preset.inputs) return;
      const inputs: any = preset.inputs;
      // symptom
      if (inputs.symptom) setSymptom(String(inputs.symptom));
      // ambient may be { value, unit }
      if (inputs.ambient) {
        if (inputs.ambient.value !== undefined) setAmbient(String(inputs.ambient.value));
        if (inputs.ambient.unit) setUnit(String(inputs.ambient.unit));
      }
      // measurements
      if (inputs.measurements) {
        if (inputs.measurements.suction_pressure_kpa)
          setSuctionPressure(String(inputs.measurements.suction_pressure_kpa));
        if (inputs.measurements.head_pressure_kpa)
          setHeadPressure(String(inputs.measurements.head_pressure_kpa));
        if (inputs.measurements.voltage_v) setVoltage(String(inputs.measurements.voltage_v));
        if (inputs.measurements.current_a) setCurrent(String(inputs.measurements.current_a));
        if (inputs.measurements.model_serial) setModelSerial(String(inputs.measurements.model_serial));
      }
      // notes/observations
      if (inputs.notes) setObservations(String(inputs.notes));
      // answers (wizard answers)
      if (inputs.answers && typeof inputs.answers === "object") setAnswers(inputs.answers);
      // attachments
      if (Array.isArray(inputs.attachments)) setAttachments(inputs.attachments.map((a: any) => (typeof a === 'string' ? a : a.url || '')));
      // results
      if (preset.results) setAiResponse(preset.results);
    } catch (e) {
      console.warn("Failed to apply calculation preset", e);
    }
  }, []);

  const steps = useMemo(() => {
    const base = [
      {
        id: "airflow",
        title: "Airflow",
        q: "Is airflow unobstructed and filter clean?",
        options: [
          { v: "yes", label: "Yes" },
          { v: "no", label: "No" },
        ],
      },
      {
        id: "charge",
        title: "Refrigerant Charge",
        q: "Are pressures/SH/SC within expected range?",
        options: [
          { v: "ok", label: "Within range" },
          { v: "low", label: "Likely undercharge" },
          { v: "high", label: "Likely overcharge" },
        ],
      },
      {
        id: "leak",
        title: "Leak/Restriction",
        q: "Any signs of leak or line restriction?",
        options: [
          { v: "none", label: "No" },
          { v: "leak", label: "Leak suspected" },
          { v: "restriction", label: "Restriction suspected" },
        ],
      },
    ];
    // Symptom-specific tailored checks
    if (symptom === "high_head") {
      return [
        base[0],
        {
          id: "condenser",
          title: "Condenser",
          q: "Is condenser coil clean and fan operating?",
          options: [
            { v: "ok", label: "Yes" },
            { v: "dirty", label: "Dirty/blocked" },
            { v: "fan_issue", label: "Fan issue" },
          ],
        },
        base[1],
        base[2],
      ];
    }

    if (symptom === "poor_airflow") {
      return [
        {
          id: "airflow",
          title: "Airflow",
          q: "Is airflow unobstructed? Check filters, dampers, fans.",
          options: [
            { v: "yes", label: "Yes" },
            { v: "no", label: "No (obstruction)" },
            { v: "partial", label: "Partial / weak" },
          ],
        },
        {
          id: "ducts",
          title: "Ducts & Registers",
          q: "Any closed/blocked registers or damaged ducts?",
          options: [
            { v: "no", label: "No" },
            { v: "blocked", label: "Blocked" },
            { v: "leak", label: "Leak/damage" },
          ],
        },
      ];
    }

    if (symptom === "no_heat") {
      return [
        {
          id: "power",
          title: "Power & Fuel",
          q: "Is the unit receiving power and fuel (if applicable)?",
          options: [
            { v: "ok", label: "Yes" },
            { v: "power_loss", label: "Power loss" },
            { v: "fuel_loss", label: "Fuel issue" },
          ],
        },
        base[1],
      ];
    }

    return base;
  }, [symptom]);

  const recommendations = useMemo(() => {
    const rec: string[] = [];

    // Airflow
    if (answers["airflow"] === "no")
      rec.push(
        "Restore airflow: clean/replace filter, inspect blower & ducts.",
      );
    if (answers["airflow"] === "partial")
      rec.push("Partial airflow: check blower speed and damper positions.");

    // Charge/work
    if (answers["charge"] === "low")
      rec.push("Check for leaks, evacuate, weigh-in correct charge.");
    if (answers["charge"] === "high")
      rec.push("Recover excess, weigh charge to spec, verify subcooling.");

    // Leaks/restrictions
    if (answers["leak"] === "leak")
      rec.push(
        "High risk of refrigerant leak — shut off and contact technician.",
      );
    if (answers["leak"] === "restriction")
      rec.push(
        "Inspect filter drier/TEV/capillary for restriction, replace as needed.",
      );

    // Condenser
    if (symptom === "high_head" && answers["condenser"] === "dirty")
      rec.push("Clean condenser coil; ensure adequate ambient airflow.");
    if (symptom === "high_head" && answers["condenser"] === "fan_issue")
      rec.push("Diagnose condenser fan motor/capacitor and replace if faulty.");

    // No heat specific
    if (symptom === "no_heat" && answers["power"] === "power_loss")
      rec.push("Confirm power at panel and breakers; reset trip and retry.");
    if (symptom === "no_heat" && answers["power"] === "fuel_loss")
      rec.push("Check fuel supply/valves and pilot/ignition systems.");

    // Default
    if (rec.length === 0)
      rec.push(
        "No fault strongly indicated. Monitor operation and log detailed measurements.",
      );
    return rec;
  }, [answers, symptom]);

  const formatAiStep = (step: any, fallback: string) => {
    if (!step) return fallback;
    if (typeof step === "string") return step;
    if (typeof step === "object") {
      // Simple probable-cause objects sometimes use `cause` + `confidence`
      if (step.cause) return String(step.cause);

      const segments: string[] = [];

      // Common keys used for step text
      if (step.step) segments.push(String(step.step));
      if (step.action) segments.push(String(step.action));
      if (step.description) segments.push(String(step.description));
      if (step.text) segments.push(String(step.text));

      // Metadata
      if (step.urgency) segments.push(`Urgency: ${step.urgency}`);
      if (step.severity) segments.push(`Urgency: ${step.severity}`);

      // Safety notes may be named differently depending on the model
      const safety =
        step.safety || step.safety_notes || step.safetyNote || step.safetyNotes;
      if (safety) segments.push(`Safety: ${safety}`);

      if (segments.length > 0) return segments.join(" — ");

      try {
        return JSON.stringify(step);
      } catch (_err) {
        return fallback;
      }
    }
    return fallback;
  };

  const computeSeverity = () => {
    // high: leak suspected, power loss, fan issue
    if (answers["leak"] === "leak") return "high";
    if (answers["condenser"] === "fan_issue") return "high";
    if (answers["power"] === "power_loss") return "high";

    // medium: airflow partial/blocked, charge issues
    if (answers["airflow"] === "partial" || answers["airflow"] === "no")
      return "medium";
    if (answers["charge"] === "low" || answers["charge"] === "high")
      return "medium";

    return "low";
  };

  const severity = computeSeverity();

  const uploadFile = async (file: File) => {
    if (!file) return null;
    setUploading(true);
    try {
      // read file as base64
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(String(fr.result || ""));
        fr.onerror = (err) => reject(err);
        fr.readAsDataURL(file);
      });
      const base64 = dataUrl.split(",")[1] || "";
      const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
      const token = localStorage.getItem("simulateon_token") || undefined;
      const resp = await fetch("/api/storage/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          filename,
          contentBase64: base64,
          bucket: "troubleshooting-uploads",
        }),
      });
      if (!resp.ok) {
        const txt = await resp.text();
        console.warn("Server upload failed", resp.status, txt);
        return null;
      }
      const j = await resp.json();
      if (j && j.publicUrl) {
        setAttachments((prev) => [...prev, j.publicUrl]);
        return j.publicUrl;
      }
      return null;
    } catch (e) {
      console.warn("Upload failed", e);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleAnswer = (id: string, v: string) => {
    setAnswers((prev) => ({ ...prev, [id]: v }));
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // convert ambient to C if necessary
      let ambientC = Number(ambient);
      if (unit === "F") {
        ambientC = ((ambientC - 32) * 5) / 9;
      }

      const inputs = {
        wizard: "hvac-basic",
        symptom,
        ambient: {
          value: Number(ambient),
          unit,
          ambient_c: Number(Number(ambientC).toFixed(2)),
        },
        measurements: {
          suction_pressure_kpa: suctionPressure || null,
          head_pressure_kpa: headPressure || null,
          voltage_v: voltage || null,
          current_a: current || null,
          model_serial: modelSerial || null,
        },
        attachments,
        answers,
        notes: observations,
      };
      const results = {
        recommendations,
        severity,
        status: "completed",
        summary: `${SYMPTOMS.find((s) => s.id === symptom)?.label || "Symptom"} – ${recommendations[0]}`,
      };
      await saveCalculation("Troubleshooting", inputs, results);
      // show confirmation toast if available
      try {
        window.dispatchEvent(
          new CustomEvent("app:success", {
            detail: {
              title: "Session saved",
              message: "Troubleshooting session saved to your history.",
            },
          }),
        );
      } catch (e) {}
    } finally {
      setSaving(false);
    }
  };

  const getAiAdvice = async () => {
    setAiError(null);
    setAiLoading(true);
    setAiResponse(null);
    try {
      // prepare same inputs as save
      let ambientC = Number(ambient);
      if (unit === "F") ambientC = ((ambientC - 32) * 5) / 9;
      const payload = {
        payload: {
          wizard: "hvac-basic",
          symptom,
          ambient: {
            value: Number(ambient),
            unit,
            ambient_c: Number(Number(ambientC).toFixed(2)),
          },
          measurements: {
            suction_pressure_kpa: suctionPressure || null,
            head_pressure_kpa: headPressure || null,
            voltage_v: voltage || null,
            current_a: current || null,
            model_serial: modelSerial || null,
          },
          attachments: attachments.map((url) => ({ url })),
          answers,
          notes: observations,
        },
        // userRole could be passed here if available from user profile
      };

      try {
        console.log("[Troubleshooting] payload object", payload);
        console.log(
          "[Troubleshooting] payload JSON",
          JSON.stringify(payload, null, 2),
        );
      } catch (e) {}

      const resp = await apiClient.aiTroubleshoot(payload);

      if (!resp || !resp.success) {
        const err = resp?.error || "AI service returned an error";
        const details = (resp as any)?.details;
        setAiError(details ? `${err} (${details})` : err);
        return;
      }

      const sanitizeString = (s: any) => {
        if (typeof s !== "string") return s;
        try {
          // Remove fenced code blocks
          let cleaned = s.replace(/```(?:json)?\n?/gi, "").replace(/```/g, "").trim();

          // If the string contains an embedded JSON object/array, attempt to parse it.
          const firstBrace = cleaned.indexOf("{");
          const firstBracket = cleaned.indexOf("[");
          const firstJsonIdx = [firstBrace, firstBracket].filter((i) => i >= 0).sort((a, b) => a - b)[0];

          if (typeof firstJsonIdx === "number") {
            const candidate = cleaned.substring(firstJsonIdx);
            try {
              const parsed = JSON.parse(candidate);
              return parsed;
            } catch (e) {
              // fallthrough to try parsing whole string
            }
          }

          try {
            return JSON.parse(cleaned);
          } catch (e) {
            // Not JSON, return cleaned string
            return cleaned;
          }
        } catch (e) {
          return s;
        }
      };

      const sanitizeObj = (obj: any): any => {
        if (obj == null) return obj;
        if (typeof obj === "string") return sanitizeString(obj);
        if (Array.isArray(obj)) return obj.map(sanitizeObj);
        if (typeof obj === "object") {
          const res: any = {};
          for (const k in obj) res[k] = sanitizeObj(obj[k]);
          return res;
        }
        return obj;
      };

      const sanitized = sanitizeObj(resp.data);

      // If the AI returned a nested structured "explanation" that itself contains the main fields,
      // merge them into the top-level object for simpler rendering.
      let merged = sanitized;
      try {
        if (
          sanitized &&
          typeof sanitized === "object" &&
          sanitized.explanation &&
          typeof sanitized.explanation === "object"
        ) {
          merged = { ...sanitized, ...sanitizeObj(sanitized.explanation) };
        }
      } catch (e) {
        // ignore merge errors
      }

      setAiResponse(merged);
      if (resp.data?.conversationId) setAiConversationId(resp.data.conversationId);
    } catch (e: any) {
      console.error("AI request failed", e);
      const message = e?.message || String(e);
      if (message.includes("Unauthorized")) {
        setAiError(
          "You need to be signed in to request AI advice. Please log in and try again.",
        );
      } else if (message.includes("Missing authorization")) {
        setAiError(
          "Unable to authenticate with Supabase. Please refresh or sign in again.",
        );
      } else {
        setAiError(message);
      }
    } finally {
      setAiLoading(false);
    }
  };

  const copyText = async (text: string, idx?: number) => {
    // Try native clipboard API first
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        if (typeof idx === "number") setCopiedQuestionIndex(idx);
        window.setTimeout(() => setCopiedQuestionIndex(null), 2000);
        return true;
      }
    } catch (e) {
      console.warn("navigator.clipboard failed", e);
      // fallthrough to execCommand fallback
    }

    // Fallback: create a hidden textarea, select and execCommand('copy')
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      // Avoid scrolling to bottom
      ta.style.position = "fixed";
      ta.style.top = "0";
      ta.style.left = "0";
      ta.style.width = "1px";
      ta.style.height = "1px";
      ta.style.padding = "0";
      ta.style.border = "none";
      ta.style.outline = "none";
      ta.style.boxShadow = "none";
      ta.style.background = "transparent";
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, ta.value.length);
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      if (ok) {
        if (typeof idx === "number") setCopiedQuestionIndex(idx);
        window.setTimeout(() => setCopiedQuestionIndex(null), 2000);
        return true;
      }
    } catch (e) {
      console.warn("execCommand copy fallback failed", e);
    }

    // As a last resort, show the text in a prompt so the user can copy manually
    try {
      // eslint-disable-next-line no-alert
      window.prompt("Copy the text below:", text);
    } catch (e) {}

    return false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold text-blue-900">
          Troubleshooting Wizards
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>Describe the issue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Primary symptom</Label>
                <Select value={symptom} onValueChange={setSymptom}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {SYMPTOMS.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Ambient</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    className="mt-1 w-full border rounded px-3 py-2"
                    value={ambient}
                    onChange={(e) => setAmbient(e.target.value)}
                  />
                  <div className="flex-shrink-0">
                    <div className="inline-flex rounded-md border bg-white">
                      <button
                        className={`px-2 py-1 ${unit === "C" ? "bg-blue-500 text-white rounded" : "text-sm px-2"}`}
                        onClick={() => setUnit("C")}
                        type="button"
                      >
                        °C
                      </button>
                      <button
                        className={`px-2 py-1 ${unit === "F" ? "bg-blue-500 text-white rounded" : "text-sm px-2"}`}
                        onClick={() => setUnit("F")}
                        type="button"
                      >
                        °F
                      </button>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Acceptable range: -50 to 80 °C (or equivalent °F)
                </div>
              </div>

              <div>
                <Label>Model / Serial</Label>
                <input
                  type="text"
                  className="mt-1 w-full border rounded px-3 py-2"
                  placeholder="Model or serial number"
                  value={modelSerial}
                  onChange={(e) => setModelSerial(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Observations</Label>
              <Textarea
                className="mt-1"
                placeholder="Add any measurements or notes"
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
              />

              <div className="mt-3">
                <div className="text-sm font-medium mb-2">
                  Measurements (optional)
                </div>
                <div className="grid md:grid-cols-4 gap-2">
                  <input
                    className="border rounded px-2 py-1"
                    placeholder="Suction press (kPa)"
                    value={suctionPressure}
                    onChange={(e) => setSuctionPressure(e.target.value)}
                  />
                  <input
                    className="border rounded px-2 py-1"
                    placeholder="Head press (kPa)"
                    value={headPressure}
                    onChange={(e) => setHeadPressure(e.target.value)}
                  />
                  <input
                    className="border rounded px-2 py-1"
                    placeholder="Voltage (V)"
                    value={voltage}
                    onChange={(e) => setVoltage(e.target.value)}
                  />
                  <input
                    className="border rounded px-2 py-1"
                    placeholder="Current (A)"
                    value={current}
                    onChange={(e) => setCurrent(e.target.value)}
                  />
                </div>

                <div className="mt-3">
                  <Label>Photos / Files</Label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      await uploadFile(f);
                      // reset input
                      (e.target as HTMLInputElement).value = "";
                    }}
                  />
                  {uploading && (
                    <div className="text-sm text-muted-foreground mt-2">
                      Uploading…
                    </div>
                  )}
                  {attachments.length > 0 && (
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {attachments.map((a) => (
                        <a
                          key={a}
                          href={a}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block border rounded overflow-hidden"
                        >
                          <img
                            src={a}
                            alt="attachment"
                            className="h-20 w-28 object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Guided Checks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">Progress</div>
                <div className="text-xs text-muted-foreground">
                  Step {Math.min(step + 1, steps.length)} of {steps.length}
                </div>
              </div>
              <div className="w-full">
                <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`absolute left-0 top-0 h-3 rounded-full ${severity === "high" ? "bg-red-500" : severity === "medium" ? "bg-yellow-400" : "bg-green-500"}`}
                    style={{
                      width: `${Math.round(((step + 1) / Math.max(1, steps.length)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {steps.map((st, idx) => (
              <div
                key={st.id}
                className={`p-4 rounded border ${idx <= step ? "bg-white" : "bg-gray-50 opacity-70"}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={idx <= step ? "default" : "outline"}>
                    Step {idx + 1}
                  </Badge>
                  <div className="font-semibold">{st.title}</div>
                </div>
                <div className="mb-3 text-sm">{st.q}</div>
                <div className="flex flex-wrap gap-2">
                  {st.options.map((op) => (
                    <Button
                      key={op.v}
                      variant={answers[st.id] === op.v ? "default" : "outline"}
                      disabled={idx > step}
                      onClick={() => handleAnswer(st.id, op.v)}
                    >
                      {op.label}
                    </Button>
                  ))}
                </div>
              </div>
            ))}

            {/* Quick advice */}
            <div className="p-3 rounded border bg-white">
              <div className="flex items-center justify-between">
                <div className="font-semibold">Quick Advice</div>
                <div
                  className={`text-sm font-semibold ${severity === "high" ? "text-red-600" : severity === "medium" ? "text-yellow-600" : "text-green-600"}`}
                >
                  {severity === "high"
                    ? "Urgent"
                    : severity === "medium"
                      ? "Action recommended"
                      : "Low priority"}
                </div>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                {recommendations.slice(0, 2).map((r, i) => (
                  <div key={i} className="mb-1">
                    • {r}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-6 space-y-2">
              {recommendations.map((r, i) => (
                <li key={i} className="text-sm">
                  {r}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center gap-2">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2"
              >
                <Save className="h-4 w-4" /> Save Session
              </Button>
              <Button
                onClick={getAiAdvice}
                disabled={aiLoading}
                variant="outline"
              >
                {aiLoading ? "Getting AI advice…" : "Get AI Expert Advice"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Expert Recommendation</CardTitle>
          </CardHeader>
          <CardContent>
            {aiLoading && (
              <div className="text-sm text-muted-foreground">
                Analyzing with AI…
              </div>
            )}
            {aiError && <div className="text-sm text-red-600">{aiError}</div>}
            {aiResponse && (
              <div className="space-y-4">
                {/* Summary */}
                {aiResponse.summary && (
                  <Card className="bg-white border">
                    <CardHeader>
                      <div className="flex items-center justify-between w-full">
                        <CardTitle>AI Summary</CardTitle>
                        <Badge className="ml-2">
                          {aiResponse.urgency ? String(aiResponse.urgency).toUpperCase() : "INFO"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground">
                        {aiResponse.summary}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Probable Causes */}
                {aiResponse.probable_causes && aiResponse.probable_causes.length > 0 && (
                  <Card className="bg-white border">
                    <CardHeader>
                      <CardTitle>Probable Causes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {aiResponse.probable_causes.map((c: any, idx: number) => {
                          const title = formatAiStep(
                            c,
                            typeof c === "string" ? c : c?.cause ? c.cause : `Cause ${idx + 1}`,
                          );
                          const confidence = c && typeof c === "object" && c.confidence ? Number(c.confidence) : null;
                          return (
                            <div key={idx} className="flex items-center justify-between">
                              <div className="flex-1 pr-4">
                                <div className="text-sm font-medium">{title}</div>
                                {confidence !== null && (
                                  <div className="text-xs text-muted-foreground">Confidence: {(confidence * 100).toFixed(0)}%</div>
                                )}
                              </div>
                              {confidence !== null && (
                                <div className="w-32">
                                  <div className="h-2 bg-gray-200 rounded overflow-hidden">
                                    <div
                                      className={`h-2 rounded ${confidence > 0.66 ? 'bg-green-500' : confidence > 0.33 ? 'bg-yellow-400' : 'bg-red-500'}`}
                                      style={{ width: `${Math.round(confidence * 100)}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Steps */}
                {aiResponse.steps && aiResponse.steps.length > 0 && (
                  <Card className="bg-white border">
                    <CardHeader>
                      <CardTitle>Recommended Steps</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ol className="list-decimal pl-6 space-y-2">
                        {aiResponse.steps.map((s: any, idx: number) => {
                          const text = formatAiStep(s, `Step ${idx + 1}`);
                          const urgency = s && typeof s === 'object' && s.urgency ? String(s.urgency) : undefined;
                          const color = urgency === 'urgent' ? 'bg-red-100 text-red-700' : urgency === 'monitor' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-50 text-blue-700';
                          return (
                            <li key={idx} className="flex items-start gap-3">
                              <div className="flex-1 text-sm">
                                <div className="mb-1">{text}</div>
                                {s.note && <div className="text-xs text-muted-foreground">{s.note}</div>}
                              </div>
                              <div className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>{urgency || 'routine'}</div>
                            </li>
                          );
                        })}
                      </ol>
                    </CardContent>
                  </Card>
                )}

                {/* Explanation */}
                {aiResponse.explanation && (
                  <Card className="bg-white border">
                    <CardHeader>
                      <CardTitle>Reasoning</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground whitespace-pre-wrap">{aiResponse.explanation}</div>
                    </CardContent>
                  </Card>
                )}

                {/* Follow-up Questions */}
                {aiResponse.follow_up_questions && aiResponse.follow_up_questions.length > 0 && (
                  <Card className="bg-white border">
                    <CardHeader>
                      <CardTitle>Follow-up Questions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {aiResponse.follow_up_questions.map((q: string, i: number) => (
                          <div key={i} className="flex items-center justify-between">
                            <div className="text-sm">{q}</div>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" onClick={() => copyText(q, i)}>
                                <Copy className="h-4 w-4" />
                              </Button>
                              {copiedQuestionIndex === i && <div className="text-xs text-green-600">Copied</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
