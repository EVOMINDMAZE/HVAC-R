import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { GlobalBackground } from "@/components/ui/GlobalBackground";
import { ConsentBanner } from "@/components/ConsentBanner";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface PublicPageShellProps {
  children: React.ReactNode;
  withFooter?: boolean;
  className?: string;
  mainClassName?: string;
  mainId?: string;
  skipToMain?: boolean;
  brand?: "box";
}

export function PublicPageShell({
  children,
  withFooter = true,
  className,
  mainClassName,
  mainId = "main-content",
  skipToMain = false,
  brand,
}: PublicPageShellProps) {
  const [showConsentBanner, setShowConsentBanner] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("consent_given") !== "true";
  });
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("consent_given") !== "true") {
      setShowConsentBanner(true);
    }
  }, []);
  return (
    <div className={cn("landing-page app-shell min-h-screen bg-slate-50 dark:bg-[#0a0f1a] text-foreground relative z-0", className)}>
      <GlobalBackground />
      {skipToMain ? (
        <a
          href={`#${mainId}`}
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to main content
        </a>
      ) : null}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header variant="landing" brand={brand} />
        <main id={mainId} className={cn("flex-grow", mainClassName)}>{children}</main>
        {withFooter ? <Footer /> : null}
        <ConsentBanner
          visible={showConsentBanner}
          onDismiss={() => setShowConsentBanner(false)}
          onConsentGranted={() => setShowConsentBanner(false)}
          onConsentDeclined={() => setShowConsentBanner(false)}
        />
      </div>
    </div>
  );
}