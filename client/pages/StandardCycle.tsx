import React from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ApiServiceStatus } from "@/components/ApiServiceStatus";
import { EnhancedStandardCycleContent } from "@/pages/EnhancedStandardCycle";

// Main StandardCycle page that uses the enhanced tabbed version
export function StandardCycle() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header variant="dashboard" />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <ApiServiceStatus />
        <EnhancedStandardCycleContent />
      </div>
      <Footer />
    </div>
  );
}
