import React from "react";
import { cn } from "@/lib/utils";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

interface PublicPageShellProps {
  children: React.ReactNode;
  withFooter?: boolean;
  className?: string;
  mainClassName?: string;
  mainId?: string;
  skipToMain?: boolean;
}

export function PublicPageShell({
  children,
  withFooter = true,
  className,
  mainClassName,
  mainId = "main-content",
  skipToMain = false,
}: PublicPageShellProps) {
  return (
    <div className={cn("app-shell min-h-screen bg-background text-foreground", className)}>
      {skipToMain ? (
        <a
          href={`#${mainId}`}
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to main content
        </a>
      ) : null}
      <Header variant="landing" />
      <main id={mainId} className={mainClassName}>{children}</main>
      {withFooter ? <Footer /> : null}
    </div>
  );
}