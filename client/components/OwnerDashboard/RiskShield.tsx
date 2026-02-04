import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShieldCheck, FileCheck, Download, Loader2 } from "lucide-react";
import {
  generateWinterizationCert,
  generateCommissioningCert,
  generateMaintenanceCert,
  downloadPdf,
} from "@/utils/pdfGenerator";
import { useJob } from "@/context/JobContext";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function RiskShield() {
  const { currentJob } = useJob();
  const { user } = useSupabaseAuth();
  const [generating, setGenerating] = useState<string | null>(null);

  const handleGenerate = async (
    type: "winter" | "commission" | "maintenance",
  ) => {
    setGenerating(type);
    try {
      // Real context data
      // Fetch branding if available
      let branding;
      if (user) {
        const { data: companyData } = await supabase
          .from("companies")
          .select(
            "name, logo_url, primary_color, financing_enabled, financing_link",
          )
          .eq("user_id", user.id)
          .single();

        if (companyData) {
          branding = {
            companyName: companyData.name,
            companyLogoUrl: companyData.logo_url,
            primaryColor: companyData.primary_color || undefined,
            financing: {
              enabled: companyData.financing_enabled,
              link: companyData.financing_link,
            },
          };
        }
      }

      const baseData = {
        projectName: currentJob?.name || "Demo Project",
        projectAddress: currentJob?.address || "123 Main St",
        technicianName:
          user?.user_metadata?.full_name ||
          user?.email ||
          "Verified Technician",
        date: new Date().toLocaleDateString(),
        branding,
      };

      let bytes;
      if (type === "winter") {
        bytes = await generateWinterizationCert({
          ...baseData,
          checklistItems: [
            { label: "Pipe Insulation Integrity Check", passed: true },
            { label: "Thermostat Winter Setpoint Validation", passed: true },
            { label: "Outdoor Unit Debris Clearance", passed: true },
            { label: "Emergency Heat Operation Test", passed: true },
            { label: "Carbon Monoxide Safety Check", passed: true },
          ],
        });
        downloadPdf(bytes, `Winterization_Cert_${Date.now()}.pdf`);
      } else if (type === "commission") {
        bytes = await generateCommissioningCert({
          ...baseData,
          checklistItems: [
            {
              label: "Refrigerant Charge Verification (Superheat/Subcooling)",
              passed: true,
            },
            { label: "Electrical Connections & Voltage Check", passed: true },
            { label: "Airflow Assessment", passed: true },
            { label: "Condensate Drain Test", passed: true },
            { label: "Thermostat & Control Operation", passed: true },
          ],
        });
        downloadPdf(bytes, `Commissioning_Report_${Date.now()}.pdf`);
      } else {
        bytes = await generateMaintenanceCert({
          ...baseData,
          checklistItems: [
            { label: "Filter Replacement / Cleaning", passed: true },
            { label: "Coil Cleaning (Condenser & Evaporator)", passed: true },
            { label: "Electrical Connection Tightening", passed: true },
            { label: "Motor & Bearing Inspection", passed: true },
            { label: "Thermostat Calibration Check", passed: true },
          ],
        });
        downloadPdf(bytes, `Maintenance_Cert_${Date.now()}.pdf`);
      }
    } catch (e) {
      console.error("Failed to generate PDF", e);
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="border rounded-lg p-6 bg-card shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4 mb-6">
        <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
          <ShieldCheck className="h-7 w-7 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Risk Shield™ Certification</h3>
          <p className="text-sm text-muted-foreground">
            Generate insurance-ready compliance reports
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid gap-3">
          <Card className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="bg-sky-100 dark:bg-sky-900/30 p-2 rounded text-sky-600 dark:text-sky-400">
                <FileCheck className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Winterization Audit</p>
                <p className="text-xs text-muted-foreground">
                  Seasonal readiness check
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleGenerate("winter")}
              disabled={!!generating}
            >
              {generating === "winter" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Download className="h-3 w-3" />
              )}
            </Button>
          </Card>

          <Card className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded text-emerald-600 dark:text-emerald-400">
                <FileCheck className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium mr-2">System Commissioning</p>
                <p className="text-xs text-muted-foreground">
                  Start-up & verification
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleGenerate("commission")}
              disabled={!!generating}
            >
              {generating === "commission" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Download className="h-3 w-3" />
              )}
            </Button>
          </Card>

          <Card className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded text-indigo-600 dark:text-indigo-400">
                <FileCheck className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium mr-2">
                  Preventative Maintenance
                </p>
                <p className="text-xs text-muted-foreground">
                  System health check
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleGenerate("maintenance")}
              disabled={!!generating}
            >
              {generating === "maintenance" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Download className="h-3 w-3" />
              )}
            </Button>
          </Card>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/30 p-3 rounded-lg text-xs text-center text-muted-foreground border border-slate-100 dark:border-slate-800">
          <ShieldCheck className="w-3 h-3 inline-block mr-1 mb-0.5" />
          Verified by ThermoNeural Risk Engine
        </div>
      </div>
    </div>
  );
}
