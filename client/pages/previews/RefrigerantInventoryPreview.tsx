import { Database, Package, ShieldCheck, CheckCircle2, History, Zap, Search, BarChart3 } from "lucide-react";

import { PublicPageShell } from "@/components/public/PublicPageShell";
import { AuthTeaserOverlay } from "@/components/ui/AuthTeaserOverlay";
import { Badge } from "@/components/ui/badge";

export function RefrigerantInventoryPreview() {
  return (
    <PublicPageShell mainId="inventory-preview">
      <div className="max-w-[1600px] mx-auto px-4 py-8 md:py-12 relative z-10">
        
        {/* Header */}
        <div className="mb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6 text-left">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <Badge
                variant="outline"
                className="px-4 py-1.5 rounded-full border-primary/20 bg-primary/5 text-primary backdrop-blur-md font-display tracking-wide uppercase text-[10px] sm:text-xs font-semibold"
              >
                <Package className="w-3 h-3 mr-2" />
                Inventory Management
              </Badge>
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-[10px] uppercase tracking-widest font-bold">
                Real-Time Tracking
              </Badge>
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-bold font-display tracking-tight text-foreground">
              Digital Refrigerant Bank
            </h1>
            <p className="text-muted-foreground mt-4 text-lg max-w-2xl font-light text-balance">
              Centralize your cylinder inventory. Track virgin and recovered gas levels across your entire fleet with automated weight logging and cylinder lifecycle management.
            </p>
          </div>

          {/* Pro Capabilities List */}
          <div className="flex flex-col gap-3 bg-card/30 border border-border/50 p-5 rounded-2xl backdrop-blur-sm lg:max-w-xs w-full">
             <h4 className="text-xs font-bold text-foreground uppercase tracking-widest mb-1">Bank Features</h4>
             {[
               { icon: Database, text: "Cylinder Lifecycle Tracking" },
               { icon: ShieldCheck, text: "Auto-Recalculated Weights" },
               { icon: BarChart3, text: "Stock Level Analytics" }
             ].map((item, i) => (
               <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <item.icon className="w-4 h-4 text-primary" />
                  <span>{item.text}</span>
               </div>
             ))}
          </div>
        </div>

        {/* Clear Summary Area (The Hook) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 text-left">
           {[
             { label: "Total Gas in Bank", value: "842", unit: "lbs", color: "text-primary" },
             { label: "R-410A Virgin Stock", value: "350", unit: "lbs", color: "text-foreground" },
             { label: "R-22 Recovered", value: "124", unit: "lbs", color: "text-amber-600" },
             { label: "Active Cylinders", value: "28", unit: "Units", color: "text-foreground" }
           ].map((metric, i) => (
             <div key={i} className="rounded-2xl border border-border bg-card/80 p-6 shadow-sm relative overflow-hidden group hover:border-primary/30 transition-all">
                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2">{metric.label}</div>
                <div className="flex items-baseline gap-1">
                   <div className={`text-3xl font-bold font-display ${metric.color}`}>{metric.value}</div>
                   <div className="text-xs font-bold text-muted-foreground">{metric.unit}</div>
                </div>
                <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                   <Package className="w-10 h-10 text-primary" />
                </div>
             </div>
           ))}
        </div>

        {/* The Mock UI Container (Locked) */}
        <div className="relative rounded-3xl border border-border/50 bg-card/50 backdrop-blur-md overflow-hidden shadow-2xl h-[500px]">
          <div className="flex flex-col h-full opacity-60 blur-[2px] pointer-events-none text-left">
            <div className="p-6 border-b border-border bg-muted/20 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="w-48 h-10 border border-input rounded-xl bg-background/50 flex items-center px-4 gap-2">
                     <Search className="w-4 h-4 text-muted" />
                     <div className="w-24 h-3 bg-muted rounded"></div>
                  </div>
                  <div className="w-32 h-10 rounded-xl bg-border/50 border border-border"></div>
               </div>
               <div className="w-32 h-10 rounded-xl bg-primary/20 border border-primary/30"></div>
            </div>
            
            <div className="p-8 space-y-4">
               {[1,2,3,4].map(i => (
                 <div key={i} className="p-5 border border-border rounded-2xl bg-background/50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-full bg-muted/30"></div>
                       <div className="space-y-2">
                          <div className="w-32 h-3 bg-muted rounded"></div>
                          <div className="w-20 h-2 bg-muted/50 rounded"></div>
                       </div>
                    </div>
                    <div className="w-24 h-4 bg-muted rounded"></div>
                 </div>
               ))}
            </div>
          </div>

          <AuthTeaserOverlay 
            redirectPath="/tools/refrigerant-inventory"
            heading="Digitalize Your Gas Bank"
            description="Sign up for free to track cylinder inventory, manage stock levels across your team, and maintain precise recovery records."
          />
        </div>
      </div>
    </PublicPageShell>
  );
}
