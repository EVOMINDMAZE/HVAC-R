import { Calculator, Zap, CheckCircle2, FileText, BarChart3, Database } from "lucide-react";

import { PublicPageShell } from "@/components/public/PublicPageShell";
import { AuthTeaserOverlay } from "@/components/ui/AuthTeaserOverlay";
import { Badge } from "@/components/ui/badge";

export function StandardCyclePreview() {
  return (
    <PublicPageShell mainId="standard-cycle-preview">
      <div className="max-w-[1600px] mx-auto px-4 py-8 md:py-12 relative z-10">
        
        {/* Header */}
        <div className="mb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <Badge
                variant="outline"
                className="px-4 py-1.5 rounded-full border-primary/20 bg-primary/5 text-primary backdrop-blur-md font-display tracking-wide uppercase text-[10px] sm:text-xs font-semibold"
              >
                <Calculator className="w-3 h-3 mr-2" />
                Standard Refrigeration Cycle
              </Badge>
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] uppercase tracking-widest font-bold">
                NIST Verified
              </Badge>
            </div>
            
            <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400 font-medium">
              Illustrative preview — the numbers shown are sample values, not live results. Create a free account to run real calculations.
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight font-display">
              <span className="text-foreground text-balance">
                Professional Cycle Simulator
              </span>
            </h1>
            <p className="text-muted-foreground mt-4 text-lg font-light tracking-wide max-w-2xl text-balance">
              Model complex baseline performance with real-time P-h diagram synthesis and NIST-verified thermodynamic accuracy.
            </p>
          </div>

          {/* Pro Capabilities List */}
          <div className="flex flex-col gap-3 bg-card/30 border border-border/50 p-5 rounded-2xl backdrop-blur-sm lg:max-w-xs w-full">
             <h4 className="text-xs font-bold text-foreground uppercase tracking-widest mb-1">Pro Capabilities</h4>
             {[
               { icon: Database, text: "CoolProp Thermodynamic Engine" },
               { icon: BarChart3, text: "Multi-Point Analysis" },
               { icon: FileText, text: "One-Click PDF Reports" }
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
             { label: "Coefficient of Performance", value: "3.42", unit: "COP", status: "Optimal" },
             { label: "Net Cooling Capacity", value: "5.0", unit: "Tons", status: "Design" },
             { label: "Specific Compressor Work", value: "5.1", unit: "kW", status: "Active" },
             { label: "Saturated Discharge Temp", value: "85.2", unit: "°C", status: "Calculated" }
           ].map((metric, i) => (
             <div key={i} className="rounded-2xl p-5 border border-border bg-card/80 shadow-sm relative overflow-hidden group transition-all hover:border-primary/30">
                <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                   <CheckCircle2 className="w-12 h-12 text-primary" />
                </div>
                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2">{metric.label}</div>
                <div className="flex items-baseline gap-1 mb-1">
                  <div className="text-3xl font-bold text-foreground font-display">{metric.value}</div>
                  <div className="text-xs text-muted-foreground font-medium">{metric.unit}</div>
                </div>
                <div className="flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                   <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-tighter">{metric.status}</span>
                </div>
             </div>
           ))}
        </div>

        {/* The Mock UI Container (Partially Locked) */}
        <div className="relative rounded-3xl border border-border/50 bg-card/50 backdrop-blur-md overflow-hidden shadow-2xl h-[600px] lg:h-[700px]">
          
          <div className="flex flex-col h-full">
            {/* Toolbar Mock */}
            <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between opacity-50 pointer-events-none">
               <div className="flex gap-4">
                  <div className="w-32 h-8 rounded-lg bg-border/50"></div>
                  <div className="w-32 h-8 rounded-lg bg-border/50"></div>
               </div>
               <div className="w-24 h-8 rounded-lg bg-primary/20 border border-primary/30"></div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden text-left">
              {/* Sidebar (Locked Area) */}
              <div className="lg:col-span-4 border-r border-border p-6 bg-card/40 blur-[1px] opacity-60 pointer-events-none">
                 <h3 className="font-display text-sm font-bold tracking-tight text-foreground mb-6 flex items-center uppercase tracking-wider">
                    <Zap className="w-4 h-4 mr-2 text-primary" /> PARAMETER INPUTS
                 </h3>
                 <div className="space-y-6">
                    {[
                      { label: "Working Fluid", value: "R-410A" },
                      { label: "Evaporator Temp (°C)", value: "-10.0" },
                      { label: "Condenser Temp (°C)", value: "45.0" },
                      { label: "Superheat (K)", value: "5.0" },
                      { label: "Subcooling (K)", value: "2.0" }
                    ].map((input, i) => (
                      <div key={i} className="space-y-2">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{input.label}</div>
                        <div className="h-11 border border-input rounded-xl bg-background/50 flex items-center px-4 text-foreground font-medium">{input.value}</div>
                      </div>
                    ))}
                    <div className="pt-4">
                      <div className="h-12 rounded-xl bg-primary w-full flex items-center justify-center text-primary-foreground font-bold shadow-lg shadow-primary/20 tracking-wide">CALCULATE PERFORMANCE</div>
                    </div>
                 </div>
              </div>

              {/* Chart/Analysis Area (Locked Area) */}
              <div className="lg:col-span-8 flex flex-col blur-[2px] opacity-60 pointer-events-none bg-card/20">
                 <div className="flex-1 p-8 flex items-center justify-center relative">
                    {/* Mock Grid Lines */}
                    <div className="absolute inset-12 border-l-2 border-b-2 border-border/50">
                       <div className="w-full h-full bg-[linear-gradient(to_right,rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.05)_1px,transparent_1px)] bg-[size:5%_10%] dark:invert" />
                    </div>
                    
                    {/* High Fidelity Mock P-h Dome */}
                    <div className="absolute w-[70%] h-[70%] border-t-4 border-primary/20 rounded-t-[100%] opacity-30" />
                    
                    {/* High Fidelity Mock Cycle Curve */}
                    <svg className="absolute w-[60%] h-[60%] text-primary/40 drop-shadow-[0_0_10px_rgba(var(--primary),0.2)]" viewBox="0 0 100 100" fill="none" preserveAspectRatio="none">
                       <path d="M20,80 L20,20 L80,20 L80,80 Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                       <circle cx="20" cy="80" r="2" fill="currentColor" />
                       <circle cx="20" cy="20" r="2" fill="currentColor" />
                       <circle cx="80" cy="20" r="2" fill="currentColor" />
                       <circle cx="80" cy="80" r="2" fill="currentColor" />
                    </svg>

                    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-background/90 border border-border px-6 py-3 rounded-full shadow-xl flex items-center gap-3">
                       <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                          <span className="text-xs font-bold font-display text-foreground tracking-widest uppercase">Live Synthesis</span>
                       </div>
                       <div className="w-px h-4 bg-border" />
                       <span className="text-xs text-muted-foreground font-medium">Awaiting Session Auth</span>
                    </div>
                 </div>
              </div>
            </div>
          </div>

          {/* The Call to Action Overlay (Positioned to cover the locked content) */}
          <AuthTeaserOverlay 
            redirectPath="/tools/standard-cycle"
            heading="Unlock the Full Workspace"
            description="Sign up for free to access the NIST-verified simulator, customize inputs, and generate professional compliance reports."
          />
        </div>
      </div>
    </PublicPageShell>
  );
}
