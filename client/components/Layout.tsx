import React, { useCallback, useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { QuickSearch } from "@/components/QuickSearch";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { ConsentBanner } from "@/components/ConsentBanner";

import { Outlet } from "react-router-dom";

export function Layout({ children }: { children?: React.ReactNode }) {
  const { isAuthenticated } = useSupabaseAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [showConsentBanner, setShowConsentBanner] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("consent_given") !== "true";
  });

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    const isK = e.key.toLowerCase() === 'k';
    const meta = e.metaKey || e.ctrlKey;
    if (meta && isK) {
      e.preventDefault();
      setSearchOpen((s) => !s);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onKeyDown]);

  return (
    <div className="app-shell min-h-screen bg-background text-foreground flex flex-col">
      <Header variant={isAuthenticated ? "dashboard" : "landing"} onOpenSearch={() => setSearchOpen(true)} />
      <Sidebar />
      <main className="flex-1 w-full">
        {children || <Outlet />}
      </main>
      <QuickSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <ConsentBanner 
        visible={showConsentBanner} 
        onDismiss={() => setShowConsentBanner(false)}
        onConsentGranted={() => setShowConsentBanner(false)}
        onConsentDeclined={() => setShowConsentBanner(false)}
      />
    </div>
  );
}
