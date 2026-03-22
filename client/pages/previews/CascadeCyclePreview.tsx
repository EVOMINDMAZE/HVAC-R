import { Layers, Thermometer, Zap, CheckCircle2, TrendingUp, Activity } from "lucide-react";

import { PublicPageShell } from "@/components/public/PublicPageShell";
import { AuthTeaserOverlay } from "@/components/ui/AuthTeaserOverlay";
import { Badge } from "@/components/ui/badge";

export function CascadeCyclePreview() {
  return (
    <PublicPageShell mainId="cascade-cycle-preview">
      <div className="max-w-[1600px] mx-auto px-4 py-8 md:py-12 relative z-10">
        
        {/* Header */}
        <div className="mb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6 text-left">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <Badge
                variant="outline"
                className="px-4 py-1.5 rounded-full border-primary/20 bg-primary/5 text-primary backdrop-blur-md font-display tracking-wide uppercase text-[10px] sm:text-xs font-semibold"
              >
                <Layers className="w-3 h-3 mr-2" />
                Cascade Analysis
              </Badge>
              <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 text-[10px] uppercase tracking-widest font-bold">
                Cryogenic Specialization
              </Badge>
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-bold font-display tracking-tight text-foreground">
              Two-Stage Cascade Systems
            </h1>
            <p className="text-muted-foreground mt-4 text-lg max-w-2xl font-light text-balance">
              Model ultra-low temperature applications with multi-stage thermodynamic synthesis and inter-stage heat exchange optimization.
            </p>
          </div>

          {/* Pro Capabilities List */}
          <div className="flex flex-col gap-3 bg-card/30 border border-border/50 p-5 rounded-2xl backdrop-blur-sm lg:max-w-xs w-full">
             <h4 className="text-xs font-bold text-foreground uppercase tracking-widest mb-1">Advanced Features</h4>
             {[
               { icon: Thermometer, text: "Inter-stage ΔT Optimization" },
               { icon: TrendingUp, text: "Dual-Fluid Compatibility" },
               { icon: Activity, text: "T-s Diagram Generation" }
             ].map((item, i) => (
               <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <item.icon className="w-4 h-4 text-primary" />
                  <span>{item.text}</span>
               </div>
             ))}
          </div>
        </div>

        {/* Clear Metrics Area (The Hook) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 text-left">
           {[
             { label: "Overall System COP", value: "1.85", unit: "Total", color: "text-primary" },
             { label: "High-Stage Mass Flow", value: "18.1", unit: "kg/s", color: "text-orange-600" },
             { label: "Low-Stage Mass Flow", value: "12.4", unit: "kg/s", color: "text-cyan-600" },
             { label: "Inter-stage Load", value: "42.5", unit: "kW", color: "text-foreground" }
           ].map((metric, i) => (
             <div key={i} className="rounded-2xl border border-border bg-card/80 p-6 shadow-sm relative overflow-hidden group hover:border-primary/30 transition-all">
                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2">{metric.label}</div>
                <div className="flex items-baseline gap-1">
                   <div className={`text-3xl font-bold font-display ${metric.color}`}>{metric.value}</div>
                   <div className="text-xs font-bold text-muted-foreground">{metric.unit}</div>
                </div>
                <div className="absolute bottom-0 left-0 h-1 bg-primary/10 w-full">
                   <div className={`h-full bg-primary opacity-20`} style={{ width: `${Math.random() * 40 + 40}%` }} />
                </div>
             </div>
           ))}
        </div>

        {/* The Mock UI Container (Locked) */}
        <div className="relative rounded-3xl border border-border/50 bg-card/50 backdrop-blur-md overflow-hidden shadow-2xl h-[550px]">
          
          <div className="flex flex-col h-full opacity-60 blur-[2px] pointer-events-none text-left">
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2">
               <div className="border-r border-border p-8 bg-card/40">
                  <h3 className="text-orange-600 font-display font-bold text-xs uppercase tracking-widest mb-6">High Temp Configuration</h3>
                  <div className="space-y-4">
                     {[1,2,3].map(i => <div key={i} className="h-10 rounded-xl bg-muted/50 border border-border" />)}
                  </div>
               </div>
               <div className="p-8 bg-card/40">
                  <h3 className="text-cyan-600 font-display font-bold text-xs uppercase tracking-widest mb-6">Low Temp Configuration</h3>
                  <div className="space-y-4">
                     {[1,2,3].map(i => <div key={i} className="h-10 rounded-xl bg-muted/50 border border-border" />)}
                  </div>
               </div>
            </div>
            <div className="h-48 border-t border-border bg-background/50 flex items-center justify-center">
               <div className="flex flex-col items-center gap-2">
                  <Layers className="w-8 h-8 text-muted animate-pulse" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Multi-Fluid System Mapping</span>
               </div>
            </div>
          </div>

          {/* The Call to Action Overlay */}
          <AuthTeaserOverlay 
            redirectPath="/tools/cascade-cycle"
            heading="Model Ultra-Low Temperatures"
            description="Sign up for free to run dual-stage thermodynamic models and optimize cascade heat exchange performance."
          />
        </div>
      </div>
    </PublicPageShell>
  );
}
