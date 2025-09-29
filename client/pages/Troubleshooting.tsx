import React, { useMemo, useState } from "react";
import { Header } from "@/components/Header";
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
import { Save } from "lucide-react";
import { useSupabaseCalculations } from "@/hooks/useSupabaseCalculations";

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
  const [unit, setUnit] = useState<"C"|"F">("C");
  const [observations, setObservations] = useState<string>("");
  const [step, setStep] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // Structured measurements
  const [suctionPressure, setSuctionPressure] = useState<string>("");
  const [headPressure, setHeadPressure] = useState<string>("");
  const [voltage, setVoltage] = useState<string>("");
  const [current, setCurrent] = useState<string>("");
  const [modelSerial, setModelSerial] = useState<string>("");

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
      rec.push("High risk of refrigerant leak — shut off and contact technician.");
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

  const computeSeverity = () => {
    // high: leak suspected, power loss, fan issue
    if (answers["leak"] === "leak") return "high";
    if (answers["condenser"] === "fan_issue") return "high";
    if (answers["power"] === "power_loss") return "high";

    // medium: airflow partial/blocked, charge issues
    if (answers["airflow"] === "partial" || answers["airflow"] === "no") return "medium";
    if (answers["charge"] === "low" || answers["charge"] === "high") return "medium";

    return "low";
  };

  const severity = computeSeverity();

  const uploadFile = async (file: File) => {
    if (!file) return null;
    setUploading(true);
    try {
      const { supabase } = await import("@/lib/supabase");
      if (!supabase) throw new Error("Storage not configured");
      const bucket = "troubleshooting-uploads";
      const timestamp = Date.now();
      const path = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
      const res = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
      if (res.error) throw res.error;
      // get public url
      const urlRes = supabase.storage.from(bucket).getPublicUrl(path);
      const publicUrl = (urlRes && (urlRes as any).data?.publicUrl) || null;
      if (publicUrl) {
        setAttachments((prev) => [...prev, publicUrl]);
        return publicUrl;
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
        window.dispatchEvent(new CustomEvent("app:success", { detail: { title: "Session saved", message: "Troubleshooting session saved to your history." } }));
      } catch (e) {}
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header variant="dashboard" />
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
                <div className="text-xs text-muted-foreground mt-1">Acceptable range: -50 to 80 °C (or equivalent °F)</div>
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
                <div className="text-sm font-medium mb-2">Measurements (optional)</div>
                <div className="grid md:grid-cols-4 gap-2">
                  <input className="border rounded px-2 py-1" placeholder="Suction press (kPa)" value={suctionPressure} onChange={(e) => setSuctionPressure(e.target.value)}/>
                  <input className="border rounded px-2 py-1" placeholder="Head press (kPa)" value={headPressure} onChange={(e) => setHeadPressure(e.target.value)}/>
                  <input className="border rounded px-2 py-1" placeholder="Voltage (V)" value={voltage} onChange={(e) => setVoltage(e.target.value)}/>
                  <input className="border rounded px-2 py-1" placeholder="Current (A)" value={current} onChange={(e) => setCurrent(e.target.value)}/>
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
                  {uploading && <div className="text-sm text-muted-foreground mt-2">Uploading…</div>}
                  {attachments.length > 0 && (
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {attachments.map((a) => (
                        <a key={a} href={a} target="_blank" rel="noreferrer" className="inline-block border rounded overflow-hidden">
                          <img src={a} alt="attachment" className="h-20 w-28 object-cover" />
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
                <div className="text-xs text-muted-foreground">Step {Math.min(step + 1, steps.length)} of {steps.length}</div>
              </div>
              <div className="w-full">
                <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`absolute left-0 top-0 h-3 rounded-full ${severity === "high" ? "bg-red-500" : severity === "medium" ? "bg-yellow-400" : "bg-green-500"}`} style={{ width: `${Math.round(((step+1)/Math.max(1, steps.length))*100)}%` }} />
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
                <div className={`text-sm font-semibold ${severity === "high" ? "text-red-600" : severity === "medium" ? "text-yellow-600" : "text-green-600"}`}>
                  {severity === "high" ? "Urgent" : severity === "medium" ? "Action recommended" : "Low priority"}
                </div>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                {recommendations.slice(0,2).map((r,i) => (<div key={i} className="mb-1">• {r}</div>))}
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
            <div className="mt-4">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2"
              >
                <Save className="h-4 w-4" /> Save Session
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
