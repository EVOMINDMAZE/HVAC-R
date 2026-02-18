import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Thermometer,
  Save,
  Info,
  Calculator,
  Gauge,
  Bluetooth,
  Link as LinkIcon,
} from "lucide-react";
import { SaveCalculation } from "@/components/SaveCalculation";
import { Badge } from "@/components/ui/badge";
import {
  getRefrigerantsByPopularity,
  RefrigerantProperties,
} from "@/lib/refrigerants";
import {
  calculateSaturationTemperature,
  isRefrigerantSupported,
} from "@/lib/pt-chart";
import { Switch } from "@/components/ui/switch";
import { useWeatherAutoFill } from "@/hooks/useWeatherAutoFill";
import { useGeolocation } from "@/hooks/useGeolocation";
import { Cloud, Loader2 } from "lucide-react";
import { useBluetoothProbe } from "@/hooks/useBluetoothProbe";

interface TargetSuperheatCalculatorProps {
  saveCalculation?: any;
}

export default function TargetSuperheatCalculator(
  _props: TargetSuperheatCalculatorProps
) {
  const [refrigerants] = useState<RefrigerantProperties[]>(
    getRefrigerantsByPopularity(),
  );
  const [selectedRefrigerant, setSelectedRefrigerant] =
    useState<string>("R410A");

  const [units, setUnits] = useState<"imperial" | "metric">("imperial");
  const [inputs, setInputs] = useState({
    indoorWetBulb: "64",
    outdoorDryBulb: "85",
    // Base actual superheat (manual result)
    actualSuperheat: "",
    // Gauge mode inputs
    suctionPressure: "",
    suctionLineTemp: "",
  });

  const [useGaugeReadings, setUseGaugeReadings] = useState(false);

  // Weather Intelligence
  const { location, getLocation, loading: geoLoading } = useGeolocation();
  const {
    weather,
    loading: weatherLoading,
    fetchWeather,
  } = useWeatherAutoFill();

  // Hardware Integration (ThermoKey)
  // Using simulated mode for prototype
  const {
    connect,
    disconnect,
    isConnected,
    data: probeData,
  } = useBluetoothProbe({ simulate: true });

  // Auto-update inputs from Probe Data
  useEffect(() => {
    if (isConnected && probeData) {
       
      setInputs((prev) => ({
        ...prev,
        // Map Probe Temperature -> Outdoor Dry Bulb (Example use case)
        outdoorDryBulb: probeData.temperature_f
          ? probeData.temperature_f.toFixed(1)
          : prev.outdoorDryBulb,
        // Map Probe Pressure -> Suction Pressure (If in gauge mode)
        suctionPressure:
          useGaugeReadings && probeData.pressure_psi
            ? probeData.pressure_psi.toFixed(1)
            : prev.suctionPressure,
      }));
    }
  }, [probeData, isConnected, useGaugeReadings]);

  const handleAutoFillWeather = async () => {
    if (!location) {
      getLocation();
      return;
    }
    await fetchWeather(location.lat, location.lng);
  };

  useEffect(() => {
    if (location && !weather && geoLoading === false) {
      fetchWeather(location.lat, location.lng);
    }
  }, [location]);

  useEffect(() => {
    if (weather && !isConnected) {
      // Only auto-fill weather if NOT using probe
       
      setInputs((prev) => ({
        ...prev,
        outdoorDryBulb: weather.tempF.toFixed(1),
      }));
    }
  }, [weather, isConnected]);

  const result = useMemo(() => {
    let wb = parseFloat(inputs.indoorWetBulb);
    let db = parseFloat(inputs.outdoorDryBulb);

    if (isNaN(wb) || isNaN(db)) return null;

    // Convert to Imperial for calculation logic if currently Metric
    if (units === "metric") {
      wb = (wb * 9) / 5 + 32;
      db = (db * 9) / 5 + 32;
    }

    // Validation (Prevent nonsensical inputs in F)
    if (wb < 32 || wb > 100) return null;
    if (db < 0 || db > 130) return null;

    // Formula: ((3 * Indoor WB) - 80 - Outdoor DB) / 2
    const target = (3 * wb - 80 - db) / 2;
    const min = target - 5;
    const max = target + 5;

    let recommendation = "Check against actual superheat.";
    let status: "Normal" | "Warning" | "Critical" = "Normal";
    let actualSH: number | undefined = undefined;
    let satTemp: number | undefined = undefined;

    // Determine Actual Superheat
    if (useGaugeReadings && inputs.suctionPressure && inputs.suctionLineTemp) {
      // Calculate from Gauges
      const P = parseFloat(inputs.suctionPressure);
      const T_line = parseFloat(inputs.suctionLineTemp);

      if (!isNaN(P) && !isNaN(T_line)) {
        let P_calc = P;
        let T_line_calc = T_line;

        // Normalize to Imperial for PT Chart usage
        if (units === "metric") {
          P_calc = P * 0.145038;
          T_line_calc = (T_line * 9) / 5 + 32;
        }

        const T_sat = calculateSaturationTemperature(
          selectedRefrigerant,
          P_calc,
          "psig",
        );

        if (T_sat !== null) {
          satTemp = T_sat;
          actualSH = T_line_calc - T_sat;
        }
      }
    } else if (!useGaugeReadings && inputs.actualSuperheat) {
      // Manual Input
      let val = parseFloat(inputs.actualSuperheat);
      if (!isNaN(val)) {
        if (units === "metric") val = val * 1.8;
        actualSH = val;
      }
    }

    // Evaluate
    if (actualSH !== undefined) {
      if (actualSH < min) {
        recommendation =
          "System is undercharged (or restriction). Add refrigerant.";
        status = "Warning";
      } else if (actualSH > max) {
        recommendation = "System is overcharged. Remove refrigerant.";
        status = "Warning";
      } else {
        recommendation = `Charge is correct within ±${units === "metric" ? "2.8°C" : "5°F"}.`;
        status = "Normal";
      }
    }

    return {
      targetSuperheat: target,
      minSuperheat: min,
      maxSuperheat: max,
      actualSuperheat: actualSH,
      calculatedSaturationTemp: satTemp,
      recommendation,
      status,
    };
  }, [inputs, units, selectedRefrigerant, useGaugeReadings]);

  // Helper for displaying result
  const formatTemp = (val: number | undefined) => {
    if (val === undefined) return "--";
    if (units === "metric") {
      return (val / 1.8).toFixed(1);
    }
    return val.toFixed(1);
  };

  // Helper for displaying absolute temps (not delta)
  const formatAbsTemp = (valF: number | undefined) => {
    if (valF === undefined) return "--";
    if (units === "metric") {
      return (((valF - 32) * 5) / 9).toFixed(1);
    }
    return valF.toFixed(1);
  };

  const isPtSupported = isRefrigerantSupported(selectedRefrigerant);

  return (
    <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden">
      <CardHeader className="bg-orange-50/50 dark:bg-slate-800/50 border-b border-orange-100 dark:border-slate-700 pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-lg text-orange-600 dark:text-orange-400">
                <Thermometer className="w-5 h-5" />
              </div>
              Target Superheat
            </CardTitle>
            <CardDescription>
              Fixed orifice system charging calculator.
            </CardDescription>
          </div>
          {/* Hardware Connect Button */}
          <div className="flex items-center gap-2">
            {!isConnected ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => connect()}
                className="h-8 gap-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 hover:text-orange-600 hover:border-orange-200 transition-all font-medium"
              >
                <Bluetooth className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Connect Probe</span>
                <span className="sm:hidden">Connect</span>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={disconnect}
                className="h-8 gap-2 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Linked: ThermoKey</span>
                <span className="sm:hidden">Linked</span>
              </Button>
            )}

            <Select
              value={units}
              onValueChange={(v: "imperial" | "metric") => setUnits(v)}
            >
              <SelectTrigger className="w-[80px] sm:w-[100px] h-8 text-xs bg-white dark:bg-slate-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="imperial">Imperial (°F)</SelectItem>
                <SelectItem value="metric">Metric (°C)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Input Section */}
          <div className="p-6 md:p-8 space-y-8 border-r border-slate-100 dark:border-slate-800">
            {/* Connection Alert */}
            {isConnected && (
              <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 rounded-lg p-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                  <Bluetooth className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    Live Data Streaming
                  </p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                    Reading Outdoor Dry Bulb & Suction Pressure
                  </p>
                </div>
              </div>
            )}

            <Alert className="bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-300">
              <Info className="h-4 w-4" />
              <AlertTitle>Prerequisites</AlertTitle>
              <AlertDescription className="text-xs mt-1">
                Ensure airflow is correct before charging. Only applies to fixed
                orifice (piston) systems.
              </AlertDescription>
            </Alert>

            <div className="space-y-6">
              {/* Refrigerant Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-xs">
                  Refrigerant
                </Label>
                <Select
                  value={selectedRefrigerant}
                  onValueChange={(v) => setSelectedRefrigerant(v)}
                >
                  <SelectTrigger className="h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-orange-400 transition-colors">
                    <SelectValue placeholder="Select Refrigerant" />
                  </SelectTrigger>
                  <SelectContent>
                    {refrigerants.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: r.color }}
                          ></span>
                          {r.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex justify-between items-center px-1">
                  <p className="text-[10px] text-slate-400">
                    Used for records & PT calculation.
                  </p>
                  {!isPtSupported && (
                    <span className="text-[10px] text-amber-500 font-medium">
                      Auto-PT not supported
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-xs">
                    Indoor Wet Bulb
                  </Label>
                  <span className="text-[10px] text-slate-400 block -mt-1">
                    ({units === "imperial" ? "°F" : "°C"})
                  </span>
                  <div className="relative group">
                    <span className="absolute left-3 top-2.5 text-slate-400">
                      💧
                    </span>
                    <Input
                      type="number"
                      value={inputs.indoorWetBulb}
                      onChange={(e) =>
                        setInputs({ ...inputs, indoorWetBulb: e.target.value })
                      }
                      className="pl-9 h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 group-hover:border-orange-400 transition-colors"
                      placeholder={units === "imperial" ? "60 - 70" : "15 - 21"}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-xs flex justify-between">
                    Outdoor Dry Bulb
                    {isConnected && (
                      <span className="text-[10px] text-emerald-500 font-bold animate-pulse">
                        LIVE
                      </span>
                    )}
                  </Label>
                  <span className="text-[10px] text-slate-400 block -mt-1">
                    ({units === "imperial" ? "°F" : "°C"})
                  </span>
                  <div className="relative group">
                    <span
                      className={`absolute left-3 top-2.5 ${isConnected ? "text-emerald-500" : "text-slate-400"}`}
                    >
                      ☀️
                    </span>
                    <Input
                      type="number"
                      value={inputs.outdoorDryBulb}
                      onChange={(e) =>
                        setInputs({ ...inputs, outdoorDryBulb: e.target.value })
                      }
                      className={`pl-9 h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 transition-colors pr-20 ${isConnected ? "border-emerald-400 ring-1 ring-emerald-400/20" : "group-hover:border-orange-400"}`}
                      placeholder={units === "imperial" ? "55+" : "13+"}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleAutoFillWeather}
                      disabled={weatherLoading || geoLoading || isConnected} // Disable auto-weather if using probe
                      className="absolute right-1 top-1 h-9 px-2 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20 disabled:opacity-50"
                    >
                      {weatherLoading || geoLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <div className="flex items-center gap-1">
                          <Cloud className="h-3 w-3" />
                          <span>Auto</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Actual Superheat Section */}
              <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-xs">
                      Actual Superheat Source
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] uppercase font-bold ${!useGaugeReadings ? "text-orange-600" : "text-slate-400"}`}
                    >
                      Manual
                    </span>
                    <Switch
                      checked={useGaugeReadings}
                      onCheckedChange={setUseGaugeReadings}
                      disabled={!isPtSupported}
                    />
                    <span
                      className={`text-[10px] uppercase font-bold ${useGaugeReadings ? "text-orange-600" : "text-slate-400"}`}
                    >
                      Gauges
                    </span>
                  </div>
                </div>

                {!useGaugeReadings ? (
                  <div className="relative group animate-in slide-in-from-top-2 duration-300">
                    <span className="absolute left-3 top-2.5 text-slate-400">
                      Calculated
                    </span>
                    <Input
                      type="number"
                      value={inputs.actualSuperheat}
                      onChange={(e) =>
                        setInputs({
                          ...inputs,
                          actualSuperheat: e.target.value,
                        })
                      }
                      placeholder="Enter measured superheat..."
                      className="pl-24 h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 group-hover:border-orange-400 transition-colors"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-slate-500 flex justify-between">
                        <span>
                          Suction Press ({units === "imperial" ? "PSIG" : "kPa"}
                          )
                        </span>
                        {isConnected && (
                          <span className="text-[10px] text-emerald-500 font-bold animate-pulse">
                            LIVE
                          </span>
                        )}
                      </Label>
                      <div className="relative group">
                        <span
                          className={`absolute left-2.5 top-2.5 ${isConnected ? "text-emerald-500" : "text-slate-400"}`}
                        >
                          <Gauge className="w-4 h-4" />
                        </span>
                        <Input
                          type="number"
                          value={inputs.suctionPressure}
                          onChange={(e) =>
                            setInputs({
                              ...inputs,
                              suctionPressure: e.target.value,
                            })
                          }
                          className={`pl-8 h-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 ${isConnected ? "border-emerald-400 ring-1 ring-emerald-400/20" : ""}`}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-slate-500">
                        Suction Line Temp
                      </Label>
                      <div className="relative group">
                        <span className="absolute left-2.5 top-2.5 text-slate-400">
                          <Thermometer className="w-4 h-4" />
                        </span>
                        <Input
                          type="number"
                          value={inputs.suctionLineTemp}
                          onChange={(e) =>
                            setInputs({
                              ...inputs,
                              suctionLineTemp: e.target.value,
                            })
                          }
                          className="pl-8 h-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Result Section */}
          <div className="bg-slate-50/80 dark:bg-slate-900/50 p-6 md:p-8 flex flex-col justify-center items-center relative min-h-[300px]">
            {result ? (
              <div className="text-center w-full max-w-sm animate-in zoom-in-95 duration-300">
                <div className="flex justify-center mb-6">
                  <div className="bg-white dark:bg-slate-800 rounded-full p-4 shadow-sm border border-slate-100 dark:border-slate-700 relative">
                    <Thermometer className="w-8 h-8 text-orange-500" />
                    {result.status !== "Normal" && (
                      <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-white"></span>
                    )}
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-1">
                  Target Superheat
                </h3>

                <div className="flex items-baseline justify-center gap-1 mb-2">
                  <span className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter">
                    {formatTemp(result.targetSuperheat)}
                  </span>
                  <span className="text-lg text-slate-400 font-medium">
                    {units === "imperial" ? "°F" : "K"}
                  </span>
                </div>

                <div className="flex justify-center items-center gap-2 mb-6">
                  <Badge
                    variant="outline"
                    className="text-slate-500 bg-white dark:bg-slate-900 px-3 py-1"
                  >
                    Acceptable: {formatTemp(result.minSuperheat)} -{" "}
                    {formatTemp(result.maxSuperheat)}{" "}
                    {units === "imperial" ? "°F" : "K"}
                  </Badge>
                </div>

                {/* Gauge Result Details */}
                {useGaugeReadings &&
                  result.calculatedSaturationTemp !== undefined && (
                    <div className="grid grid-cols-2 gap-2 mb-6 text-xs bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                      <div className="text-slate-500 text-right pr-2 border-r border-slate-100">
                        <span className="block text-[10px] uppercase">
                          Sat Temp (Dew)
                        </span>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                          {formatAbsTemp(result.calculatedSaturationTemp)}°
                        </span>
                      </div>
                      <div className="text-slate-500 text-left pl-2">
                        <span className="block text-[10px] uppercase">
                          Actual SH
                        </span>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                          {formatTemp(result.actualSuperheat)}°
                        </span>
                      </div>
                    </div>
                  )}

                <div
                  className={`p-4 rounded-lg mb-6 text-sm text-center border ${
                    result.status === "Normal"
                      ? "bg-emerald-50 border-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-900"
                      : result.status === "Warning"
                        ? "bg-amber-50 border-amber-100 text-amber-800 dark:bg-amber-900/20 dark:border-amber-900"
                        : "bg-slate-100 border-slate-200 text-slate-800 dark:bg-slate-800 dark:border-slate-700"
                  }`}
                >
                  <strong className="block mb-1 font-bold tracking-tight">
                    {result.status === "Normal"
                      ? "SYSTEM CHARGED CORRECTLY"
                      : "ATTENTION REQUIRED"}
                  </strong>
                  {result.recommendation}
                </div>

                <SaveCalculation
                  calculationType="Target Superheat"
                  inputs={{
                    ...inputs,
                    units,
                    refrigerant: selectedRefrigerant,
                    mode: useGaugeReadings ? "gauges" : "manual",
                  }}
                  results={{ ...result, units_used: units }}
                  trigger={
                    <Button
                      variant="ghost"
                      className="w-full text-slate-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save to History
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="text-center text-slate-400 py-12">
                <Calculator className="w-12 h-12 mx-auto mb-3 text-slate-200 dark:text-slate-800" />
                <p className="max-w-[200px] mx-auto text-sm">
                  Enter temperatures to calculate target.
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
