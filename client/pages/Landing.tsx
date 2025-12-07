import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SupabaseStatus } from "@/components/SupabaseStatus";
import {
  ArrowRight,
  Calculator,
  Users,
  Shield,
  TrendingUp,
  CheckCircle,
  Zap,
  Star,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export function Landing() {
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-orange-100 selection:text-orange-900">
      <Header variant="landing" />

      {/* Warm/Thermo Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-orange-100/50 blur-[100px] animate-pulse" />
        <div className="absolute top-[20%] right-[-5%] w-[30%] h-[30%] rounded-full bg-amber-100/40 blur-[100px] animate-pulse delay-1000" />
        <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-red-100/30 blur-[100px] animate-pulse delay-2000" />
      </div>

      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 pt-4">
          <SupabaseStatus />
        </div>

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 py-20 lg:py-32">
          <motion.div
            initial="initial"
            animate="animate"
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.div variants={fadeInUp}>
              <Badge
                variant="secondary"
              >
                <Zap className="w-3 h-3 mr-2 fill-orange-500 text-orange-600" />
                <span className="text-orange-700">Professional Thermal Engineering Intelligence</span>
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-5xl md:text-7xl font-bold text-slate-900 mb-8 tracking-tight"
            >
              Advanced Refrigeration
              <br />
              <span className="bg-gradient-to-r from-orange-600 via-red-600 to-amber-600 bg-clip-text text-transparent drop-shadow-sm">
                Cycle Analysis
              </span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed"
            >
              Professional-grade thermodynamic calculations for HVAC&R engineers.
              Analyze standard cycles, compare refrigerants, and optimize cascade
              systems with precision.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link to="/signup">
                <Button
                  size="lg"
                  className="bg-slate-900 hover:bg-slate-800 text-white text-lg px-8 py-6 h-auto shadow-lg shadow-slate-900/10 hover:shadow-slate-900/20 transition-all hover:-translate-y-1"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 h-auto border-slate-200 hover:bg-slate-50 hover:text-slate-900 backdrop-blur-sm transition-all hover:-translate-y-1"
              >
                View Demo
              </Button>
            </motion.div>
          </motion.div>

          {/* Feature Cards */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="grid md:grid-cols-3 gap-8 mb-32"
          >
            {[
              {
                title: "Standard Cycle Analysis",
                desc: "Calculate COP, refrigeration effect, and state points for standard vapor compression cycles.",
                icon: Calculator,
                color: "text-slate-700",
                bg: "bg-slate-100",
              },
              {
                title: "Refrigerant Comparison",
                desc: "Compare performance metrics across multiple refrigerants to optimize your system design.",
                icon: TrendingUp,
                color: "text-orange-600",
                bg: "bg-orange-100",
              },
              {
                title: "Cascade Systems",
                desc: "Analyze complex two-stage cascade refrigeration systems for ultra-low temperature applications.",
                icon: Shield,
                color: "text-red-600",
                bg: "bg-red-100",
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className="group relative bg-white/70 backdrop-blur-md border-slate-200/60 hover:border-blue-300/50 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-500 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardHeader className="text-center relative z-10">
                  <div
                    className={`w-16 h-16 ${feature.bg} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500`}
                  >
                    <feature.icon className={`h-8 w-8 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-xl text-slate-900 font-semibold">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center relative z-10">
                  <p className="text-slate-600 leading-relaxed">
                    {feature.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        </section>

        {/* Social Proof / Trusted By */}
        <section className="border-y border-slate-200 bg-white/50 backdrop-blur-sm py-16">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-8">
              Trusted by engineers at innovative companies
            </p>
            <div className="flex flex-wrap justify-center gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              {/* Placeholders for logos */}
              <div className="text-2xl font-bold text-slate-400 flex items-center gap-2">
                <div className="w-8 h-8 bg-slate-400 rounded-full" />
                TechCool
              </div>
              <div className="text-2xl font-bold text-slate-400 flex items-center gap-2">
                <div className="w-8 h-8 bg-slate-400 rounded-full" />
                FrostSystems
              </div>
              <div className="text-2xl font-bold text-slate-400 flex items-center gap-2">
                <div className="w-8 h-8 bg-slate-400 rounded-full" />
                ArcticFlow
              </div>
              <div className="text-2xl font-bold text-slate-400 flex items-center gap-2">
                <div className="w-8 h-8 bg-slate-400 rounded-full" />
                ThermaPro
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-32 relative">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
                Why Choose ThermoNeural?
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                Built by engineers, for engineers. Get accurate results with
                industry-standard calculations.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: CheckCircle,
                  title: "Accurate Calculations",
                  description:
                    "Industry-standard thermodynamic property calculations",
                },
                {
                  icon: Users,
                  title: "Save Projects",
                  description: "Store and organize your calculation history",
                },
                {
                  icon: TrendingUp,
                  title: "Performance Insights",
                  description: "Compare and optimize system performance",
                },
                {
                  icon: Shield,
                  title: "Professional Grade",
                  description: "Trusted by HVAC&R professionals worldwide",
                },
              ].map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center p-6 rounded-2xl hover:bg-white/50 hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <benefit.icon className="h-8 w-8 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">
                    {benefit.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {benefit.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center opacity-10" />
          <div className="max-w-7xl mx-auto px-4 relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
              Loved by Engineering Teams
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[1, 2, 3].map((_, i) => (
                <Card
                  key={i}
                  className="bg-slate-800/50 border-slate-700 backdrop-blur-sm"
                >
                  <CardContent className="pt-6">
                    <div className="flex gap-1 mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className="w-4 h-4 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    </div>
                    <p className="text-slate-300 mb-6 italic">
                      "This tool has completely transformed how we approach system
                      design. The cascade cycle analysis is a game changer."
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-600" />
                      <div>
                        <p className="font-semibold text-white">Sarah Chen</p>
                        <p className="text-sm text-slate-400">
                          Senior HVAC Engineer
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-7xl mx-auto px-4 py-32 text-center">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            className="bg-slate-900 rounded-3xl p-12 md:p-24 text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to Start Calculating?
              </h2>
              <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
                Join thousands of engineers using ThermoNeural for their
                refrigeration calculations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/signup">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="text-lg px-8 py-6 h-auto font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
                  >
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 py-6 h-auto bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white hover:border-white transition-all"
                >
                  Contact Sales
                </Button>
              </div>
            </div>
          </motion.div>
        </section>

        <Footer />
      </div>
    </div>
  );
}
