import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import {
  ArrowRight,
  Calculator,
  Users,
  Shield,
  TrendingUp,
  CheckCircle,
  Zap,
  Globe,
  BarChart,
  Layers,
  Sparkles,
  ChevronDown,
  Lock,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { SEO } from "@/components/SEO";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

function HeroSection() {
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.9]);
  const y = useTransform(scrollYProgress, [0, 0.5], [0, 50]);

  return (
    <section ref={targetRef} className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden px-4">
      <motion.div
        style={{ opacity, scale, y }}
        className="max-w-[1600px] mx-auto text-center relative z-10"
      >
        <motion.div
          initial="initial"
          animate="animate"
          variants={staggerContainer}
          className="flex flex-col items-center"
        >
          <motion.div variants={fadeInUp}>
            <Badge
              variant="outline"
              className="px-4 py-1.5 rounded-full border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 mb-8 backdrop-blur-md"
            >
              <Sparkles className="w-3 h-3 mr-2" />
              <span className="font-semibold tracking-wide uppercase text-[10px] sm:text-xs">
                The New Standard in Thermal Analysis
              </span>
            </Badge>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-foreground mb-8 max-w-5xl mx-auto"
          >
            Master Your <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-500 animate-gradient-x">
              Refrigeration Cycles
            </span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-lg sm:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            The comprehensive platform for HVAC&R professionals.
            Simulate, analyze, and optimize simple to complex thermodynamic systems with unprecedented speed.
          </motion.p>

          <motion.div
            variants={fadeInUp}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-4"
          >
            <Link to="/signup" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white h-14 px-8 rounded-full shadow-xl shadow-blue-500/20 transition-all hover:scale-105 font-medium text-lg"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/features" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto h-14 px-8 rounded-full border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-foreground font-medium text-lg backdrop-blur-sm"
              >
                Explore Features
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Decorative Background Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-gradient-to-tr from-blue-500/20 via-sky-500/10 to-transparent rounded-[100%] blur-[120px] -z-10 opacity-60 dark:opacity-40 pointer-events-none" />
    </section>
  );
}

