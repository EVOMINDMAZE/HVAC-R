import React, { useState } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { useSupabaseCalculations } from "@/hooks/useSupabaseCalculations";

export default function DIYCalculators() {
  const { saveCalculation } = useSupabaseCalculations();

  // Standard
  const [stdForm, setStdForm] = useState({
    refrigerant: "R134a",
    evap_temp_c: "-10",
    cond_temp_c: "45",
    superheat_c: "5",
    subcooling_c: "2",
  });
  const [stdLoading, setStdLoading] = useState(false);
  const [stdError, setStdError] = useState<string | null>(null);
  const [stdResult, setStdResult] = useState<any>(null);

  // Cascade
  const [lt, setLt] = useState({
    refrigerant: "R744",
    evap_temp_c: "-50",
    cond_temp_c: "-5",
    superheat_c: "3",
    subcooling_c: "2",
  });
  const [ht, setHt] = useState({
    refrigerant: "R134a",
    evap_temp_c: "0",
    cond_temp_c: "40",
    superheat_c: "5",
    subcooling_c: "2",
  });
  const [hxDeltaT, setHxDeltaT] = useState("5");
  const [casLoading, setCasLoading] = useState(false);
  const [casError, setCasError] = useState<string | null>(null);
  const [casResult, setCasResult] = useState<any>(null);

  const validateNumber = (s: string) => s !== "" && !isNaN(Number(s));

  const runStandard = async () => {
    setStdError(null);
    setStdResult(null);
    if (
      !stdForm.refrigerant ||
      !validateNumber(stdForm.evap_temp_c) ||
      !validateNumber(stdForm.cond_temp_c) ||
      !validateNumber(stdForm.superheat_c) ||
      !validateNumber(stdForm.subcooling_c)
    ) {
      setStdError("Please fill all fields with valid numbers.");
      return;
    }
    setStdLoading(true);
    try {
      const body = {
        refrigerant: stdForm.refrigerant,
        evap_temp_c: Number(stdForm.evap_temp_c),
        cond_temp_c: Number(stdForm.cond_temp_c),
        superheat_c: Number(stdForm.superheat_c),
        subcooling_c: Number(stdForm.subcooling_c),
      };
      const resp = await fetch(`${API_BASE_URL}/calculate-standard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await resp.json();
      if (!resp.ok || !payload?.data) {
        setStdError(payload?.error || `Request failed (${resp.status})`);
        return;
      }
      setStdResult(payload.data);
      await saveCalculation(
        "DIY Calculator",
        { kind: "standard", ...body },
        payload.data,
      );
    } catch (e: any) {
      setStdError(e?.message || "Network error");
    } finally {
      setStdLoading(false);
    }
  };

  const runCascade = async () => {
    setCasError(null);
    setCasResult(null);
    if (
      !lt.refrigerant ||
      !validateNumber(lt.evap_temp_c) ||
      !validateNumber(lt.cond_temp_c) ||
      !validateNumber(lt.superheat_c) ||
      !validateNumber(lt.subcooling_c) ||
      !ht.refrigerant ||
      !validateNumber(ht.evap_temp_c) ||
      !validateNumber(ht.cond_temp_c) ||
      !validateNumber(ht.superheat_c) ||
      !validateNumber(ht.subcooling_c) ||
      !validateNumber(hxDeltaT)
    ) {
      setCasError("Please fill all fields with valid numbers.");
      return;
    }
    setCasLoading(true);
    try {
      const body = {
        lt_cycle: {
          refrigerant: lt.refrigerant,
          evap_temp_c: Number(lt.evap_temp_c),
          cond_temp_c: Number(lt.cond_temp_c),
          superheat_c: Number(lt.superheat_c),
          subcooling_c: Number(lt.subcooling_c),
        },
        ht_cycle: {
          refrigerant: ht.refrigerant,
          evap_temp_c: Number(ht.evap_temp_c),
          cond_temp_c: Number(ht.cond_temp_c),
          superheat_c: Number(ht.superheat_c),
          subcooling_c: Number(ht.subcooling_c),
        },
        cascade_hx_delta_t_c: Number(hxDeltaT),
      };
      const resp = await fetch(`${API_BASE_URL}/calculate-cascade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await resp.json();
      if (!resp.ok || !payload?.data) {
        setCasError(payload?.error || `Request failed (${resp.status})`);
        return;
      }
      setCasResult(payload.data);
      await saveCalculation(
        "DIY Calculator",
        { kind: "cascade", ...body },
        payload.data,
      );
    } catch (e: any) {
      setCasError(e?.message || "Network error");
    } finally {
      setCasLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header variant="dashboard" />
      <main className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold text-blue-900">
          DIY Calculators
        </h1>

        <Tabs defaultValue="standard">
          <TabsList>
            <TabsTrigger value="standard">Standard Cycle</TabsTrigger>
            <TabsTrigger value="cascade">Cascade Cycle</TabsTrigger>
          </TabsList>

          <TabsContent value="standard">
            <Card>
              <CardHeader>
                <CardTitle>Quick Standard Cycle</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {stdError && (
                  <Alert variant="destructive">
                    <AlertTitle>Request failed</AlertTitle>
                    <AlertDescription>{stdError}</AlertDescription>
                  </Alert>
                )}
                <div className="grid md:grid-cols-5 gap-3">
                  <div className="md:col-span-2">
                    <Label>Refrigerant</Label>
                    <Input
                      value={stdForm.refrigerant}
                      onChange={(e) =>
                        setStdForm({ ...stdForm, refrigerant: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Evap (°C)</Label>
                    <Input
                      type="number"
                      value={stdForm.evap_temp_c}
                      onChange={(e) =>
                        setStdForm({ ...stdForm, evap_temp_c: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Cond (°C)</Label>
                    <Input
                      type="number"
                      value={stdForm.cond_temp_c}
                      onChange={(e) =>
                        setStdForm({ ...stdForm, cond_temp_c: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Superheat (°C)</Label>
                    <Input
                      type="number"
                      value={stdForm.superheat_c}
                      onChange={(e) =>
                        setStdForm({ ...stdForm, superheat_c: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Subcooling (°C)</Label>
                    <Input
                      type="number"
                      value={stdForm.subcooling_c}
                      onChange={(e) =>
                        setStdForm({ ...stdForm, subcooling_c: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={runStandard} disabled={stdLoading}>
                    {stdLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Calculating…
                      </>
                    ) : (
                      "Calculate"
                    )}
                  </Button>
                </div>
                {stdResult && (
                  <div className="mt-4 p-3 rounded border bg-white">
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(stdResult, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cascade">
            <Card>
              <CardHeader>
                <CardTitle>Quick Cascade Cycle</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {casError && (
                  <Alert variant="destructive">
                    <AlertTitle>Request failed</AlertTitle>
                    <AlertDescription>{casError}</AlertDescription>
                  </Alert>
                )}
                <div className="grid md:grid-cols-5 gap-3">
                  <div className="md:col-span-2">
                    <Label>LT Refrigerant</Label>
                    <Input
                      value={lt.refrigerant}
                      onChange={(e) =>
                        setLt({ ...lt, refrigerant: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>LT Evap (°C)</Label>
                    <Input
                      type="number"
                      value={lt.evap_temp_c}
                      onChange={(e) =>
                        setLt({ ...lt, evap_temp_c: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>LT Cond (°C)</Label>
                    <Input
                      type="number"
                      value={lt.cond_temp_c}
                      onChange={(e) =>
                        setLt({ ...lt, cond_temp_c: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>LT Superheat (°C)</Label>
                    <Input
                      type="number"
                      value={lt.superheat_c}
                      onChange={(e) =>
                        setLt({ ...lt, superheat_c: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>LT Subcooling (°C)</Label>
                    <Input
                      type="number"
                      value={lt.subcooling_c}
                      onChange={(e) =>
                        setLt({ ...lt, subcooling_c: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-5 gap-3">
                  <div className="md:col-span-2">
                    <Label>HT Refrigerant</Label>
                    <Input
                      value={ht.refrigerant}
                      onChange={(e) =>
                        setHt({ ...ht, refrigerant: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>HT Evap (°C)</Label>
                    <Input
                      type="number"
                      value={ht.evap_temp_c}
                      onChange={(e) =>
                        setHt({ ...ht, evap_temp_c: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>HT Cond (°C)</Label>
                    <Input
                      type="number"
                      value={ht.cond_temp_c}
                      onChange={(e) =>
                        setHt({ ...ht, cond_temp_c: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>HT Superheat (°C)</Label>
                    <Input
                      type="number"
                      value={ht.superheat_c}
                      onChange={(e) =>
                        setHt({ ...ht, superheat_c: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>HT Subcooling (°C)</Label>
                    <Input
                      type="number"
                      value={ht.subcooling_c}
                      onChange={(e) =>
                        setHt({ ...ht, subcooling_c: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-5 gap-3">
                  <div>
                    <Label>HX ΔT (°C)</Label>
                    <Input
                      type="number"
                      value={hxDeltaT}
                      onChange={(e) => setHxDeltaT(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={runCascade} disabled={casLoading}>
                    {casLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Calculating…
                      </>
                    ) : (
                      "Calculate"
                    )}
                  </Button>
                </div>
                {casResult && (
                  <div className="mt-4 p-3 rounded border bg-white">
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(casResult, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
