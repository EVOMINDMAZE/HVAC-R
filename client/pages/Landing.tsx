import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Footer } from "@/components/Footer";
import { SupabaseStatus } from "@/components/SupabaseStatus";
import { ArrowRight, Calculator, Users, Shield, TrendingUp, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

export function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Header variant="landing" />

      <div className="max-w-7xl mx-auto px-4 pt-4">
        <SupabaseStatus />
      </div>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-6 text-blue-600 bg-blue-100">
            Professional HVAC&R Engineering Tool
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Advanced Refrigeration
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {" "}Cycle Analysis
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Professional-grade thermodynamic calculations for HVAC&R engineers. 
            Analyze standard cycles, compare refrigerants, and optimize cascade systems with precision.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8 py-4 border-blue-200 hover:bg-blue-50">
              View Demo
            </Button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <Card className="bg-white/60 backdrop-blur-sm border-blue-200 hover:shadow-lg transition-all duration-300">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Calculator className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">Standard Cycle Analysis</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600">
                Calculate COP, refrigeration effect, and state points for standard vapor compression cycles.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur-sm border-blue-200 hover:shadow-lg transition-all duration-300">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">Refrigerant Comparison</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600">
                Compare performance metrics across multiple refrigerants to optimize your system design.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur-sm border-blue-200 hover:shadow-lg transition-all duration-300">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-indigo-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">Cascade Systems</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600">
                Analyze complex two-stage cascade refrigeration systems for ultra-low temperature applications.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-white/40 backdrop-blur-sm py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Simulateon?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built by engineers, for engineers. Get accurate results with industry-standard calculations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: CheckCircle,
                title: "Accurate Calculations",
                description: "Industry-standard thermodynamic property calculations"
              },
              {
                icon: Users,
                title: "Save Projects",
                description: "Store and organize your calculation history"
              },
              {
                icon: TrendingUp,
                title: "Performance Insights",
                description: "Compare and optimize system performance"
              },
              {
                icon: Shield,
                title: "Professional Grade",
                description: "Trusted by HVAC&R professionals worldwide"
              }
            ].map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Start Calculating?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of engineers using Simulateon for their refrigeration calculations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-4">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8 py-4 bg-transparent border-white text-white hover:bg-white hover:text-blue-600">
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
