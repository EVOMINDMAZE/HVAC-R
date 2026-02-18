import { useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2,
  History,
  Wind,
  Thermometer,
  ShieldAlert,
  Save,
  ArrowLeft,
  Ruler,
  Cloud,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/lib/api";
import { useSupabaseCalculations } from "@/hooks/useSupabaseCalculations";
import { PageContainer } from "@/components/PageContainer";
import { Badge } from "@/components/ui/badge";
import { SaveCalculation } from "@/components/SaveCalculation";

// Lazy-load heavy calculator components
const A2LCalculator = lazy(
  () => import("@/components/calculators/A2LCalculator"),
);
const SubcoolingCalculator = lazy(
  () => import("@/components/calculators/SubcoolingCalculator"),
);
const PsychrometricCalculator = lazy(
  () => import("@/components/calculators/PsychrometricCalculator"),
);

export default function DIYCalculators() {
  const navigate = useNavigate();
  const { saveCalculation } = useSupabaseCalculations();
  const [activeTab, setActiveTab] = useState("airflow");

  return (
    <PageContainer variant="standard" className="space-y-8 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
            </Button>
          </div>
          <h1 className="text-3xl font-extrabold font-mono tracking-tight text-foreground flex items-center gap-3">
            <Ruler className="w-8 h-8 text-primary" />
            HVAC Field Tools
          </h1>
          <p className="mt-2 text-muted-foreground max-w-2xl text-lg">
            Quick, professional-grade calculators for technicians on the job
            site.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/history")}
            className="hidden md:flex"
          >
            <History className="w-4 h-4 mr-2" />
            Calculation History
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <Tabs
        defaultValue="airflow"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-8"
      >
        <div className="flex justify-center md:justify-start overflow-x-auto pb-2 scrollbar-hide">
          <TabsList className="bg-secondary border border-border p-1 rounded-full shadow-sm h-12">
            <TabsTrigger
              value="airflow"
              className="rounded-full px-6 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            >
              <Wind className="w-4 h-4 mr-2" />
              Airflow
            </TabsTrigger>
            <TabsTrigger
              value="deltat"
              className="rounded-full px-6 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white transition-all"
            >
              <Thermometer className="w-4 h-4 mr-2" />
              Delta T
            </TabsTrigger>
            <TabsTrigger
              value="a2l"
              className="rounded-full px-6 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            >
              <ShieldAlert className="w-4 h-4 mr-2" />
              A2L Safety
            </TabsTrigger>
            <TabsTrigger
              value="subcooling"
              className="rounded-full px-6 py-2 data-[state=active]:bg-sky-500 data-[state=active]:text-white transition-all"
            >
              <Thermometer className="w-4 h-4 mr-2" />
              Subcooling
            </TabsTrigger>
            <TabsTrigger
              value="psychrometric"
              className="rounded-full px-6 py-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all"
            >
              <Cloud className="w-4 h-4 mr-2" />
              Psychrometric
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="airflow"
          className="animate-in fade-in slide-in-from-bottom-4 duration-500 focus-visible:outline-none"
        >
          <AirflowCalculator />
        </TabsContent>

        <TabsContent
          value="deltat"
          className="animate-in fade-in slide-in-from-bottom-4 duration-500 focus-visible:outline-none"
        >
          <DeltaTCalculator />
        </TabsContent>

        <TabsContent
          value="a2l"
          className="animate-in fade-in slide-in-from-bottom-4 duration-500 focus-visible:outline-none"
        >
          <Suspense
            fallback={
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            }
          >
            <A2LCalculator saveCalculation={saveCalculation} />
          </Suspense>
        </TabsContent>

        <TabsContent
          value="subcooling"
          className="animate-in fade-in slide-in-from-bottom-4 duration-500 focus-visible:outline-none"
        >
          <Suspense
            fallback={
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            }
          >
            <SubcoolingCalculator saveCalculation={saveCalculation} />
          </Suspense>
        </TabsContent>

        <TabsContent
          value="psychrometric"
          className="animate-in fade-in slide-in-from-bottom-4 duration-500 focus-visible:outline-none"
        >
          <Suspense
            fallback={
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            }
          >
            <PsychrometricCalculator
              saveCalculation={saveCalculation}
              userTier="pro"
            />
          </Suspense>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

function AirflowCalculator() {
  const [inputs, setInputs] = useState({
    sensible_heat: 24000,
    delta_t: 20,
  });
  const [units, setUnits] = useState({
    sensible_heat: "BTU/hr",
    delta_t: "F",
    result: "CFM",
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [_error, setError] = useState<string | null>(null);

  const handleCalculate = async () => {
    setError(null);
    setResult(null);
    if (
      isNaN(inputs.sensible_heat) ||
      isNaN(inputs.delta_t) ||
      inputs.sensible_heat === 0 ||
      inputs.delta_t === 0
    ) {
      setError("Please enter valid non-zero numbers for all fields.");
      return;
    }
    setLoading(true);
    try {
      let sensible_heat_btuh = inputs.sensible_heat;
      if (units.sensible_heat === "Watts") sensible_heat_btuh *= 3.41214;
      else if (units.sensible_heat === "kW") sensible_heat_btuh *= 3412.14;
      else if (units.sensible_heat === "Ton") sensible_heat_btuh *= 12000;

      let delta_t_f = inputs.delta_t;
      if (units.delta_t === "C") delta_t_f *= 1.8;
      else if (units.delta_t === "K") delta_t_f *= 1.8;

      const response = await apiClient.calculateAirflow(
        sensible_heat_btuh,
        delta_t_f,
      );

      if (!response.success || !response.data) {
        setError(response.error || "Request failed");
        return;
      }
      setResult(response.data);
    } catch (_e: any) {
      setError(_e?.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  let displayResult = result ? result.airflow_cfm : null;
  if (result) {
    if (units.result === "L/s")
      displayResult = (result.airflow_cfm * 0.471947).toFixed(1);
    else if (units.result === "m3/h")
      displayResult = (result.airflow_cfm * 1.69901).toFixed(1);
    else displayResult = result.airflow_cfm.toFixed(0);
  }

  return (
    <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden">
      <CardHeader className="bg-cyan-50/50 dark:bg-slate-800/50 border-b border-cyan-100 dark:border-slate-700 pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <div className="bg-cyan-100 dark:bg-cyan-900/30 p-2 rounded-lg text-cyan-600 dark:text-cyan-400">
                <Wind className="w-5 h-5" />
              </div>
              Airflow Calculator
            </CardTitle>
            <CardDescription>
              Determine required CFM based on sensible heat load and temp split.
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="text-cyan-600 border-cyan-200 bg-cyan-50 hidden sm:flex"
          >
            Q = 1.08 × CFM × ΔT
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Input Section */}
          <div className="p-6 md:p-8 space-y-8 border-r border-slate-100 dark:border-slate-800">
            {_error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{_error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-xs">
                  Based on Heat Load
                </Label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1 group">
                    <span className="absolute left-3 top-2.5 text-slate-400">
                      🔥
                    </span>
                    <Input
                      type="number"
                      value={inputs.sensible_heat}
                      onChange={(e) =>
                        setInputs({
                          ...inputs,
                          sensible_heat: Number(e.target.value),
                        })
                      }
                      className="pl-9 h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 group-hover:border-cyan-400 transition-colors"
                    />
                  </div>
                  <Select
                    value={units.sensible_heat}
                    onValueChange={(v) =>
                      setUnits({ ...units, sensible_heat: v })
                    }
                  >
                    <SelectTrigger className="w-[120px] h-11 bg-slate-50 dark:bg-slate-900">
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

              <div className="space-y-3">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-xs">
                  Measured Temp. Split (ΔT)
                </Label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1 group">
                    <span className="absolute left-3 top-2.5 text-slate-400">
                      🌡️
                    </span>
                    <Input
                      type="number"
                      value={inputs.delta_t}
                      onChange={(e) =>
                        setInputs({
                          ...inputs,
                          delta_t: Number(e.target.value),
                        })
                      }
                      className="pl-9 h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 group-hover:border-cyan-400 transition-colors"
                    />
                  </div>
                  <Select
                    value={units.delta_t}
                    onValueChange={(v) => setUnits({ ...units, delta_t: v })}
                  >
                    <SelectTrigger className="w-[120px] h-11 bg-slate-50 dark:bg-slate-900">
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

              <div className="pt-4">
                <Button
                  onClick={handleCalculate}
                  className="w-full h-12 text-base bg-cyan-600 hover:bg-cyan-700 shadow-xl shadow-cyan-500/20"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    "Calculate Required Airflow"
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Result Section */}
          <div className="bg-slate-50/80 dark:bg-slate-900/50 p-6 md:p-8 flex flex-col justify-center items-center relative min-h-[300px]">
            <div className="absolute top-4 right-4">
              <Select
                value={units.result}
                onValueChange={(v) => setUnits({ ...units, result: v })}
              >
                <SelectTrigger className="w-[100px] h-8 text-xs bg-white dark:bg-slate-800">
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
              <div className="text-center w-full max-w-sm animate-in zoom-in-95 duration-300">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400 mb-6 shadow-inner">
                  <Wind className="w-10 h-10" />
                </div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-2">
                  Required Airflow
                </h3>
                <div className="flex items-baseline justify-center gap-1 mb-8">
                  <span className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter">
                    {displayResult}
                  </span>
                  <span className="text-lg text-slate-400 font-medium">
                    {units.result === "m3/h" ? "m³/h" : units.result}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground border-t border-slate-200 dark:border-slate-800 pt-6">
                  <div>
                    <span className="block mb-1">Heat Load</span>
                    <strong className="text-slate-700 dark:text-slate-300">
                      {inputs.sensible_heat} {units.sensible_heat}
                    </strong>
                  </div>
                  <div>
                    <span className="block mb-1">Target ΔT</span>
                    <strong className="text-slate-700 dark:text-slate-300">
                      {inputs.delta_t}°{units.delta_t}
                    </strong>
                  </div>
                </div>

                <div className="mt-8">
                  <SaveCalculation
                    calculationType="Airflow"
                    inputs={{ ...inputs, ...units }}
                    results={result}
                    trigger={
                      <Button
                        variant="outline"
                        className="w-full border-dashed border-slate-300 hover:border-cyan-500 hover:text-cyan-600 transition-all"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Result
                      </Button>
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-400 py-12">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Wind className="w-10 h-10 opacity-30" />
                </div>
                <p className="max-w-[200px] mx-auto text-sm">
                  Enter sensible heat and temperature split to calculate
                  required airflow
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DeltaTCalculator() {
  const [inputs, setInputs] = useState({
    return_temp: 75,
    supply_temp: 55,
  });
  const [units, setUnits] = useState({
    return_temp: "F",
    supply_temp: "F",
    result: "F",
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [_error, setError] = useState<string | null>(null);

  const handleCalculate = async () => {
    setError(null);
    setResult(null);
    if (isNaN(inputs.return_temp) || isNaN(inputs.supply_temp)) {
      setError("Please enter valid numbers for both temperatures.");
      return;
    }
    setLoading(true);
    try {
      const toF = (val: number, unit: string) => {
        if (unit === "C") return val * 1.8 + 32;
        if (unit === "K") return (val - 273.15) * 1.8 + 32;
        return val;
      };

      const return_temp_f = toF(inputs.return_temp, units.return_temp);
      const supply_temp_f = toF(inputs.supply_temp, units.supply_temp);

      const response = await apiClient.calculateDeltaT(
        return_temp_f,
        supply_temp_f,
      );
      if (!response.success || !response.data) {
        setError(response.error || "Request failed");
        return;
      }
      setResult(response.data);
    } catch (_e: any) {
      setError(_e?.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  let displayDeltaT = result ? result.delta_t_f : null;
  if (result) {
    if (units.result === "C")
      displayDeltaT = (result.delta_t_f / 1.8).toFixed(1);
    else if (units.result === "K")
      displayDeltaT = (result.delta_t_f / 1.8).toFixed(1);
    else displayDeltaT = result.delta_t_f.toFixed(1);
  }

  return (
    <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden">
      <CardHeader className="bg-emerald-50/50 dark:bg-slate-800/50 border-b border-emerald-100 dark:border-slate-700 pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg text-emerald-600 dark:text-emerald-400">
                <Thermometer className="w-5 h-5" />
              </div>
              Delta T Calculator
            </CardTitle>
            <CardDescription>
              Measure temperature drop across the evaporator coil to verify
              performance.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Input Section */}
          <div className="p-6 md:p-8 space-y-8 border-r border-slate-100 dark:border-slate-800">
            <div className="space-y-6">
              {/* Supply */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-xs">
                  Return Air (Intake)
                </Label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1 group">
                    <span className="absolute left-3 top-2.5 text-slate-400">
                      ↩️
                    </span>
                    <Input
                      type="number"
                      value={inputs.return_temp}
                      onChange={(e) =>
                        setInputs({
                          ...inputs,
                          return_temp: Number(e.target.value),
                        })
                      }
                      className="pl-9 h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 group-hover:border-emerald-400 transition-colors"
                    />
                  </div>
                  <Select
                    value={units.return_temp}
                    onValueChange={(v) =>
                      setUnits({ ...units, return_temp: v })
                    }
                  >
                    <SelectTrigger className="w-[80px] h-11 bg-slate-50 dark:bg-slate-900">
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

              {/* Return */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-xs">
                  Supply Air (Output)
                </Label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1 group">
                    <span className="absolute left-3 top-2.5 text-slate-400">
                      💨
                    </span>
                    <Input
                      type="number"
                      value={inputs.supply_temp}
                      onChange={(e) =>
                        setInputs({
                          ...inputs,
                          supply_temp: Number(e.target.value),
                        })
                      }
                      className="pl-9 h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 group-hover:border-emerald-400 transition-colors"
                    />
                  </div>
                  <Select
                    value={units.supply_temp}
                    onValueChange={(v) =>
                      setUnits({ ...units, supply_temp: v })
                    }
                  >
                    <SelectTrigger className="w-[80px] h-11 bg-slate-50 dark:bg-slate-900">
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

              <div className="pt-4">
                <Button
                  onClick={handleCalculate}
                  className="w-full h-12 text-base bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-500/20"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    "Calculate Delta T"
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="bg-slate-50/80 dark:bg-slate-900/50 p-6 md:p-8 flex flex-col justify-center items-center relative min-h-[300px]">
            <div className="absolute top-4 right-4">
              <Select
                value={units.result}
                onValueChange={(v) => setUnits({ ...units, result: v })}
              >
                <SelectTrigger className="w-[80px] h-8 text-xs bg-white dark:bg-slate-800">
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
              <div className="text-center w-full max-w-sm animate-in zoom-in-95 duration-300">
                <div
                  className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 shadow-inner ${
                    result.status.includes("Normal")
                      ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                  }`}
                >
                  <Thermometer className="w-10 h-10" />
                </div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-2">
                  Measured Difference
                </h3>
                <div className="flex items-baseline justify-center gap-1 mb-2">
                  <span
                    className={`text-6xl font-black tracking-tighter ${result.status.includes("Normal") ? "text-slate-900 dark:text-white" : "text-amber-600 dark:text-amber-400"}`}
                  >
                    {displayDeltaT}
                  </span>
                  <span className="text-lg text-slate-400 font-medium">
                    °{units.result === "K" ? "K" : units.result}
                  </span>
                </div>
                <Badge
                  variant={
                    result.status.includes("Normal") ? "default" : "secondary"
                  }
                  className={`mb-8 ${result.status.includes("Normal") ? "bg-emerald-600 hover:bg-emerald-600" : "bg-amber-100 text-amber-700 hover:bg-amber-200"}`}
                >
                  {result.status}
                </Badge>

                <div className="mt-4">
                  <SaveCalculation
                    calculationType="Delta T"
                    inputs={{ ...inputs, ...units }}
                    results={result}
                    trigger={
                      <Button
                        variant="outline"
                        className="w-full border-dashed border-slate-300 hover:border-emerald-500 hover:text-emerald-600 transition-all"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Result
                      </Button>
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-400 py-12">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Thermometer className="w-10 h-10 opacity-30" />
                </div>
                <p className="max-w-[200px] mx-auto text-sm">
                  Enter return and supply air temperatures to check system
                  performance
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
