import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Target, Award, Heart, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

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

export function About() {
  const stats = [
    { label: "Verified Models", value: "NIST", color: "text-blue-500" },
    { label: "Validations", value: "100%", color: "text-emerald-500" },
    { label: "Global Standard", value: "SI/IP", color: "text-purple-500" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-orange-100 selection:text-orange-900">
      <Header variant="landing" />

      <main className="flex-grow pt-24 px-4 overflow-hidden relative">
        {/* Background Elements */}
        <div className="absolute top-0 inset-x-0 h-[600px] bg-gradient-to-b from-orange-50/50 to-transparent dark:from-orange-900/10 dark:to-transparent pointer-events-none -z-10" />
        <div className="absolute top-[10%] left-[-10%] w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[20%] right-[-10%] w-[500px] h-[500px] bg-red-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto pb-20">
          {/* Hero Section */}
          <motion.div
            className="text-center mb-20 max-w-4xl mx-auto"
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <Badge variant="outline" className="mb-6 border-orange-200 bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800 backdrop-blur-sm">
                Our Mission
              </Badge>
            </motion.div>

            <motion.h1 variants={fadeInUp} className="text-4xl md:text-6xl font-bold tracking-tight mb-8">
              Empowering the World's <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-red-600 to-amber-600">
                Thermodynamic Innovation
              </span>
            </motion.h1>

            <motion.p variants={fadeInUp} className="text-xl text-muted-foreground leading-relaxed">
              We're dedicated to building the most accurate, accessible, and powerful tools for the next generation of HVAC&R engineers.
            </motion.p>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-24 max-w-3xl mx-auto"
          >
            {stats.map((stat, i) => (
              <div key={i} className="text-center p-6 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300">
                <div className={`text-4xl md:text-5xl font-bold mb-2 ${stat.color}`}>{stat.value}</div>
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          {/* Mission & Vision */}
          <section className="mb-24">
            <div className="grid md:grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <Card className="h-full bg-card/80 backdrop-blur-md shadow-lg border-border hover:border-orange-500/30 transition-colors duration-300">
                  <CardHeader>
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mb-4">
                      <Target className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <CardTitle className="text-2xl">Our Mission</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed text-lg">
                      To provide HVAC&R engineers with unmatched tools for thermodynamic calculations. We simplify the complex, ensuring accuracy without compromising on speed or usability.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                <Card className="h-full bg-card/80 backdrop-blur-md shadow-lg border-border hover:border-red-500/30 transition-colors duration-300">
                  <CardHeader>
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mb-4">
                      <Heart className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <CardTitle className="text-2xl">Our Vision</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed text-lg">
                      A future where every refrigeration system is optimized for maximum efficiency and minimal environmental impact, powered by intelligent software.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </section>

          {/* Team Section */}
          <motion.div
            className="mb-24"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-center text-foreground mb-16">
              The Minds Behind ThermoNeural
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: Users, title: "Engineering", desc: "Decades of combined field experience.", color: "orange" },
                { icon: Award, title: "R&D", desc: "Pushing the boundaries of thermodynamic modeling.", color: "red" },
                { icon: Target, title: "Product", desc: "Building intuitive interfaces for complex problems.", color: "amber" }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="group relative"
                >
                  <div className={`absolute inset-0 bg-${item.color}-500/5 rounded-2xl transform rotate-1 group-hover:rotate-2 transition-transform duration-300`} />
                  <Card className="relative h-full bg-card border-border text-center overflow-hidden">
                    <div className={`absolute top-0 inset-x-0 h-1 bg-${item.color}-500/50`} />
                    <CardContent className="p-8">
                      <div className={`w-20 h-20 bg-${item.color}-100 dark:bg-${item.color}-900/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                        <item.icon className={`h-10 w-10 text-${item.color}-600 dark:text-${item.color}-400`} />
                      </div>
                      <h3 className="text-xl font-semibold mb-3">
                        {item.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {item.desc}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Values Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden bg-slate-900 text-white p-8 md:p-16 text-center md:text-left"
          >
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-orange-500/20 to-red-500/20 blur-[100px] pointer-events-none rounded-full" />

            <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-5xl font-bold mb-6">Built on Trust & <br />Precision</h2>
                <p className="text-slate-300 text-lg leading-relaxed mb-8">
                  Our software isn't just a tool; it's a commitment to engineering integrity. We validate every model against NIST standards to ensure your calculations are field-ready.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { title: "Accuracy", desc: "Verified against NIST standards." },
                  { title: "Innovation", desc: "Cutting-edge solver algorithms." },
                  { title: "Sustainability", desc: "Eco-friendly refrigerant focus." },
                  { title: "Community", desc: "Built for engineers, by engineers." }
                ].map((val, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-xl hover:bg-white/10 transition-colors">
                    <h4 className="text-lg font-bold text-orange-400 mb-2">{val.title}</h4>
                    <p className="text-sm text-slate-300">{val.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
