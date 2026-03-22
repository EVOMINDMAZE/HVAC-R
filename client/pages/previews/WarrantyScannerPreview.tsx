import { ShieldCheck, Camera, FileText, CheckCircle2, History, Zap, Search } from "lucide-react";

import { PublicPageShell } from "@/components/public/PublicPageShell";
import { AuthTeaserOverlay } from "@/components/ui/AuthTeaserOverlay";
import { Badge } from "@/components/ui/badge";

export function WarrantyScannerPreview() {
  return (
    <PublicPageShell mainId="warranty-scanner-preview">
      <div className="max-w-[1600px] mx-auto px-4 py-8 md:py-12 relative z-10">
        
        {/* Header */}
        <div className="mb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6 text-left">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <Badge
                variant="outline"
                className="px-4 py-1.5 rounded-full border-primary/20 bg-primary/5 text-primary backdrop-blur-md font-display tracking-wide uppercase text-[10px] sm:text-xs font-semibold"
              >
                <ShieldCheck className="w-3 h-3 mr-2" />
                Warranty Scanner
              </Badge>
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-[10px] uppercase tracking-widest font-bold">
                Instant Lookup
              </Badge>
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-bold font-display tracking-tight text-foreground">
              Equipment Entitlement AI
            </h1>
            <p className="text-muted-foreground mt-4 text-lg max-w-2xl font-light text-balance">
              Instant warranty verification via serial number OCR or manual entry. Cross-reference major manufacturers to identify active coverage and part entitlements in seconds.
            </p>
          </div>

          {/* Pro Capabilities List */}
          <div className="flex flex-col gap-3 bg-card/30 border border-border/50 p-5 rounded-2xl backdrop-blur-sm lg:max-w-xs w-full">
             <h4 className="text-xs font-bold text-foreground uppercase tracking-widest mb-1">Scanner Features</h4>
             {[
               { icon: Camera, text: "Plate Image Recognition (OCR)" },
               { icon: History, text: "Manufacturer API Integration" },
               { icon: FileText, text: "Entitlement Log Exports" }
             ].map((item, i) => (
               <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <item.icon className="w-4 h-4 text-primary" />
                  <span>{item.text}</span>
               </div>
             ))}
          </div>
        </div>

        {/* Clear Lookup Result (The Hook) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
           <div className="lg:col-span-7">
              <div className="rounded-3xl border border-border bg-card/80 p-6 md:p-8 shadow-sm relative overflow-hidden group hover:border-primary/30 transition-all text-left">
                 <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                    <ShieldCheck className="w-24 h-24 text-primary" />
                 </div>
                 <h4 className="text-[10px] font-bold text-muted-foreground mb-6 tracking-widest uppercase">LATEST VERIFIED ENTITLEMENT</h4>
                 
                 <div className="flex items-center gap-6 mb-8">
                    <div className="w-20 h-20 rounded-2xl bg-muted/20 border border-border flex items-center justify-center">
                       <Zap className="w-10 h-10 text-primary" />
                    </div>
                    <div>
                       <h3 className="text-2xl font-bold text-foreground font-display">Carrier WeatherMaker™</h3>
                       <p className="text-muted-foreground font-mono">SN: 4212N12345</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                       <p className="text-[10px] font-bold text-muted-foreground uppercase">Parts Warranty</p>
                       <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">ACTIVE</p>
                       <p className="text-xs text-muted-foreground">Expires Oct 2028</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-bold text-muted-foreground uppercase">Compressor</p>
                       <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">ACTIVE</p>
                       <p className="text-xs text-muted-foreground">Expires Oct 2032</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="lg:col-span-5 grid grid-cols-1 gap-4">
              <div className="rounded-2xl border border-border bg-card/80 p-6 shadow-sm text-left">
                 <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-4">SUPPORTED MANUFACTURERS</div>
                 <div className="grid grid-cols-3 gap-3 opacity-40">
                    {['Carrier', 'Trane', 'York', 'Lennox', 'Rheem', 'Daikin'].map(m => (
                      <div key={m} className="h-8 border border-border rounded flex items-center justify-center text-[10px] font-bold">{m}</div>
                    ))}
                 </div>
              </div>
              <div className="rounded-2xl border border-border bg-card/80 p-6 shadow-sm text-left flex items-center gap-4">
                 <div className="p-3 rounded-xl bg-primary/10">
                    <History className="w-6 h-6 text-primary" />
                 </div>
                 <div>
                    <p className="text-sm font-bold text-foreground">Audit History</p>
                    <p className="text-xs text-muted-foreground">All scans are logged for billing verification.</p>
                 </div>
              </div>
           </div>
        </div>

        {/* The Mock UI Container (Locked) */}
        <div className="relative rounded-3xl border border-border/50 bg-card/50 backdrop-blur-md overflow-hidden shadow-2xl h-[400px]">
          <div className="flex flex-col h-full opacity-60 blur-[2px] pointer-events-none text-left">
            <div className="flex-1 flex items-center justify-center p-12">
               <div className="w-full max-w-md space-y-6">
                  <div className="h-14 border border-input rounded-2xl bg-background/50 flex items-center px-6 gap-4">
                     <Search className="w-5 h-5 text-muted" />
                     <div className="flex-1 h-4 bg-muted rounded"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="h-12 rounded-xl bg-border/50"></div>
                     <div className="h-12 rounded-xl bg-primary/20"></div>
                  </div>
                  <div className="h-40 border border-dashed border-border rounded-3xl bg-muted/5 flex flex-col items-center justify-center">
                     <Camera className="w-10 h-10 text-muted mb-2" />
                     <div className="w-32 h-3 bg-muted rounded"></div>
                  </div>
               </div>
            </div>
          </div>

          <AuthTeaserOverlay 
            redirectPath="/tools/warranty-scanner"
            heading="Identify Coverage Instantly"
            description="Sign up for free to access our AI-powered serial number scanner, manufacturer integrations, and entitlement logging tools."
          />
        </div>
      </div>
    </PublicPageShell>
  );
}
