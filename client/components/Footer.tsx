import { Link, useLocation } from "react-router-dom";
import { Calculator, Mail } from "lucide-react";
import { Button } from "./ui/button";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

export function Footer() {
  const { isAuthenticated } = useSupabaseAuth();
  const location = useLocation();
  const isLandingPage = location.pathname === "/";
  const year = new Date().getFullYear();

  return (
    <footer className="bg-background border-t border-border py-16 px-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--foreground)/0.02)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--foreground)/0.02)_1px,transparent_1px)] bg-[size:40px_40px] -z-10" />

      {!isAuthenticated && !isLandingPage && (
        <div className="bg-gradient-to-r from-primary/10 via-background to-primary/10 py-12 border-b border-border">
          <div className="max-w-[1600px] mx-auto px-4 text-center">
            <h2 className="text-3xl font-semibold mb-4 text-foreground">
              Ready to streamline HVAC operations?
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              Unify dispatch, compliance, and engineering tools in one Business in a Box platform built for contractors.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button size="lg">Start Free</Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" size="lg">
                  Book Ops Demo
                </Button>
              </Link>
            </div>
            <p className="text-muted-foreground text-sm mt-4">
              Fast setup • Field-ready workflows • Cancel anytime
            </p>
          </div>
        </div>
      )}

      <div className="max-w-[1600px] mx-auto px-4 pt-12 pb-0">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Calculator className="h-8 w-8 text-primary" />
              <h3 className="text-2xl font-bold text-primary">ThermoNeural</h3>
            </div>
            <p className="text-muted-foreground">
              Business-in-a-Box operations and engineering platform for HVAC contractors, refrigeration teams, and cryogenic facilities.
            </p>
            {!isAuthenticated && (
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                <p className="text-primary/80 text-sm font-semibold mb-2">
                  Why choose ThermoNeural?
                </p>
                <ul className="text-muted-foreground text-sm space-y-1">
                  <li>✓ Dispatch + triage workflows</li>
                  <li>✓ Compliance-ready logs</li>
                  <li>✓ Report-ready exports</li>
                  <li>✓ Automation workflows</li>
                </ul>
              </div>
            )}

            <div className="bg-background/70 p-4 rounded-lg border border-border/70">
              <p className="text-foreground text-sm font-semibold mb-2">
                Trust Anchors
              </p>
              <ul className="text-muted-foreground text-sm space-y-1">
                <li>EPA-aligned workflow design</li>
                <li>Secure cloud records + role-based access</li>
                <li>Built for regulated HVAC&R environments</li>
              </ul>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4 text-foreground">Tools & Workflows</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link
                  to={isAuthenticated ? "/dashboard" : "/features"}
                  className="hover:text-primary transition-colors"
                >
                  Dispatch & Jobs
                </Link>
              </li>
              <li>
                <Link
                  to={
                    isAuthenticated
                      ? "/tools/refrigerant-inventory"
                      : "/features"
                  }
                  className="hover:text-primary transition-colors"
                >
                  Refrigerant Compliance
                </Link>
              </li>
              <li>
                <Link
                  to={isAuthenticated ? "/diy-calculators" : "/features"}
                  className="hover:text-primary transition-colors"
                >
                  Engineering Tools
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4 text-foreground">Company</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link to="/about" className="hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-primary transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-primary transition-colors">
                  Industry Blog
                </Link>
              </li>
              <li>
                <Link to="/help" className="hover:text-primary transition-colors">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground">Get in touch</h4>
            <ul className="space-y-4 text-muted-foreground">
              <li className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
                    Support
                  </span>
                  <a
                    href="mailto:support@thermoneural.com"
                    className="hover:text-primary transition-colors text-sm block"
                  >
                    support@thermoneural.com
                  </a>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
                    Partnerships
                  </span>
                  <a
                    href="mailto:hello@thermoneural.com"
                    className="hover:text-primary transition-colors text-sm block"
                  >
                    hello@thermoneural.com
                  </a>
                </div>
              </li>
            </ul>

            {!isAuthenticated && (
              <div className="pt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Start with the Engineering Suite
                </p>
                <Link to="/signup">
                  <Button size="lg" className="w-full">
                    Start Free
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 pb-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-muted-foreground text-sm">© {year} ThermoNeural. All rights reserved.</p>
          <div className="flex space-x-8 mt-4 md:mt-0">
            <Link to="/privacy" className="text-muted-foreground hover:text-primary text-sm transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-muted-foreground hover:text-primary text-sm transition-colors">
              Terms of Service
            </Link>
            <Link to="/contact" className="text-muted-foreground hover:text-primary text-sm transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
