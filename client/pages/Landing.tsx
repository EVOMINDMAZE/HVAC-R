import { useEffect, useState, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import "@/landing.css";
import {
  ArrowRight,
  CheckCircle2,
  Shield,
  Play,
  Zap,
  ImageOff,
  BadgeCheck,
  Clock,
  Layout,
  BarChart3,
  FileCheck2,
  Send,
} from "lucide-react";
import { Link } from "react-router-dom";

import { PublicPageShell } from "@/components/public/PublicPageShell";
import { SEO } from "@/components/SEO";
import { StructuredData } from "@/components/seo/StructuredData";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { landingConfig } from "@/config/metrics";
import { trackMarketingEvent } from "@/lib/marketingAnalytics";

function LandingImage({
  src,
  alt,
  className,
  loading
}: {
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager"
}) {
  const [error, setError] = useState(false);
  const isVideo = src.toLowerCase().endsWith('.mp4');

  useEffect(() => {
    setError(false);
  }, [src]);

  if (error) {
    return (
      <div className={`${className} bg-muted flex items-center justify-center`}>
        <ImageOff className="w-8 h-8 text-muted-foreground opacity-50" />
      </div>
    );
  }

  if (isVideo) {
    return (
      <video
        src={src}
        className={className}
        autoPlay
        loop
        muted
        playsInline
        onError={() => setError(true)}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      onError={() => setError(true)}
    />
  );
}

export function Landing() {
  const [isVisible, setIsVisible] = useState(false);
  const [showMobileCta, setShowMobileCta] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    setIsVisible(true);
    trackMarketingEvent("landing_view", { section: "hero_redesign" });
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const heroHeight = window.innerHeight * 0.9;
      setShowMobileCta(scrollY > heroHeight);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as any } 
    },
  };

  const stagger = {
    visible: {
      transition: prefersReducedMotion ? undefined : { staggerChildren: 0.1 },
    },
  };

  const pillarIcons = [Layout, BarChart3, FileCheck2, Send];

  return (
    <PublicPageShell className="landing-page bg-background" mainId="main-content" skipToMain>
      <SEO
        title="ThermoNeural | Engineering Operations at Scale"
        description="Equip your HVAC&R technicians with AI-driven diagnostics, automated compliance, and profit-focused dispatching."
      />
      <StructuredData />

      {/* Hero Section */}
      <section className="relative bg-slate-50 dark:bg-[#111827] pt-20 sm:pt-28 pb-16 sm:pb-20 lg:pt-40 lg:pb-32 overflow-hidden hero-gradient">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.05] text-primary pointer-events-none" />

        {/* Background Image - Full Width, Faded Center */}
        <div className="absolute inset-0 z-0 hidden sm:block">
          <img
            src="/assets/landing/create_image_like_202603191616.png"
            alt=""
            className="w-full h-full object-cover opacity-20 blur-sm scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-transparent dark:bg-gradient-to-r dark:from-transparent dark:via-transparent dark:to-transparent" style={{
            background: 'radial-gradient(ellipse 60% 100% at 50% 50%, transparent 0%, transparent 100%)',
          }} />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-transparent hidden dark:block" style={{
            background: 'radial-gradient(ellipse 60% 100% at 50% 50%, transparent 0%, #111827 100%)',
          }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Hero Text */}
            <motion.div
              initial="hidden"
              animate={isVisible ? "visible" : "hidden"}
              variants={stagger}
            >
              <motion.h1
                variants={fadeInUp}
                className="text-foreground dark:text-white text-4xl sm:text-5xl md:text-6xl lg:text-[56px] xl:text-[60px] font-display font-extrabold tracking-tight leading-[1.1] mb-4 sm:mb-6"
              >
                Engineering<br />
                <span className="text-primary" style={{ position: "relative", display: "inline-block" }}>
                  Operations
                  <img
                    src="/assets/landing-figma/mmxud1sh-eiwbik6.svg"
                    alt=""
                    className="absolute left-0 -bottom-1 w-full pointer-events-none"
                    style={{ height: "8px" }}
                  />
                </span>{" "}
                at Scale.
              </motion.h1>
              <motion.p
                variants={fadeInUp}
                className="text-muted-foreground text-base sm:text-lg lg:text-xl max-w-lg mb-8 sm:mb-10 leading-relaxed"
              >
                Stop trading time for money. Equip your technicians with AI-driven diagnostics, automated compliance, and profit-focused dispatching.
              </motion.p>
              <motion.div
                variants={fadeInUp}
                className="flex flex-col sm:flex-row gap-3 sm:gap-4"
              >
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 sm:px-8 py-5 sm:py-7 rounded-xl text-base sm:text-lg font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all group">
                  <Link to="/signup" className="flex items-center gap-2">
                    Start Your Free Trial
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border border-border bg-background/80 dark:border-white/20 dark:bg-white/10 backdrop-blur-md px-6 sm:px-8 py-5 sm:py-7 rounded-xl text-base sm:text-lg font-semibold text-foreground dark:text-white hover:bg-background/90 dark:hover:bg-white/20 transition-all">
                  <Link to="/demo" className="flex items-center gap-2">
                    <Play className="w-5 h-5 fill-current" />
                    Watch Strategy Video
                  </Link>
                </Button>
              </motion.div>
            </motion.div>

            {/* Hero Visual - Clear Image on Right Side */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative mt-8 lg:mt-0"
            >
              <div className="relative rounded-2xl overflow-hidden border border-border shadow-2xl bg-card/30 backdrop-blur-md">
                <LandingImage
                  src="/assets/landing/create_image_like_202603191616.png"
                  alt="ThermoNeural Dashboard Interface"
                  className="w-full h-auto object-cover"
                />
              </div>

              {/* Decorative HUD Elements */}
              <div className="absolute -top-4 sm:-top-6 -right-4 sm:-right-6 w-24 sm:w-32 h-24 sm:h-32 bg-primary/20 blur-2xl sm:blur-3xl rounded-full animate-pulse" />
              <div className="absolute -bottom-4 sm:-bottom-6 -left-4 sm:-left-6 w-32 sm:w-48 h-32 sm:h-48 bg-primary/10 blur-2xl sm:blur-3xl rounded-full" />

              {/* Floating Value Card */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/2 -right-8 sm:-right-12 lg:-right-12 hidden md:block glass-card p-3 sm:p-4 rounded-xl z-20 bg-card border border-border shadow-xl backdrop-blur-md"
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                  <Zap className="w-4 sm:w-5 h-4 sm:h-5 text-primary" />
                  <span className="text-lg sm:text-xl font-bold font-display">2.4x</span>
                </div>
                <div className="text-[8px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Efficiency Gain
                </div>
                <div className="text-[8px] sm:text-[10px] text-muted-foreground uppercase tracking-widest mt-0 sm:mt-1">Direct Operational ROI</div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problem / Pillars Section */}
      <section className="py-24 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] text-slate-500 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4 font-display">Your technicians are excellent.</h2>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground font-display">Your systems are the bottleneck.</h2>
            <div className="w-24 h-1 bg-primary mx-auto mt-8" />
            <p className="mt-8 text-muted-foreground font-semibold tracking-wide uppercase text-sm">Four Pillars of Operational Excellence</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {landingConfig.strategicPillars.map((pillar, idx) => {
              const Icon = pillarIcons[idx] || Layout;
              return (
                <motion.div 
                  key={idx}
                  whileHover={{ y: -8 }}
                  className="border border-border rounded-2xl p-6 flex flex-col h-full bg-card/50 backdrop-blur-sm landing-pillars-card group"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-6 transition-all duration-300 ${
                    idx === 0 ? 'bg-blue-100 dark:bg-[#eff6ff] text-blue-600 dark:text-[#2563eb] group-hover:bg-blue-600 dark:group-hover:bg-[#2563eb] group-hover:text-white' :
                    idx === 1 ? 'bg-green-100 dark:bg-[#f0fdf4] text-green-600 dark:text-[#16a34a] group-hover:bg-green-600 dark:group-hover:bg-[#16a34a] group-hover:text-white' :
                    idx === 2 ? 'bg-purple-100 dark:bg-[#faf5ff] text-purple-600 dark:text-[#9333ea] group-hover:bg-purple-600 dark:group-hover:bg-[#9333ea] group-hover:text-white' :
                    'bg-orange-100 dark:bg-[#fff7ed] text-orange-600 dark:text-[#ea580c] group-hover:bg-orange-600 dark:group-hover:bg-[#ea580c] group-hover:text-white'
                  }`}>
                    <Icon className="w-6 h-6 transition-transform duration-300" />
                  </div>
                  <h3 className="font-bold text-foreground mb-2">{pillar.title}</h3>
                  <p className="text-muted-foreground text-sm mb-6 flex-grow leading-relaxed">
                    {pillar.description}
                  </p>
                  <Link to="/signup" className="text-[#2563eb] font-semibold text-sm hover:underline flex items-center gap-1">
                    Deploy Module <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </Link>
                  <div className="mt-6 pt-6 border-t border-border overflow-hidden rounded-lg">
                    <div className="bg-muted rounded-lg h-32 w-full relative overflow-hidden">
                      <LandingImage 
                        src={pillar.icon} 
                        alt={pillar.title} 
                        className="w-full h-full object-cover opacity-80 mix-blend-multiply dark:mix-blend-overlay group-hover:scale-110 transition-transform duration-500 ease-out" 
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-primary/5" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pillars of Operational Excellence Metrics Strip */}
      <section className="py-12 border-y border-border bg-card/50 backdrop-blur-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] text-primary pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-8">
            {/* Metrics Group */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 md:gap-12 w-full lg:w-auto">
              <div className="flex flex-col items-center lg:items-start group">
                <span className="text-4xl md:text-5xl font-black text-primary font-display tracking-tight transition-transform group-hover:scale-110 duration-300">30%</span>
                <span className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mt-2 text-center lg:text-left">Increase in Ticket Value</span>
              </div>
              <div className="flex flex-col items-center lg:items-start group">
                <span className="text-4xl md:text-5xl font-black text-primary font-display tracking-tight transition-transform group-hover:scale-110 duration-300">Zero</span>
                <span className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mt-2 text-center lg:text-left">Compliance Fines</span>
              </div>
              <div className="flex flex-col items-center lg:items-start group">
                <span className="text-4xl md:text-5xl font-black text-primary font-display tracking-tight transition-transform group-hover:scale-110 duration-300">2hrs</span>
                <span className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mt-2 text-center lg:text-left">Saved Per Job</span>
              </div>
            </div>

            {/* Vertical Divider (Desktop Only) */}
            <div className="hidden lg:block w-px h-16 bg-border/40" />

            {/* Badges Group */}
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-10">
              {/* ASHRAE */}
              <div className="flex items-center gap-2 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-default">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-[#1a3a5c] flex items-center justify-center">
                  <span className="text-slate-600 dark:text-white text-[5px] font-black leading-none text-center">ASHRAE</span>
                </div>
                <span className="font-black text-foreground text-sm tracking-tight">ASHRAE</span>
              </div>
              {/* NIST */}
              <div className="flex items-center gap-2 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-default">
                <span className="font-black text-foreground text-sm tracking-tight">NIST</span>
                <Shield className="w-5 h-5 text-emerald-500 fill-emerald-500/20" />
              </div>
              {/* AES-256 */}
              <div className="flex items-center gap-1 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-default">
                <div className="w-7 h-7 rounded-full bg-teal-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-teal-500" />
                </div>
                <span className="font-bold text-foreground text-xs">AES 256</span>
              </div>
              {/* GDPR */}
              <div className="flex items-center gap-1 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-default">
                <div className="w-7 h-7 rounded-full bg-blue-500/10 border-2 border-blue-400 flex items-center justify-center">
                  <span className="text-blue-500 text-[7px] font-bold">EU</span>
                </div>
                <span className="font-bold text-foreground text-xs">GDPR</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-muted/30 relative">
        <div className="max-w-[1024px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-[30px] font-bold text-foreground font-display">Transparent Pricing for Every Stage</h2>
          </div>

          <div className="flex items-center justify-center gap-6">
            {landingConfig.pricing.map((plan, idx) => (
              <div
                key={idx}
                className={`flex flex-col rounded-2xl border border-border bg-card ${
                  plan.popular
                    ? "w-[320px] lg:w-[352px] shadow-lg"
                    : "w-[320px] lg:w-[352px] hover:shadow-lg"
                }`}
              >
                {plan.popular && (
                  <div className="bg-primary px-4 py-2 rounded-t-2xl text-center">
                    <span className="text-primary-foreground text-[12px] font-bold tracking-wider uppercase">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="p-8 flex flex-col flex-grow">
                  <div className="mb-6 text-center">
                    <h3 className="text-[20px] font-bold text-foreground mb-2 font-display">
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-[48px] font-bold text-foreground font-display leading-none">
                        {plan.price}
                      </span>
                    </div>
                    <p className="text-[14px] text-muted-foreground mt-2">{plan.period}</p>
                    <p className="text-[14px] text-muted-foreground mt-2">{plan.description}</p>
                  </div>

                  <ul className="space-y-4 mb-8 flex-grow">
                    {plan.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-center gap-2 text-[14px] text-muted-foreground">
                        <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke={plan.popular ? "var(--primary)" : "currentColor"} strokeWidth="2"/>
                          <path d="m9 12 2 2 4-4" stroke={plan.popular ? "var(--primary)" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {plan.popular && (
                    <Link
                      to={plan.link}
                      className="block w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground text-[16px] font-bold rounded-lg text-center transition-all"
                    >
                      {plan.cta}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-foreground text-center mb-12 font-display">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="space-y-4">
            {landingConfig.faq.map((item, idx) => (
              <AccordionItem 
                key={idx} 
                value={`item-${idx}`}
                className="bg-card rounded-xl border border-border overflow-hidden px-4 transition-all duration-200 hover:shadow-lg hover:border-primary/20"
              >
                <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline py-6 px-2">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-6 px-2">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-24 md:py-32 overflow-hidden border-t border-border group">
        <div className="absolute inset-0 z-0">
          <LandingImage 
            src="/assets/landing/hvac_office_team.jpg" 
            alt="ThermoNeural Team" 
            className="w-full h-full object-cover opacity-20 transition-transform duration-[5s] group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/85 to-background/95" />
        </div>
        
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl font-black text-foreground mb-8 tracking-tight leading-[1.1] font-display">
              Equip your fleet with <br className="hidden sm:block" />
              <span className="text-primary">Decision Intelligence</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
              Join the growing number of HVAC&R contractors who are scaling their businesses with ThermoNeural's operational OS.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-7 rounded-full text-lg font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all group"
              >
                Get Started Now
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="glass-button-dark px-8 py-7 rounded-full text-lg font-semibold shadow-xl shadow-foreground/10 hover:scale-105 transition-all group"
              >
                <Play className="mr-2 w-5 h-5 fill-current" />
                Watch Strategy Video
              </Button>
            </div>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-xs font-bold text-muted-foreground uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-primary" />
                No credit card
              </div>
              <div className="flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-primary" />
                14-day full access
              </div>
              <div className="flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-primary" />
                Live in 5 mins
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mobile Sticky CTA */}
      <div className={`fixed bottom-6 left-4 right-4 z-40 md:hidden transition-all duration-300 transform ${showMobileCta ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
        <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-14 rounded-xl shadow-2xl text-lg font-bold">
          <Link to="/signup">Start Free Trial</Link>
        </Button>
      </div>
    </PublicPageShell>
  );
}
