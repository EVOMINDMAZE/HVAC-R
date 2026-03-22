import { motion } from "framer-motion";
import { Link } from "react-router-dom";

import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { landingVariants } from "@/lib/animations/landingVariants";

export interface RolePathItem {
  title: string;
  promise: string;
  proof: string;
  cta: string;
  link: string;
  icon: LucideIcon;
  eventKey: string;
  image: string;
}

interface RolePathCardsProps {
  segments: readonly RolePathItem[];
  onTrack: (segment: string, destination: string) => void;
}

export function RolePathCards({ segments, onTrack }: RolePathCardsProps) {
  return (
    <motion.div 
      variants={landingVariants.staggerChildren}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      className="mt-12 grid gap-6 md:grid-cols-3"
    >
      {segments.map((segment) => (
        <motion.div 
          key={segment.title} 
          variants={landingVariants.hudFadeIn}
          whileHover={{ y: -5 }}
          className="glass-blur hud-border bg-card/40 flex flex-col p-6 transition-all duration-300 hover:bg-card/60 hover:cyan-glow"
        >
          <div className="flex-grow">
            <div className="relative aspect-video overflow-hidden border border-primary/10 bg-background/50 mb-6">
              <img
                src={segment.image}
                alt={`${segment.title} workflow preview`}
                className="w-full h-full object-cover mix-blend-luminosity hover:mix-blend-normal transition-all duration-700"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/5 border border-primary/20 rounded-sm">
                <segment.icon className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-lg font-display font-bold tracking-tight uppercase">{segment.title}</h3>
            </div>

            <p className="text-[11px] font-mono text-foreground/80 leading-relaxed uppercase mb-2 tracking-wide">
              {segment.promise}
            </p>
            <p className="text-[10px] font-mono text-muted-foreground/60 leading-relaxed uppercase tracking-widest">
              // VERIFIED: {segment.proof}
            </p>
          </div>

          <div className="mt-8">
            <Link
              to={segment.link}
              onClick={() => onTrack(segment.eventKey, segment.link)}
            >
              <Button 
                variant={segment.link === "/contact" ? "outline" : "default"} 
                className={`w-full h-10 rounded-none font-mono text-[10px] uppercase tracking-[0.2em] transition-all duration-300 ${
                  segment.link !== "/contact" ? "bg-primary text-primary-foreground" : "border-primary/30 hover:bg-primary/5"
                }`}
              >
                {segment.cta}
              </Button>
            </Link>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
