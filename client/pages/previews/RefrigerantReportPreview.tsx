import { FileText, ClipboardCheck, BarChart3, ShieldCheck, CheckCircle2, History, Zap } from "lucide-react";

import { PublicPageShell } from "@/components/public/PublicPageShell";
import { AuthTeaserOverlay } from "@/components/ui/AuthTeaserOverlay";
import { Badge } from "@/components/ui/badge";

export function RefrigerantReportPreview() {
  return (
    <PublicPageShell mainId="compliance-report-preview">
      <div className="max-w-[1600px] mx-auto px-4 py-8 md:py-12 relative z-10">
        
        {/* Header */}
        <div className="mb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6 text-left">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <Badge
                variant="outline"
                className="px-4 py-1.5 rounded-full border-primary/20 bg-primary/5 text-primary backdrop-blur-md font-display tracking-wide uppercase text-[10px] sm:text-xs font-semibold"
              >
                <FileText className="w-3 h-3 mr-2" />
                Compliance Reporting
              </Badge>
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-[10px] uppercase tracking-widest font-bold">
                Audit Ready
              </Badge>
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-bold font-display tracking-tight text-foreground">
              EPA Regulatory Export
            </h1>
            <p className="text-muted-foreground mt-4 text-lg max-w-2xl font-light text-balance">
              Generate professional, auditor-ready EPA 608 compliance reports. Automatically compile recovery logs, leak rate calculations, and technician certifications into a single digital document.
            </p>
          </div>

          {/* Pro Capabilities List */}
          <div className="flex flex-col gap-3 bg-card/30 border border-border/50 p-5 rounded-2xl backdrop-blur-sm lg:max-w-xs w-full">
             <h4 className="text-xs font-bold text-foreground uppercase tracking-widest mb-1">Report Features</h4>
             {[
               { icon: ClipboardCheck, text: "EPA 608 Standard Formatting" },
               { icon: ShieldCheck, text: "Digital Chain of Custody" },
               { icon: History, text: "Multi-Year Data Archiving" }
             ].map((item, i) => (
               <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <item.icon className="w-4 h-4 text-primary" />
                  <span>{item.text}</span>
               </div>
             ))}
          </div>
        </div>

        {/* Clear Preview Card (The Hook) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
           <div className="lg:col-span-8">
              <div className="rounded-3xl border border-border bg-card/80 p-8 shadow-sm relative overflow-hidden group hover:border-primary/30 transition-all text-left">
                 <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <FileText className="w-32 h-32 text-primary" />
                 </div>
                 
                 <div className="flex justify-between items-start mb-12">
                    <div>
                       <h3 className="text-xl font-bold text-foreground font-display mb-1">2025 Annual Compliance Summary</h3>
                       <p className="text-xs text-muted-foreground font-mono">Report ID: RPT-7729-X</p>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-bold">VERIFIED</Badge>
                 </div>

                 <div className="grid grid-cols-3 gap-8">
                    <div className="space-y-1 border-l-2 border-primary pl-4">
                       <p className="text-[10px] font-bold text-muted-foreground uppercase">Total Recovery</p>
                       <p className="text-2xl font-bold text-foreground font-display">1,240 lbs</p>
                    </div>
                    <div className="space-y-1 border-l-2 border-slate-300 pl-4">
                       <p className="text-[10px] font-bold text-muted-foreground uppercase">Active Assets</p>
                       <p className="text-2xl font-bold text-foreground font-display">142 Units</p>
                    </div>
                    <div className="space-y-1 border-l-2 border-slate-300 pl-4">
                       <p className="text-[10px] font-bold text-muted-foreground uppercase">Compliance %</p>
                       <p className="text-2xl font-bold text-emerald-600 font-display">100%</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="lg:col-span-4 flex flex-col justify-center">
              <div className="p-6 rounded-3xl border-2 border-dashed border-border flex flex-col items-center text-center">
                 <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-primary" />
                 </div>
                 <p className="font-bold text-foreground mb-2">Sample Report Ready</p>
                 <div className="h-10 px-6 rounded-xl bg-primary text-primary-foreground font-bold flex items-center text-sm shadow-lg shadow-primary/20">Download Draft PDF</div>
              </div>
           </div>
        </div>

        {/* The Mock UI Container (Locked) */}
        <div className="relative rounded-3xl border border-border/50 bg-card/50 backdrop-blur-md overflow-hidden shadow-2xl h-[400px]">
          <div className="flex flex-col h-full opacity-60 blur-[2px] pointer-events-none text-left">
            <div className="p-6 border-b border-border bg-muted/20">
               <div className="w-48 h-4 bg-muted rounded"></div>
            </div>
            <div className="p-8 space-y-4">
               {[1,2,3,4,5].map(i => (
                 <div key={i} className="flex justify-between items-center py-3 border-b border-border/50">
                    <div className="w-64 h-3 bg-muted rounded"></div>
                    <div className="w-24 h-3 bg-muted/50 rounded"></div>
                 </div>
               ))}
            </div>
          </div>

          <AuthTeaserOverlay 
            redirectPath="/tools/refrigerant-report"
            heading="Automate Your EPA Audits"
            description="Sign up for free to compile your refrigerant handling data into professional, one-click compliance reports."
          />
        </div>
      </div>
    </PublicPageShell>
  );
}
