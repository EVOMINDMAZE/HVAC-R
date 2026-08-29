import { motion } from "framer-motion";
import { Shield, Users, Zap } from "lucide-react";
import { ArrowRight, BadgeCheck } from "lucide-react";

import { PublicPageShell } from "@/components/public/PublicPageShell";
import { SEO } from "@/components/SEO";
import { BlueprintGrid } from "@/components/ui/BlueprintGrid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MeasurementLabel } from "@/components/ui/MeasurementLabel";
import { SectionNumber } from "@/components/ui/SectionNumber";
import { BRANDING_TITLE } from "@/config/branding";

const values = [
  {
    icon: Users,
    title: "Community",
    description:
      "We believe in the power of shared knowledge. Connect with a network of top-tier HVAC professionals to learn, collaborate, and grow together.",
  },
  {
    icon: Zap,
    title: "Automation",
    description:
      "Replace manual busywork with streamlined workflows. From dispatch to engineering calculations, we automate the repetitive so you can focus on scaling.",
  },
  {
    icon: Shield,
    title: "Professionalism",
    description:
      "Elevate your brand. We provide the tools, templates, and operational standards to deliver dependable, professional service that builds lasting trust.",
  },
];

export function About() {
  return (
    <PublicPageShell className="bg-transparent" mainId="about-main">
      <SEO
        title="About"
        description="Learn about ThermoNeural's mission to scale HVAC businesses through our comprehensive Precision Engineering Hub."
      />

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 md:pt-40 md:pb-32 lg:pt-48 lg:pb-40 overflow-hidden">
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
            <div className="relative">
              <SectionNumber number="01" className="top-0 -left-4 md:-left-8" />
            </div>
            <motion.p
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mt-8 md:mt-12"
            >
              About ThermoNeural
            </motion.p>
            <motion.h1
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="mt-6 text-4xl md:text-5xl lg:text-[56px] font-display font-black tracking-tight leading-[1.05] text-white max-w-4xl"
            >
              The definitive operating system for scaling modern HVAC businesses.
            </motion.h1>
            <motion.p
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="mt-8 text-lg md:text-xl text-gray-300 max-w-3xl leading-relaxed"
            >
              ThermoNeural is built for ambitious contractors who want to grow predictably. We provide a complete "Precision Engineering Hub" that combines engineering precision with operational excellence, freeing you from the overhead of scattered tools.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="relative px-4 py-24 md:py-32 bg-secondary/30 overflow-hidden">
        <div className="max-w-5xl mx-auto relative">
          <SectionNumber number="02" className="top-0 -left-4 md:-left-8" />
          <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mt-8 md:mt-12 mb-12">
            Our mission & vision
          </p>
          <div className="grid gap-8 md:grid-cols-2">
            <Card className="bg-card border-border/60 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="relative z-10">
                <CardTitle className="text-3xl md:text-4xl font-display font-bold tracking-tight">Our mission</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 text-muted-foreground text-lg leading-relaxed">
                Equip HVAC businesses with a complete operational platform—from lead generation to engineering precision—enabling them to scale profitably and predictably.
              </CardContent>
            </Card>
            <Card className="bg-card border-border/60 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="relative z-10">
                <CardTitle className="text-3xl md:text-4xl font-display font-bold tracking-tight">Our vision</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 text-muted-foreground text-lg leading-relaxed">
                A future where every HVAC business operates with industrial precision and unparalleled efficiency, supported by a thriving community of professionals.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="relative px-4 py-24 md:py-32 bg-transparent overflow-hidden">
        <div className="max-w-5xl mx-auto relative">
          <SectionNumber number="03" className="top-0 -left-4 md:-left-8" />
          <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mt-8 md:mt-12 mb-12">
            What we believe
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {values.map((value) => (
              <Card
                key={value.title}
                className="bg-card border-primary/30 relative overflow-hidden group cursor-pointer"
                style={{
                  borderColor: "var(--card-interactive-border)",
                  transform: "var(--card-interactive-transform)",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center gap-3 text-xl md:text-2xl font-display font-semibold">
                    <value.icon className="h-6 w-6 text-primary" />
                    {value.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10 text-muted-foreground text-base md:text-lg leading-relaxed">
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
              We partner with ambitious HVAC contractors to transform their operations and accelerate growth. Reach out to see how ThermoNeural can help scale your business.
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
                className="px-8 py-7 rounded-full text-lg font-semibold shadow-xl hover:scale-105 transition-all group border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50"
              >
                <a href="/contact">
                  Schedule a Demo
                </a>
              </Button>
            </div>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 md:gap-10">
              <MeasurementLabel className="text-primary">
                <BadgeCheck className="w-4 h-4 inline mr-1" />
                No commitment
              </MeasurementLabel>
              <MeasurementLabel className="text-primary">
                <BadgeCheck className="w-4 h-4 inline mr-1" />
                Free consultation
              </MeasurementLabel>
              <MeasurementLabel className="text-primary">
                <BadgeCheck className="w-4 h-4 inline mr-1" />
                Response in 24hrs
              </MeasurementLabel>
            </div>
          </motion.div>
        </div>
      </section>
    </PublicPageShell>
  );
}