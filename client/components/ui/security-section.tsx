import { motion } from "framer-motion";
import { Shield, Lock, CheckCircle, FileCheck, Globe, Server, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const certifications = [
  {
    icon: Clock,
    title: "SOC 2 Type II",
    description: "Certification audit scheduled for Q2 2025. Security controls implementation in progress.",
    status: "In Progress",
    statusColor: "bg-warning/10 text-warning",
  },
  {
    icon: Lock,
    title: "256-bit Encryption",
    description: "AES-256 encryption for all data at rest and in transit.",
    status: "Active",
    statusColor: "bg-success/10 text-success",
  },
  {
    icon: FileCheck,
    title: "ASHRAE Compliant",
    description: "Our calculations follow ASHRAE standards and guidelines for HVAC&R engineering.",
    status: "Active",
    statusColor: "bg-success/10 text-success",
  },
  {
    icon: Globe,
    title: "GDPR Ready",
    description: "Full compliance with European data protection regulations.",
    status: "Active",
    statusColor: "bg-success/10 text-success",
  },
  {
    icon: Server,
    title: "NIST Validated",
    description: "Thermodynamic calculations validated against NIST Refprop reference data.",
    status: "Active",
    statusColor: "bg-success/10 text-success",
  },
  {
    icon: Clock,
    title: "ISO 27001",
    description: "Information security management system certification process initiated.",
    status: "In Progress",
    statusColor: "bg-warning/10 text-warning",
  },
];

export function SecuritySection() {
  return (
    <section className="py-24 px-4 relative overflow-hidden bg-secondary/30">
      <div className="absolute inset-0 bg-background -z-30" />

      <div className="max-w-[1600px] mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 tracking-tight font-mono">
            Enterprise-Grade
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-primary">
              {" "}Security
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light">
            Your data security is our top priority. We maintain the highest standards to protect your information.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            We&apos;re continuously working to achieve industry-leading security certifications.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {certifications.map((cert, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="bg-card/80 backdrop-blur-md border border-border rounded-xl p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <cert.icon className="h-6 w-6 text-primary" />
                </div>
                <Badge className={`${cert.statusColor} text-xs`}>
                  {cert.status}
                </Badge>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                {cert.title}
              </h3>
              <p className="text-muted-foreground text-sm">
                {cert.description}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12"
        >
          <p className="text-sm text-muted-foreground">
            Have security questions?{" "}
            <a href="/contact" className="text-primary hover:underline">
              Contact our security team
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
