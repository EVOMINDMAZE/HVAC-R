import { motion } from "framer-motion";
import { ArrowRight, Zap, Play, Clock, CheckCircle, BarChart, MapPin, Activity } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { metrics } from "@/config/metrics";

const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

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
      className="absolute -top-4 -left-12 z-20 glass-card p-4 rounded-xl border border-white/20 shadow-2xl backdrop-blur-[20px] bg-white/5 w-56"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Dashboard</span>
        <Zap className="w-3 h-3 text-primary" />
      </div>
      <div className="h-20 flex items-end gap-1 px-1">
        {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${h}%` }}
            transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
            className="flex-1 bg-gradient-to-t from-primary/20 to-primary/60 rounded-t-sm"
          />
        ))}
      </div>
      <div className="mt-3 flex justify-between items-center">
        <div className="text-xl font-bold text-white">2.4x</div>
        <div className="text-[8px] text-white/40 text-right leading-tight">Efficiency<br/>Increase</div>
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
      className="absolute top-1/2 -left-20 z-20 glass-card p-4 rounded-xl border border-white/20 shadow-2xl backdrop-blur-[20px] bg-white/5 w-64"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Live Dispatch</span>
        </div>
        <span className="text-[8px] font-bold text-success">Tech 442 → On Route</span>
      </div>
      <div className="relative h-24 bg-white/5 rounded-lg overflow-hidden border border-white/10">
        <div className="absolute inset-0 opacity-20 bg-[url('https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/-74.006,40.7128,12/400x300?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.r_98_f99_f99_f99')] bg-cover" />
        <div className="absolute top-1/2 left-1/4 w-12 h-1 bg-primary/40 rounded-full rotate-45" />
        <MapPin className="absolute top-1/3 left-1/3 w-4 h-4 text-primary fill-primary/20" />
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
      className="absolute bottom-12 -right-8 z-20 glass-card p-4 rounded-xl border border-white/20 shadow-2xl backdrop-blur-[20px] bg-black/20 w-48"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">System Health</span>
        <Activity className="w-3 h-3 text-success" />
      </div>
      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <span className="text-[10px] text-white/60">Fleet Uptime</span>
          <span className="text-sm font-bold text-success">98.2%</span>
        </div>
        <Progress value={98.2} className="h-1 bg-white/10" indicatorClassName="bg-success" />
      </div>
    </motion.div>
  );
}

export function HeroSection() {
  return (
    <section className="relative pt-28 pb-24 lg:pt-36 lg:pb-32 overflow-hidden px-4">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/98 to-background -z-20" />
      
      {/* Dynamic Background Effects */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[700px] bg-primary/[0.05] rounded-full blur-[140px] -z-10" />
      <div className="absolute top-[20%] left-[10%] w-[600px] h-[500px] bg-highlight/[0.02] rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[400px] bg-success/[0.02] rounded-full blur-[100px] -z-10" />

      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content */}
          <motion.div
            initial="initial"
            animate="animate"
            variants={staggerContainer}
            className="flex flex-col items-start text-left"
          >
            <motion.div variants={fadeInUp}>
              <Badge
                variant="outline"
                className="px-5 py-2 rounded-full border-primary/20 bg-primary/[0.04] text-primary mb-8 hover:bg-primary/[0.08] transition-colors duration-300"
              >
                <Zap className="w-3.5 h-3.5 mr-2" />
                <span className="font-medium text-xs tracking-wide">
                  The Complete HVAC Business Platform
                </span>
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-8 leading-[1.1]"
            >
              The Complete HVAC{" "}
              <span className="text-primary relative inline-block">
                <span className="relative z-10">Business</span>
                <span className="absolute -bottom-2 left-0 right-0 h-3 bg-primary/10 blur-xl rounded-full" />
              </span>{" "}
              in a Box.
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl leading-[1.7]"
            >
              Stop patching together fragmented software. Launch, manage, and scale your operations with a unified business system built for HVAC&R growth.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto mb-12"
            >
              <Link to="/signup" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto h-14 px-10 rounded-xl font-bold text-base bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all duration-300"
                >
                  Get Business in a Box
                  <ArrowRight className="ml-2.5 h-4.5 w-4.5" />
                </Button>
              </Link>
              <Link to="/demo" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto h-14 px-10 rounded-xl font-semibold text-base border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all duration-300"
                >
                  <Play className="mr-2.5 h-4 w-4 fill-current" />
                  See the System in Action
                </Button>
              </Link>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="flex items-center gap-4"
            >
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-background bg-secondary flex items-center justify-center overflow-hidden"
                  >
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`}
                      alt="User avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">500+</span> businesses already joined
              </div>
            </motion.div>
          </motion.div>

          {/* Right Visual (HUD) */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative hidden lg:block"
          >
            <div className="relative z-10 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl bg-slate-900 aspect-[4/3] group">
              {/* Background Image */}
              <img
                src="/assets/landing/hvac_professional_consult.jpg"
                alt="HVAC Professional"
                className="w-full h-full object-cover opacity-60 grayscale-[0.2] transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/80 via-transparent to-primary/10" />
              
              {/* Glass HUD Cards */}
              <DashboardCard />
              <LiveDispatchCard />
              <SystemHealthCard />
            </div>

            {/* Background Glows */}
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-primary/15 rounded-full blur-[100px] -z-10 animate-pulse" />
            <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -z-10" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
