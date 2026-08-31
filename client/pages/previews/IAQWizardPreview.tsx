import { Wind, ShieldCheck, Thermometer, Droplets, CheckCircle2, FileText, Zap, BrainCircuit } from "lucide-react";

import { PublicPageShell } from "@/components/public/PublicPageShell";
import { AuthTeaserOverlay } from "@/components/ui/AuthTeaserOverlay";
import { Badge } from "@/components/ui/badge";

export function IAQWizardPreview() {
  return (
    <PublicPageShell mainId="iaq-wizard-preview">
      <div className="max-w-[1600px] mx-auto px-4 py-8 md:py-12 relative z-10">
        
        {/* Header */}
        <div className="mb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6 text-left">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <Badge
                variant="outline"
                className="px-4 py-1.5 rounded-full border-primary/20 bg-primary/5 text-primary backdrop-blur-md font-display tracking-wide uppercase text-[10px] sm:text-xs font-semibold"
              >
                <Wind className="w-3 h-3 mr-2" />
                IAQ Wizard
              </Badge>
              <Badge variant="secondary" className="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20 text-[10px] uppercase tracking-widest font-bold">
                AI Diagnostics
              </Badge>
            </div>
            
            <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400 font-medium">
              Illustrative preview — the numbers shown are sample values, not live results. Create a free account to run real calculations.
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold font-display tracking-tight text-foreground">
              Indoor Air Quality Auditor
            </h1>
            <p className="text-muted-foreground mt-4 text-lg max-w-2xl font-light text-balance">
              Professional-grade IAQ assessment tool. Audit ventilation, filtration, and contaminant levels with guided field diagnostics and AI-driven mitigation strategies.
            </p>
          </div>

          {/* Pro Capabilities List */}
          <div className="flex flex-col gap-3 bg-card/30 border border-border/50 p-5 rounded-2xl backdrop-blur-sm lg:max-w-xs w-full">
             <h4 className="text-xs font-bold text-foreground uppercase tracking-widest mb-1">Wizard Capabilities</h4>
             {[
               { icon: BrainCircuit, text: "AI Mitigation Strategies" },
               { icon: ShieldCheck, text: "ASHRAE 62.1 Standards" },
               { icon: FileText, text: "Client-Ready IAQ Reports" }
             ].map((item, i) => (
               <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <item.icon className="w-4 h-4 text-primary" />
                  <span>{item.text}</span>
               </div>
             ))}
          </div>
        </div>

        {/* Clear Assessment Metrics (The Hook) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 text-left">
           {[
             { label: "Overall Air Quality Score", value: "84", unit: "/100", status: "Good", color: "text-emerald-600" },
             { label: "CO2 Concentration", value: "650", unit: "PPM", status: "Optimal", color: "text-foreground" },
             { label: "PM2.5 Level", value: "8.4", unit: "µg/m³", status: "Safe", color: "text-foreground" },
             { label: "VOC Concentration", value: "180", unit: "PPB", status: "Fair", color: "text-amber-600" }
           ].map((metric, i) => (
             <div key={i} className="rounded-2xl p-5 border border-border bg-card/80 shadow-sm relative overflow-hidden group hover:border-primary/30 transition-all">
                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2">{metric.label}</div>
                <div className="flex items-baseline gap-1 mb-1">
                  <div className={`text-3xl font-bold font-display ${metric.color}`}>{metric.value}</div>
                  <div className="text-xs text-muted-foreground font-medium">{metric.unit}</div>
                </div>
                <div className="flex items-center gap-1.5">
                   <div className={`w-1.5 h-1.5 rounded-full ${metric.status === 'Good' || metric.status === 'Optimal' || metric.status === 'Safe' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                   <span className={`text-[10px] font-bold uppercase tracking-tighter ${metric.status === 'Good' || metric.status === 'Optimal' || metric.status === 'Safe' ? 'text-emerald-600' : 'text-amber-600'}`}>{metric.status}</span>
                </div>
             </div>
           ))}
        </div>

        {/* The Mock UI Container (Locked) */}
        <div className="relative rounded-3xl border border-border/50 bg-card/50 backdrop-blur-md overflow-hidden shadow-2xl h-[550px]">
          <div className="flex flex-col h-full opacity-60 blur-[2px] pointer-events-none text-left">
            <div className="p-6 border-b border-border bg-muted/20 flex items-center justify-between">
               <h3 className="font-display font-bold text-foreground uppercase tracking-widest text-sm">Guided Field Audit</h3>
               <div className="flex gap-2">
                  <div className="w-24 h-10 rounded-xl bg-border/50"></div>
                  <div className="w-32 h-10 rounded-xl bg-primary/20 border border-primary/30"></div>
               </div>
            </div>
            
            <div className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
               <div className="lg:col-span-5 space-y-4">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="p-4 border border-border rounded-xl bg-background/50 flex items-center gap-4">
                       <div className="w-5 h-5 rounded border border-border"></div>
                       <div className="flex-1 h-3 bg-muted rounded"></div>
                    </div>
                  ))}
               </div>
               <div className="lg:col-span-7 border border-border rounded-3xl bg-muted/5 p-8 flex flex-col items-center justify-center text-center">
                  <BrainCircuit className="w-16 h-16 text-primary mb-4 opacity-20" />
                  <div className="w-64 h-4 bg-muted rounded mb-3"></div>
                  <div className="w-48 h-3 bg-muted/50 rounded"></div>
                  <div className="mt-8 grid grid-cols-2 gap-4 w-full">
                     <div className="h-20 rounded-2xl bg-background/50 border border-border"></div>
                     <div className="h-20 rounded-2xl bg-background/50 border border-border"></div>
                  </div>
               </div>
            </div>
          </div>

          <AuthTeaserOverlay 
            redirectPath="/tools/iaq-wizard"
            heading="Master Air Quality Diagnostics"
            description="Sign up for free to access our guided IAQ wizard, get AI-powered remediation advice, and generate branded reports for your customers."
          />
        </div>
      </div>
    </PublicPageShell>
  );
}
