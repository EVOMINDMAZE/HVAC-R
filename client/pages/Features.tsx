import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
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
  Globe,
} from "lucide-react";

export function Features() {
  const coreFeatures = [
    {
      icon: <Calculator className="h-12 w-12 text-orange-600" />,
      title: "Standard Cycle Analysis",
      description:
        "Complete thermodynamic analysis of vapor compression refrigeration cycles with detailed state point calculations.",
      features: [
        "COP calculation and optimization",
        "State point analysis (P-h, T-s diagrams)",
        "Energy balance calculations",
        "Multiple refrigerant support",
        "Real-time parameter validation",
      ],
    },
    {
      icon: <TrendingUp className="h-12 w-12 text-red-600" />,
      title: "Refrigerant Comparison",
      description:
        "Side-by-side performance comparison of different refrigerants under identical operating conditions.",
      features: [
        "Multi-refrigerant analysis",
        "Performance benchmarking",
        "Environmental impact assessment",
        "Cost-effectiveness analysis",
        "Visual comparison charts",
      ],
    },
    {
      icon: <BarChart3 className="h-12 w-12 text-amber-600" />,
      title: "Cascade Systems",
      description:
        "Advanced analysis of two-stage cascade refrigeration systems for ultra-low temperature applications.",
      features: [
        "Dual-cycle optimization",
        "Heat exchanger sizing",
        "System efficiency analysis",
        "Temperature matching",
        "Economic evaluation",
      ],
    },
  ];

  const professionalFeatures = [
    {
      icon: <Database className="h-8 w-8 text-orange-600" />,
      title: "Calculation History",
      description:
        "Comprehensive database of all your calculations with powerful search and organization tools.",
    },
    {
      icon: <Download className="h-8 w-8 text-orange-600" />,
      title: "Export Capabilities",
      description:
        "Export results to PDF, Excel, or JSON formats for reporting and further analysis.",
    },
    {
      icon: <Shield className="h-8 w-8 text-orange-600" />,
      title: "Data Security",
      description:
        "Enterprise-grade security with encrypted data storage.",
    },
    {
      icon: <Zap className="h-8 w-8 text-orange-600" />,
      title: "High-Speed Calculations",
      description:
        "Optimized algorithms providing instant results even for complex multi-variable analyses.",
    },
    {
      icon: <Users className="h-8 w-8 text-orange-600" />,
      title: "Team Collaboration",
      description:
        "Share calculations and collaborate with team members on projects.",
    },
    {
      icon: <Clock className="h-8 w-8 text-orange-600" />,
      title: "Project Management",
      description:
        "Organize calculations into projects and track progress over time.",
    },
  ];

  const technicalSpecs = [
    {
      title: "Thermodynamics",
      items: [
        { icon: <Thermometer className="h-5 w-5 text-orange-500" />, text: "NIST Refprop Interface" },
        { icon: <Gauge className="h-5 w-5 text-orange-500" />, text: "Real Gas Equations of State" },
        { icon: <Settings className="h-5 w-5 text-orange-500" />, text: "Transport Properties" },
        { icon: <CheckCircle className="h-5 w-5 text-orange-500" />, text: "Mixture Properties" },
      ],
    },
    {
      title: "Reporting",
      items: [
        { icon: <FileText className="h-5 w-5 text-orange-500" />, text: "Professional PDF Reports" },
        { icon: <LineChart className="h-5 w-5 text-orange-500" />, text: "Interactive Phase Diagrams" },
        { icon: <Database className="h-5 w-5 text-orange-500" />, text: "CSV/Excel Data Export" },
        { icon: <Globe className="h-5 w-5 text-orange-500" />, text: "Cloud Synchronization" },
      ],
    },
    {
      title: "Support",
      items: [
        { icon: <Mail className="h-5 w-5 text-orange-500" />, text: "Priority Email Support" },
        { icon: <Users className="h-5 w-5 text-orange-500" />, text: "Community Access" },
        { icon: <FileText className="h-5 w-5 text-orange-500" />, text: "Comprehensive Documentation" },
        { icon: <Zap className="h-5 w-5 text-orange-500" />, text: "Video Tutorials" },
      ],
    },
  ];

  const industryApplications = [
    {
      icon: <Thermometer className="h-8 w-8 text-orange-600" />,
      title: "HVAC Systems",
      description:
        "Design and optimize commercial and residential air conditioning systems.",
      items: [
        "Chiller optimization",
        "Heat load calculations",
        "System sizing",
      ],
    },
    {
      icon: <Gauge className="h-8 w-8 text-red-600" />,
      title: "Industrial Refrigeration",
      description:
        "Large-scale refrigeration for food processing, chemical storage, and manufacturing.",
      items: [
        "Cold storage design",
        "Process cooling",
        "Energy efficiency audits",
      ],
    },
    {
      icon: <Settings className="h-8 w-8 text-amber-600" />,
      title: "Heat Pumps",
      description:
        "Analysis and optimization of heat pump systems for heating and cooling applications.",
      items: [
        "COP improvement",
        "Alternative refrigerants",
        "System retrofitting",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-orange-100 selection:text-orange-900">
      <Header variant="landing" />

      {/* Warm/Thermo Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-orange-100/50 blur-[100px] animate-pulse" />
        <div className="absolute top-[20%] right-[-5%] w-[30%] h-[30%] rounded-full bg-amber-100/40 blur-[100px] animate-pulse delay-1000" />
        <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-red-100/30 blur-[100px] animate-pulse delay-2000" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <Badge variant="secondary" className="mb-6 text-orange-700 bg-orange-100 border-orange-200">
            Professional HVAC&R Engineering Software
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
            Powerful Features for
            <span className="bg-gradient-to-r from-orange-600 via-red-600 to-amber-600 bg-clip-text text-transparent">
              {" "}
              Modern Engineers
            </span>
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Everything you need to analyze, optimize, and validate refrigeration
            systems in one professional platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Link to="/signup">
              <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-6 text-lg h-auto shadow-lg shadow-orange-900/10 mb-4 sm:mb-0">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Core Features */}
        <section className="mb-32">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Core Calculation Engines
            </h2>
            <p className="text-xl text-slate-600">
              Industry-standard thermodynamic calculations with unmatched
              accuracy
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {coreFeatures.map((feature, index) => (
              <Card
                key={index}
                className="border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur-sm"
              >
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4 p-3 bg-orange-50 rounded-2xl w-fit mx-auto">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-2xl text-slate-900">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 mb-6 leading-relaxed">{feature.description}</p>
                  <ul className="space-y-3">
                    {feature.features.map((item, idx) => (
                      <li key={idx} className="flex items-start text-slate-700">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Professional Tools Section */}
        <section className="mb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Professional Engineering Tools
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Built for accuracy, speed, and collaboration.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {professionalFeatures.map((feature, index) => (
              <div
                key={index}
                className="flex flex-col p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Technical Specs */}
        <div className="rounded-3xl bg-slate-900 text-white p-8 md:p-12 mb-32 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-12 opacity-10">
            <Calculator className="w-64 h-64" />
          </div>

          <div className="relative z-10">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Technical Specifications</h2>
              <p className="text-slate-300">
                Powered by industry-standard libraries and validated models
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {technicalSpecs.map((spec, index) => (
                <div key={index} className="bg-slate-800/50 rounded-xl p-6 backdrop-blur">
                  <h3 className="text-xl font-semibold mb-6 flex items-center">
                    {spec.title}
                  </h3>
                  <ul className="space-y-4">
                    {spec.items.map((item, i) => (
                      <li key={i} className="flex items-center text-slate-300">
                        <span className="mr-3">{item.icon}</span>
                        {item.text}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Industry Applications */}
        <section className="mb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Industry Applications
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Solutions for every sector of the HVAC&R industry
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {industryApplications.map((app, index) => (
              <Card key={index} className="bg-white border-slate-200 shadow-md hover:shadow-lg transition-all">
                <CardContent className="p-8 text-center">
                  <div className="flex justify-center mb-6 p-4 bg-orange-50 rounded-full w-fit mx-auto">
                    {app.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{app.title}</h3>
                  <p className="text-slate-600 mb-6">{app.description}</p>
                  <ul className="text-left space-y-2">
                    {app.items.map((item, i) => (
                      <li key={i} className="flex items-center text-slate-700 text-sm">
                        <CheckCircle className="h-4 w-4 text-orange-500 mr-2" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <div className="text-center mb-20 bg-gradient-to-r from-orange-50 to-amber-50 rounded-3xl p-12 border border-orange-100">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
            Ready to optimize your systems?
          </h2>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Join thousands of HVAC&R professionals using Simulateon for accurate
            thermodynamic calculations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-6 h-auto text-lg shadow-lg shadow-orange-600/20">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button variant="outline" size="lg" className="px-8 py-6 h-auto text-lg border-slate-300 text-slate-700 hover:bg-white hover:text-orange-700">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
