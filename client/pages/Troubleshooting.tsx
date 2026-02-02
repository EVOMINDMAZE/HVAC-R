import React, { useMemo, useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Save,
  AlertTriangle,
  Clock,
  CheckCircle,
  HelpCircle,
  Thermometer,
  Activity,
  Zap,
  FileText,
  Bot,
  ArrowLeft,
  RotateCcw,
  Stethoscope,
  AlertCircle,
  Terminal,
  Check,
} from "lucide-react";
import { useSupabaseCalculations } from "@/hooks/useSupabaseCalculations";
import { apiClient } from "@/lib/api";
import { consumeCalculationPreset } from "@/lib/historyPresets";
import { useToast } from "@/hooks/use-toast";
import { ApiServiceStatus } from "@/components/ApiServiceStatus";
import { PageContainer } from "@/components/PageContainer";


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

function AiAnalysisDisplay({ data }: { data: any }) {
  if (!data) return null;

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-5 duration-700">

      {/* 1. Expert Summary Badge & Content */}
      <Card className="overflow-hidden border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 shadow-xl">
        <div className="absolute top-0 left-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-600 h-full" />
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-white dark:from-slate-900 dark:to-slate-900 border-b border-indigo-100 dark:border-indigo-900/50 pb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center border border-indigo-200 dark:border-indigo-700">
                <Bot className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-indigo-950 dark:text-indigo-100">Expert Analysis</CardTitle>
                <CardDescription className="text-indigo-600/80 dark:text-indigo-300">
                  AI-Generated Diagnostic Report
                </CardDescription>
              </div>
            </div>

            {data.urgency && (
              <Badge
                variant={data.urgency.toLowerCase() === "urgent" ? "destructive" : "outline"}
                className={`
                  px-4 py-1.5 text-sm font-medium uppercase tracking-wide
                  ${data.urgency.toLowerCase() !== "urgent" ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800" : ""}
                `}
              >
                {data.urgency} Priority
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6 pb-8 px-6 md:px-8">
          <div className="text-lg md:text-xl leading-relaxed text-slate-700 dark:text-slate-200 font-medium">
            {data.summary}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* 2. Probable Causes */}
        {data.probable_causes && data.probable_causes.length > 0 && (
          <Card className="h-full border-border shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-amber-500" />
                Probable Causes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {data.probable_causes.map((c: any, idx: number) => {
                const confidence = c.confidence !== undefined ? Number(c.confidence) : 0;
                const showConfidence = confidence > 0;

                return (
                  <div key={idx} className="group">
                    <div className="flex justify-between items-end mb-2">
                      <span className="font-semibold text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {c.cause}
                      </span>
                      {showConfidence && (
                        <span className="text-sm font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          {Math.round(confidence * 100)}%
                        </span>
                      )}
                    </div>
                    {showConfidence && (
                      <div className="h-2.5 w-full bg-secondary/50 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ease-out ${confidence > 0.7 ? "bg-amber-500" :
                            confidence > 0.4 ? "bg-amber-400" : "bg-amber-300"
                            }`}
                          style={{ width: `${confidence * 100}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* 3. Recommended Actions */}
        {data.steps && data.steps.length > 0 && (
          <Card className="h-full border-border shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                Recommended Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.steps.map((s: any, idx: number) => {
                  const stepText = typeof s === "string" ? s : s.text || s.step;
                  const stepNote = typeof s === "object" ? s.note : null;

                  return (
                    <div key={idx} className="flex gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-sm font-bold border border-emerald-200 dark:border-emerald-800">
                        {idx + 1}
                      </div>
                      <div className="pt-1">
                        <div className="font-medium text-foreground">{stepText}</div>
                        {stepNote && (
                          <div className="text-sm text-muted-foreground mt-1 flex items-start gap-1.5">
                            <span className="mt-1 block h-1 w-1 rounded-full bg-muted-foreground/50" />
                            {stepNote}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 4. Technical Explanation */}
      {data.explanation && (
        <Card className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-slate-700 dark:text-slate-300">
              <Terminal className="h-4 w-4" /> Technical Explanation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-slate dark:prose-invert max-w-none text-sm md:text-base leading-relaxed text-muted-foreground">
              {data.explanation}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 5. Follow-up Questions (Optional) */}
      {data.follow_up_questions && data.follow_up_questions.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center pt-4">
          {data.follow_up_questions.map((q: string, i: number) => (
            <Badge key={i} variant="secondary" className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground cursor-help transition-colors border-dashed">
              ? {q}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export function TroubleshootingContent() {
  const { saveCalculation } = useSupabaseCalculations();
  const { toast } = useToast();

  // --- State ---
  const [symptom, setSymptom] = useState<string>("no_cooling");
  const [ambient, setAmbient] = useState<string>("25");
  const [unit, setUnit] = useState<"C" | "F">("C");
  const [observations, setObservations] = useState<string>("");
  const [step, setStep] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState<"wizard" | "ai">("wizard");
  const [userRole, setUserRole] = useState<"technician" | "homeowner">("technician");

  // AI state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiConversationId, setAiConversationId] = useState<string | null>(null);

  // Structured measurements
  const [suctionPressure, setSuctionPressure] = useState<string>("");
  const [headPressure, setHeadPressure] = useState<string>("");
  const [voltage, setVoltage] = useState<string>("");
  const [current, setCurrent] = useState<string>("");
  const [modelSerial, setModelSerial] = useState<string>("");

  // --- Effects ---
  useEffect(() => {
    try {
      const preset = consumeCalculationPreset();
      if (!preset || preset.type !== "Troubleshooting" || !preset.inputs) return;

      const inputs: any = preset.inputs;
      if (inputs.symptom) setSymptom(String(inputs.symptom));

      if (inputs.ambient) {
        if (inputs.ambient.value !== undefined) setAmbient(String(inputs.ambient.value));
        if (inputs.ambient.unit) setUnit(String(inputs.ambient.unit) as "C" | "F");
      }

      if (inputs.measurements) {
        setSuctionPressure(String(inputs.measurements.suction_pressure_kpa || ""));
        setHeadPressure(String(inputs.measurements.head_pressure_kpa || ""));
        setVoltage(String(inputs.measurements.voltage_v || ""));
        setCurrent(String(inputs.measurements.current_a || ""));
        setModelSerial(String(inputs.measurements.model_serial || ""));
      }

      if (inputs.notes) setObservations(String(inputs.notes));
      if (inputs.answers && typeof inputs.answers === "object") setAnswers(inputs.answers);

      if (Array.isArray(inputs.attachments)) {
        setAttachments(inputs.attachments.map((a: any) => (typeof a === "string" ? a : a.url || "")));
      }

      if (preset.results) {
        setAiResponse(preset.results);
        setMode("ai");
      }
    } catch (e) {
      console.warn("Failed to apply calculation preset", e);
    }
  }, []);

  const steps = useMemo(() => {
    const base = [
      {
        id: "airflow",
        title: "Airflow Check",
        q: "Is airflow unobstructed and is the filter clean?",
        icon: <RotateCcw className="h-5 w-5" />,
        options: [
          { v: "yes", label: "Yes, clear", description: "Filter clean, vents open" },
          { v: "no", label: "No, obstructed", description: "Filter dirty or vents blocked" },
        ],
      },
      {
        id: "charge",
        title: "Refrigerant Charge",
        q: "Are system pressures, superheat, and subcooling within expected ranges?",
        icon: <Thermometer className="h-5 w-5" />,
        options: [
          { v: "ok", label: "Within range", description: "Pressures/temps look normal" },
          { v: "low", label: "Likely undercharge", description: "Low pressure, high superheat" },
          { v: "high", label: "Likely overcharge", description: "High pressure, high subcooling" },
        ],
      },
      {
        id: "leak",
        title: "Leak Inspection",
        q: "Are there any visible signs of leaks (oil spots) or flow restrictions?",
        icon: <AlertTriangle className="h-5 w-5" />,
        options: [
          { v: "none", label: "No issues found", description: "System is sealed" },
          { v: "leak", label: "Leak suspected", description: "Oil traces or detector alert" },
          { v: "restriction", label: "Restriction suspected", description: "Temperature drop across drier/TXV" },
        ],
      },
    ];

    if (symptom === "high_head") {
      return [
        base[0],
        {
          id: "condenser",
          title: "Condenser Inspection",
          q: "Is the condenser coil clean and the fan operating correctly?",
          icon: <Activity className="h-5 w-5" />,
          options: [
            { v: "ok", label: "Clean & Running", description: "Coil clear, fan normal" },
            { v: "dirty", label: "Dirty Coil", description: "Debris blocking airflow" },
            { v: "fan_issue", label: "Fan Issue", description: "Fan not spinning or slow" },
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
          title: "Airflow Obstruction",
          q: "Is airflow unobstructed? check filters, dampers, and blower.",
          icon: <RotateCcw className="h-5 w-5" />,
          options: [
            { v: "yes", label: "Clear", description: "No blockages found" },
            { v: "no", label: "Obstructed", description: "Filter clogged or return blocked" },
            { v: "partial", label: "Weak Airflow", description: "Low velocity detected" },
          ],
        },
        {
          id: "ducts",
          title: "Ductwork & Registers",
          q: "Are there closed registers, crushed ducts, or disconnects?",
          icon: <Activity className="h-5 w-5" />,
          options: [
            { v: "no", label: "Good", description: "Ducts intact, registers open" },
            { v: "blocked", label: "Blocked/Closed", description: "Registers closed off" },
            { v: "leak", label: "Leak/Damaged", description: "Ducts disconnected or torn" },
          ],
        },
      ];
    }

    if (symptom === "no_heat") {
      return [
        {
          id: "power",
          title: "Power & Fuel Supply",
          q: "Is the unit receiving power and/or fuel (gas/oil)?",
          icon: <Zap className="h-5 w-5" />,
          options: [
            { v: "ok", label: "Yes, Powered", description: "Voltage/Fuel present" },
            { v: "power_loss", label: "No Power", description: "Breaker tripped or fuse blown" },
            { v: "fuel_loss", label: "No Fuel", description: "Gas valve closed or tank empty" },
          ],
        },
        base[1],
      ];
    }

    return base;
  }, [symptom]);

  const recommendations = useMemo(() => {
    const rec: string[] = [];
    if (answers["airflow"] === "no") rec.push("Restore airflow: clean/replace filter, inspect blower & ducts.");
    if (answers["airflow"] === "partial") rec.push("Partial airflow: check blower speed, capacitor, and damper positions.");
    if (answers["charge"] === "low") rec.push("Check for leaks, evacuate, and weigh-in correct charge.");
    if (answers["charge"] === "high") rec.push("Recover excess refrigerant, weigh charge to spec, verify subcooling.");
    if (answers["leak"] === "leak") rec.push("High risk of refrigerant leak — shut off and contact technician.");
    if (answers["leak"] === "restriction") rec.push("Inspect filter drier, TEV, and capillary tubes for restriction.");

    if (symptom === "high_head") {
      if (answers["condenser"] === "dirty") rec.push("Clean condenser coil thoroughly; ensure adequate ambient airflow.");
      if (answers["condenser"] === "fan_issue") rec.push("Diagnose condenser fan motor and capacitor; replace if faulty.");
    }

    if (symptom === "no_heat") {
      if (answers["power"] === "power_loss") rec.push("Confirm power at panel and breakers; reset trip and retry.");
      if (answers["power"] === "fuel_loss") rec.push("Check fuel supply line, valves, and pilot/ignition systems.");
    }

    if (rec.length === 0 && step >= steps.length) {
      rec.push("No obvious fault identified by basic checks. Recommend deeper analysis or AI consultation.");
    }
    return rec;
  }, [answers, symptom, step, steps.length]);

  const severity = useMemo(() => {
    if (answers["leak"] === "leak") return "high";
    if (answers["condenser"] === "fan_issue") return "high";
    if (answers["power"] === "power_loss") return "high";
    if (answers["airflow"] === "partial" || answers["airflow"] === "no") return "medium";
    if (answers["charge"] === "low" || answers["charge"] === "high") return "medium";
    return "low";
  }, [answers]);

  const handleAnswer = (id: string, v: string) => {
    setAnswers((prev) => ({ ...prev, [id]: v }));
    if (step < steps.length) {
      setTimeout(() => setStep((s) => s + 1), 200);
    }
  };

  const restartWizard = () => {
    setStep(0);
    setAnswers({});
    setMode("wizard");
  };

  const uploadFile = async (file: File) => {
    if (!file) return null;
    setUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(String(fr.result || ""));
        fr.onerror = (err) => reject(err);
        fr.readAsDataURL(file);
      });
      const base64 = dataUrl.split(",")[1] || "";
      const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
      const token = localStorage.getItem("simulateon_token");

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

      if (!resp.ok) throw new Error("Upload failed");
      const j = await resp.json();
      if (j?.publicUrl) {
        setAttachments((prev) => [...prev, j.publicUrl]);
        toast({ title: "File uploaded", description: "Attachment added successfully." });
      }
    } catch (e) {
      console.warn("Upload failed", e);
      toast({ variant: "destructive", title: "Upload failed", description: "Could not upload file." });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let ambientC = Number(ambient);
      if (unit === "F") ambientC = ((ambientC - 32) * 5) / 9;

      const inputs = {
        wizard: "hvac-basic",
        symptom,
        ambient: { value: Number(ambient), unit, ambient_c: Number(ambientC.toFixed(2)) },
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
        recommendations: aiResponse ? aiResponse.steps : recommendations,
        severity: aiResponse?.urgency || severity,
        status: "completed",
        summary: aiResponse?.summary || `${SYMPTOMS.find((s) => s.id === symptom)?.label} diagnosis`,
      };

      await saveCalculation("Troubleshooting", inputs, results);

      toast({
        title: "Session Saved",
        description: "Your troubleshooting session has been saved to history.",
      });
    } catch (e) {
      toast({ variant: "destructive", title: "Save failed", description: "Could not save session." });
    } finally {
      setSaving(false);
    }
  };

  const getAiAdvice = async () => {
    setMode("ai");
    setAiError(null);
    setAiLoading(true);
    setAiResponse(null);

    window.scrollTo({ top: 0, behavior: "smooth" });

    try {
      let ambientC = Number(ambient);
      if (unit === "F") ambientC = ((ambientC - 32) * 5) / 9;

      const payload = {
        payload: {
          wizard: "hvac-basic",
          symptom,
          ambient: { value: Number(ambient), unit, ambient_c: Number(ambientC.toFixed(2)) },
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
        userRole: userRole,
      };

      const resp = await apiClient.aiTroubleshoot(payload);

      if (!resp || !resp.success) {
        throw new Error(resp?.error || "AI service returned an error");
      }

      const sanitizeString = (s: any) => {
        if (typeof s !== "string") return s;
        return s.replace(/```json/g, "").replace(/```/g, "").trim();
      };

      let data = resp.data;
      if (typeof data === "string") {
        try { data = JSON.parse(sanitizeString(data)); } catch (e) { }
      }

      setAiResponse(data);
      if (data?.conversationId) setAiConversationId(data.conversationId);

    } catch (e: any) {
      console.error("AI request failed", e);
      setAiError(e.message || "An unexpected error occurred.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="space-y-8">


        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              Diagnostic Wizard
            </h1>
            <p className="text-muted-foreground mt-1">
              Interactive troubleshooting guide for HVAC systems
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" /> Save Session
            </Button>
            <Button
              onClick={getAiAdvice}
              disabled={aiLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
            >
              <Bot className="mr-2 h-4 w-4" /> {aiLoading ? "Analyzing..." : "Ask AI Expert"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">

          {/* LEFT SIDEBAR: CONTEXT & INPUTS */}
          <div className="xl:col-span-4 space-y-6 xl:sticky xl:top-24">

            <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-primary" />
                  Session Context
                </CardTitle>
                <CardDescription>Basic system information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">

                <div className="space-y-2">
                  <Label>Primary Symptom</Label>
                  <Select value={symptom} onValueChange={(v) => { setSymptom(v); setStep(0); setAnswers({}); }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SYMPTOMS.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ambient Temp</Label>
                    <div className="flex">
                      <Input
                        type="number"
                        value={ambient}
                        onChange={(e) => setAmbient(e.target.value)}
                        className="rounded-r-none focus-visible:ring-0"
                      />
                      <Button
                        variant="outline"
                        className="rounded-l-none border-l-0 px-3 min-w-[3rem]"
                        onClick={() => setUnit(unit === "C" ? "F" : "C")}
                      >
                        °{unit}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Model/Serial</Label>
                    <Input
                      placeholder="Optional"
                      value={modelSerial}
                      onChange={(e) => setModelSerial(e.target.value)}
                    />
                  </div>
                </div>

              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Measurements
                </CardTitle>
                <CardDescription>Enter known values to aid diagnosis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Suction (kPa)</Label>
                    <Input placeholder="0" value={suctionPressure} onChange={(e) => setSuctionPressure(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Head (kPa)</Label>
                    <Input placeholder="0" value={headPressure} onChange={(e) => setHeadPressure(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Voltage (V)</Label>
                    <Input placeholder="0" value={voltage} onChange={(e) => setVoltage(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Current (A)</Label>
                    <Input placeholder="0" value={current} onChange={(e) => setCurrent(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Additional Notes</Label>
                  <Textarea
                    placeholder="Describe observations..."
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Attachments</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="file"
                      className="text-xs file:mr-4 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:bg-secondary file:text-secondary-foreground hover:file:bg-secondary/80"
                      onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])}
                    />
                    {uploading && <Clock className="h-4 w-4 animate-spin text-muted-foreground" />}
                  </div>
                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {attachments.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer" className="block w-12 h-12 rounded border overflow-hidden hover:opacity-80 transition-opacity">
                          <img src={url} alt="attachment" className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {mode === "wizard" && (
              <Card className="border-border/50 bg-muted/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Diagnostic Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 relative">
                    <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border -z-10" />

                    {steps.map((s, i) => (
                      <div key={s.id} className="flex gap-3 items-center">
                        <div className={`
                                        w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border
                                        ${i === step ? "bg-primary text-primary-foreground border-primary" :
                            i < step ? "bg-green-500 text-white border-green-500" : "bg-background border-muted-foreground text-muted-foreground"}
                                        transition-colors duration-300
                                    `}>
                          {i < step ? <Check className="h-3 w-3" /> : (i + 1)}
                        </div>
                        <div className={i === step ? "font-medium text-foreground" : "text-muted-foreground"}>
                          {s.title}
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-3 items-center">
                      <div className={`
                                    w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border
                                    ${step >= steps.length ? "bg-primary text-primary-foreground border-primary" : "bg-background border-muted-foreground text-muted-foreground"}
                                `}>
                        <FileText className="h-3 w-3" />
                      </div>
                      <div className={step >= steps.length ? "font-medium text-foreground" : "text-muted-foreground"}>
                        Results
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

          </div>

          <div className="xl:col-span-8 space-y-6">

            <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
                <TabsTrigger value="wizard">Step-by-Step Guide</TabsTrigger>
                <TabsTrigger value="ai">AI Expert Analysis</TabsTrigger>
              </TabsList>

              {/* Role Selector for AI Context */}
              {mode === "ai" && (
                <div className="mb-6 bg-muted/40 p-3 rounded-lg border border-border/50 flex items-center justify-between">
                  <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    AI Persona:
                  </div>
                  <Tabs value={userRole} onValueChange={(v) => setUserRole(v as any)} className="w-[240px]">
                    <TabsList className="grid w-full grid-cols-2 h-8">
                      <TabsTrigger value="technician" className="text-xs">Technician</TabsTrigger>
                      <TabsTrigger value="homeowner" className="text-xs">Homeowner</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              )}

              <TabsContent value="wizard" className="mt-0 space-y-6">
                {step < steps.length ? (
                  <Card className="border-t-4 border-t-primary shadow-lg overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                      <HelpCircle className="w-64 h-64" />
                    </div>

                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <Badge variant="outline" className="mb-2">Step {step + 1} of {steps.length}</Badge>
                        <Button variant="ghost" size="sm" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
                          <ArrowLeft className="h-4 w-4 mr-2" /> Back
                        </Button>
                      </div>
                      <CardTitle className="text-2xl md:text-3xl font-bold leading-tight">
                        {steps[step].q}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-8 pb-12">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {steps[step].options.map((opt) => (
                          <button
                            key={opt.v}
                            onClick={() => handleAnswer(steps[step].id, opt.v)}
                            className={`
                                                relative flex flex-col items-start p-6 rounded-xl border-2 transition-all duration-200 text-left hover:scale-[1.02]
                                                ${answers[steps[step].id] === opt.v
                                ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary"
                                : "border-border bg-card hover:border-primary/50 hover:bg-accent/50"}
                                            `}
                          >
                            <div className="font-semibold text-lg mb-1">{opt.label}</div>
                            <div className="text-sm text-muted-foreground">{opt.description}</div>
                            {answers[steps[step].id] === opt.v && (
                              <div className="absolute top-4 right-4 text-primary">
                                <CheckCircle className="h-6 w-6" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/30 dark:to-emerald-900/10 border-green-200 dark:border-green-900">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-300">
                          <CheckCircle className="h-6 w-6" />
                          Calculations Complete
                        </CardTitle>
                        <CardDescription>Based on your inputs, here are the recommendations.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-background/80 backdrop-blur rounded-lg p-6 border shadow-sm">
                          <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <Terminal className="h-4 w-4 text-muted-foreground" />
                            System Diagnosis
                          </h3>
                          <ul className="space-y-3">
                            {recommendations.map((rec, i) => (
                              <li key={i} className="flex gap-3 text-sm md:text-base items-start">
                                <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="mt-6 flex flex-col sm:flex-row gap-4">
                          <Button className="flex-1" onClick={getAiAdvice} disabled={aiLoading}>
                            <Bot className="mr-2 h-4 w-4" /> Get AI Expert Analysis
                          </Button>
                          <Button variant="outline" onClick={handleSave} disabled={saving}>
                            <Save className="mr-2 h-4 w-4" /> Save Result
                          </Button>
                          <Button variant="ghost" onClick={restartWizard}>
                            <RotateCcw className="mr-2 h-4 w-4" /> Start Over
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="ai" className="mt-0 space-y-6">
                {aiError && (
                  <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <div>{aiError}</div>
                  </div>
                )}

                {!aiResponse && !aiLoading && !aiError && (
                  <div className="text-center py-16 border-2 border-dashed border-indigo-200 dark:border-indigo-900 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/10">
                    <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Bot className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">AI Expert Ready</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto mb-8">
                      Our advanced AI engine will analyze your inputs, measurements, and photos to provide a professional-grade diagnosis.
                    </p>
                    <Button onClick={getAiAdvice} size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/20 h-12 px-8 text-base transition-all hover:scale-105">
                      <Zap className="mr-2 h-5 w-5" /> Start Analysis
                    </Button>
                  </div>
                )}

                {aiLoading && (
                  <Card className="border-none shadow-lg bg-gradient-to-b from-white to-indigo-50/50 dark:from-slate-900 dark:to-slate-900/50">
                    <CardContent className="py-20 flex flex-col items-center text-center">
                      <div className="relative mb-8">
                        <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 animate-pulse rounded-full" />
                        <div className="h-16 w-16 relative bg-white dark:bg-slate-800 rounded-full shadow-lg flex items-center justify-center border-2 border-indigo-100 dark:border-indigo-900 z-10">
                          <Bot className="h-8 w-8 text-indigo-600 animate-pulse" />
                        </div>
                        <svg className="absolute top-0 left-0 w-full h-full -m-1 animate-[spin_3s_linear_infinite]" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-600 dashed opacity-30" strokeDasharray="10 10" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Analyzing System Data...</h3>
                      <div className="text-muted-foreground max-w-xs mx-auto space-y-1 text-sm">
                        <p className="animate-[fade-in_2s_ease-in-out_infinite]">Reviewing provided symptoms...</p>
                        <p className="animate-[fade-in_2s_ease-in-out_1s_infinite]">Consulting technical diagnostics knowledge base...</p>
                        <p className="animate-[fade-in_2s_ease-in-out_2s_infinite]">Generating recommendations...</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {aiResponse && <AiAnalysisDisplay data={aiResponse} />}
              </TabsContent>
            </Tabs>

          </div>
        </div>
      </div>
    </div>
  );
}


export function Troubleshooting() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900 pb-20">
      <PageContainer variant="standard">
        <ApiServiceStatus />
        <TroubleshootingContent />
      </PageContainer>
    </div>
  );
}


export default Troubleshooting;


