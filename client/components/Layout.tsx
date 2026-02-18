import React, { useCallback, useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { QuickSearch } from "@/components/QuickSearch";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { ConsentBanner } from "@/components/ConsentBanner";
import { MonitorDockSlot } from "@/components/monitor/MonitorDockSlot";

import { Outlet } from "react-router-dom";

export function Layout({ children }: { children?: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useSupabaseAuth();
  const bypass =
    !import.meta.env.PROD &&
    (() => {
      try {
        if (typeof window === "undefined") return false;
        const params = new URLSearchParams(window.location.search);
        return (
          params.get("bypassAuth") === "1" && import.meta.env.DEV
        );
      } catch {
        return false;
      }
    })();
  const effectiveAuthenticated = isAuthenticated || bypass;
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
      <Header
        variant={effectiveAuthenticated ? "dashboard" : "landing"}
        onOpenSearch={() => setSearchOpen(true)}
      />
      <Sidebar />
      <MonitorDockSlot />
      <main className="flex-1 w-full">
        {children || <Outlet />}
      </main>
      <QuickSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <ConsentBanner 
        // Avoid flashing the banner while auth state is still resolving.
        visible={showConsentBanner && !effectiveAuthenticated && !isLoading} 
        onDismiss={() => setShowConsentBanner(false)}
        onConsentGranted={() => setShowConsentBanner(false)}
        onConsentDeclined={() => setShowConsentBanner(false)}
      />
    </div>
  );
}
