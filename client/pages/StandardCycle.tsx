import React from "react";
import { Footer } from "@/components/Footer";
import { ApiServiceStatus } from "@/components/ApiServiceStatus";
import { EnhancedStandardCycleContent } from "@/pages/EnhancedStandardCycle";

// Main StandardCycle page that uses the enhanced tabbed version
export function StandardCycle() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <ApiServiceStatus />
        <EnhancedStandardCycleContent />
      </div>
      <Footer />
    </div>
  );
}
