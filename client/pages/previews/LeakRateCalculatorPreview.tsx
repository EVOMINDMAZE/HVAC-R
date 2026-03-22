import { Calculator, AlertTriangle, FileText, CheckCircle2, History, ShieldAlert } from "lucide-react";

import { PublicPageShell } from "@/components/public/PublicPageShell";
import { AuthTeaserOverlay } from "@/components/ui/AuthTeaserOverlay";
import { Badge } from "@/components/ui/badge";

export function LeakRateCalculatorPreview() {
  return (
    <PublicPageShell mainId="leak-rate-preview">
      <div className="max-w-[1600px] mx-auto px-4 py-8 md:py-12 relative z-10">
        
        {/* Header */}
        <div className="mb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6 text-left">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <Badge
                variant="outline"
                className="px-4 py-1.5 rounded-full border-primary/20 bg-primary/5 text-primary backdrop-blur-md font-display tracking-wide uppercase text-[10px] sm:text-xs font-semibold"
              >
                <Calculator className="w-3 h-3 mr-2" />
                Leak Rate Calculator
              </Badge>
              <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 text-[10px] uppercase tracking-widest font-bold">
                EPA Section 608
              </Badge>
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-bold font-display tracking-tight text-foreground">
              Compliance Leak Tracking
            </h1>
            <p className="text-muted-foreground mt-4 text-lg max-w-2xl font-light text-balance">
              Automatically calculate annualized leak rates, monitor regulatory thresholds, and maintain digital compliance logs for EPA inspections.
            </p>
          </div>

          {/* Pro Capabilities List */}
          <div className="flex flex-col gap-3 bg-card/30 border border-border/50 p-5 rounded-2xl backdrop-blur-sm lg:max-w-xs w-full">
             <h4 className="text-xs font-bold text-foreground uppercase tracking-widest mb-1">Pro Capabilities</h4>
             {[
               { icon: ShieldAlert, text: "Threshold Breach Alerts" },
               { icon: History, text: "Historical Leak Trends" },
               { icon: FileText, text: "Audit-Ready Export" }
             ].map((item, i) => (
               <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <item.icon className="w-4 h-4 text-primary" />
                  <span>{item.text}</span>
               </div>
             ))}
          </div>
        </div>

        {/* Clear Metrics Bar (The Hook) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 text-left">
           {[
             { label: "Annualized Leak Rate", value: "14.2", unit: "%", status: "Critical", color: "text-red-600" },
             { label: "EPA Threshold", value: "10.0", unit: "%", status: "Breached", color: "text-muted-foreground" },
             { label: "Days Since Last Add", value: "42", unit: "Days", status: "Tracked", color: "text-foreground" },
             { label: "Total Refrig. Added", value: "85.0", unit: "lbs", status: "Logged", color: "text-foreground" }
           ].map((metric, i) => (
             <div key={i} className="rounded-2xl p-5 border border-border bg-card/80 shadow-sm relative overflow-hidden group hover:border-primary/30 transition-all">
                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2">{metric.label}</div>
                <div className="flex items-baseline gap-1 mb-1">
                  <div className={`text-3xl font-bold font-display ${metric.color}`}>{metric.value}</div>
                  <div className="text-xs text-muted-foreground font-medium">{metric.unit}</div>
                </div>
                <div className="flex items-center gap-1.5">
                   <div className={`w-1.5 h-1.5 rounded-full ${metric.status === 'Critical' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                   <span className={`text-[10px] font-bold uppercase tracking-tighter ${metric.status === 'Critical' ? 'text-red-600' : 'text-emerald-600'}`}>{metric.status}</span>
                </div>
             </div>
           ))}
        </div>

        {/* The Mock UI Container (Locked) */}
        <div className="relative rounded-3xl border border-border/50 bg-card/50 backdrop-blur-md overflow-hidden shadow-2xl h-[500px]">
          <div className="flex flex-col h-full opacity-60 blur-[2px] pointer-events-none text-left">
            <div className="p-6 border-b border-border bg-muted/20 flex items-center justify-between">
               <h3 className="font-display font-bold text-foreground uppercase tracking-widest text-sm">Asset & Event Logging</h3>
               <div className="w-32 h-10 rounded-xl bg-primary/20 border border-primary/30"></div>
            </div>
            
            <div className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="space-y-6">
                  {[1,2,3].map(i => (
                    <div key={i} className="h-14 border border-border rounded-2xl bg-background/50 flex items-center px-6 gap-4">
                       <div className="w-8 h-8 rounded-lg bg-muted"></div>
                       <div className="flex-1 h-4 bg-muted rounded"></div>
                    </div>
                  ))}
               </div>
               <div className="border border-border rounded-3xl bg-muted/10 flex flex-col items-center justify-center p-12">
                  <AlertTriangle className="w-16 h-16 text-muted mb-4 opacity-30" />
                  <div className="w-48 h-4 bg-muted rounded mb-2"></div>
                  <div className="w-32 h-3 bg-muted/50 rounded"></div>
               </div>
            </div>
          </div>

          <AuthTeaserOverlay 
            redirectPath="/tools/leak-rate-calculator"
            heading="Maintain EPA Compliance"
            description="Sign up for free to track leak rates across your fleet, generate compliance logs, and stay ahead of regulatory requirements."
          />
        </div>
      </div>
    </PublicPageShell>
  );
}
