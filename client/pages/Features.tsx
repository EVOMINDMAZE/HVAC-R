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
  Layers,
  Cpu,
} from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { SEO } from "@/components/SEO";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut" },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export function Features() {
  const coreFeatures = [
    {
      icon: <Calculator className="h-8 w-8 text-primary" />,
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
      icon: <TrendingUp className="h-8 w-8 text-primary" />,
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
      icon: <Layers className="h-8 w-8 text-primary" />,
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
      icon: <Database className="h-6 w-6 text-primary" />,
      title: "Calculation History",
      description:
        "Comprehensive database of all your calculations with powerful search and organization tools.",
    },
    {
      icon: <Download className="h-6 w-6 text-primary" />,
      title: "Export Capabilities",
      description:
        "Export results to PDF, Excel, or JSON formats for reporting and further analysis.",
    },
    {
      icon: <Shield className="h-6 w-6 text-primary" />,
      title: "Data Security",
      description:
        "Enterprise-grade security with encrypted data storage and backup.",
    },
    {
      icon: <Zap className="h-6 w-6 text-primary" />,
      title: "High-Speed Calculations",
      description:
        "Optimized algorithms providing instant results even for complex multi-variable analyses.",
    },
    {
      icon: <Users className="h-6 w-6 text-primary" />,
      title: "Team Collaboration",
      description:
        "Share calculations and collaborate with team members on projects seamlessly.",
    },
    {
      icon: <Clock className="h-6 w-6 text-primary" />,
      title: "Project Management",
      description:
        "Organize calculations into projects and track progress over time with ease.",
    },
  ];

  const technicalSpecs = [
    {
      title: "Thermodynamics",
      color: "text-primary",
      items: [
        {
          icon: <Thermometer className="h-4 w-4" />,
          text: "NIST Refprop Interface",
        },
        {
          icon: <Gauge className="h-4 w-4" />,
          text: "Real Gas Equations of State",
        },
        {
          icon: <Settings className="h-4 w-4" />,
          text: "Transport Properties",
        },
        {
          icon: <CheckCircle className="h-4 w-4" />,
          text: "Mixture Properties",
        },
      ],
    },
    {
      title: "Reporting",
      color: "text-primary",
      items: [
        {
          icon: <FileText className="h-4 w-4" />,
          text: "Professional PDF Reports",
        },
        {
          icon: <LineChart className="h-4 w-4" />,
          text: "Interactive Phase Diagrams",
        },
        {
          icon: <Database className="h-4 w-4" />,
          text: "CSV/Excel Data Export",
        },
        { icon: <Globe className="h-4 w-4" />, text: "Cloud Synchronization" },
      ],
    },
    {
      title: "Support",
      color: "text-primary",
      items: [
        { icon: <Mail className="h-4 w-4" />, text: "Priority Email Support" },
        { icon: <Users className="h-4 w-4" />, text: "Community Access" },
        {
          icon: <FileText className="h-4 w-4" />,
          text: "Comprehensive Documentation",
        },
        { icon: <Zap className="h-4 w-4" />, text: "Video Tutorials" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 selection:text-primary">
      <Header variant="landing" />

      <main className="flex-grow pt-24">
        <SEO
          title="Features"
          description="Explore ThermoNeural's powerful thermodynamic tools: Standard Cycle Analysis, Refrigerant Comparison, Cascade Systems, and verified NIST reporting."
        />
        {/* Hero Section */}
        <section className="relative px-4 pb-20 pt-10 overflow-hidden">
          {/* Background Elements */}
          <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-slate-50/50 to-transparent dark:from-slate-900/20 dark:to-transparent pointer-events-none -z-10" />
          <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="max-w-[1600px] mx-auto text-center">
            <motion.div
              initial="initial"
              animate="animate"
              variants={staggerContainer}
              className="max-w-3xl mx-auto"
            >
              <motion.div variants={fadeInUp}>
                <Badge
                  variant="outline"
                  className="mb-6 border-primary/30 bg-primary/10 text-primary dark:bg-primary/20 backdrop-blur-sm"
                >
                  <Cpu className="w-3 h-3 mr-2" />
                  Powerful Calculation Engines
                </Badge>
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                className="text-5xl md:text-7xl font-bold font-mono tracking-tight mb-8"
              >
                Features designed for <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-primary">
                  Modern Engineering
                </span>
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="text-xl text-muted-foreground leading-relaxed mb-10"
              >
                From simple cycle validation to complex system optimization,
                ThermoNeural gives you the toolkit to solve thermodynamic
                problems with confidence.
              </motion.p>

              <motion.div
                variants={fadeInUp}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Link to="/signup">
                  <Button
                    size="lg"
                    className="h-14 px-8 text-lg rounded-full font-medium text-foreground shadow-xl"
                  >
                    Start Calculating
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Core Calculation Engines */}
        <section className="py-24 px-4 bg-secondary/30 dark:bg-secondary/10 border-y border-border">
          <div className="max-w-[1600px] mx-auto">
            <div className="grid lg:grid-cols-3 gap-8">
              {coreFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                  <Card className="h-full border-border bg-card/80 dark:bg-card/50 backdrop-blur-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group">
                    <CardHeader>
                      <div className="w-16 h-16 rounded-2xl bg-secondary dark:bg-secondary/50 border border-border flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                        {feature.icon}
                      </div>
                      <CardTitle className="text-2xl mb-2">
                        {feature.title}
                      </CardTitle>
                      <p className="text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-4 mt-4">
                        {feature.features.map((item, idx) => (
                          <li key={idx} className="flex items-start">
                            <CheckCircle className="h-5 w-5 text-primary mr-3 shrink-0 mt-0.5" />
                            <span className="text-sm font-medium text-foreground">
                              {item}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Professional Tools Grid */}
        <section className="py-24 px-4">
          <div className="max-w-[1600px] mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Built for Professionals
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Streamline your workflow with tools designed for accuracy,
                speed, and collaboration.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {professionalFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="p-6 rounded-2xl border border-border hover:border-primary/50 hover:bg-secondary/50 dark:hover:bg-secondary/20 transition-all duration-300 group"
                >
                  <div className="mb-4 p-3 bg-secondary dark:bg-secondary/50 w-fit rounded-xl group-hover:bg-primary/10 transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Technical Specs & Dark Section */}
        <section className="py-24 px-4 bg-secondary text-foreground relative overflow-hidden">
          {/* Decorative Background */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 dark:opacity-20" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 blur-[150px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/5 blur-[150px] rounded-full pointer-events-none" />

          <div className="max-w-[1600px] mx-auto relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
                  Technical Specifications
                </h2>
                <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                  Powered by industry-standard libraries including NIST Refprop
                  and validated equations of state. We ensure every calculation
                  meets rigorous engineering standards.
                </p>
                <Link to="/contact">
                  <Button
                    variant="outline"
                    className="border-primary/30 text-foreground hover:bg-primary/10"
                  >
                    Request Technical Documentation
                  </Button>
                </Link>
              </div>

              <div className="grid gap-6">
                {technicalSpecs.map((spec, i) => (
                  <motion.div
                    key={i}
                    initial={{ x: 50, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-card/50 backdrop-blur-md border border-border rounded-xl p-6 hover:bg-card transition-colors"
                  >
                    <h3 className={`text-lg font-bold mb-4 ${spec.color}`}>
                      {spec.title}
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {spec.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center text-sm text-foreground"
                        >
                          <span className={`mr-3 ${spec.color}`}>
                            {item.icon}
                          </span>
                          {item.text}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-32 px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold mb-6">
              Ready to optimize your workflow?
            </h2>
            <p className="text-xl text-muted-foreground mb-10">
              Join engineers worldwide who trust ThermoNeural for their critical
              calculations.
            </p>
            <div className="flex justify-center gap-4">
              <Link to="/signup">
                <Button
                  size="lg"
                  className="h-14 px-8 rounded-full font-medium text-foreground text-lg"
                >
                  Get Started Now
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
