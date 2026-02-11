import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Zap, Play, Clock, CheckCircle, BarChart, Building, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { metrics } from "@/config/metrics";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
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

export function HeroSection() {
  return (
    <section className="relative pt-24 pb-20 lg:pt-32 lg:pb-28 overflow-hidden px-4">
      {/* Clean Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background to-background/95 -z-20" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-[100px] -z-10" />

      <div className="max-w-6xl mx-auto text-center">
        <motion.div
          initial="initial"
          animate="animate"
          variants={staggerContainer}
          className="flex flex-col items-center"
        >
          <motion.div variants={fadeInUp}>
            <Badge
              variant="outline"
              className="px-4 py-1.5 rounded-full border-primary/30 bg-primary/5 text-primary mb-6"
            >
              <Zap className="w-3 h-3 mr-2" />
              <span className="font-medium text-xs">
                Trusted by {metrics.users.totalEngineers} HVAC Engineers Worldwide
              </span>
            </Badge>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6 max-w-5xl"
          >
            Transform Your HVAC&R Workflow with
            <span className="text-primary"> AI‑Powered Precision</span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed"
          >
            Professional‑grade thermodynamic calculations that save engineers <strong>significant time</strong>, boost accuracy, and deliver client‑ready reports instantly.
          </motion.p>

          {/* Key Metrics */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-wrap justify-center gap-6 md:gap-10 mb-12"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-success" />
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold text-foreground">{metrics.performance.timeSavings.value}</div>
                <div className="text-sm text-muted-foreground">Time reduction</div>
                <div className="text-xs text-muted-foreground/70 mt-1">{metrics.performance.timeSavings.qualifier}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold text-foreground">{metrics.performance.accuracy.value}</div>
                <div className="text-sm text-muted-foreground">Calculation accuracy</div>
                <div className="text-xs text-muted-foreground/70 mt-1">{metrics.performance.accuracy.qualifier}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-highlight/10 flex items-center justify-center">
                <BarChart className="h-5 w-5 text-highlight" />
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold text-foreground">{metrics.performance.reportsGenerated.value}</div>
                <div className="text-sm text-muted-foreground">Reports generated</div>
                <div className="text-xs text-muted-foreground/70 mt-1">{metrics.performance.reportsGenerated.qualifier}</div>
              </div>
            </div>
          </motion.div>
          <motion.p
            variants={fadeInUp}
            className="text-xs text-muted-foreground -mt-6 mb-10"
          >
            {metrics.meta.asOfLabel}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
          >
            <Link to="/signup" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto h-12 px-8 rounded-lg font-medium text-base bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
              >
                Start Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/#interactive-demo" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto h-12 px-8 rounded-lg font-medium text-base"
              >
                <Play className="mr-2 h-4 w-4" />
                Explore Interactive Demo
              </Button>
            </Link>
            <Link to="/pricing" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="ghost"
                className="w-full sm:w-auto h-12 px-8 rounded-lg font-medium text-base"
              >
                See Pricing
              </Button>
            </Link>
          </motion.div>

          {/* Social Proof */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8"
          >
            <div className="inline-flex items-center gap-2 bg-success/10 text-success px-4 py-2 rounded-full text-sm font-medium">
              <CheckCircle className="h-3 w-3" />
              Trusted by {metrics.users.totalEngineers} HVAC engineers
            </div>
          </motion.div>

          <motion.p
            variants={fadeInUp}
            className="text-sm text-muted-foreground mt-8"
          >
            No credit card required • Cancel anytime
          </motion.p>

          {/* Industry Standards */}
          <motion.div
            variants={fadeInUp}
            className="mt-12 pt-8 border-t border-border/50 w-full max-w-3xl"
          >
            <p className="text-sm text-muted-foreground mb-6">Standards & References</p>
            <div className="flex justify-center gap-6">
              {[
                { icon: Building, ...metrics.industryStandards.ashrae },
                { icon: Shield, ...metrics.industryStandards.nist },
              ].map((logo, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                  whileHover={{ scale: 1.05 }}
                  className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl bg-card/50 hover:bg-card/80 border border-border/30 hover:border-primary/20 transition-all duration-300 w-48"
                >
                  <logo.icon className="h-8 w-8 text-muted-foreground" />
                  <div className="text-center">
                    <div className="font-semibold text-foreground text-sm">{logo.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">{logo.description}</div>
                  </div>
                </motion.div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Standards referenced for calculation validation.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
