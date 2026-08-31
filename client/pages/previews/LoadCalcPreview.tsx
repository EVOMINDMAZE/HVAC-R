import { Calculator, Building2, Thermometer, Wind, Save, Download, FileText, BarChart3, ShieldCheck } from "lucide-react";
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

export function LoadCalcPreview() {
  const { isAuthenticated, isLoading } = useSupabaseAuth();

  if (isAuthenticated && !isLoading) {
    return <Navigate to="/tools/load-calc" replace />;
  }

  return (
    <PublicPageShell className="bg-transparent" mainId="load-calc-preview">
      <Helmet>
        <title>Commercial Load Calculator | ThermoNeural</title>
        <meta name="description" content="Preview of the Commercial Load Calculator tool." />
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
                <Calculator className="w-3 h-3 mr-2" />
                Commercial Load Calculator
              </Badge>
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-[10px] uppercase tracking-widest font-bold">
                ASHRAE Compliant
              </Badge>
            </div>
            
            <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400 font-medium">
              Illustrative preview — the numbers shown are sample values, not live results. Create a free account to run real calculations.
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold font-display tracking-tight text-foreground">
              Peak Block Load Analysis
            </h1>
            <p className="text-muted-foreground mt-4 text-lg max-w-2xl font-light text-balance">
              Perform high-fidelity commercial heating and cooling load calculations using ASHRAE fundamental algorithms.
            </p>
          </div>

          {/* Pro Capabilities List */}
          <div className="flex flex-col gap-3 bg-card/30 border border-border/50 p-5 rounded-2xl backdrop-blur-sm lg:max-w-xs w-full">
             <h4 className="text-xs font-bold text-foreground uppercase tracking-widest mb-1">Pro Capabilities</h4>
             {[
               { icon: ShieldCheck, text: "CLTD/SCL/CLF Methodologies" },
               { icon: BarChart3, text: "Solar Heat Gain Synthesis" },
               { icon: FileText, text: "Professional PDF Reports" }
             ].map((item, i) => (
               <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <item.icon className="w-4 h-4 text-primary" />
                  <span>{item.text}</span>
               </div>
             ))}
          </div>
        </div>

        {/* Clear Summary Area (The Hook) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-left">
          <div className="rounded-2xl p-6 border border-border bg-card/80 shadow-sm relative overflow-hidden group hover:border-primary/30 transition-all">
            <p className="text-sm font-bold text-muted-foreground mb-4 uppercase tracking-widest">Total Peak Cooling</p>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 font-display">68.4</p>
              <p className="text-lg font-bold text-muted-foreground">Tons</p>
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-mono">820.8 MBH Sensitivity</p>
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <Thermometer className="w-16 h-16 text-blue-500" />
            </div>
          </div>
          <div className="rounded-2xl p-6 border border-border bg-card/80 shadow-sm relative overflow-hidden group hover:border-primary/30 transition-all">
            <p className="text-sm font-bold text-muted-foreground mb-4 uppercase tracking-widest">Total Peak Heating</p>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold text-orange-600 dark:text-orange-400 font-display">415.2</p>
              <p className="text-lg font-bold text-muted-foreground">MBH</p>
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-mono">Max Demand at 06:00</p>
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <Thermometer className="w-16 h-16 text-orange-500" />
            </div>
          </div>
          <div className="rounded-2xl p-6 border border-border bg-card/80 shadow-sm relative overflow-hidden group hover:border-primary/30 transition-all">
            <p className="text-sm font-bold text-muted-foreground mb-4 uppercase tracking-widest">Calculated Airflow</p>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 font-display">24,600</p>
              <p className="text-lg font-bold text-muted-foreground">CFM</p>
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-mono">~1.0 CFM / sq ft Design</p>
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <Wind className="w-16 h-16 text-emerald-500" />
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
               <div className="flex gap-2">
                  <div className="w-20 h-8 rounded-lg bg-border/50"></div>
                  <div className="w-24 h-8 rounded-lg bg-primary/20 border border-primary/30"></div>
               </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden text-left">
              {/* Sidebar (Locked Area) */}
              <div className="lg:col-span-4 border-r border-border p-6 bg-card/40 blur-[1px] opacity-60 pointer-events-none">
                 <h3 className="font-display text-sm font-bold tracking-tight text-foreground mb-6 flex items-center uppercase tracking-wider">
                    <Building2 className="w-4 h-4 mr-2 text-primary" /> BUILDING CONFIG
                 </h3>
                 <div className="space-y-6">
                    {[
                      { label: "Design Location", value: "Austin, TX" },
                      { label: "Floor Area (sq ft)", value: "24,500" },
                      { label: "Wall Construction", value: "R-21 Insulated" },
                      { label: "Roof Type", value: "Built-up Dark" },
                      { label: "Window-to-Wall Ratio", value: "35%" }
                    ].map((input, i) => (
                      <div key={i} className="space-y-2">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{input.label}</div>
                        <div className="h-11 border border-input rounded-xl bg-background/50 flex items-center px-4 text-foreground font-medium">{input.value}</div>
                      </div>
                    ))}
                    <div className="pt-4">
                      <div className="h-12 rounded-xl bg-primary w-full flex items-center justify-center text-primary-foreground font-bold shadow-lg shadow-primary/20 tracking-wide">CALCULATE LOADS</div>
                    </div>
                 </div>
              </div>

              {/* Analysis Area (Locked Area) */}
              <div className="lg:col-span-8 flex flex-col blur-[2px] opacity-60 pointer-events-none bg-card/20">
                 <div className="p-8 flex-1">
                    <h4 className="font-display font-bold text-foreground mb-6 uppercase tracking-wider">Cooling Load Breakdown</h4>
                    <div className="border border-border rounded-2xl overflow-hidden bg-background/50">
                      <Table>
                        <TableHeader className="bg-muted/30">
                          <TableRow>
                            <TableHead className="font-bold">Component</TableHead>
                            <TableHead className="text-right font-bold">Total (MBH)</TableHead>
                            <TableHead className="text-right font-bold">% of Peak</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">External Envelope</TableCell>
                            <TableCell className="text-right">185.4</TableCell>
                            <TableCell className="text-right font-mono">22.6%</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Solar Glass Load</TableCell>
                            <TableCell className="text-right">210.2</TableCell>
                            <TableCell className="text-right font-mono">25.6%</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Internal Equipment</TableCell>
                            <TableCell className="text-right">165.0</TableCell>
                            <TableCell className="text-right font-mono">20.1%</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">People / Occupancy</TableCell>
                            <TableCell className="text-right">117.5</TableCell>
                            <TableCell className="text-right font-mono">14.3%</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Ventilation Air</TableCell>
                            <TableCell className="text-right">142.7</TableCell>
                            <TableCell className="text-right font-mono">17.4%</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                    
                    {/* Progress visual mock */}
                    <div className="mt-8 space-y-4">
                       <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 w-2/3" />
                       </div>
                       <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-orange-500 w-1/2" />
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>

          {/* The Call to Action Overlay */}
          <AuthTeaserOverlay 
            redirectPath="/tools/load-calc"
            heading="Unlock Commercial Block Loads"
            description="Sign up for free to run precise ASHRAE-compliant calculations, customize building parameters, and export professional engineering reports."
          />
        </div>
      </div>
    </PublicPageShell>
  );
}
