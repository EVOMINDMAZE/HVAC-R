import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Zap, Play, CheckCircle, BarChart, MapPin, Activity } from "lucide-react";
import { useRef } from "react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { hudFadeIn, staggerChildren, technicalGlow, technicalPulse } from "@/lib/animations/landingVariants";
import { trackMarketingEvent } from "@/lib/marketingAnalytics";
import { SectionNumber } from "@/components/ui/SectionNumber";

const float: any = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

function DashboardCard() {
  return (
    <motion.div 
      variants={float}
      animate="animate"
      className="absolute -top-4 -left-12 z-20 glass-card hud-border hud-corner-accents p-4 rounded-xl shadow-2xl w-56 overflow-hidden"
    >
      <div className="corner-bottom-left" />
      <div className="corner-bottom-right" />
      <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
        <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] font-display">System.Metrics</span>
        <motion.div variants={technicalPulse} animate="animate">
          <Zap className="w-3 h-3 text-primary" />
        </motion.div>
      </div>
      <div className="h-20 flex items-end gap-1.5 px-1">
        {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${h}%` }}
            transition={{ delay: 0.5 + i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 bg-primary/40 rounded-t-[1px] relative group"
          >
            <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        ))}
      </div>
      <div className="mt-4 flex justify-between items-end">
        <div>
          <div className="text-[8px] text-white/40 uppercase tracking-wider font-display mb-0.5">Efficiency</div>
          <div className="text-xl font-bold text-white font-display tracking-tighter">2.4<span className="text-primary text-xs ml-0.5">X</span></div>
        </div>
        <div className="text-[8px] text-primary/60 font-mono text-right leading-tight">STABLE_FLOW<br/>NODE_04</div>
      </div>
    </motion.div>
  );
}

function LiveDispatchCard() {
  return (
    <motion.div 
      variants={float}
      animate="animate"
      transition={{ delay: 0.5 }}
      className="absolute top-1/2 -left-20 z-20 glass-card hud-border hud-corner-accents p-4 rounded-xl shadow-2xl w-64 overflow-hidden"
    >
      <div className="corner-bottom-left" />
      <div className="corner-bottom-right" />
      <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] font-display">Live.Dispatch</span>
        </div>
        <span className="text-[8px] font-bold text-success font-mono">ID: 442</span>
      </div>
      <div className="relative h-24 bg-black/40 rounded-lg overflow-hidden border border-white/10 group">
        <div className="absolute inset-0 opacity-30 bg-[url('https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/-74.006,40.7128,12/400x300?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.r_98_f99_f99_f99')] bg-cover grayscale" />
        <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
        {/* HUD Crosshair */}
        <div className="absolute top-1/2 left-1/4 w-8 h-[1px] bg-primary/20" />
        <div className="absolute top-1/2 left-1/4 w-[1px] h-8 bg-primary/20 -translate-y-1/2" />
        <MapPin className="absolute top-1/3 left-1/3 w-4 h-4 text-primary fill-primary/20 animate-bounce" />
        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 rounded text-[7px] text-white/60 font-mono">
          40.7128° N, 74.0060° W
        </div>
      </div>
    </motion.div>
  );
}

function SystemHealthCard() {
  return (
    <motion.div 
      variants={float}
      animate="animate"
      transition={{ delay: 1 }}
      className="absolute bottom-12 -right-8 z-20 glass-card hud-border hud-corner-accents p-4 rounded-xl shadow-2xl w-48 overflow-hidden"
    >
      <div className="corner-bottom-left" />
      <div className="corner-bottom-right" />
      <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
        <span className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] font-display">Fleet.Status</span>
        <Activity className="w-3 h-3 text-success" />
      </div>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <div className="flex justify-between items-end">
            <span className="text-[9px] text-white/40 uppercase tracking-wider font-display">Uptime</span>
            <span className="text-sm font-bold text-success font-display">98.2<span className="text-[10px] ml-0.5">%</span></span>
          </div>
          <Progress value={98.2} className="h-1 bg-white/5" indicatorClassName="bg-success shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
        </div>
        <div className="flex justify-between items-center text-[8px] font-mono text-white/30">
          <span>SECURE_LINK</span>
          <span className="text-success/60">ACTIVE</span>
        </div>
      </div>
    </motion.div>
  );
}

export function HeroSection() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 5]);

  return (
    <section ref={containerRef} className="relative pt-28 pb-24 lg:pt-36 lg:pb-32 overflow-hidden px-4">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/98 to-background -z-20" />
      
      {/* Ambient HUD Grid Background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] text-primary -z-10" />
      
      {/* Dynamic Background Effects */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[700px] bg-primary/[0.05] rounded-full blur-[140px] -z-10" />
      <div className="absolute top-[20%] left-[10%] w-[600px] h-[500px] bg-highlight/[0.02] rounded-full blur-[120px] -z-10" />

      <div className="max-w-7xl mx-auto">
        <SectionNumber number="01" className="absolute -top-8 -left-4 lg:-top-12 lg:-left-8" />
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerChildren}
            className="flex flex-col items-start text-left"
          >
            <motion.div variants={hudFadeIn}>
              <Badge
                variant="outline"
                className="px-5 py-2 rounded-full border-primary/20 bg-primary/[0.04] text-primary mb-8 hover:bg-primary/[0.08] transition-colors duration-300 font-display"
              >
                <motion.div variants={technicalPulse} animate="animate">
                  <Zap className="w-3.5 h-3.5 mr-2" />
                </motion.div>
                <span className="font-medium text-[10px] tracking-[0.15em] uppercase">
                  Technical Excellence / 2024.v1
                </span>
              </Badge>
            </motion.div>

            <motion.h1
              variants={hudFadeIn}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-8 leading-[1.05] font-display"
            >
              The Complete HVAC{" "}
              <span className="text-primary relative inline-block text-glow">
                <span className="relative z-10">Business</span>
                <span className="absolute -bottom-2 left-0 right-0 h-3 bg-primary/10 blur-xl rounded-full" />
              </span>{" "}
              in a Box.
            </motion.h1>

            <motion.p
              variants={hudFadeIn}
              className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl leading-[1.7]"
            >
              Stop patching together fragmented software. Launch, manage, and scale your operations with a unified business system built for HVAC&R growth.
            </motion.p>

            <motion.div
              variants={hudFadeIn}
              className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto mb-12"
            >
              <Link 
                to="/signup?plan=business" 
                className="w-full sm:w-auto"
                onClick={() => trackMarketingEvent("landing_hero_primary_click", { section: "hero", destination: "/signup" })}
              >
                <Button
                  size="lg"
                  className="w-full sm:w-auto h-14 px-10 rounded-xl font-bold text-base bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all duration-300 font-display uppercase tracking-wider cyan-glow"
                >
                  Launch System
                  <ArrowRight className="ml-2.5 h-4.5 w-4.5" />
                </Button>
              </Link>
              <Link 
                to="/demo" 
                className="w-full sm:w-auto"
                onClick={() => trackMarketingEvent("landing_hero_secondary_click", { section: "hero", destination: "/demo" })}
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto h-14 px-10 rounded-xl font-semibold text-base border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all duration-300 font-display uppercase tracking-wider"
                >
                  <Play className="mr-2.5 h-4 w-4 fill-current" />
                  Visual Demo
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Right Visual (Dashboard Screenshot) */}
          <motion.div
            initial={{ opacity: 0, x: 40, filter: "blur(10px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ y: y1, rotate }}
            className="relative hidden lg:block"
          >
            <motion.div
              style={{ y: y2 }}
              className="relative z-10"
            >
              <motion.img
                src="/assets/landing/admin-dashboard-hero.png"
                alt="Admin Dashboard Preview"
                className="w-auto h-auto max-w-[600px] max-h-[450px] rounded-2xl shadow-2xl rotate-[-8deg] group-hover:rotate-[-5deg] transition-transform duration-500"
                style={{ transformOrigin: 'center center' }}
              />
            </motion.div>

            {/* Background Glows */}
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-primary/15 rounded-full blur-[100px] -z-10 animate-pulse" />
            <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -z-10" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
