import { Link, useLocation } from "react-router-dom";
import { Calculator, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "./ui/button";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

export function Footer() {
  const { isAuthenticated } = useSupabaseAuth();
  const location = useLocation();
  const isLandingPage = location.pathname === "/";

  return (
    <footer
      className="bg-gray-900 text-white pb-0 mb-0"
      style={{ paddingBottom: 0, marginBottom: 0 }}
    >
      {/* Value proposition banner for non-authenticated users */}
      {!isAuthenticated && !isLandingPage && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 py-12 border-b border-slate-700">
          <div className="max-w-[1600px] mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Transform Your Thermal Engineering?
            </h2>
            <p className="text-xl text-slate-300 mb-6">
              Join thousands of engineers who save 20+ hours monthly with
              professional-grade calculations
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3 text-lg border-2 border-transparent">
                  Start Free Trial - No Credit Card Required
                </Button>
              </Link>
              <Link to="/pricing">
                <Button
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-white hover:text-slate-900 px-8 py-3 text-lg"
                >
                  View Pricing Plans
                </Button>
              </Link>
            </div>
            <p className="text-slate-400 text-sm mt-4">
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
              <Calculator className="h-8 w-8 text-orange-500" />
              <h3 className="text-2xl font-bold text-white">ThermoNeural</h3>
            </div>
            <p className="text-gray-300">
              Professional refrigeration cycle analysis platform trusted by
              engineers worldwide.
            </p>
            {!isAuthenticated && (
              <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                <p className="text-slate-300 text-sm font-semibold mb-2">
                  Why Choose ThermoNeural?
                </p>
                <ul className="text-slate-400 text-sm space-y-1">
                  <li>✓ Industry-standard calculations</li>
                  <li>✓ Export & collaboration tools</li>
                  <li>✓ 24/7 expert support</li>
                </ul>
              </div>
            )}
          </div>

          {/* Products Column */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Calculation Tools</h4>
            <ul className="space-y-2 text-gray-300">
              <li>
                <Link
                  to={isAuthenticated ? "/tools/standard-cycle" : "/features"}
                  className="hover:text-orange-400 transition-colors"
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
                  className="hover:text-orange-400 transition-colors"
                >
                  Refrigerant Comparison
                </Link>
              </li>
              <li>
                <Link
                  to={isAuthenticated ? "/tools/cascade-cycle" : "/features"}
                  className="hover:text-orange-400 transition-colors"
                >
                  Cascade Cycle Analysis
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-gray-300">
              <li>
                <Link
                  to="/about"
                  className="hover:text-orange-400 transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/pricing"
                  className="hover:text-orange-400 transition-colors"
                >
                  Pricing Plans
                </Link>
              </li>
              <li>
                <Link
                  to="/blog"
                  className="hover:text-orange-400 transition-colors"
                >
                  Engineering Blog
                </Link>
              </li>
              <li>
                <Link
                  to="/help-center"
                  className="hover:text-orange-400 transition-colors"
                >
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Get In Touch</h4>
            <ul className="space-y-4 text-gray-300">
              <li className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-orange-500 mt-0.5" />
                <div>
                  <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                    Technical Support
                  </span>
                  <a
                    href="mailto:support@thermoneural.com"
                    className="hover:text-orange-400 transition-colors text-sm"
                  >
                    support@thermoneural.com
                  </a>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-orange-500 mt-0.5" />
                <div>
                  <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                    Inquiries & Partnerships
                  </span>
                  <a
                    href="mailto:hello@thermoneural.com"
                    className="hover:text-orange-400 transition-colors text-sm"
                  >
                    hello@thermoneural.com
                  </a>
                </div>
              </li>
            </ul>

            {!isAuthenticated && (
              <div className="mt-6">
                <p className="text-sm text-gray-400 mb-2">
                  Start your free trial today
                </p>
                <Link to="/signup">
                  <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                    Get Started Free
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          className="border-t border-slate-800 mt-2 pt-1 pb-0 flex flex-col md:flex-row justify-between items-center bg-gray-900 !mb-0 !pb-0 min-h-0 leading-none"
          style={{ paddingBottom: 0, marginBottom: 0 }}
        >
          <p
            className="text-gray-400 text-sm m-0 p-0 leading-none"
            style={{ marginBottom: 0, paddingBottom: 0 }}
          >
            © 2024 ThermoNeural. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-0 md:mt-0 leading-none">
            <Link
              to="/privacy"
              className="text-gray-400 hover:text-orange-400 text-sm transition-colors block"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="text-gray-400 hover:text-orange-400 text-sm transition-colors block"
            >
              Terms of Service
            </Link>
            <Link
              to="/contact"
              className="text-gray-400 hover:text-orange-400 text-sm transition-colors block"
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
