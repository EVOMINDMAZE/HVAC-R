import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calculator, 
  TrendingUp, 
  BarChart3, 
  Database, 
  Shield, 
  Zap,
  Users,
  Download,
  Clock,
  CheckCircle,
  ArrowRight,
  Thermometer,
  Gauge,
  Settings,
  LineChart,
  FileText,
  Mail,
  Globe
} from "lucide-react";

export function Features() {
  const coreFeatures = [
    {
      icon: <Calculator className="h-12 w-12 text-blue-600" />,
      title: "Standard Cycle Analysis",
      description: "Complete thermodynamic analysis of vapor compression refrigeration cycles with detailed state point calculations.",
      features: [
        "COP calculation and optimization",
        "State point analysis (P-h, T-s diagrams)",
        "Energy balance calculations",
        "Multiple refrigerant support",
        "Real-time parameter validation"
      ]
    },
    {
      icon: <TrendingUp className="h-12 w-12 text-purple-600" />,
      title: "Refrigerant Comparison",
      description: "Side-by-side performance comparison of different refrigerants under identical operating conditions.",
      features: [
        "Multi-refrigerant analysis",
        "Performance benchmarking",
        "Environmental impact assessment",
        "Cost-effectiveness analysis",
        "Visual comparison charts"
      ]
    },
    {
      icon: <BarChart3 className="h-12 w-12 text-green-600" />,
      title: "Cascade Systems",
      description: "Advanced analysis of two-stage cascade refrigeration systems for ultra-low temperature applications.",
      features: [
        "Dual-cycle optimization",
        "Heat exchanger sizing",
        "System efficiency analysis",
        "Temperature matching",
        "Economic evaluation"
      ]
    }
  ];

  const professionalFeatures = [
    {
      icon: <Database className="h-8 w-8" />,
      title: "Calculation History",
      description: "Comprehensive database of all your calculations with powerful search and organization tools."
    },
    {
      icon: <Download className="h-8 w-8" />,
      title: "Export Capabilities",
      description: "Export results to PDF, Excel, or JSON formats for reporting and further analysis."
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Data Security",
      description: "Enterprise-grade security with encrypted data storage and secure API access."
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "High-Speed Calculations",
      description: "Optimized algorithms providing instant results even for complex multi-variable analyses."
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Team Collaboration",
      description: "Share calculations and collaborate with team members on projects."
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: "Real-time Updates",
      description: "Automatic synchronization across devices with real-time calculation updates."
    }
  ];

  const technicalSpecs = [
    {
      category: "Refrigerants Supported",
      items: ["R-134a", "R-410A", "R-404A", "R-448A", "R-290 (Propane)", "R-32", "R-744 (CO₂)", "R-1234yf", "And 50+ more"]
    },
    {
      category: "Temperature Range",
      items: ["-80°C to +150°C", "Automatic range validation", "Unit conversion (°C/°F/K)", "Precision to 0.1°C"]
    },
    {
      category: "Pressure Range", 
      items: ["0.1 kPa to 10 MPa", "Multiple pressure units", "Vacuum applications", "High-pressure systems"]
    },
    {
      category: "Accuracy",
      items: ["±0.1% thermodynamic properties", "NIST REFPROP validated", "Industry-standard correlations", "Peer-reviewed algorithms"]
    }
  ];

  const industryApplications = [
    {
      icon: <Thermometer className="h-8 w-8 text-blue-600" />,
      title: "HVAC Systems",
      description: "Design and optimize commercial and residential air conditioning systems.",
      useCases: ["Building cooling loads", "Energy efficiency optimization", "Equipment sizing", "Seasonal performance"]
    },
    {
      icon: <Gauge className="h-8 w-8 text-purple-600" />,
      title: "Industrial Refrigeration",
      description: "Large-scale refrigeration for food processing, chemical storage, and manufacturing.",
      useCases: ["Cold storage design", "Process cooling", "Freeze drying", "Cryogenic applications"]
    },
    {
      icon: <Settings className="h-8 w-8 text-green-600" />,
      title: "Heat Pumps",
      description: "Analysis and optimization of heat pump systems for heating and cooling applications.",
      useCases: ["Ground source systems", "Air source heat pumps", "Water heating", "Space conditioning"]
    },
    {
      icon: <LineChart className="h-8 w-8 text-orange-600" />,
      title: "Energy Recovery",
      description: "Waste heat recovery and energy efficiency improvement in industrial processes.",
      useCases: ["Heat recovery wheels", "Thermal storage", "Waste heat utilization", "Energy audits"]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-blue-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <Calculator className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-blue-900">Simulateon</h1>
          </Link>
          <div className="flex items-center space-x-4">
            <Link to="/pricing">
              <Button variant="ghost" className="text-blue-600 hover:text-blue-700">
                Pricing
              </Button>
            </Link>
            <Link to="/signin">
              <Button variant="ghost" className="text-blue-600 hover:text-blue-700">
                Sign In
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <Badge variant="secondary" className="mb-6 text-blue-600 bg-blue-100">
            Professional HVAC&R Engineering Software
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Powerful Features for
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {" "}Modern Engineers
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Everything you need for professional refrigeration cycle analysis, from basic calculations 
            to complex multi-stage systems.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4">
                Try All Features Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg" variant="outline" className="text-lg px-8 py-4 border-blue-200 hover:bg-blue-50">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>

        {/* Core Features */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Core Calculation Engines</h2>
            <p className="text-xl text-gray-600">
              Industry-standard thermodynamic calculations with unmatched accuracy
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {coreFeatures.map((feature, index) => (
              <Card key={index} className="bg-white shadow-xl border-blue-200 hover:shadow-2xl transition-all duration-300">
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-2xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-6">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.features.map((item, idx) => (
                      <li key={idx} className="flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Professional Features */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Professional Tools</h2>
            <p className="text-xl text-gray-600">
              Advanced features for professional engineering workflows
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {professionalFeatures.map((feature, index) => (
              <Card key={index} className="bg-white shadow-lg border-gray-200 hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 p-3 bg-blue-100 rounded-lg">
                      {feature.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                        <Badge variant="secondary" className="text-xs">Pro</Badge>
                      </div>
                      <p className="text-gray-600 text-sm">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Technical Specifications */}
        <section className="mb-20">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Technical Specifications</h2>
              <p className="text-xl text-gray-600">
                Built on industry-standard data and validated algorithms
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {technicalSpecs.map((spec, index) => (
                <div key={index} className="space-y-4">
                  <h3 className="font-bold text-lg text-blue-900">{spec.category}</h3>
                  <ul className="space-y-2">
                    {spec.items.map((item, idx) => (
                      <li key={idx} className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Industry Applications */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Industry Applications</h2>
            <p className="text-xl text-gray-600">
              Trusted by engineers across diverse industries and applications
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {industryApplications.map((app, index) => (
              <Card key={index} className="bg-white shadow-lg border-gray-200">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      {app.icon}
                    </div>
                    <div>
                      <CardTitle className="text-xl">{app.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{app.description}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {app.useCases.map((useCase, idx) => (
                      <div key={idx} className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                        {useCase}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Integration & API */}
        <section className="mb-20">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-4xl font-bold mb-4">API & Integrations</h2>
                <p className="text-xl mb-6 opacity-90">
                  Seamlessly integrate Simulateon into your existing engineering workflows with our powerful API.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-3" />
                    RESTful API with comprehensive documentation
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-3" />
                    Webhook support for real-time updates
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-3" />
                    SDKs for Python, JavaScript, and MATLAB
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-3" />
                    Enterprise SSO and user management
                  </li>
                </ul>
                <div className="flex space-x-4">
                  <Link to="/api-docs">
                    <Button variant="secondary" size="lg">
                      <FileText className="mr-2 h-5 w-5" />
                      API Documentation
                    </Button>
                  </Link>
                  <Link to="/contact">
                    <Button variant="outline" size="lg" className="bg-transparent border-white text-white hover:bg-white hover:text-blue-600">
                      <Mail className="mr-2 h-5 w-5" />
                      Contact Sales
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                  <Globe className="h-24 w-24 mx-auto mb-4 opacity-80" />
                  <h3 className="text-xl font-semibold mb-2">Enterprise Ready</h3>
                  <p className="opacity-80">
                    Scale from individual calculations to enterprise-wide deployment
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <div className="text-center bg-white rounded-2xl shadow-xl p-12">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Experience Professional HVAC&R Calculations?
          </h3>
          <p className="text-xl text-gray-600 mb-8">
            Start your free trial today and see why thousands of engineers trust Simulateon.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="text-lg px-8 py-4 border-blue-200 hover:bg-blue-50">
                Schedule Demo
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
