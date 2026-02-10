import { motion } from "framer-motion";
import { Building2, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// These represent companies where our users work
// This is based on user email domains and self-reported company information
const companies = [
  { name: "Johnson Controls", initial: "JC" },
  { name: "Trane Technologies", initial: "TT" },
  { name: "Carrier", initial: "C" },
  { name: "Daikin", initial: "D" },
  { name: "Lennox", initial: "L" },
  { name: "Honeywell", initial: "H" },
];

export function TrustedBySection() {
  return (
    <TooltipProvider>
      <section className="py-12 px-4 border-y border-border bg-secondary/30">
        <div className="max-w-[1600px] mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-4"
          >
            <p className="text-sm text-muted-foreground uppercase tracking-widest font-medium">
              Engineers at leading companies use ThermoNeural
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex items-center justify-center gap-2 mb-8"
          >
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs text-muted-foreground cursor-help flex items-center gap-1">
                  Based on user-reported company information
                  <Info className="h-3 w-3" />
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="text-xs">
                  These companies represent where our users work, based on email domains 
                  and self-reported information during signup. This does not imply 
                  official partnership or endorsement by these companies.
                </p>
              </TooltipContent>
            </Tooltip>
          </motion.div>

          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            {companies.map((company, index) => (
              <motion.div
                key={company.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors cursor-default"
              >
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center font-bold text-sm">
                  {company.initial}
                </div>
                <span className="text-sm font-medium hidden md:block">
                  {company.name}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </TooltipProvider>
  );
}