function ProductPreview() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <section className="py-24 px-4 relative z-10 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <Badge variant="secondary" className="mb-4 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            Interactive Preview
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Experience the Power</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Try the interactive dashboard below. See how ThermoNeural visualizes complex thermodynamic data.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 100, rotateX: 10 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ transformPerspective: "1000px" }}
          className="relative rounded-xl bg-slate-950 dark:bg-slate-900 p-2 border border-slate-800 shadow-2xl overflow-hidden"
        >
          {/* Window Controls */}
          <div className="absolute top-0 left-0 right-0 h-9 bg-slate-900 border-b border-slate-800 rounded-t-xl flex items-center px-4 space-x-2 z-20">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            <div className="ml-4 text-xs text-slate-500 font-mono">dashboard.thermoneural.app</div>
          </div>

          {/* App Shell */}
          <div className="mt-9 flex h-[500px] bg-slate-950 text-slate-200 font-sans">
            {/* Sidebar */}
            <div className="w-16 md:w-64 border-r border-slate-800 flex flex-col p-4 gap-2 bg-slate-900/50">
              <div className="flex items-center gap-2 mb-6 px-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
                  <Zap className="text-white w-5 h-5" />
                </div>
                <span className="font-bold text-lg tracking-tight hidden md:block">ThermoNeural</span>
              </div>

              {[
                { id: "overview", label: "Overview", icon: TrendingUp },
                { id: "analysis", label: "Cycle Analysis", icon: Calculator },
                { id: "projects", label: "Projects", icon: Layers },
                { id: "team", label: "Team", icon: Users },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${activeTab === item.id
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                    }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="hidden md:block font-medium">{item.label}</span>
                </button>
              ))}
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 bg-slate-950/50">
              {/* Header */}
              <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/20 backdrop-blur-sm">
                <div className="text-sm text-slate-400">
                  Workspace / <span className="text-slate-100 font-medium capitalize">{activeTab}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 border border-white/10" />
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 p-6 overflow-hidden">
                {activeTab === "overview" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="h-full flex flex-col gap-6"
                  >
                    {/* Stats Row - REPLACED MOCK DATA WITH FEATURE DESCRIPTIONS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { label: "Efficiency Tracking", value: "Real-Time", trend: "COP Analysis", color: "text-emerald-400" },
                        { label: "Power Monitoring", value: "kW / Ton", trend: "Energy Usage", color: "text-blue-400" },
                        { label: "Cycle Management", value: "Multi-Stage", trend: "Status Monitor", color: "text-amber-400" },
                      ].map((stat, i) => (
                        <div key={i} className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                          <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">{stat.label}</div>
                          <div className="flex items-end justify-between">
                            <div className="text-2xl font-bold text-white">{stat.value}</div>
                            <div className={`text-xs font-medium ${stat.color} bg-white/5 px-2 py-1 rounded`}>{stat.trend}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Chart Area - REPLACED MOCK DATA VISUALIZATION WITH STATIC FEATURE PREVIEW */}
                    <div className="flex-1 rounded-xl bg-slate-900 border border-slate-800 p-4 min-h-0 flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
                      <div className="relative z-10 p-6 rounded-full bg-slate-800/50 border border-slate-700">
                        <BarChart className="w-12 h-12 text-blue-500" />
                      </div>
                      <div className="relative z-10 max-w-md">
                        <h3 className="text-xl font-semibold text-slate-100 mb-2">Real-Time Analytics Engine</h3>
                        <p className="text-slate-400">
                          Connect your equipment sensors to visualize pressure-enthalpy diagrams, temperature curves, and efficiency metrics instantly.
                        </p>
                      </div>
                      <div className="flex gap-3 relative z-10">
                        <Button size="sm" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white" disabled>
                          Connect Sensor
                        </Button>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" disabled>
                          View Sample
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab !== "overview" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full flex items-center justify-center flex-col text-slate-500"
                  >
                    <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center mb-4">
                      <Lock className="w-8 h-8 opacity-50" />
                    </div>
                    <p className="text-lg font-medium">Authentication Required</p>
                    <p className="text-sm max-w-xs text-center mt-2">Sign up to access full {activeTab} features interactively.</p>
                    <Link to="/signup" className="mt-6">
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">Create Account</Button>
                    </Link>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function FeatureCard({ icon: Icon, title, desc, delay }: { icon: any, title: string, desc: string, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="group p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors" />

      <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
        <Icon className="h-7 w-7 text-blue-600 dark:text-blue-400" />
      </div>

      <h3 className="text-xl font-bold text-foreground mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">
        {desc}
      </p>
    </motion.div>
  );
}

function FeaturesGrid() {
  const features = [
    {
      title: "Standard Cycle Analysis",
      desc: "Comprehensive analysis for single-stage vapor compression cycles calculating COP, capacity, and work.",
      icon: Calculator,
    },
    {
      title: "Cascade Systems",
      desc: "Design complex low-temp systems with multi-stage cascade functionality and inter-stage optimization.",
      icon: Layers,
    },
    {
      title: "Refrigerant Library",
      desc: "Access a vast database of modern refrigerants including natural and synthetic options with real-time property plotting.",
      icon: Globe,
    },
    {
      title: "Performance Reports",
      desc: "Generate professional PDF reports with P-h diagrams, state points, and system performance metrics.",
      icon: BarChart,
    },
    {
      title: "Project Management",
      desc: "Save, organize, and version control your calculations. Share projects with team members effortlessly.",
      icon: Users,
    },
    {
      title: "Secure & Cloud-Based",
      desc: "Enterprise-grade security for your data using Supabase, accessible from any device, anywhere.",
      icon: Shield,
    },
  ];

  return (
    <section className="py-32 px-4 bg-slate-50/50 dark:bg-slate-950/50 border-y border-slate-200 dark:border-slate-800">
      <div className="max-w-[1600px] mx-auto">
        <div className="text-center mb-20 max-w-3xl mx-auto">
          <Badge variant="outline" className="mb-4 border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-300">
            Feature Rich Platform
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Everything you need for <span className="text-blue-600">thermal analysis</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            From quick estimations to detailed system design, ThermoNeural provides the tools engineering teams trust.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <FeatureCard key={i} {...f} delay={i * 0.1} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  return (
    <section className="py-24 px-4 bg-background">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
        <Accordion type="single" collapsible className="w-full">
          {[
            { q: "Is ThermoNeural free to try?", a: "Yes! We offer a generous free tier that lets you perform standard cycle calculations and explore the platform's capabilities." },
            { q: "Can I export my data?", a: "Absolutely. Pro plans allow you to export your calculations to PDF and CSV formats for use in reports and other tools." },
            { q: "What refrigerants are supported?", a: "We support over 50+ common refrigerants including R410A, R134a, R32, R744 (CO2), R717 (Ammonia) and many new low-GWP alternatives." },
            { q: "Is it suitable for students?", a: "Yes, ThermoNeural is an excellent tool for thermodynamics students to visualize cycles and verify manual calculations." }
          ].map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left text-lg font-medium">{faq.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-32 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="relative rounded-[2.5rem] bg-gradient-to-br from-slate-900 to-slate-800 px-6 py-20 md:px-20 text-center overflow-hidden shadow-2xl">
          {/* Background Glows */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/20 blur-[120px] rounded-full pointer-events-none" />

          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
              Ready to elevate your engineering?
            </h2>
            <p className="text-lg text-slate-300 mb-10 max-w-2xl mx-auto">
              Join the platform designed for the modern thermodynamics professional.
              Start for free, upgrade as you grow.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg bg-white text-slate-900 hover:bg-slate-100 border-0 font-semibold">
                  Get Started For Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg border-white/20 text-white hover:bg-white/10">
                  Contact Sales
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Landing() {
  return (
    <div className="min-h-screen w-full bg-background text-foreground selection:bg-blue-100 selection:text-blue-900 flex flex-col">
      <Header variant="landing" />

      <main className="flex-grow">
        <SEO
          title="Home"
          description="Master your refrigeration cycles with ThermoNeural. The comprehensive platform for HVAC&R professionals to simulate, analyze, and optimize thermodynamic systems."
        />
        <HeroSection />
        <ProductPreview />
        <FeaturesGrid />
        <FAQSection />
        <CTASection />
      </main>

      <Footer />
    </div>
  );
}
