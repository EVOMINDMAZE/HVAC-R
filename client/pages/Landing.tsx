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
    <div className="min-h-screen w-full overflow-x-hidden overscroll-none bg-[#111827] text-slate-900 selection:bg-blue-100 selection:text-blue-900 flex flex-col">
      <div className="bg-white flex-grow flex flex-col">
        <Header variant="landing" />

        {/* Warm/Thermo Background */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-100/50 blur-[100px] animate-pulse" />
          <div className="absolute top-[20%] right-[-5%] w-[30%] h-[30%] rounded-full bg-red-100/40 blur-[100px] animate-pulse delay-1000" />
          <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-indigo-100/30 blur-[100px] animate-pulse delay-2000" />
        </div>

        <div className="relative z-10 flex-grow">
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
                  <Zap className="w-3 h-3 mr-2 fill-blue-500 text-blue-600" />
                  <span className="text-blue-700">Professional Thermal Engineering Intelligence</span>
                </Badge>
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                className="text-5xl md:text-7xl font-bold text-slate-900 mb-8 tracking-tight"
              >
                Advanced Refrigeration
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-red-600 bg-clip-text text-transparent drop-shadow-sm font-display">
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
                    className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-6 h-auto shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all hover:-translate-y-1"
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
                  color: "text-blue-600",
                  bg: "bg-blue-100",
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



          {/* CTA Section */}
          <section className="max-w-7xl mx-auto px-4 pt-32 pb-0 text-center">
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
                  <Link to="/contact">
                    <Button
                      size="lg"
                      variant="outline"
                      className="text-lg px-8 py-6 h-auto bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white hover:border-white transition-all"
                    >
                      Contact Sales
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </section>
        </div>


        <Footer />
      </div>
    </div>
  );
}
