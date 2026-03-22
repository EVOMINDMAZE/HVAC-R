import { Scale, Info, CheckCircle2, Zap, BarChart3, ShieldCheck } from "lucide-react";

import { PublicPageShell } from "@/components/public/PublicPageShell";
import { AuthTeaserOverlay } from "@/components/ui/AuthTeaserOverlay";
import { Badge } from "@/components/ui/badge";

export function RefrigerantComparisonPreview() {
  return (
    <PublicPageShell mainId="refrigerant-comparison-preview">
      <div className="max-w-[1600px] mx-auto px-4 py-8 md:py-12 relative z-10">
        
        {/* Header */}
        <div className="mb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6 text-left">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <Badge
                variant="outline"
                className="px-4 py-1.5 rounded-full border-primary/20 bg-primary/5 text-primary backdrop-blur-md font-display tracking-wide uppercase text-[10px] sm:text-xs font-semibold"
              >
                <Scale className="w-3 h-3 mr-2" />
                Refrigerant Comparison
              </Badge>
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-[10px] uppercase tracking-widest font-bold">
                50+ Working Fluids
              </Badge>
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-bold font-display tracking-tight text-foreground">
              Refrigerant Analytics
            </h1>
            <p className="text-muted-foreground mt-4 text-lg max-w-2xl font-light text-balance">
              Benchmark GWP, efficiency, and capacity across the industry's most comprehensive database of refrigerants.
            </p>
          </div>

          {/* Pro Capabilities List */}
          <div className="flex flex-col gap-3 bg-card/30 border border-border/50 p-5 rounded-2xl backdrop-blur-sm lg:max-w-xs w-full">
             <h4 className="text-xs font-bold text-foreground uppercase tracking-widest mb-1">Database Assets</h4>
             {[
               { icon: ShieldCheck, text: "A2L Safety Classifications" },
               { icon: BarChart3, text: "GWP Impact Modeling" },
               { icon: Zap, text: "Retrofit Efficiency Analysis" }
             ].map((item, i) => (
               <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <item.icon className="w-4 h-4 text-primary" />
                  <span>{item.text}</span>
               </div>
             ))}
          </div>
        </div>

        {/* Clear Results Area (The Hook) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
           <div className="lg:col-span-8">
              <div className="rounded-3xl border border-border bg-card/80 p-6 md:p-8 shadow-sm relative overflow-hidden group transition-all hover:border-primary/30">
                 <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                    <BarChart3 className="w-24 h-24 text-primary" />
                 </div>
                 <h4 className="text-xs font-bold text-muted-foreground mb-6 tracking-widest uppercase text-left">RELATIVE EFFICIENCY BENCHMARK (COP)</h4>
                 
                 <div className="space-y-8 text-left">
                    {[
                      { name: "R-410A (Baseline)", value: 100, color: "bg-slate-400", isBase: true },
                      { name: "R-454B (Opteon XL41)", value: 101.8, color: "bg-emerald-500", isBase: false },
                      { name: "R-32", value: 103.2, color: "bg-cyan-500", isBase: false },
                      { name: "R-466A (Solstice N41)", value: 98.5, color: "bg-amber-500", isBase: false }
                    ].map((ref, i) => (
                      <div key={i} className="space-y-2">
                         <div className="flex justify-between items-end">
                            <div className="flex items-center gap-2">
                               <span className={`font-display font-bold ${ref.isBase ? 'text-muted-foreground' : 'text-foreground'}`}>{ref.name}</span>
                               {!ref.isBase && <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[9px] h-4">Recommended</Badge>}
                            </div>
                            <span className="font-mono text-sm font-bold text-foreground">{ref.value}%</span>
                         </div>
                         <div className="h-3 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full ${ref.color} rounded-full transition-all duration-1000`} style={{ width: `${ref.value > 100 ? 100 : ref.value}%` }} />
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>

           <div className="lg:col-span-4 grid grid-cols-1 gap-4">
              {[
                { label: "GWP (AR4)", value: "466", sub: "-78% vs Base", color: "text-emerald-600" },
                { label: "Boiling Point", value: "-59.6", unit: "°F", color: "text-foreground" }
              ].map((metric, i) => (
                <div key={i} className="rounded-2xl border border-border bg-card/80 p-6 shadow-sm text-left">
                   <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2">{metric.label}</div>
                   <div className="flex items-baseline gap-1">
                      <div className={`text-3xl font-bold font-display ${metric.color}`}>{metric.value}</div>
                      {metric.unit && <div className="text-xs font-bold text-muted-foreground">{metric.unit}</div>}
                   </div>
                   {metric.sub && <div className="text-[10px] font-bold text-emerald-600 mt-1">{metric.sub}</div>}
                </div>
              ))}
           </div>
        </div>

        {/* The Mock UI Container (Locked) */}
        <div className="relative rounded-3xl border border-border/50 bg-card/50 backdrop-blur-md overflow-hidden shadow-2xl h-[400px]">
          
          <div className="flex flex-col h-full opacity-60 blur-[2px] pointer-events-none text-left">
            <div className="p-6 border-b border-border bg-muted/20 flex items-center justify-between">
               <h3 className="font-display font-bold text-foreground uppercase tracking-widest text-sm">Working Fluid Selector</h3>
               <div className="w-32 h-10 rounded-xl bg-primary/20 border border-primary/30"></div>
            </div>
            
            <div className="p-8 grid grid-cols-2 md:grid-cols-4 gap-6">
               {[1,2,3,4].map(i => (
                 <div key={i} className="h-24 border border-dashed border-border rounded-2xl bg-background/50 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-muted animate-pulse"></div>
                 </div>
               ))}
            </div>
          </div>

          {/* The Call to Action Overlay */}
          <AuthTeaserOverlay 
            redirectPath="/tools/refrigerant-comparison"
            heading="Explore 50+ Refrigerants"
            description="Sign up for free to unlock our full thermodynamic database and compare low-GWP alternatives."
          />
        </div>
      </div>
    </PublicPageShell>
  );
}
