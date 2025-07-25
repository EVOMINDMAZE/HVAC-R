import { Link } from "react-router-dom";
import { Calculator, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "./ui/button";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

export function Footer() {
  const { isAuthenticated } = useSupabaseAuth();

  return (
    <footer className="bg-gray-900 text-white">
      {/* Value proposition banner for non-authenticated users */}
      {!isAuthenticated && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 py-12">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Refrigeration Analysis?</h2>
            <p className="text-xl text-blue-100 mb-6">
              Join thousands of engineers who save 20+ hours monthly with professional-grade calculations
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button className="bg-yellow-400 hover:bg-yellow-500 text-purple-900 font-bold px-8 py-3 text-lg">
                  Start Free Trial - No Credit Card Required
                </Button>
              </Link>
              <Link to="/pricing">
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-purple-700 px-8 py-3 text-lg">
                  View Pricing Plans
                </Button>
              </Link>
            </div>
            <p className="text-blue-200 text-sm mt-4">
              ✓ Instant setup ✓ Full API access ✓ Expert support ✓ Cancel anytime
            </p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Calculator className="h-8 w-8 text-blue-400" />
              <h3 className="text-2xl font-bold">Simulateon</h3>
            </div>
            <p className="text-gray-300">
              Professional refrigeration cycle analysis platform trusted by engineers worldwide.
            </p>
            {!isAuthenticated && (
              <div className="bg-blue-900/50 p-4 rounded-lg">
                <p className="text-blue-200 text-sm font-semibold mb-2">Why Choose Simulateon?</p>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>✓ Industry-standard calculations</li>
                  <li>✓ Real-time API integration</li>
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
                <Link to={isAuthenticated ? "/standard-cycle" : "/features"} className="hover:text-blue-400 transition-colors">
                  Standard Cycle Analysis
                </Link>
              </li>
              <li>
                <Link to={isAuthenticated ? "/refrigerant-comparison" : "/features"} className="hover:text-blue-400 transition-colors">
                  Refrigerant Comparison
                </Link>
              </li>
              <li>
                <Link to={isAuthenticated ? "/cascade-cycle" : "/features"} className="hover:text-blue-400 transition-colors">
                  Cascade Cycle Analysis
                </Link>
              </li>
              <li>
                <Link to="/api-docs" className="hover:text-blue-400 transition-colors">
                  API Documentation
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-gray-300">
              <li>
                <Link to="/about" className="hover:text-blue-400 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-blue-400 transition-colors">
                  Pricing Plans
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-blue-400 transition-colors">
                  Engineering Blog
                </Link>
              </li>
              <li>
                <Link to="/help-center" className="hover:text-blue-400 transition-colors">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Get In Touch</h4>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-blue-400" />
                <a href="mailto:support@simulateon.com" className="hover:text-blue-400 transition-colors">
                  support@simulateon.com
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-blue-400" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-blue-400" />
                <span>San Francisco, CA</span>
              </li>
            </ul>
            
            {!isAuthenticated && (
              <div className="mt-6">
                <p className="text-sm text-gray-400 mb-2">Start your free trial today</p>
                <Link to="/signup">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Get Started Free
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2024 Simulateon. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link to="/privacy" className="text-gray-400 hover:text-blue-400 text-sm transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-gray-400 hover:text-blue-400 text-sm transition-colors">
              Terms of Service
            </Link>
            <Link to="/contact" className="text-gray-400 hover:text-blue-400 text-sm transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
