import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

import { GuaranteeStrip } from "./GuaranteeStrip";

import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

const PRODUCTS = [
  {
    name: "The Box",
    href: "/platform",
    status: "Live",
    external: false,
  },
  {
    name: "PhasePoint",
    href: "https://simulateon.vercel.app",
    status: "Live",
    external: true,
  },
  {
    name: "VanClass",
    href: "https://vanclass-app.vercel.app",
    status: "Beta",
    external: true,
  },
  {
    name: "Cryovo",
    href: "https://cryovo.vercel.app",
    status: "Beta",
    external: true,
  },
] as const;

const TOOLS = [
  { label: "Standard Cycle", to: "/tools/standard-cycle", preview: "/previews/load-calc" },
  { label: "Refrigerant Comparison", to: "/tools/refrigerant-comparison", preview: "/previews/load-calc" },
  { label: "Cascade Cycle", to: "/tools/cascade-cycle", preview: "/previews/load-calc" },
  { label: "DIY Calculators", to: "/diy-calculators", preview: "/diy-calculators" },
  { label: "Load Calc", to: "/tools/load-calc", preview: "/previews/load-calc" },
  { label: "Psychrometrics", to: "/tools/psychrometrics", preview: "/previews/psychrometrics" },
] as const;

export function UmbrellaFooter() {
  const { isAuthenticated } = useSupabaseAuth();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-background border-t border-border pt-24 pb-12 px-4 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-12 mb-20">
          <div className="col-span-2 lg:col-span-2 space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-bold text-xl">
                T
              </div>
              <span className="text-2xl font-bold text-foreground tracking-tight font-display">ThermoNeural</span>
            </div>
            <p className="text-muted-foreground max-w-sm leading-relaxed">
              The ThermoNeural platform builds engineering operations software for the thermal
              economy — The Box, PhasePoint, VanClass and Cryovo.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-foreground mb-6 font-display">Product family</h4>
            <ul className="space-y-4">
              {PRODUCTS.map((product) => (
                <li key={product.name}>
                  {product.external ? (
                    <a
                      href={product.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium inline-flex items-center gap-1"
                    >
                      {product.name}
                      <ArrowUpRight className="h-3 w-3" />
                      <span className="ml-1 rounded border border-border px-1 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                        {product.status}
                      </span>
                    </a>
                  ) : (
                    <Link
                      to={product.href}
                      className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium inline-flex items-center gap-1"
                    >
                      {product.name}
                      <span className="ml-1 rounded border border-border px-1 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                        {product.status}
                      </span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-foreground mb-6 font-display">Engineering Tools</h4>
            <ul className="space-y-4">
              {TOOLS.map((tool) => (
                <li key={tool.label}>
                  <Link
                    to={isAuthenticated ? tool.to : tool.preview}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
                  >
                    {tool.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-foreground mb-6 font-display">Company</h4>
            <ul className="space-y-4">
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">
                  About
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-foreground mb-6 font-display">Get in touch</h4>
            <ul className="space-y-4">
              <li>
                <span className="block text-xs uppercase tracking-widest text-muted-foreground font-bold mb-1">Support</span>
                <a href="mailto:support@thermoneural.com" className="text-foreground hover:text-primary transition-colors text-sm font-bold">
                  support@thermoneural.com
                </a>
              </li>
              <li>
                <span className="block text-xs uppercase tracking-widest text-muted-foreground font-bold mb-1">Sales</span>
                <a href="mailto:hello@thermoneural.com" className="text-foreground hover:text-primary transition-colors text-sm font-bold">
                  hello@thermoneural.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <GuaranteeStrip />
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-muted-foreground text-xs font-medium">
            Copyright © {year} ThermoNeural. Engineering Operations at Scale.
          </p>
          <div className="flex gap-8">
            <Link to="/privacy" className="text-muted-foreground hover:text-foreground text-xs font-medium transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="text-muted-foreground hover:text-foreground text-xs font-medium transition-colors">
              Terms
            </Link>
            <Link to="/terms#guarantee" className="text-muted-foreground hover:text-foreground text-xs font-medium transition-colors">
              Guarantee
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
