import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { StructuredData } from "@/components/seo/StructuredData";
import { PublicPageShell } from "@/components/public/PublicPageShell";
import { trackMarketingEvent } from "@/lib/marketingAnalytics";
import { landingConfig } from "@/config/metrics";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

const pricing = landingConfig.pricing;
const strategicPillars = landingConfig.strategicPillars;

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
  const [activeTab, setActiveTab] = useState(0);
  const [showMobileCta, setShowMobileCta] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    trackMarketingEvent("landing_view", { section: "hero_b2b" });
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

  // Scroll Spy Logic
  const observerRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: "-20% 0px -20% 0px",
      threshold: 0.5,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = observerRefs.current.indexOf(entry.target as HTMLDivElement);
          if (index !== -1) {
            setActiveTab(index);
          }
        }
      });
    }, options);

    observerRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      observerRefs.current.forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, []);

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const stagger = {
    visible: { transition: { staggerChildren: 0.2 } },
  };

  return (
    <PublicPageShell className="landing-page" mainId="main-content" skipToMain>
      <SEO
        title="ThermoNeural | Scale Your HVAC&R Operations"
        description="The enterprise-grade operating system for HVAC owners. Automate compliance, standardize service, and protect your margins."
      />
      <StructuredData />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-slate-50/50 dark:bg-background">
        {/* Background Asset */}
        <div className="absolute inset-0 z-0">
          <LandingImage
            src="/assets/landing/hero_bg_premium.png"
            alt="Background"
            className="w-full h-full object-cover opacity-40 dark:opacity-30 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-slate-50/80 dark:bg-background/80 z-10" />
        </div>

        <div className="container relative z-20 mx-auto px-4 pt-24 pb-32">
          <div className="grid lg:grid-cols-[1.2fr,0.8fr] gap-16 items-center">

            {/* Hero Content */}
            <motion.div
              initial="hidden"
              animate={isVisible ? "visible" : "hidden"}
              variants={stagger}
              className="max-w-full lg:max-w-xl"
            >
              <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-6 backdrop-blur-sm">
                <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-sm font-medium text-primary">Enterprise-Grade HVAC&R Management</span>
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                className="text-4xl sm:text-7xl lg:text-6xl xl:text-8xl font-black tracking-tighter leading-[1.1] mb-8 text-slate-950 dark:text-foreground excellence-header"
              >Engineering <br /><span className="text-primary">Operations</span> <br />at Scale.
              </motion.h1>

              <motion.p variants={fadeInUp} className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
                Stop trading time for money. Equip your technicians with AI-driven diagnostics, automated compliance, and profit-focused dispatching.
              </motion.p>

              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 h-14 text-lg shadow-[0_0_20px_rgba(var(--primary),0.3)]">
                  <Link to="/signup" onClick={() => trackMarketingEvent("landing_hero_primary_click")}>
                    Start Your Free Trial
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-slate-400 dark:border-border text-foreground hover:bg-slate-100 dark:hover:bg-secondary h-14 text-lg backdrop-blur-md shadow-md transition-all duration-300 active:scale-95"
                ><Link to="/demo" onClick={() => trackMarketingEvent("landing_hero_secondary_click")}>
                    <Play className="w-4 h-4 mr-2 fill-current" />
                    Watch Strategy Video
                  </Link>
                </Button>
              </motion.div>

              <motion.div variants={fadeInUp} className="mt-8 flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-bold text-foreground">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <p>Trusted by {landingConfig.socialProof.contractorCount} <span className="text-xs opacity-70">{landingConfig.socialProof.disclaimer}</span></p>
              </motion.div>
            </motion.div>

            {/* Hero Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotateY: 10 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="relative hidden lg:block pr-8 pb-8"
            >
              <div className="relative z-10 animate-float">
                <LandingImage
                  src="/assets/landing/hero_premium.png"
                  alt="ThermoNeural Command Center"
                  className="rounded-xl shadow-premium border border-slate-200/50 dark:border-border w-full transform hover:scale-[1.01] transition-transform duration-700"
                />

                {/* Floating Elements (CSS Enhanced) */}
                <div className="absolute -top-10 -right-10 p-4 bg-white/95 dark:bg-card/90 backdrop-blur-xl rounded-lg border border-slate-200/80 dark:border-border shadow-premium animate-float-delayed z-20">
                  <div className="flex items-center gap-3 mb-2">
                    <Zap className="w-5 h-5 text-success" />
                    <span className="text-foreground font-medium">Revenue</span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">$12,450</div>
                  <div className="text-xs text-success font-medium">+18% this week</div>
                </div>

                {/* New Halo HUD Cards */}
                <div className="absolute top-1/2 -left-16 p-4 bg-white/95 dark:bg-card/90 backdrop-blur-xl rounded-lg border border-slate-200/80 dark:border-border shadow-premium animate-float z-20 hidden md:block">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                    <span className="text-foreground font-medium text-sm">Live Dispatch</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-[10px] font-bold text-white">T</div>
                      <div className="text-xs text-muted-foreground">Tech #42 <span className="text-primary">→ En Route</span></div>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-8 right-20 p-3 bg-white/95 dark:bg-card/90 backdrop-blur-xl rounded-lg border border-slate-200/80 dark:border-border shadow-premium animate-float-delayed z-20 hidden md:block">
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-primary" />
                    <div className="text-xs font-medium text-foreground">System Health: <span className="text-success">98%</span></div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Glow effect behind visual */}
        {/* Background Glow Removed */}
      </section>

      {/* Problem / Agitation Section */}
      <section className="py-20 bg-background relative border-y border-border/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Your technicians are excellent. <br />
              <span className="text-destructive">Your systems are the bottleneck.</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Manual invoices, lost data, and callback loops are eating your margins.
              It's time to run your business like an engineering firm.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Strategic Core */}
      <section className="py-32 bg-secondary/30 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Four Pillars of Operational Excellence
            </h2>
            <p className="text-lg text-muted-foreground">
              Click through each module to see how we solve your biggest operational challenges.
            </p>
          </div>

          <div className="core-grid">
            {/* Pillar Cards */}
            <div className="core-module-nav">
              {strategicPillars.map((pillar, idx) => (
                <div
                  key={idx}
                  className={`core-module-item ${activeTab === idx ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab(idx);
                    trackMarketingEvent("landing_pillar_click", { section: pillar.title });
                  }}
                >
                  <div className="painpoint-tag mb-4">{pillar.painpoint}</div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">{pillar.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                    {pillar.description}
                  </p>

                  {/* Integrated Media Preview */}
                  <div className="mt-6 mb-4 rounded-xl overflow-hidden border border-border bg-muted/30 aspect-video relative group/media">
                    <LandingImage
                      src={pillar.icon}
                      alt={pillar.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover/media:scale-110"
                    />
                    {/* Technical HUD Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                      <div className="text-xs font-medium text-white/90 drop-shadow-md">
                        {pillar.subtitle}
                      </div>
                      <div className="text-[10px] font-mono text-primary/80 bg-primary/10 px-2 py-0.5 rounded border border-primary/20 backdrop-blur-md hidden md:block">
                        SYS_READY
                      </div>
                    </div>
                  </div>

                  <button className={`text-sm font-semibold uppercase tracking-wider flex items-center gap-2 ${activeTab === idx ? 'text-primary' : 'text-muted-foreground'}`}>
                    Deploy Module <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Right Column: Holographic Viewport (Desktop Only) */}
            <div className="core-viewport group hidden lg:block">
              {strategicPillars.map((pillar, idx) => (
                <LandingImage
                  key={idx}
                  src={pillar.icon}
                  alt={pillar.title}
                  loading="lazy"
                  className={`core-viewport-image ${activeTab === idx ? 'active' : ''}`}
                />
              ))}

              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />

              <div className="core-overlay">
                <div>
                  <h4 className="text-muted-foreground text-sm font-mono mb-2">SYSTEM_STATUS: ONLINE</h4>
                  <h2 className="text-3xl font-bold text-foreground">{strategicPillars[activeTab]?.subtitle}</h2>
                </div>
                <div className="hidden md:block">
                  <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center animate-pulse">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Stats Section */}
      <section className="py-20 bg-background border-y border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center divide-y md:divide-y-0 md:divide-x divide-border">
            {landingConfig.roiStats.map((stat, idx) => (
              <div key={idx} className="p-4">
                <div className="text-4xl md:text-5xl font-bold text-foreground mb-2">{stat.value}</div>
                <div className="text-primary font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-6 opacity-70">
            *{landingConfig.roiStats[0].disclaimer}. Individual results may vary.
          </p>
        </div>
      </section>

      {/* Trust Badges Section */}
      <section className="py-12 bg-secondary/30 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12">
            {landingConfig.trustBadges.map((badge, idx) => (
              <div key={idx} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background/50 border border-border">
                {badge.status === 'active' ? (
                  <BadgeCheck className="w-5 h-5 text-success" />
                ) : (
                  <Clock className="w-5 h-5 text-yellow-500" />
                )}
                <div className="text-sm">
                  <span className="font-semibold text-foreground">{badge.name}</span>
                  <span className="hidden md:inline text-muted-foreground ml-1">• {badge.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <h2 className="text-3xl font-bold text-foreground mb-4">Transparent Pricing for Every Stage</h2>
            <p className="text-muted-foreground">Start free. Upgrade as you scale your fleet.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricing.map((plan) => (
              <div
                key={plan.name}
                className={`relative p-8 rounded-2xl border ${plan.popular ? 'border-primary shadow-2xl scale-105 z-10 bg-card' : 'border-border bg-muted/30'}`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wide">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-bold text-foreground mb-2">{plan.name}</h3>
                <div className="flex items-baseline mb-2">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground ml-2">{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center text-foreground/80">
                      <CheckCircle2 className={`w-5 h-5 mr-3 ${plan.popular ? 'text-primary' : 'text-muted-foreground'}`} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  className={`w-full h-12 ${plan.popular ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'bg-foreground hover:bg-foreground/90 text-background'}`}
                >
                  <Link to={plan.link}>{plan.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <h2 className="text-3xl font-bold text-foreground mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground">Everything you need to know about ThermoNeural.</p>
          </motion.div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
              {landingConfig.faq.map((item, idx) => (
                <AccordionItem key={idx} value={`item-${idx}`}>
                  <AccordionTrigger
                    className="text-left text-foreground hover:text-primary"
                    onClick={() => trackMarketingEvent("landing_faq_expand", { section: `faq_${idx}` })}
                  >
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Final CTA - Premium Upgrade */}
      <section className="py-24 md:py-40 bg-background relative overflow-hidden border-t border-border group/cta">
        {/* Layered Background System */}
        <div className="absolute inset-0 z-0">
          <LandingImage
            src="/assets/landing/hvac_office_team.jpg"
            alt=""
            loading="lazy"
            className="w-full h-full object-cover scale-105 group-hover/cta:scale-100 transition-transform duration-[3s] opacity-30 dark:opacity-50 grayscale hover:grayscale-0 transition-all"
          />
          {/* Layer 1: Glassmorphism base */}
          <div className="absolute inset-0 bg-background/90 backdrop-blur-[3px]" />

          {/* Layer 2: Removed Radial Vignette */}
          <div className="absolute inset-0 bg-background/10" />

          {/* Layer 3: Removed Dynamic Glows */}
        </div>

        <div className="container relative z-10 mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              whileInView={{ scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-8 backdrop-blur-md"
            >
              <Zap className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-xs font-bold tracking-widest uppercase text-primary">Strategic Partnership</span>
            </motion.div>

            <h2 className="text-4xl sm:text-6xl md:text-7xl font-black text-foreground mb-10 tracking-tighter leading-[0.95] drop-shadow-2xl">
              Build a business that <br />
              <span className="text-primary italic relative">
                runs without you
                <svg className="absolute -bottom-2 left-0 w-full h-3 text-primary/30" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 25 0, 50 5 T 100 5" fill="none" stroke="currentColor" strokeWidth="4" />
                </svg>
              </span>
            </h2>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-12">
              <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-xl px-12 h-20 shadow-[0_20px_50px_rgba(var(--primary),0.3)] rounded-2xl group/btn overflow-hidden relative">
                <Link to="/signup" onClick={() => trackMarketingEvent("landing_pricing_cta_click")}>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                  <span className="relative flex items-center gap-3">
                    Systemize Your Business
                    <ArrowRight className="w-6 h-6 group-hover/btn:translate-x-1 transition-transform" />
                  </span>
                </Link>
              </Button>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground/80 font-medium"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                14-day full access
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                Deploy in 5 minutes
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Mobile Sticky CTA */}
      <div className={`landing-mobile-cta ${showMobileCta ? 'is-visible' : ''}`}>
        <div className="landing-mobile-cta-inner">
          <Button asChild className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground h-12">
            <Link to="/signup" onClick={() => trackMarketingEvent("landing_mobile_cta_click")}>
              Start Free Trial
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </PublicPageShell>
  );
}