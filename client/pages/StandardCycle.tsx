import { ApiServiceStatus } from "@/components/ApiServiceStatus";
import { Footer } from "@/components/Footer";
import { EnhancedStandardCycleContent } from "@/pages/EnhancedStandardCycle";

// Main StandardCycle page that uses the enhanced tabbed version
export function StandardCycle() {
  return (
    <div className="relative overflow-hidden">
      <div className="relative z-10 max-w-[1600px] mx-auto px-4 py-8">
        <ApiServiceStatus />
        <EnhancedStandardCycleContent />
      </div>
      <Footer />
    </div>
  );
}
