import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Calculator,
  Wrench,
  Clock,
  Package,
  DollarSign,
} from "lucide-react";
import { useSupabaseCalculations } from "@/hooks/useSupabaseCalculations";
import { PageContainer } from "@/components/PageContainer";
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
import { PageHero } from "@/components/shared/PageHero";
import { StatsRow, type StatItem } from "@/components/shared/StatsRow";

const SYSTEM_TYPES = [
  { id: "split_ac", label: "Split AC" },
  { id: "heat_pump", label: "Heat Pump" },
  { id: "rtu", label: "Rooftop Unit" },
  { id: "walkin", label: "Walk-in Cooler" },
];

function currency(value: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export default function EstimateBuilder() {
  const { saveCalculation } = useSupabaseCalculations();
  const navigate = useNavigate();
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
        case "heat_pump": return 1600 * tons;
        case "rtu": return 1400 * tons;
        case "walkin": return 1200 * tons;
        default: return 1100 * tons;
      }
    })();

    const labor = (Number(laborRate) || 0) * (Number(laborHours) || 0);
    const materials = baseEquipment * (Number(materialsPct) || 0);
    const subtotal = baseEquipment + labor + materials;
    const contingency = subtotal * (Number(contingencyPct) || 0);
    const margin = (subtotal + contingency) * (Number(marginPct) || 0);
    const total = subtotal + contingency + margin;

    return { baseEquipment, labor, materials, contingency, margin, subtotal, total };
  }, [systemType, capacityTons, laborRate, laborHours, materialsPct, marginPct, contingencyPct]);

  const stats: StatItem[] = useMemo(() => [
    {
      id: "equipment",
      label: "Equipment",
      value: currency(estimate.baseEquipment),
      status: "neutral",
      icon: <Package className="w-4 h-4" />,
    },
    {
      id: "labor",
      label: "Labor",
      value: currency(estimate.labor),
      status: "neutral",
      icon: <Clock className="w-4 h-4" />,
    },
    {
      id: "materials",
      label: "Materials",
      value: currency(estimate.materials),
      status: "neutral",
      icon: <Wrench className="w-4 h-4" />,
    },
    {
      id: "total",
      label: "Total Estimate",
      value: currency(estimate.total),
      status: "success",
      icon: <DollarSign className="w-4 h-4" />,
    },
  ], [estimate]);

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
    <PageContainer variant="standard" className="estimate-page">
      <PageHero
        title="Estimate Builder"
        subtitle="Generate consistent service estimates from one pricing model"
        icon={<Calculator className="w-5 h-5" />}
        actions={
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        }
      />

      <StatsRow stats={stats} columns={4} />

      <div className="estimate-page__content">
        <div className="estimate-page__form">
          <div className="estimate-page__section">
            <h3 className="estimate-page__section-title">System Details</h3>
            <div className="estimate-page__fields">
              <div className="estimate-page__field">
                <Label>System Type</Label>
                <Select value={systemType} onValueChange={setSystemType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {SYSTEM_TYPES.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="estimate-page__field">
                <Label>Capacity (tons)</Label>
                <Input
                  type="number"
                  value={capacityTons}
                  onChange={(e) => setCapacityTons(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="estimate-page__section">
            <h3 className="estimate-page__section-title">Labor & Materials</h3>
            <div className="estimate-page__fields">
              <div className="estimate-page__field">
                <Label>Labor Rate ($/hr)</Label>
                <Input
                  type="number"
                  value={laborRate}
                  onChange={(e) => setLaborRate(e.target.value)}
                />
              </div>

              <div className="estimate-page__field">
                <Label>Labor Hours</Label>
                <Input
                  type="number"
                  value={laborHours}
                  onChange={(e) => setLaborHours(e.target.value)}
                />
              </div>

              <div className="estimate-page__field">
                <Label>Materials %</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={materialsPct}
                  onChange={(e) => setMaterialsPct(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="estimate-page__section">
            <h3 className="estimate-page__section-title">Margins & Contingency</h3>
            <div className="estimate-page__fields">
              <div className="estimate-page__field">
                <Label>Margin %</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={marginPct}
                  onChange={(e) => setMarginPct(e.target.value)}
                />
              </div>

              <div className="estimate-page__field">
                <Label>Contingency %</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={contingencyPct}
                  onChange={(e) => setContingencyPct(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="estimate-page__actions">
            <Button onClick={handleSave} disabled={saving} size="lg">
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Estimate"}
            </Button>
          </div>
        </div>

        <div className="estimate-page__summary">
          <h3 className="estimate-page__summary-title">Cost Breakdown</h3>
          <div className="estimate-page__summary-list">
            <div className="estimate-page__summary-row">
              <span className="estimate-page__summary-label">Equipment</span>
              <span className="estimate-page__summary-value">{currency(estimate.baseEquipment)}</span>
            </div>
            <div className="estimate-page__summary-row">
              <span className="estimate-page__summary-label">Labor</span>
              <span className="estimate-page__summary-value">{currency(estimate.labor)}</span>
            </div>
            <div className="estimate-page__summary-row">
              <span className="estimate-page__summary-label">Materials</span>
              <span className="estimate-page__summary-value">{currency(estimate.materials)}</span>
            </div>
            <div className="estimate-page__summary-row">
              <span className="estimate-page__summary-label">Subtotal</span>
              <span className="estimate-page__summary-value">{currency(estimate.subtotal)}</span>
            </div>
            <div className="estimate-page__summary-row">
              <span className="estimate-page__summary-label">Contingency</span>
              <span className="estimate-page__summary-value">{currency(estimate.contingency)}</span>
            </div>
            <div className="estimate-page__summary-row">
              <span className="estimate-page__summary-label">Margin</span>
              <span className="estimate-page__summary-value">{currency(estimate.margin)}</span>
            </div>
            <div className="estimate-page__summary-row estimate-page__summary-row--total">
              <span className="estimate-page__summary-label">Total</span>
              <span className="estimate-page__summary-value">{currency(estimate.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}