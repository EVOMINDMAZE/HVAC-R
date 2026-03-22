import { Droplets, Settings2, Download, Save, Activity, FileText, BarChart3, ShieldCheck } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Navigate } from "react-router-dom";

import { PublicPageShell } from "@/components/public/PublicPageShell";
import { AuthTeaserOverlay } from "@/components/ui/AuthTeaserOverlay";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

export function PsychrometricsPreview() {
  const { isAuthenticated, isLoading } = useSupabaseAuth();

  if (isAuthenticated && !isLoading) {
    return <Navigate to="/tools/psychrometrics" replace />;
  }

  return (
    <PublicPageShell className="bg-transparent" mainId="psychrometrics-preview">
      <Helmet>
        <title>Psychrometric Analyzer | ThermoNeural</title>
        <meta name="description" content="Preview of the Psychrometric Analyzer tool." />
      </Helmet>

      <div className="max-w-[1600px] mx-auto px-4 py-8 md:py-12 relative z-10">
        
        {/* Header */}
        <div className="mb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6 text-left">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <Badge
                variant="outline"
                className="px-4 py-1.5 rounded-full border-primary/20 bg-primary/5 text-primary backdrop-blur-md font-display tracking-wide uppercase text-[10px] sm:text-xs font-semibold"
              >
                <Droplets className="w-3 h-3 mr-2" />
                Psychrometric Analyzer
              </Badge>
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-[10px] uppercase tracking-widest font-bold">
                Thermodynamic Accuracy
              </Badge>
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-bold font-display tracking-tight text-foreground">
              Air State Synthesis
            </h1>
            <p className="text-muted-foreground mt-4 text-lg max-w-2xl font-light text-balance">
              Calculate precise air properties, model mixing processes, and visualize complex HVAC cycles on an interactive psychrometric chart.
            </p>
          </div>

          {/* Pro Capabilities List */}
          <div className="flex flex-col gap-3 bg-card/30 border border-border/50 p-5 rounded-2xl backdrop-blur-sm lg:max-w-xs w-full">
             <h4 className="text-xs font-bold text-foreground uppercase tracking-widest mb-1">Pro Capabilities</h4>
             {[
               { icon: Activity, text: "Complex Process Mapping" },
               { icon: BarChart3, text: "Sensible/Latent Load Splitting" },
               { icon: FileText, text: "Professional Data Export" }
             ].map((item, i) => (
               <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <item.icon className="w-4 h-4 text-primary" />
                  <span>{item.text}</span>
               </div>
             ))}
          </div>
        </div>

        {/* Clear Summary Area (The Hook) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-left">
          <div className="rounded-2xl p-6 border border-border bg-card/80 shadow-sm relative overflow-hidden group hover:border-primary/30 transition-all">
            <p className="text-sm font-bold text-muted-foreground mb-4 uppercase tracking-widest">Calculated Coil Load</p>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 font-display">377.6</p>
              <p className="text-lg font-bold text-muted-foreground">MBH</p>
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-mono">31.5 Tons of Refrigeration</p>
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <Droplets className="w-16 h-16 text-blue-500" />
            </div>
          </div>
          <div className="rounded-2xl p-6 border border-border bg-card/80 shadow-sm relative overflow-hidden group hover:border-primary/30 transition-all">
            <p className="text-sm font-bold text-muted-foreground mb-4 uppercase tracking-widest">Condensate Removal</p>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold text-cyan-600 dark:text-cyan-400 font-display">98.4</p>
              <p className="text-lg font-bold text-muted-foreground">lb / hr</p>
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-mono">~11.8 Gallons / hr Recovery</p>
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <Activity className="w-16 h-16 text-cyan-500" />
            </div>
          </div>
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
               <div className="flex gap-2 text-left">
                  <div className="w-20 h-8 rounded-lg bg-border/50"></div>
                  <div className="w-24 h-8 rounded-lg bg-primary/20 border border-primary/30"></div>
               </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden text-left">
              {/* Sidebar (Locked Area) */}
              <div className="lg:col-span-3 border-r border-border p-6 bg-card/40 blur-[1px] opacity-60 pointer-events-none">
                 <h3 className="font-display text-sm font-bold tracking-tight text-foreground mb-6 flex items-center uppercase tracking-wider">
                    <Settings2 className="w-4 h-4 mr-2 text-primary" /> STATE POINTS
                 </h3>
                 <div className="space-y-6">
                    <div className="p-4 rounded-xl border border-border bg-background/50">
                       <p className="text-[10px] font-bold text-primary mb-3 uppercase tracking-widest">Point 1 (OA)</p>
                       <div className="space-y-3">
                          <div className="h-9 border border-input rounded-lg bg-background flex items-center px-3 text-xs text-foreground font-medium">DB: 95.0 °F</div>
                          <div className="h-9 border border-input rounded-lg bg-background flex items-center px-3 text-xs text-foreground font-medium">WB: 78.0 °F</div>
                       </div>
                    </div>
                    <div className="p-4 rounded-xl border border-border bg-background/50 text-left">
                       <p className="text-[10px] font-bold text-primary mb-3 uppercase tracking-widest">Point 2 (RA)</p>
                       <div className="space-y-3">
                          <div className="h-9 border border-input rounded-lg bg-background flex items-center px-3 text-xs text-foreground font-medium">DB: 75.0 °F</div>
                          <div className="h-9 border border-input rounded-lg bg-background flex items-center px-3 text-xs text-foreground font-medium">RH: 50.0%</div>
                       </div>
                    </div>
                    <div className="pt-4">
                      <div className="h-12 rounded-xl bg-primary w-full flex items-center justify-center text-primary-foreground font-bold shadow-lg shadow-primary/20 tracking-wide">ADD PROCESS</div>
                    </div>
                 </div>
              </div>

              {/* Chart/Analysis Area (Locked Area) */}
              <div className="lg:col-span-9 flex flex-col blur-[2px] opacity-60 pointer-events-none bg-card/20">
                 <div className="flex-1 p-8 flex flex-col">
                    {/* Mock Psych Chart */}
                    <div className="flex-1 relative border-l-2 border-b-2 border-border/50 overflow-hidden rounded-bl-lg">
                       <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.05)_1px,transparent_1px)] bg-[size:5%_10%] dark:invert" />
                       {/* Saturation Curve Mock */}
                       <svg className="absolute inset-0 w-full h-full text-border" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <path d="M0,100 Q50,80 100,0" stroke="currentColor" strokeWidth="2" fill="none" />
                       </svg>
                       {/* Point Markers Mock */}
                       <div className="absolute left-[80%] bottom-[40%] w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                       <div className="absolute left-[60%] bottom-[60%] w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
                       <div className="absolute left-[70%] bottom-[50%] w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    </div>

                    <div className="mt-6 border border-border rounded-2xl overflow-hidden bg-background/50">
                      <Table>
                        <TableHeader className="bg-muted/30">
                          <TableRow>
                            <TableHead className="font-bold text-[10px] uppercase">Point</TableHead>
                            <TableHead className="text-right font-bold text-[10px] uppercase">DB (°F)</TableHead>
                            <TableHead className="text-right font-bold text-[10px] uppercase">RH (%)</TableHead>
                            <TableHead className="text-right font-bold text-[10px] uppercase">h (Btu/lb)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium text-xs">1 - OA</TableCell>
                            <TableCell className="text-right text-xs">95.0</TableCell>
                            <TableCell className="text-right text-xs">46.8</TableCell>
                            <TableCell className="text-right text-xs">41.4</TableCell>
                          </TableRow>
                          <TableRow className="bg-primary/5 text-primary">
                            <TableCell className="font-bold text-xs">3 - Mixed</TableCell>
                            <TableCell className="text-right text-xs font-bold">80.0</TableCell>
                            <TableCell className="text-right text-xs font-bold">49.4</TableCell>
                            <TableCell className="text-right text-xs font-bold">31.4</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                 </div>
              </div>
            </div>
          </div>

          {/* The Call to Action Overlay */}
          <AuthTeaserOverlay 
            redirectPath="/tools/psychrometrics"
            heading="Unlock Psychrometric Analysis"
            description="Sign up for free to design complex air handling processes, visualize state transitions, and access professional thermodynamic property synthesis."
          />
        </div>
      </div>
    </PublicPageShell>
  );
}
