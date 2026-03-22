import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { useState, useEffect } from "react";

import { hudFadeIn } from "@/lib/animations/landingVariants";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const TimeUnit = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center px-3 py-2 min-w-[64px] relative" aria-label={`${value} ${label}`}>
    <div className="text-2xl font-bold font-display tracking-tighter text-white tabular-nums drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]" aria-hidden="true">
      {value.toString().padStart(2, '0')}
    </div>
    <div className="text-[9px] uppercase tracking-[0.2em] text-primary/70 font-display mt-0.5" aria-hidden="true">
      {label}
    </div>
    <span className="sr-only">{value} {label}</span>
    {/* HUD line accent */}
    <div className="absolute bottom-0 left-1/4 right-1/4 h-[1px] bg-primary/20" />
  </div>
);

export function CountdownTimer({ targetDate }: { targetDate: string }) {
  const calculateTimeLeft = (): TimeLeft => {
    const difference = +new Date(targetDate) - +new Date();
    let timeLeft: TimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }

    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <motion.div 
      variants={hudFadeIn}
      className="flex items-center gap-1 glass-card hud-border hud-corner-accents p-2 rounded-xl mb-8 relative group overflow-hidden w-full sm:w-auto"
    >
      <div className="corner-bottom-left" />
      <div className="corner-bottom-right" />
      
      <div className="flex items-center justify-center w-12 h-12 border-r border-white/10 mr-2">
        <Clock className="w-5 h-5 text-primary animate-pulse" />
      </div>

      <div className="flex divide-x divide-white/10">
        <TimeUnit value={timeLeft.days} label="Days" />
        <TimeUnit value={timeLeft.hours} label="Hours" />
        <TimeUnit value={timeLeft.minutes} label="Mins" />
        <TimeUnit value={timeLeft.seconds} label="Secs" />
      </div>

      <div className="ml-4 pr-3 border-l border-white/10 pl-4 hidden md:block">
        <div className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] font-display">Time_Remaining</div>
        <div className="text-[8px] text-white/40 font-mono mt-0.5 uppercase">Status: System_Ready</div>
      </div>
      
      {/* Scanline overlay for HUD feel */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] opacity-20" />
    </motion.div>
  );
}
