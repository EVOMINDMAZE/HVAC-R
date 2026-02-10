import { Link, useLocation } from "react-router-dom";
import { Calculator, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "./ui/button";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

export function Footer() {
  const { isAuthenticated } = useSupabaseAuth();
  const location = useLocation();
  const isLandingPage = location.pathname === "/";

  return (
    <footer className="bg-background border-t border-border py-16 px-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--foreground)/0.02)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--foreground)/0.02)_1px,transparent_1px)] bg-[size:40px_40px] -z-10" />
      {/* Value proposition banner for non-authenticated users */}
      {!isAuthenticated && !isLandingPage && (
        <div className="bg-gradient-to-r from-primary/10 via-background to-primary/10 py-12 border-b border-border">
          <div className="max-w-[1600px] mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4 text-foreground">
              Ready to Transform Your Thermal Engineering?
            </h2>
            <p className="text-xl text-muted-foreground mb-6">
              Join thousands of engineers who save 20+ hours monthly with
              professional-grade calculations
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button variant="neonHighlight" size="lg" className="font-mono tracking-wider px-8 py-3 text-lg">
                  Start Free Trial - No Credit Card Required
                </Button>
              </Link>
              <Link to="/pricing">
                <Button
                  variant="outline"
                  className="border-primary/30 text-muted-foreground hover:bg-primary/10 hover:text-primary font-mono px-8 py-3 text-lg"
                >
                  View Pricing Plans
                </Button>
              </Link>
            </div>
            <p className="text-muted-foreground text-sm mt-4">
              ✓ Instant setup ✓ Expert support ✓ Cancel anytime
            </p>
          </div>
        </div>
      )}

      <div className="max-w-[1600px] mx-auto px-4 pt-12 pb-0">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Calculator className="h-8 w-8 text-primary" />
              <h3 className="text-2xl font-bold text-primary">ThermoNeural</h3>
            </div>
            <p className="text-muted-foreground">
              Professional refrigeration cycle analysis platform trusted by
              engineers worldwide.
            </p>
            {!isAuthenticated && (
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                <p className="text-primary/80 text-sm font-semibold mb-2">
                  Why Choose ThermoNeural?
                </p>
                <ul className="text-muted-foreground text-sm space-y-1">
                  <li>✓ Industry-standard calculations</li>
                  <li>✓ Export & collaboration tools</li>
                  <li>✓ 24/7 expert support</li>
                </ul>
              </div>
            )}
          </div>

          {/* Products Column */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-foreground">Calculation Tools</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link
                  to={isAuthenticated ? "/tools/standard-cycle" : "/features"}
                  className="hover:text-primary transition-colors"
                >
                  Standard Cycle Analysis
                </Link>
              </li>
              <li>
                <Link
                  to={
                    isAuthenticated
                      ? "/tools/refrigerant-comparison"
                      : "/features"
                  }
                  className="hover:text-primary transition-colors"
                >
                  Refrigerant Comparison
                </Link>
              </li>
              <li>
                <Link
                  to={isAuthenticated ? "/tools/cascade-cycle" : "/features"}
                  className="hover:text-primary transition-colors"
                >
                  Cascade Cycle Analysis
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-foreground">Company</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link
                  to="/about"
                  className="hover:text-primary transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/pricing"
                  className="hover:text-primary transition-colors"
                >
                  Pricing Plans
                </Link>
              </li>
              <li>
                <Link
                  to="/blog"
                  className="hover:text-primary transition-colors"
                >
                  Engineering Blog
                </Link>
              </li>
              <li>
                <Link
                  to="/help-center"
                  className="hover:text-primary transition-colors"
                >
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground">Get In Touch</h4>
            <ul className="space-y-4 text-muted-foreground">
              <li className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
                    Technical Support
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
                    Inquiries & Partnerships
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
                  Start your free trial today
                </p>
                <Link to="/signup">
                  <Button variant="neonHighlight" size="lg" className="w-full font-mono tracking-wider text-foreground">
                    Get Started Free
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          className="border-t border-border mt-12 pt-8 pb-8 flex flex-col md:flex-row justify-between items-center"
        >
          <p
            className="text-muted-foreground text-sm"
          >
            © 2024 ThermoNeural. All rights reserved.
          </p>
          <div className="flex space-x-8 mt-4 md:mt-0">
            <Link
              to="/privacy"
              className="text-muted-foreground hover:text-primary text-sm transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="text-muted-foreground hover:text-primary text-sm transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              to="/contact"
              className="text-muted-foreground hover:text-primary text-sm transition-colors"
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
