import { useCallback, useEffect, useState } from 'react';
import { Outlet } from "react-router-dom";

import { ConsentBanner } from "@/components/ConsentBanner";
import { Header } from "@/components/Header";
import { QuickSearch } from "@/components/QuickSearch";
import { Sidebar } from "@/components/Sidebar";
import { GlobalBackground } from "@/components/ui/GlobalBackground";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

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
    <div className="landing-page app-shell app-bg min-h-screen flex flex-col overflow-x-clip bg-slate-50 dark:bg-[#0a0f1a] relative z-0">
      <GlobalBackground />
      <Header variant={isAuthenticated ? "dashboard" : "landing"} onOpenSearch={() => setSearchOpen(true)} />
      <Sidebar />
      <main className="flex-1 w-full overflow-x-clip relative z-10">
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
