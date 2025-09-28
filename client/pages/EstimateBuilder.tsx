import React, { useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Save } from "lucide-react";
import { useSupabaseCalculations } from "@/hooks/useSupabaseCalculations";

const SYSTEM_TYPES = [
  { id: "split_ac", label: "Split AC" },
  { id: "heat_pump", label: "Heat Pump" },
  { id: "rtu", label: "Rooftop Unit" },
  { id: "walkin", label: "Walk-in Cooler" },
];

export default function EstimateBuilder() {
  const { saveCalculation } = useSupabaseCalculations();
  const [systemType, setSystemType] = useState("split_ac");
  const [capacityTons, setCapacityTons] = useState("3");
  const [laborRate, setLaborRate] = useState("95");
  const [laborHours, setLaborHours] = useState("12");
  const [materialsPct, setMaterialsPct] = useState("0.35");
  const [marginPct, setMarginPct] = useState("0.25");
  const [contingencyPct, setContingencyPct] = useState("0.05");
  const [saving, setSaving] = useState(false);

  const estimate = useMemo(() => {
    const tons = Math.max(0, Number(capacityTons) || 0);
    const baseEquipment = (() => {
      switch (systemType) {
        case "heat_pump":
          return 1600 * tons; // higher base cost per ton
        case "rtu":
          return 1400 * tons;
        case "walkin":
          return 1200 * tons;
        default:
          return 1100 * tons;
      }
    })();
    const labor = (Number(laborRate) || 0) * (Number(laborHours) || 0);
    const materials = baseEquipment * (Number(materialsPct) || 0);
    const subtotal = baseEquipment + labor + materials;
    const contingency = subtotal * (Number(contingencyPct) || 0);
    const margin = (subtotal + contingency) * (Number(marginPct) || 0);
    const total = subtotal + contingency + margin;

    return {
      baseEquipment,
      labor,
      materials,
      contingency,
      margin,
      total,
      subtotal,
    };
  }, [systemType, capacityTons, laborRate, laborHours, materialsPct, marginPct, contingencyPct]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const inputs = {
        systemType,
        capacityTons: Number(capacityTons),
        laborRate: Number(laborRate),
        laborHours: Number(laborHours),
        materialsPct: Number(materialsPct),
        marginPct: Number(marginPct),
        contingencyPct: Number(contingencyPct),
      };
      await saveCalculation("Estimate", inputs, estimate);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header variant="dashboard" />
      <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold text-blue-900">Instant Estimate Builder</h1>
          <Badge variant="outline">Preview</Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Inputs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>System type</Label>
                <Select value={systemType} onValueChange={setSystemType}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {SYSTEM_TYPES.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Capacity (tons)</Label>
                <Input type="number" value={capacityTons} onChange={(e) => setCapacityTons(e.target.value)} />
              </div>
              <div>
                <Label>Labor rate ($/hr)</Label>
                <Input type="number" value={laborRate} onChange={(e) => setLaborRate(e.target.value)} />
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Estimated labor (hrs)</Label>
                <Input type="number" value={laborHours} onChange={(e) => setLaborHours(e.target.value)} />
              </div>
              <div>
                <Label>Materials (% of equip)</Label>
                <Input type="number" step="0.01" value={materialsPct} onChange={(e) => setMaterialsPct(e.target.value)} />
              </div>
              <div>
                <Label>Margin (%)</Label>
                <Input type="number" step="0.01" value={marginPct} onChange={(e) => setMarginPct(e.target.value)} />
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Contingency (%)</Label>
                <Input type="number" step="0.01" value={contingencyPct} onChange={(e) => setContingencyPct(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estimate Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="p-3 rounded border bg-white">
                <div className="font-semibold">Equipment</div>
                <div>${estimate.baseEquipment.toFixed(2)}</div>
              </div>
              <div className="p-3 rounded border bg-white">
                <div className="font-semibold">Labor</div>
                <div>${estimate.labor.toFixed(2)}</div>
              </div>
              <div className="p-3 rounded border bg-white">
                <div className="font-semibold">Materials</div>
                <div>${estimate.materials.toFixed(2)}</div>
              </div>
              <div className="p-3 rounded border bg-white">
                <div className="font-semibold">Contingency</div>
                <div>${estimate.contingency.toFixed(2)}</div>
              </div>
              <div className="p-3 rounded border bg-white">
                <div className="font-semibold">Margin</div>
                <div>${estimate.margin.toFixed(2)}</div>
              </div>
              <div className="p-3 rounded border bg-white">
                <div className="font-semibold">Subtotal</div>
                <div>${estimate.subtotal.toFixed(2)}</div>
              </div>
            </div>
            <div className="mt-4 p-4 rounded-lg border-2 border-blue-300 bg-blue-50 text-blue-900 font-bold text-lg">
              Total: ${estimate.total.toFixed(2)}
            </div>
            <div className="mt-4">
              <Button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2">
                <Save className="h-4 w-4" /> Save Estimate
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
