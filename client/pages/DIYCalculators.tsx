import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, History, Settings, Thermometer, Wind, Activity, Layers, Save, ShieldAlert } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { API_BASE_URL } from "@/lib/api";
import { useSupabaseCalculations } from "@/hooks/useSupabaseCalculations";
import A2LCalculator from "@/components/calculators/A2LCalculator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const refrigerants = [
  { value: "R134a", label: "R134a" },
  { value: "R404A", label: "R404A" },
  { value: "R410A", label: "R410A" },
  { value: "R22", label: "R22" },
  { value: "R744", label: "R744 (CO2)" },
  { value: "R290", label: "R290 (Propane)" },
  { value: "R717", label: "R717 (Ammonia)" },
];

function SaveCalculationDialog({
  onSave,
  defaultName,
  trigger,
}: {
  onSave: (name: string) => Promise<void>;
  defaultName: string;
  trigger: React.ReactNode;
}) {
  const [name, setName] = useState(defaultName);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(name);
      setIsOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save Calculation</DialogTitle>
          <DialogDescription>
            Enter a name for this calculation to easily identify it later in your
            history.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function DIYCalculators() {
  const navigate = useNavigate();
  const { saveCalculation } = useSupabaseCalculations();

  // Standard Cycle State
  const [inputs, setInputs] = useState({
    refrigerant: "R134a",
    evap_temp_c: "-10",
    cond_temp_c: "45",
    superheat_c: "5",
    subcooling_c: "2",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);

  // Cascade Cycle State
  const [cascadeLoading, setCascadeLoading] = useState(false);
  const [cascadeError, setCascadeError] = useState<string | null>(null);
  const [cascadeResults, setCascadeResults] = useState<any>(null);

  // Tabs State
  const [activeTab, setActiveTab] = useState("airflow");

  const handleInputChange = (field: string, value: string) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
  };

  const calculateStandardCycle = async () => {
    setError(null);
    setResults(null);
    setLoading(true);
    try {
      const body = {
        refrigerant: inputs.refrigerant,
        evap_temp_c: Number(inputs.evap_temp_c),
        cond_temp_c: Number(inputs.cond_temp_c),
        superheat_c: Number(inputs.superheat_c),
        subcooling_c: Number(inputs.subcooling_c),
      };

      const response = await fetch(`${API_BASE_URL}/calculate-standard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok || !data?.data) {
        setError(data?.error || `Request failed (${response.status})`);
        return;
      }

      setResults(data.data);
      // await saveCalculation("Standard Cycle", body, data.data); // Removed auto-save
    } catch (e: any) {
      setError(e?.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  const calculateCascadeCycle = async () => {
    setCascadeError(null);
    setCascadeResults(null);
    setCascadeLoading(true);
    try {
      // Demo body for cascade cycle as placeholder
      const demoBody = {
        lt_cycle: {
          refrigerant: "R744",
          evap_temp_c: -50,
          cond_temp_c: -5,
          superheat_c: 5,
          subcooling_c: 2,
        },
        ht_cycle: {
          refrigerant: "R134a",
          evap_temp_c: -10,
          cond_temp_c: 40,
          superheat_c: 5,
          subcooling_c: 2,
        },
        cascade_hx_delta_t_c: 5,
      };

      const response = await fetch(`${API_BASE_URL}/calculate-cascade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(demoBody),
      });

      const data = await response.json();

      if (!response.ok || !data?.data) {
        setCascadeError(data?.error || `Request failed (${response.status})`);
        return;
      }

      setCascadeResults(data.data);
      // await saveCalculation("Cascade Cycle", demoBody, data.data); // Removed auto-save
    } catch (e: any) {
      setCascadeError(e?.message || "Network error");
    } finally {
      setCascadeLoading(false);
    }
  };

  return (
    <main>
      <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in">
          <div>
            <Button
              variant="ghost"
              className="mb-4 pl-0 hover:bg-transparent hover:text-blue-600"
              onClick={() => navigate('/dashboard')}
            >
              <History className="w-4 h-4 mr-2 rotate-180" /> Back
            </Button>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
              HVAC Field Tools
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
              Professional grade calculators for field technicians
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="outline" className="glass hover-lift" onClick={() => navigate('/history')}>
              <History className="w-4 h-4 mr-2" /> History
            </Button>
          </div>
        </div>

        <div className="space-y-8">
          <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-full justify-start overflow-x-auto no-scrollbar glass p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("airflow")}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${activeTab === "airflow" ? "bg-background text-foreground shadow-sm" : ""}`}
            >
              <Wind className="h-4 w-4 mr-2" />
              Airflow
            </button>
            <button
              onClick={() => setActiveTab("deltat")}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${activeTab === "deltat" ? "bg-background text-foreground shadow-sm" : ""}`}
            >
              <Thermometer className="h-4 w-4 mr-2" />
              Delta T
            </button>
            <button
              onClick={() => setActiveTab("a2l")}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${activeTab === "a2l" ? "bg-background text-foreground shadow-sm" : ""}`}
            >
              <ShieldAlert className="h-4 w-4 mr-2" />
              A2L Safety
            </button>
          </div>

          <div className="mt-8">
            {activeTab === "airflow" && (
              <div className="animate-slide-up">
                <AirflowCalculator saveCalculation={saveCalculation} />
              </div>
            )}

            {activeTab === "deltat" && (
              <div className="animate-slide-up">
                <DeltaTCalculator saveCalculation={saveCalculation} />
              </div>
            )}

            {activeTab === "a2l" && (
              <div className="animate-slide-up">
                <A2LCalculator saveCalculation={saveCalculation} />
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function AirflowCalculator({ saveCalculation }: { saveCalculation: any }) {
  const [inputs, setInputs] = useState({
    sensible_heat: 24000,
    delta_t: 20,
  });
  const [units, setUnits] = useState({
    sensible_heat: "BTU/hr",
    delta_t: "F",
    result: "CFM"
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = async () => {
    setError(null);
    setResult(null);
    if (isNaN(inputs.sensible_heat) || isNaN(inputs.delta_t) || inputs.sensible_heat === 0 || inputs.delta_t === 0) {
      setError("Please enter valid non-zero numbers for all fields.");
      return;
    }
    setLoading(true);
    try {
      // Normalize inputs to BTU/hr and F
      let sensible_heat_btuh = inputs.sensible_heat;
      if (units.sensible_heat === "Watts") sensible_heat_btuh *= 3.41214;
      else if (units.sensible_heat === "kW") sensible_heat_btuh *= 3412.14;
      else if (units.sensible_heat === "Ton") sensible_heat_btuh *= 12000;

      let delta_t_f = inputs.delta_t;
      if (units.delta_t === "C") delta_t_f *= 1.8;
      else if (units.delta_t === "K") delta_t_f *= 1.8; // Delta K is same magnitude as Delta C

      const response = await fetch(`${API_BASE_URL}/calculate-airflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sensible_heat_btuh,
          delta_t_f
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.data) {
        setError(data?.error || `Request failed (${response.status})`);
        return;
      }
      setResult(data.data);
    } catch (e: any) {
      setError(e?.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  // Convert result
  let displayResult = result ? result.airflow_cfm : null;
  if (result) {
    if (units.result === "L/s") displayResult = (result.airflow_cfm * 0.471947).toFixed(1);
    else if (units.result === "m3/h") displayResult = (result.airflow_cfm * 1.69901).toFixed(1);
    else displayResult = result.airflow_cfm.toFixed(0);
  }

  return (
    <Card className="glass-card border-0 overflow-hidden">
      <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
        <CardTitle className="text-xl font-semibold text-primary flex items-center gap-2">
          <Wind className="w-5 h-5" />
          Airflow Calculator
        </CardTitle>
        <CardDescription>
          Calculate required airflow based on sensible heat and temperature split
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Calculation Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Sensible Heat</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={inputs.sensible_heat}
                    onChange={(e) =>
                      setInputs({ ...inputs, sensible_heat: Number(e.target.value) })
                    }
                    className="bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20 transition-all flex-1"
                  />
                  <Select value={units.sensible_heat} onValueChange={(v) => setUnits({ ...units, sensible_heat: v })}>
                    <SelectTrigger className="w-[110px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BTU/hr">BTU/hr</SelectItem>
                      <SelectItem value="Watts">Watts</SelectItem>
                      <SelectItem value="kW">kW</SelectItem>
                      <SelectItem value="Ton">Ton</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Temperature Split</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={inputs.delta_t}
                    onChange={(e) =>
                      setInputs({ ...inputs, delta_t: Number(e.target.value) })
                    }
                    className="bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20 transition-all flex-1"
                  />
                  <Select value={units.delta_t} onValueChange={(v) => setUnits({ ...units, delta_t: v })}>
                    <SelectTrigger className="w-[110px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="F">°F</SelectItem>
                      <SelectItem value="C">°C</SelectItem>
                      <SelectItem value="K">K</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Button
              onClick={handleCalculate}
              className="w-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 transform hover:-translate-y-0.5"
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Calculate"}
            </Button>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-6 border border-slate-100 dark:border-slate-700 flex flex-col justify-center relative">
            <div className="absolute top-4 right-4">
              <Select value={units.result} onValueChange={(v) => setUnits({ ...units, result: v })}>
                <SelectTrigger className="w-[100px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CFM">CFM</SelectItem>
                  <SelectItem value="L/s">L/s</SelectItem>
                  <SelectItem value="m3/h">m³/h</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {result ? (
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-2">
                  <Wind className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">Required Airflow</p>
                  <p className="text-4xl font-bold text-slate-900 dark:text-white mt-1">
                    {displayResult} <span className="text-xl text-slate-400 font-normal">{units.result === 'm3/h' ? 'm³/h' : units.result}</span>
                  </p>
                </div>
                <SaveCalculationDialog
                  defaultName="Airflow Calculation"
                  onSave={async (name) => {
                    await saveCalculation("Airflow", inputs, result, name);
                  }}
                  trigger={
                    <Button
                      variant="outline"
                      className="w-full mt-4 border-primary/20 hover:bg-primary/5 text-primary"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Result
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="text-center text-slate-400">
                <Wind className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Enter values to calculate airflow</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DeltaTCalculator({ saveCalculation }: { saveCalculation: any }) {
  const [inputs, setInputs] = useState({
    return_temp: 75,
    supply_temp: 55,
  });
  const [units, setUnits] = useState({
    return_temp: "F",
    supply_temp: "F",
    result: "F"
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = async () => {
    setError(null);
    setResult(null);
    if (isNaN(inputs.return_temp) || isNaN(inputs.supply_temp)) {
      setError("Please enter valid numbers for both temperatures.");
      return;
    }
    setLoading(true);
    try {
      // Normalize to F
      const toF = (val: number, unit: string) => {
        if (unit === "C") return (val * 1.8) + 32;
        if (unit === "K") return ((val - 273.15) * 1.8) + 32;
        return val;
      };

      const return_temp_f = toF(inputs.return_temp, units.return_temp);
      const supply_temp_f = toF(inputs.supply_temp, units.supply_temp);

      const response = await fetch(`${API_BASE_URL}/calculate-deltat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          return_temp_f,
          supply_temp_f
        }),
      });
      const data = await response.json();
      if (!response.ok || !data?.data) {
        setError(data?.error || `Request failed (${response.status})`);
        return;
      }
      setResult(data.data);
    } catch (e: any) {
      setError(e?.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  // Convert result
  let displayDeltaT = result ? result.delta_t_f : null;
  if (result) {
    if (units.result === "C") displayDeltaT = (result.delta_t_f / 1.8).toFixed(1);
    else if (units.result === "K") displayDeltaT = (result.delta_t_f / 1.8).toFixed(1); // Delta K = Delta C
    else displayDeltaT = result.delta_t_f.toFixed(1);
  }

  return (
    <Card className="glass-card border-0 overflow-hidden">
      <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
        <CardTitle className="text-xl font-semibold text-primary flex items-center gap-2">
          <Thermometer className="w-5 h-5" />
          Delta T Calculator
        </CardTitle>
        <CardDescription>
          Measure temperature difference across evaporator coil
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Calculation Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Return Air Temp</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={inputs.return_temp}
                    onChange={(e) =>
                      setInputs({ ...inputs, return_temp: Number(e.target.value) })
                    }
                    className="bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20 transition-all flex-1"
                  />
                  <Select value={units.return_temp} onValueChange={(v) => setUnits({ ...units, return_temp: v })}>
                    <SelectTrigger className="w-[80px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="F">°F</SelectItem>
                      <SelectItem value="C">°C</SelectItem>
                      <SelectItem value="K">K</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Supply Air Temp</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={inputs.supply_temp}
                    onChange={(e) =>
                      setInputs({ ...inputs, supply_temp: Number(e.target.value) })
                    }
                    className="bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20 transition-all flex-1"
                  />
                  <Select value={units.supply_temp} onValueChange={(v) => setUnits({ ...units, supply_temp: v })}>
                    <SelectTrigger className="w-[80px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="F">°F</SelectItem>
                      <SelectItem value="C">°C</SelectItem>
                      <SelectItem value="K">K</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Button
              onClick={handleCalculate}
              className="w-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 transform hover:-translate-y-0.5"
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Calculate Delta T"}
            </Button>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-6 border border-slate-100 dark:border-slate-700 flex flex-col justify-center relative">
            <div className="absolute top-4 right-4">
              <Select value={units.result} onValueChange={(v) => setUnits({ ...units, result: v })}>
                <SelectTrigger className="w-[80px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="F">°F</SelectItem>
                  <SelectItem value="C">°C</SelectItem>
                  <SelectItem value="K">K</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {result ? (
              <div className="text-center space-y-4">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-2 ${result.status.includes("Normal") ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                  }`}>
                  <Thermometer className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">Temperature Split</p>
                  <p className="text-4xl font-bold text-slate-900 dark:text-white mt-1">
                    {displayDeltaT}°{units.result === 'K' ? 'K' : units.result}
                  </p>
                  <p className={`text-sm font-medium mt-2 ${result.status.includes("Normal") ? "text-emerald-600" : "text-amber-600"
                    }`}>
                    {result.status}
                  </p>
                </div>
                <SaveCalculationDialog
                  defaultName="Delta T Calculation"
                  onSave={async (name) => {
                    await saveCalculation("Delta T", inputs, result, name);
                  }}
                  trigger={
                    <Button
                      variant="outline"
                      className="w-full mt-4 border-primary/20 hover:bg-primary/5 text-primary"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Result
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="text-center text-slate-400">
                <Thermometer className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Enter temperatures to calculate Delta T</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
