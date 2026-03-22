import { motion, AnimatePresence } from "framer-motion";
import { MapPin, User, Activity } from "lucide-react";
import { useState, useEffect } from "react";

import { metrics } from "@/config/metrics";

export function UrgencyNotification() {
  const [index, setIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const signups = metrics.urgency.recentSignups;

  useEffect(() => {
    if (signups.length <= 1) return;

    const timer = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % signups.length);
        setIsVisible(true);
      }, 500); // Wait for exit animation
    }, 5000);

    return () => clearInterval(timer);
  }, [signups.length]);

  const current = signups[index];

  return (
    <div className="fixed bottom-6 left-6 z-[100] pointer-events-none">
      <AnimatePresence mode="wait">
        {isVisible && (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20, x: -20, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(5px)" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="glass-card hud-border hud-corner-accents p-4 rounded-xl shadow-2xl w-72 pointer-events-auto"
            aria-live="polite"
            role="status"
          >
            <div className="corner-bottom-left" />
            <div className="corner-bottom-right" />
            
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-primary" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest font-display">New_Activation</span>
                  <div className="flex items-center gap-1">
                    <Activity className="w-2.5 h-2.5 text-success animate-pulse" />
                    <span className="text-[8px] font-mono text-success/80 uppercase">Live</span>
                  </div>
                </div>
                
                <p className="text-sm font-bold text-white font-display truncate">
                  {current.name}
                </p>
                
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1 text-[10px] text-white/50">
                    <MapPin className="w-3 h-3 text-primary/60" />
                    <span className="truncate">{current.location}</span>
                  </div>
                  <span className="text-[10px] text-white/30">•</span>
                  <span className="text-[10px] text-white/40 font-mono italic">
                    {current.timeAgo}
                  </span>
                </div>
              </div>
            </div>
            
            {/* HUD Scanline */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.05)_50%)] bg-[length:100%_2px] opacity-10" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
