import { motion } from "framer-motion";
import { Clock, CheckCircle, FileText, Sparkles } from "lucide-react";
import { useRef } from "react";

import { Badge } from "@/components/ui/badge";
import { metrics } from "@/config/metrics";
import { hudFadeIn, staggerChildren } from "@/lib/animations/landingVariants";
import { trackMarketingEvent } from "@/lib/marketingAnalytics";

export function ValuePropositionGrid() {
  const ref = useRef(null);

  const valueProps = [
    {
      title: "Real-Time Intelligence",
      description: "Equip your techs with live AI diagnostics and automated compliance logs that keep jobs moving and data accurate.",
      icon: Clock,
      stats: "2.4h SAVED / TICKET"
    },
    {
      title: "Unified Operations",
      description: "Scale your business with a single source of truth for dispatch, invoicing, and client relationships.",
      icon: CheckCircle,
      stats: "ZERO COMPLIANCE GAPS"
    },
    {
      title: "Community Driven",
      description: "Connect with industry experts and peers. Share playbooks, pricing strategies, and growing tactics.",
      icon: FileText,
      stats: "VETTED NETWORK"
    },
    {
      title: "Enterprise Rigor",
      description: "Built for industrial demand with bank-grade security and SOC2-ready data handling protocols.",
      icon: Sparkles,
      stats: "AES-256 ENCRYPTED"
    }
  ];

  return (
    <section className="py-24 px-4 relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-dot-pattern opacity-[0.03] text-primary" />
      
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerChildren}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {valueProps.map((prop, index) => {
            const Icon = prop.icon;
            return (
              <motion.div
                key={index}
                variants={hudFadeIn}
                whileHover={{ y: -5 }}
                className="group relative h-full cursor-pointer"
                onClick={() => trackMarketingEvent("landing_pillar_click", { pillar: prop.title })}
              >
                <div className="h-full p-8 glass-blur border border-primary/10 rounded-xl bg-card/40 transition-all duration-300 group-hover:border-primary/30 group-hover:bg-card/60 group-hover:shadow-[0_0_30px_-10px_rgba(56,189,248,0.2)] flex flex-col relative overflow-hidden">
                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-primary/10 transition-colors" />
                  
                  <div className="mb-6 p-3 w-fit rounded-lg bg-primary/10 border border-primary/20 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  
                  <h3 className="text-xl font-display font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                    {prop.title}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground leading-relaxed mb-8 flex-grow">
                    {prop.description}
                  </p>
                  
                  <div className="pt-6 border-t border-primary/10">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-primary tracking-widest">
                        {prop.stats}
                      </span>
                      <div className="h-1 w-8 bg-primary/20 rounded-full overflow-hidden">
                        <div className="h-full w-1/2 bg-primary group-hover:w-full transition-all duration-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-16"
        >
          <p className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-[0.2em]">
            Data synchronized as of {metrics.meta.asOfLabel} // {metrics.users.totalEngineers} active nodes
          </p>
        </motion.div>
      </div>
    </section>
  );
}
