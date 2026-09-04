import { Calculator, Mail, ArrowUpRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { Button } from "./ui/button";
import { GuaranteeStrip } from "./GuaranteeStrip";

import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

export function Footer() {
  const { isAuthenticated } = useSupabaseAuth();
  const location = useLocation();
  const isLandingPage = location.pathname === "/";
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
              Engineering the future of HVAC&R operations. Our platform equips field technicians with AI-driven intelligence and automated compliance workflows.
            </p>
            <div className="flex items-center gap-4">
            </div>
          </div>

          <div>
            <h4 className="font-bold text-foreground mb-6 font-display">Precision Engineering Hub</h4>
            <ul className="space-y-4">
              <li><Link to="/pricing" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">The Hub</Link></li>
              <li><Link to="/features#automations" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">Automations</Link></li>
              <li><Link to="/features" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">Platform Features</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-foreground mb-6 font-display">Engineering Tools</h4>
            <ul className="space-y-4">
              <li><Link to="/tools/standard-cycle" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">Standard Cycle</Link></li>
              <li><Link to="/tools/refrigerant-comparison" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">Refrigerant Comparison</Link></li>
              <li><Link to="/tools/cascade-cycle" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">Cascade Cycle</Link></li>
              <li><Link to="/diy-calculators" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">DIY Calculators</Link></li>
              <li><Link to={isAuthenticated ? "/tools/load-calc" : "/previews/load-calc"} className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">Load Calc</Link></li>
              <li><Link to={isAuthenticated ? "/tools/psychrometrics" : "/previews/psychrometrics"} className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">Psychrometrics</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-foreground mb-6 font-display">Product family</h4>
            <ul className="space-y-4">
              <li>
                <a href="https://simulateon.vercel.app" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium inline-flex items-center gap-1">
                  PhasePoint <ArrowUpRight className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a href="https://vanclass-app.vercel.app" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium inline-flex items-center gap-1">
                  VanClass <ArrowUpRight className="h-3 w-3" />
                </a>
              </li>
              <li>
                <Link to="/platform" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">The Box</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-foreground mb-6 font-display">Company</h4>
            <ul className="space-y-4">
              <li><Link to="/about" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">About</Link></li>
              <li><Link to="/pricing" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">Pricing</Link></li>
              <li><Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-foreground mb-6 font-display">Get in touch</h4>
            <ul className="space-y-4">
              <li>
                <span className="block text-xs uppercase tracking-widest text-muted-foreground font-bold mb-1">Support</span>
                <a href="mailto:support@thermoneural.com" className="text-foreground hover:text-primary transition-colors text-sm font-bold">support@thermoneural.com</a>
              </li>
              <li>
                <span className="block text-xs uppercase tracking-widest text-muted-foreground font-bold mb-1">Sales</span>
                <a href="mailto:hello@thermoneural.com" className="text-foreground hover:text-primary transition-colors text-sm font-bold">hello@thermoneural.com</a>
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
            <Link to="/privacy" className="text-muted-foreground hover:text-foreground text-xs font-medium transition-colors">Privacy</Link>
            <Link to="/terms" className="text-muted-foreground hover:text-foreground text-xs font-medium transition-colors">Terms</Link>
            <Link to="/terms#guarantee" className="text-muted-foreground hover:text-foreground text-xs font-medium transition-colors">Guarantee</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
