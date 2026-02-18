import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Cloud, Save, Gauge, ArrowDown, Loader2 } from "lucide-react";
import { SaveCalculation } from "@/components/SaveCalculation";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useWeatherAutoFill } from "@/hooks/useWeatherAutoFill";
import { FileText } from "lucide-react";

interface AirDensityCalculatorProps {
  saveCalculation?: any;
}

export default function AirDensityCalculator(
  _props: AirDensityCalculatorProps
) {
  const [units, setUnits] = useState<"imperial" | "metric">("imperial");
  const [inputs, setInputs] = useState({
    altitude: "0",
    temperature: "70",
    humidity: "50",
  });

  const [result, setResult] = useState<{
    density: number;
    densitylb: number;
    impact: number;
    derating: number;
  } | null>(null);

  const [pdfComponents, setPdfComponents] = useState<{
    PDFDownloadLink: React.ComponentType<any> | null;
    ClientReportPDF: React.ComponentType<any> | null;
  }>({ PDFDownloadLink: null, ClientReportPDF: null });
  const [loadingPdf, setLoadingPdf] = useState(false);

  // Weather Intelligence
  const { location, getLocation, loading: geoLoading } = useGeolocation();
  const {
    weather,
    loading: weatherLoading,
    fetchWeather,
  } = useWeatherAutoFill();

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
    if (weather) {
      // Convert to currently selected unit
      let temp = weather.tempF;
      if (units === "metric") {
        // weather is usually F from hook default? check backend.
        // Wait, useWeatherAutoFill returns tempF and tempC usually or just one.
        // The hook implementation shows: tempF.
        temp = ((weather.tempF - 32) * 5) / 9;
      }

      setInputs((prev) => ({
        ...prev,
        temperature: temp.toFixed(1),
        humidity: weather.humidity.toString(),
      }));
    }
  }, [weather, units]);

  useEffect(() => {
    if (result && !pdfComponents.PDFDownloadLink && !loadingPdf) {
      setLoadingPdf(true);
      Promise.all([
        import("@react-pdf/renderer").then(module => ({ PDFDownloadLink: module.PDFDownloadLink })),
        import("@/components/reports/ClientReportPDF").then(module => ({ ClientReportPDF: module.ClientReportPDF }))
      ]).then(([pdfModule, reportModule]) => {
        setPdfComponents({
          PDFDownloadLink: pdfModule.PDFDownloadLink,
          ClientReportPDF: reportModule.ClientReportPDF
        });
        setLoadingPdf(false);
      }).catch(error => {
        console.error("Failed to load PDF components:", error);
        setLoadingPdf(false);
      });
    }
  }, [result]);

  const calculate = () => {
    // Constants
    const P0 = 101325; // Sea level pressure (Pa)
    const T0 = 288.15; // Sea level temp (K)
    const g = 9.80665; // Gravity
    const L = 0.0065; // Temp lapse rate
    const R = 8.31447; // Gas constant
    const M = 0.0289644; // Molar mass of dry air

    // Convert Inputs to Standard Units (Meters, Celsius) for Calculation
    let h = parseFloat(inputs.altitude); // ft or m
    let t = parseFloat(inputs.temperature); // F or C
    const rh = parseFloat(inputs.humidity) / 100;

    if (isNaN(h) || isNaN(t) || isNaN(rh)) return;

    if (units === "imperial") {
      h = h * 0.3048; // ft -> m
      t = ((t - 32) * 5) / 9; // F -> C
    }
    const Tc = t;
    const Tk = Tc + 273.15;

    // 1. Calculate Pressure at Altitude (Barometric formula)
    // P = P0 * (1 - (L*h)/T0) ^ ((g*M)/(R*L))
    const pressure = P0 * Math.pow(1 - (L * h) / T0, (g * M) / (R * L));

    // 2. Calculate Saturation Vapor Pressure (Es) - Magnus formula
    const Es = 6.112 * Math.exp((17.67 * Tc) / (Tc + 243.5)); // hPa
    const EsPa = Es * 100; // to Pa

    // 3. Vapor Pressure (Pv)
    const Pv = rh * EsPa;

    // 4. Dry Air Pressure (Pd)
    const Pd = pressure - Pv;

    // 5. Density
    // Rd = 287.058 (Specific gas constant dry air)
    // Rv = 461.495 (Specific gas constant water vapor)
    const Rd = 287.058;
    const Rv = 461.495;

    const density = Pd / (Rd * Tk) + Pv / (Rv * Tk); // kg/m3
    const densityLbFt3 = density * 0.062428;

    // 6. Impact / Derating
    // Standard air density at sea level is approx 0.075 lb/ft3 (1.225 kg/m3)
    // const stdDensity = 0.075;

    // Calculate density ratio relative to STANDARD
    // Using 1.225 kg/m3 as simplified standard reference
    const ratio = density / 1.225;
    const impact = (1 - ratio) * 100; // % Performance Loss

    setResult({
      density: density,
      densitylb: densityLbFt3,
      impact: Math.max(0, impact), // Show loss as positive number
      derating: ratio,
    });
  };

  // Psychrometric Helpers for Report
  const calculatePsychrometrics = () => {
    const t_f = parseFloat(inputs.temperature);
    const rh = parseFloat(inputs.humidity);

    const t_c = units === "metric" ? t_f : ((t_f - 32) * 5) / 9;
    const t_f_final = units === "metric" ? (t_f * 9) / 5 + 32 : t_f;

    // 1. Dew Point (Magnus)
    const Es = 6.112 * Math.exp((17.67 * t_c) / (t_c + 243.5));
    const E = (rh / 100) * Es;
    const lnE = Math.log(E / 6.112);
    const t_dp_c = (243.5 * lnE) / (17.67 - lnE);
    const t_dp_f = (t_dp_c * 9) / 5 + 32;

    // 2. Wet Bulb (Stull - requires T in C, RH in %)
    // Tw = T atan(0.151977(RH% + 8.313659)^1/2) + atan(T + RH%) - atan(RH% - 1.676331) + 0.00391838(RH%)^3/2 atan(0.023101 RH%) - 4.686035
    const T = t_c;
    const R = rh;
    const term1 = T * Math.atan(0.151977 * Math.sqrt(R + 8.313659));
    const term2 = Math.atan(T + R);
    const term3 = Math.atan(R - 1.676331);
    const term4 = 0.00391838 * Math.pow(R, 1.5) * Math.atan(0.023101 * R);
    const t_wb_c = term1 + term2 - term3 + term4 - 4.686035;
    const t_wb_f = (t_wb_c * 9) / 5 + 32;

    return {
      dryBulb: t_f_final,
      wetBulb: t_wb_f,
      rh: rh,
      dewPoint: t_dp_f,
      enthalpy: 0, // Placeholder, not critical for MVP report
    };
  };

  useEffect(() => {
    calculate();
  }, [inputs, units]);

  return (
    <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden">
      <CardHeader className="bg-sky-50/50 dark:bg-slate-800/50 border-b border-sky-100 dark:border-slate-700 pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <div className="bg-sky-100 dark:bg-sky-900/30 p-2 rounded-lg text-sky-600 dark:text-sky-400">
                <Cloud className="w-5 h-5" />
              </div>
              Air Density & Derating
            </CardTitle>
            <CardDescription>
              Calculate air density and equipment performance degradation at
              altitude.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={units}
              onValueChange={(v: "imperial" | "metric") => setUnits(v)}
            >
              <SelectTrigger className="w-[100px] h-8 text-xs bg-white dark:bg-slate-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="imperial">Imperial (ft, °F)</SelectItem>
                <SelectItem value="metric">Metric (m, °C)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Input Section */}
          <div className="p-6 md:p-8 space-y-8 border-r border-slate-100 dark:border-slate-800">
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-xs">
                  Altitude ({units === "imperial" ? "ft" : "m"})
                </Label>
                <div className="relative group">
                  <span className="absolute left-3 top-2.5 text-slate-400">
                    ⛰️
                  </span>
                  <Input
                    type="number"
                    value={inputs.altitude}
                    onChange={(e) =>
                      setInputs({ ...inputs, altitude: e.target.value })
                    }
                    className="pl-9 h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 group-hover:border-sky-400 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-xs flex justify-between">
                  <span>
                    Air Temperature ({units === "imperial" ? "°F" : "°C"})
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleAutoFillWeather}
                    disabled={weatherLoading || geoLoading}
                    className="h-5 px-2 text-[10px] text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20"
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
                </Label>
                <div className="relative group">
                  <span className="absolute left-3 top-2.5 text-slate-400">
                    🌡️
                  </span>
                  <Input
                    type="number"
                    value={inputs.temperature}
                    onChange={(e) =>
                      setInputs({ ...inputs, temperature: e.target.value })
                    }
                    className="pl-9 h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 group-hover:border-sky-400 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-xs flex justify-between">
                  <span>Relative Humidity (%)</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleAutoFillWeather}
                    disabled={weatherLoading || geoLoading}
                    className="h-5 px-2 text-[10px] text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20"
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
                </Label>
                <div className="relative group">
                  <span className="absolute left-3 top-2.5 text-slate-400">
                    💧
                  </span>
                  <Input
                    type="number"
                    value={inputs.humidity}
                    onChange={(e) =>
                      setInputs({ ...inputs, humidity: e.target.value })
                    }
                    max={100}
                    min={0}
                    className="pl-9 h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 group-hover:border-sky-400 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Result Section */}
          <div className="bg-slate-50/80 dark:bg-slate-900/50 p-6 md:p-8 flex flex-col justify-center items-center relative min-h-[300px]">
            {result ? (
              <div className="text-center w-full max-w-sm animate-in zoom-in-95 duration-300">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400 mb-6 shadow-inner">
                  <Gauge className="w-10 h-10" />
                </div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-2">
                  Air Density
                </h3>

                <div className="flex items-baseline justify-center gap-1 mb-8">
                  <span className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter">
                    {units === "imperial"
                      ? result.densitylb.toFixed(3)
                      : result.density.toFixed(3)}
                  </span>
                  <span className="text-lg text-slate-400 font-medium">
                    {units === "imperial" ? "lb/ft³" : "kg/m³"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground border-t border-slate-200 dark:border-slate-700 pt-6 mb-8">
                  <div className="bg-red-50 dark:bg-red-900/10 p-2 rounded">
                    <span className="block mb-1 text-red-600 dark:text-red-400 font-semibold">
                      Capacity Loss
                    </span>
                    <strong className="text-xl text-slate-900 dark:text-white flex items-center justify-center gap-1">
                      <ArrowDown className="w-3 h-3 text-red-500" />
                      {result.impact.toFixed(1)}%
                    </strong>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded">
                    <span className="block mb-1">Derating Factor</span>
                    <strong className="text-xl text-slate-900 dark:text-white">
                      {result.derating.toFixed(2)}x
                    </strong>
                  </div>
                </div>

                <SaveCalculation
                  calculationType="Air Density"
                  inputs={{ ...inputs, units }}
                  results={{ ...result, units_used: units }}
                  trigger={
                    <Button
                      variant="outline"
                      className="w-full border-dashed border-slate-300 hover:border-sky-500 hover:text-sky-600 transition-all"
                    >
                      <Save className="w-4 h-4 mr-2" />
                    </Button>
                  }
                />

                {pdfComponents.PDFDownloadLink && pdfComponents.ClientReportPDF ? (
                  <pdfComponents.PDFDownloadLink
                    document={
                      <pdfComponents.ClientReportPDF data={calculatePsychrometrics()} />
                    }
                    fileName={`ThermoNeural_Report_${new Date().toISOString().split("T")[0]}.pdf`}
                    className="w-full"
                  >
                    {({ loading }: { loading: boolean }) => (
                      <Button
                        variant="default"
                        className="w-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 mt-2"
                        disabled={loading}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        {loading
                          ? "Preparing Report..."
                          : "Download Client Report"}
                      </Button>
                    )}
                  </pdfComponents.PDFDownloadLink>
                ) : loadingPdf ? (
                  <Button
                    variant="default"
                    className="w-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 mt-2"
                    disabled
                  >
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading PDF Library...
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    className="w-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 mt-2"
                    onClick={() => {
                      if (!pdfComponents.PDFDownloadLink && !loadingPdf) {
                        setLoadingPdf(true);
                        Promise.all([
                          import("@react-pdf/renderer").then(module => ({ PDFDownloadLink: module.PDFDownloadLink })),
                          import("@/components/reports/ClientReportPDF").then(module => ({ ClientReportPDF: module.ClientReportPDF }))
                        ]).then(([pdfModule, reportModule]) => {
                          setPdfComponents({
                            PDFDownloadLink: pdfModule.PDFDownloadLink,
                            ClientReportPDF: reportModule.ClientReportPDF
                          });
                          setLoadingPdf(false);
                        }).catch(error => {
                          console.error("Failed to load PDF components:", error);
                          setLoadingPdf(false);
                        });
                      }
                    }}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Load PDF Report
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center text-slate-400 py-12">
                <p className="max-w-[200px] mx-auto text-sm">
                  Enter altitude and current conditions.
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
