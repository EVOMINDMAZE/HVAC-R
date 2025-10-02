import React from "react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Header variant="dashboard" />
      <div className="max-w-7xl mx-auto px-4 py-8 flex gap-6">
        <Sidebar />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
