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
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

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
        className="max-w-7xl mx-auto text-center relative z-10"
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
  return (
    <section className="py-12 px-4 relative z-10">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 100, rotateX: 20 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ transformPerspective: "1200px" }}
          className="relative rounded-xl bg-slate-900/5 dark:bg-white/5 p-2 sm:p-4 border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-xl shadow-2xl"
        >
          {/* Mock Window Header */}
          <div className="absolute top-0 left-0 right-0 h-10 bg-slate-100/50 dark:bg-slate-800/50 border-b border-slate-200/50 dark:border-slate-700/50 rounded-t-xl flex items-center px-4 space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-400/80" />
            <div className="w-3 h-3 rounded-full bg-amber-400/80" />
            <div className="w-3 h-3 rounded-full bg-green-400/80" />
          </div>

          {/* Abstract Interface Content */}
          <div className="mt-8 grid grid-cols-12 gap-4 h-[300px] sm:h-[500px] overflow-hidden rounded-lg bg-background/50 relative">
            <div className="col-span-3 hidden md:flex flex-col gap-3 p-4 border-r border-border/50">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-8 w-full bg-slate-200/50 dark:bg-slate-800/50 rounded animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
              ))}
            </div>
            <div className="col-span-12 md:col-span-9 p-6 flex flex-col gap-6">
              <div className="flex gap-4 mb-4">
                <div className="h-32 w-full bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-8 w-8 text-blue-500 opacity-50" />
                </div>
                <div className="h-32 w-full bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
                  <Zap className="h-8 w-8 text-emerald-500 opacity-50" />
                </div>
              </div>
              <div className="flex-1 bg-slate-100/50 dark:bg-slate-800/30 rounded-xl border border-border/50 p-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
                {/* Mock Graph Lines */}
                <svg className="w-full h-full text-blue-500 opacity-20" viewBox="0 0 100 50" preserveAspectRatio="none">
                  <path d="M0,50 Q25,10 50,30 T100,20 L100,50 Z" fill="currentColor" />
                </svg>
              </div>
            </div>
          </div>

          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent pointer-events-none rounded-xl" />

          <div className="absolute bottom-8 left-0 right-0 text-center z-20">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Interactive Dashboard Preview</p>
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
      <div className="max-w-7xl mx-auto">
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
