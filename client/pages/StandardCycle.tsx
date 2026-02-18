import { Footer } from "@/components/Footer";
import { ApiServiceStatus } from "@/components/ApiServiceStatus";
import { EnhancedStandardCycleContent } from "@/pages/EnhancedStandardCycle";

// Main StandardCycle page that uses the enhanced tabbed version
export function StandardCycle() {
  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Futuristic Background Elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px]" />
      
      <div className="relative z-10 max-w-[1600px] mx-auto px-4 py-8">
        <ApiServiceStatus />
        <EnhancedStandardCycleContent />
      </div>
      <Footer />
    </div>
  );
}
