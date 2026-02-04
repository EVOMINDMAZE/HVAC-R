import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Wind,
  Thermometer,
  Droplets,
  ShieldCheck,
  Camera,
  ChevronRight,
  ChevronLeft,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Smile,
  Frown,
  Meh,
  Sparkles,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

export default function IAQWizard() {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);

  // Form Data
  const [formData, setFormData] = useState({
    client_id: "",
    temperature_f: 72,
    humidity_percent: 45,
    co2_ppm: 600,
    voc_level: "low",
    pm25_level: 5,
    notes: "",
    checklist: {
      mold_visible: false,
      dust_accumulation: false,
      pet_odors: false,
      coil_rust: false,
      filter_dirty: false,
    },
  });

  // Score State
  const [scores, setScores] = useState({
    overall: 0,
    wellness: 0,
    comfort: 0,
    unit_health: 0,
  });

  useEffect(() => {
    if (user) {
      fetchClients();
    }
  }, [user]);

  // Calculate score whenever measurements change
  useEffect(() => {
    calculateIAQScore();
  }, [formData]);

  const fetchClients = async () => {
    const { data } = await supabase.from("clients").select("id, name");
    if (data) setClients(data);
  };

  const calculateIAQScore = () => {
    // Simple but effective scoring logic
    let wellness = 100;
    let comfort = 100;
    let unit_health = 100;

    // 1. Humidity (Comfort & Wellness)
    if (formData.humidity_percent < 30 || formData.humidity_percent > 60) {
      comfort -= 20;
      wellness -= 10;
    }

    // 2. CO2 (Wellness)
    if (formData.co2_ppm > 1000) wellness -= 30;
    else if (formData.co2_ppm > 800) wellness -= 10;

    // 3. VOCs (Wellness)
    if (formData.voc_level === "high") wellness -= 40;
    else if (formData.voc_level === "medium") wellness -= 15;

    // 4. Checklist Impacts
    if (formData.checklist.mold_visible) wellness -= 50;
    if (formData.checklist.filter_dirty) {
      unit_health -= 30;
      wellness -= 10;
    }
    if (formData.checklist.coil_rust) unit_health -= 40;

    // Clamp
    const clamp = (val: number) => Math.max(0, Math.min(100, val));

    const finalWellness = clamp(wellness);
    const finalComfort = clamp(comfort);
    const finalUnitHealth = clamp(unit_health);
    const overall = Math.round(
      finalWellness * 0.5 + finalComfort * 0.3 + finalUnitHealth * 0.2,
    );

    setScores({
      wellness: finalWellness,
      comfort: finalComfort,
      unit_health: finalUnitHealth,
      overall: overall,
    });
  };

  const handleSubmit = async () => {
    if (!formData.client_id) {
      toast({
        title: "Client Required",
        description: "Please select a client first.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Find company ID for the user
      const { data: company } = await supabase
        .from("companies")
        .select("id")
        .eq("user_id", user?.id)
        .single();
      if (!company) throw new Error("No company linked to account.");

      const { error } = await supabase.from("iaq_audits").insert({
        company_id: company.id,
        client_id: formData.client_id,
        technician_id: user?.id,
        temperature_f: formData.temperature_f,
        humidity_percent: formData.humidity_percent,
        co2_ppm: formData.co2_ppm,
        voc_level: formData.voc_level,
        pm25_level: formData.pm25_level,
        checklist: formData.checklist,
        overall_score: scores.overall,
        wellness_score: scores.wellness,
        comfort_score: scores.comfort,
        unit_health_score: scores.unit_health,
        notes: formData.notes,
        status: "completed",
      });

      if (error) throw error;
      setStep(5); // Success state
      toast({
        title: "Audit Saved",
        description: "Indoor Health report successfully generated.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
      {/* Background elements */}
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-orange-600/10 to-transparent pointer-events-none" />

      <div className="w-full max-w-2xl z-10">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-orange-100 dark:bg-orange-900/30 rounded-2xl mb-4 text-orange-600 dark:text-orange-400">
            <Wind className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Indoor Health Wizard
          </h1>
          <p className="text-slate-500">
            Calculate IAQ scores and generate "Unit Passports".
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="border-none shadow-xl ring-1 ring-slate-200 dark:ring-slate-800">
                <CardHeader>
                  <CardTitle>Client Selection</CardTitle>
                  <CardDescription>
                    Who are we performing this audit for?
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Select Client</Label>
                    <Select
                      value={formData.client_id}
                      onValueChange={(v) =>
                        setFormData({ ...formData, client_id: v })
                      }
                    >
                      <SelectTrigger className="h-12 text-lg">
                        <SelectValue placeholder="Search clients..." />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-800 text-sm text-orange-700 dark:text-orange-300 flex gap-3">
                    <Info className="h-5 w-5 shrink-0" />
                    <p>
                      This audit will generate a professional PDF report that
                      can be shared instantly with the client.
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full h-12 text-lg font-bold"
                    disabled={!formData.client_id}
                    onClick={nextStep}
                  >
                    Continue <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="border-none shadow-xl ring-1 ring-slate-200 dark:ring-slate-800">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    Environmental Entry
                    <Badge
                      variant="outline"
                      className="text-orange-600 border-orange-200 uppercase"
                    >
                      Step 2/4
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Input data from your handheld IAQ monitor.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Temperature Slider */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="flex items-center gap-2">
                        <Thermometer className="h-4 w-4 text-orange-500" />{" "}
                        Temperature (°F)
                      </Label>
                      <span className="text-2xl font-black text-slate-800 dark:text-slate-100">
                        {formData.temperature_f}°
                      </span>
                    </div>
                    <Slider
                      value={[formData.temperature_f]}
                      min={60}
                      max={85}
                      step={1}
                      onValueChange={([v]) =>
                        setFormData({ ...formData, temperature_f: v })
                      }
                    />
                  </div>

                  {/* Humidity Slider */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="flex items-center gap-2">
                        <Droplets className="h-4 w-4 text-orange-500" />{" "}
                        Humidity (%)
                      </Label>
                      <span className="text-2xl font-black text-slate-800 dark:text-slate-100">
                        {formData.humidity_percent}%
                      </span>
                    </div>
                    <Slider
                      value={[formData.humidity_percent]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={([v]) =>
                        setFormData({ ...formData, humidity_percent: v })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>CO2 (PPM)</Label>
                      <Input
                        type="number"
                        className="h-12 font-bold text-lg"
                        value={formData.co2_ppm}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            co2_ppm: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>VOC Level</Label>
                      <Select
                        value={formData.voc_level}
                        onValueChange={(v) =>
                          setFormData({ ...formData, voc_level: v })
                        }
                      >
                        <SelectTrigger className="h-12 font-bold text-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low (Clean)</SelectItem>
                          <SelectItem value="medium">
                            Medium (Odor/Stale)
                          </SelectItem>
                          <SelectItem value="high">
                            High (Chemical/Toxic)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-4">
                  <Button
                    variant="ghost"
                    onClick={prevStep}
                    className="px-6 h-12"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button
                    className="flex-1 h-12 text-lg font-bold"
                    onClick={nextStep}
                  >
                    Analyze Components <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="border-none shadow-xl ring-1 ring-slate-200 dark:ring-slate-800">
                <CardHeader>
                  <CardTitle>Physical Inspection</CardTitle>
                  <CardDescription>
                    Visual markers identified during the visit.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      id: "mold_visible",
                      label: "Visible Mold/Mildew Growth",
                      icon: <Frown className="text-red-500 h-4 w-4" />,
                    },
                    {
                      id: "filter_dirty",
                      label: "Clogged / Dirty Filter",
                      icon: (
                        <AlertTriangle className="text-orange-500 h-4 w-4" />
                      ),
                    },
                    {
                      id: "dust_accumulation",
                      label: "Excessive Dust on Registers",
                      icon: <Wind className="text-slate-400 h-4 w-4" />,
                    },
                    {
                      id: "pet_odors",
                      label: "Noticeable Pet/Smoke Odors",
                      icon: <Meh className="text-orange-400 h-4 w-4" />,
                    },
                    {
                      id: "coil_rust",
                      label: "Evap Coil Rust / Corrosion",
                      icon: <Info className="text-amber-600 h-4 w-4" />,
                    },
                  ].map((item) => (
                    <div
                      key={item.id}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          checklist: {
                            ...formData.checklist,
                            [item.id]:
                              !formData.checklist[
                                item.id as keyof typeof formData.checklist
                              ],
                          },
                        })
                      }
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex justify-between items-center ${formData.checklist[item.id as keyof typeof formData.checklist] ? "bg-red-50 border-red-500 dark:bg-red-900/10" : "bg-white border-slate-100 hover:border-orange-300 dark:bg-slate-950 dark:border-slate-800"}`}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        <span className="font-bold text-slate-700 dark:text-slate-200">
                          {item.label}
                        </span>
                      </div>
                      {formData.checklist[
                        item.id as keyof typeof formData.checklist
                      ] && <Badge className="bg-red-600">Detected</Badge>}
                    </div>
                  ))}
                </CardContent>
                <CardFooter className="flex gap-4">
                  <Button
                    variant="ghost"
                    onClick={prevStep}
                    className="px-6 h-12"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button
                    className="flex-1 h-12 text-lg font-bold bg-orange-600 hover:bg-orange-700"
                    onClick={nextStep}
                  >
                    View Scoring <ShieldCheck className="ml-2 h-5 w-5" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="border-none shadow-2xl ring-2 ring-orange-500/20 bg-white dark:bg-slate-950 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-600 to-indigo-700 p-8 text-white text-center">
                  <h3 className="text-lg font-bold opacity-80 uppercase tracking-widest mb-2">
                    Final Indoor Health Score
                  </h3>
                  <div className="text-7xl font-black mb-4 flex items-center justify-center gap-2">
                    <Sparkles className="h-8 w-8 text-yellow-300 animate-pulse" />
                    {scores.overall}
                    <span className="text-2xl opacity-50">/100</span>
                  </div>
                  <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/40 text-sm py-1 px-4">
                    {scores.overall >= 80
                      ? "EXCELLENT"
                      : scores.overall >= 60
                        ? "MODERATE"
                        : "CRITICAL ACTION"}
                  </Badge>
                </div>
                <CardContent className="p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      {
                        label: "Wellness",
                        score: scores.wellness,
                        color: "bg-emerald-500",
                      },
                      {
                        label: "Comfort",
                        score: scores.comfort,
                        color: "bg-orange-500",
                      },
                      {
                        label: "Unit Health",
                        score: scores.unit_health,
                        color: "bg-orange-500",
                      },
                    ].map((stat, i) => (
                      <div
                        key={i}
                        className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border text-center"
                      >
                        <span className="text-xs font-black text-slate-400 uppercase tracking-tighter">
                          {stat.label}
                        </span>
                        <p className="text-3xl font-black text-slate-800 dark:text-slate-100">
                          {stat.score}%
                        </p>
                        <Progress
                          value={stat.score}
                          className="h-1.5 mt-2"
                          indicatorClassName={stat.color}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label>Technician Recommendations</Label>
                    <Textarea
                      placeholder="Suggested improvements (e.g. UV filter, Dehumidifier)..."
                      className="min-h-[100px] bg-slate-50 dark:bg-slate-900 border-none ring-1 ring-slate-200"
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                    />
                  </div>
                </CardContent>
                <CardFooter className="p-6 bg-slate-50 border-t flex flex-col gap-4">
                  <Button
                    className="w-full h-14 text-xl font-black bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200"
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      "Finalize Audit & Report"
                    )}
                  </Button>
                  <Button variant="ghost" onClick={prevStep} disabled={loading}>
                    Edit Measurements
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="border-none shadow-2xl text-center py-12 px-8 overflow-hidden relative">
                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="relative z-10 space-y-6"
                >
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="h-12 w-12 text-green-600" />
                  </div>
                  <h2 className="text-4xl font-black text-slate-900">
                    Audit Completed!
                  </h2>
                  <p className="text-slate-500 max-w-sm mx-auto">
                    The Health Passport has been generated and saved to the
                    customer's portal.
                  </p>
                  <div className="pt-8 flex flex-col gap-3">
                    <Button className="h-12 text-lg font-bold bg-green-600 hover:bg-green-700">
                      View PDF Summary
                    </Button>
                    <Button
                      variant="outline"
                      className="h-12 text-lg"
                      onClick={() => window.location.reload()}
                    >
                      Start New Audit
                    </Button>
                  </div>
                </motion.div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
