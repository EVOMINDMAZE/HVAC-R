import React, { useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Save } from "lucide-react";
import { useSupabaseCalculations } from "@/hooks/useSupabaseCalculations";

const SYMPTOMS = [
  { id: "no_cooling", label: "No/insufficient cooling" },
  { id: "icing", label: "Evaporator icing" },
  { id: "high_head", label: "High head pressure" },
  { id: "low_suction", label: "Low suction pressure" },
  { id: "short_cycling", label: "Short cycling" },
  { id: "noisy", label: "Unusual noise/vibration" },
];

export default function Troubleshooting() {
  const { saveCalculation } = useSupabaseCalculations();
  const [symptom, setSymptom] = useState<string>("no_cooling");
  const [ambient, setAmbient] = useState<string>("25");
  const [observations, setObservations] = useState<string>("");
  const [step, setStep] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

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
    return base;
  }, [symptom]);

  const recommendations = useMemo(() => {
    const rec: string[] = [];
    if (answers["airflow"] === "no") rec.push("Restore airflow: clean/replace filter, inspect blower & ducts.");
    if (answers["charge"] === "low") rec.push("Check for leaks, evacuate, weigh-in correct charge.");
    if (answers["charge"] === "high") rec.push("Recover excess, weigh charge to spec, verify subcooling.");
    if (answers["leak"] === "leak") rec.push("Perform leak detection, repair, evacuate and recharge.");
    if (answers["leak"] === "restriction") rec.push("Inspect filter drier/TEV/capillary for restriction, replace as needed.");
    if (symptom === "icing" && answers["airflow"] !== "no") rec.push("Check TEV sensing bulb and superheat setting; verify defrost logic.");
    if (symptom === "high_head" && answers["condenser"] === "dirty") rec.push("Clean condenser coil; ensure adequate ambient airflow.");
    if (symptom === "high_head" && answers["condenser"] === "fan_issue") rec.push("Diagnose condenser fan motor/capacitor and replace if faulty.");
    if (rec.length === 0) rec.push("No fault strongly indicated. Monitor operation and log detailed measurements.");
    return rec;
  }, [answers, symptom]);

  const handleAnswer = (id: string, v: string) => {
    setAnswers((prev) => ({ ...prev, [id]: v }));
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const inputs = {
        wizard: "hvac-basic",
        symptom,
        ambient_c: Number(ambient),
        answers,
        notes: observations,
      };
      const results = {
        recommendations,
        status: "completed",
        summary: `${SYMPTOMS.find((s) => s.id === symptom)?.label || "Symptom"} – ${recommendations[0]}`,
      };
      await saveCalculation("Troubleshooting", inputs, results);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header variant="dashboard" />
      <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold text-blue-900">Troubleshooting Wizards</h1>

        <Card>
          <CardHeader>
            <CardTitle>Describe the issue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Primary symptom</Label>
                <Select value={symptom} onValueChange={setSymptom}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {SYMPTOMS.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ambient (°C)</Label>
                <input
                  type="number"
                  className="mt-1 w-full border rounded px-3 py-2"
                  value={ambient}
                  onChange={(e) => setAmbient(e.target.value)}
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
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Guided Checks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {steps.map((st, idx) => (
              <div key={st.id} className={`p-4 rounded border ${idx <= step ? "bg-white" : "bg-gray-50 opacity-70"}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={idx <= step ? "default" : "outline"}>Step {idx + 1}</Badge>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-6 space-y-2">
              {recommendations.map((r, i) => (
                <li key={i} className="text-sm">{r}</li>
              ))}
            </ul>
            <div className="mt-4">
              <Button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2">
                <Save className="h-4 w-4" /> Save Session
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
