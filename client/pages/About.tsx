import { motion } from "framer-motion";
import { Shield, Target, Users } from "lucide-react";
import { ArrowRight, BadgeCheck } from "lucide-react";

import { PublicPageShell } from "@/components/public/PublicPageShell";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";


const values = [
  {
    icon: Target,
    title: "Precision over noise",
    description:
      "We build tools that reduce ambiguity and help engineers deliver consistent results.",
  },
  {
    icon: Shield,
    title: "Responsible compliance",
    description:
      "Workflows map to real-world standards so reports are audit-ready from day one.",
  },
  {
    icon: Users,
    title: "Built for teams",
    description:
      "Collaboration, review, and traceability are designed into every workflow.",
  },
];

export function About() {
  return (
    <PublicPageShell className="bg-background" mainId="about-main">
      <SEO
        title="About"
        description="Learn about ThermoNeural's mission to modernize HVAC&R, refrigeration, and cryogenic engineering workflows."
      />

      {/* Hero Section */}
      <section className="relative bg-slate-900 dark:bg-[#111827] pt-20 sm:pt-28 pb-16 sm:pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.05] text-primary pointer-events-none" />
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 blur-3xl rounded-full" />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
            }}
          >
            <motion.p
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="text-xs uppercase tracking-[0.2em] text-primary font-semibold"
            >
              About ThermoNeural
            </motion.p>
            <motion.h1
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="mt-4 text-4xl md:text-5xl lg:text-[48px] font-display font-extrabold tracking-tight leading-[1.1] text-white"
            >
              Modern engineering software for HVAC&R, refrigeration, and cryogenics.
            </motion.h1>
            <motion.p
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="mt-6 text-lg text-gray-300 max-w-3xl leading-relaxed"
            >
              ThermoNeural was built for engineers who need accurate calculations, consistent reporting,
              and reliable compliance workflows without the overhead of scattered spreadsheets and
              legacy tools.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="px-4 py-16 bg-secondary/30">
        <div className="max-w-5xl mx-auto grid gap-6 md:grid-cols-2">
          <Card className="bg-card/50 backdrop-blur-sm border-border/60 hover:-translate-y-1 transition-all hover:shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold font-display">Our mission</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Deliver the most trusted HVAC&R and cryogenic analysis platform so engineering teams
              can move faster, stay compliant, and make confident decisions.
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-sm border-border/60 hover:-translate-y-1 transition-all hover:shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold font-display">Our vision</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              A future where every refrigeration system is optimized for performance, safety, and
              environmental impact—with documentation that stands up to any audit.
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Values Section */}
      <section className="px-4 py-16 bg-background">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">What we believe</p>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {values.map((value) => (
              <Card key={value.title} className="bg-card/50 backdrop-blur-sm border-border/60 hover:-translate-y-1 transition-all hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-lg font-display">
                    <value.icon className="h-5 w-5 text-primary" />
                    {value.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {value.description}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-24 md:py-32 overflow-hidden border-t border-border group">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/85 to-background/95" />
        </div>

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-5xl font-black text-foreground mb-8 tracking-tight leading-[1.1] font-display">
              Work with us
            </h2>
            <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
              We partner with contractors, industrial operators, and R&D teams to deliver workflows
              that match how real engineers work. Reach out to see how ThermoNeural can support
              your projects.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-7 rounded-full text-lg font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all group"
              >
                <a href="/contact" className="flex items-center gap-2">
                  Contact our team
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="glass-button-dark px-8 py-7 rounded-full text-lg font-semibold shadow-xl shadow-foreground/10 hover:scale-105 transition-all group"
              >
                <a href="/contact">
                  Schedule a Demo
                </a>
              </Button>
            </div>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-xs font-bold text-muted-foreground uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-primary" />
                No commitment
              </div>
              <div className="flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-primary" />
                Free consultation
              </div>
              <div className="flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-primary" />
                Response in 24hrs
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </PublicPageShell>
  );
}
