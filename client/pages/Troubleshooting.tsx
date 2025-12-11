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
} from "lucide-react";
import { useSupabaseCalculations } from "@/hooks/useSupabaseCalculations";
import { apiClient } from "@/lib/api";
import { consumeCalculationPreset } from "@/lib/historyPresets";
import { useToast } from "@/hooks/use-toast";
import { ApiServiceStatus } from "@/components/ApiServiceStatus";

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

  // AI state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [setAiConversationId] = useState<string | null>(null);

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
    <div className="min-h-screen bg-background text-foreground animate-in fade-in duration-500 pb-20">
      <div className="container mx-auto px-4 py-8 max-w-[1800px]">
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
                  <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900 flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <div>{aiError}</div>
                  </div>
                )}

                {!aiResponse && !aiLoading && !aiError && (
                  <div className="text-center py-12 border-2 border-dashed rounded-xl">
                    <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Ready to Analyze</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                      The AI will analyze your inputs, measurements, and uploaded photos to provide a detailed diagnosis.
                    </p>
                    <Button onClick={getAiAdvice} size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                      <Zap className="mr-2 h-4 w-4" /> Start AI Analysis
                    </Button>
                  </div>
                )}

                {aiLoading && (
                  <Card>
                    <CardContent className="py-12 flex flex-col items-center text-center">
                      <div className="h-10 w-10 relative mb-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <Bot className="relative inline-flex rounded-full h-10 w-10 text-indigo-600" />
                      </div>
                      <h3 className="text-lg font-medium">Analyzing System Data...</h3>
                      <p className="text-muted-foreground animate-pulse">Consulting technical knowledge base</p>
                    </CardContent>
                  </Card>
                )}

                {aiResponse && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-700">

                    <Card className="border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/10">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                            <Bot className="h-5 w-5" /> Expert Summary
                          </CardTitle>
                          <Badge variant={aiResponse.urgency === "urgent" ? "destructive" : "secondary"}>
                            {aiResponse.urgency ? aiResponse.urgency.toUpperCase() : "ANALYSIS"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-lg leading-relaxed text-indigo-950 dark:text-indigo-100">
                          {aiResponse.summary}
                        </div>
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {aiResponse.probable_causes && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Probable Causes</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {aiResponse.probable_causes.map((c: any, idx: number) => {
                              const confidence = c.confidence ? Number(c.confidence) : 0;
                              return (
                                <div key={idx} className="space-y-1">
                                  <div className="flex justify-between text-sm">
                                    <span className="font-medium">{c.cause}</span>
                                    <span className="text-muted-foreground">{Math.round(confidence * 100)}%</span>
                                  </div>
                                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${confidence > 0.6 ? "bg-indigo-500" : "bg-indigo-300"}`}
                                      style={{ width: `${confidence * 100}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </CardContent>
                        </Card>
                      )}

                      {aiResponse.steps && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Recommended Actions</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ol className="space-y-3">
                              {aiResponse.steps.map((s: any, idx: number) => {
                                const stepText = typeof s === "string" ? s : s.text || s.step;
                                return (
                                  <li key={idx} className="flex gap-3 text-sm">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground">
                                      {idx + 1}
                                    </div>
                                    <div>
                                      <div className="font-medium">{stepText}</div>
                                      {s.note && <div className="text-xs text-muted-foreground mt-0.5">{s.note}</div>}
                                    </div>
                                  </li>
                                );
                              })}
                            </ol>
                          </CardContent>
                        </Card>
                      )}
                    </div>

                    {aiResponse.explanation && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Technical Explanation</CardTitle>
                        </CardHeader>
                        <CardContent className="prose dark:prose-invert max-w-none text-sm text-muted-foreground whitespace-pre-wrap">
                          {aiResponse.explanation}
                        </CardContent>
                      </Card>
                    )}

                  </div>
                )}
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-[1920px] mx-auto">
        <ApiServiceStatus />
        <TroubleshootingContent />
      </div>
    </div>
  );
}

export default Troubleshooting;
