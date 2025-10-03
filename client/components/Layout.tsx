import React, { useCallback, useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { QuickSearch } from "@/components/QuickSearch";

export function Layout({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);

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
    <div className="min-h-screen bg-background">
      <Header variant="dashboard" onOpenSearch={() => setSearchOpen(true)} />
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-6">
        <Sidebar />
        <main className="flex-1">{children}</main>
      </div>
      <QuickSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
