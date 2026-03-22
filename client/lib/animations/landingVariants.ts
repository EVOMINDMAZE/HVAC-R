import { type Variants } from "framer-motion";

/**
 * Ambient HUD Animation Variants
 * Uses "Technical" easing (easeInOutQuart) for a precise, engineered feel.
 */

const technicalEasing = [0.76, 0, 0.24, 1] as any;

export const hudFadeIn: Variants = {
  hidden: { 
    opacity: 0, 
    y: 30,
    scale: 0.98,
    filter: "blur(12px)" 
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 1.1,
      ease: technicalEasing,
    }
  }
};

export const staggerChildren: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    }
  }
};

export const technicalGlow: Variants = {
  initial: {
    boxShadow: "0 0 0px hsla(var(--primary) / 0)",
    borderColor: "hsla(var(--primary) / 0.1)",
  },
  animate: {
    boxShadow: [
      "0 0 5px hsla(var(--primary) / 0.1)",
      "0 0 25px hsla(var(--primary) / 0.35)",
      "0 0 5px hsla(var(--primary) / 0.1)",
    ],
    borderColor: [
      "hsla(var(--primary) / 0.15)",
      "hsla(var(--primary) / 0.45)",
      "hsla(var(--primary) / 0.15)",
    ],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
    }
  }
};

export const technicalPulse: Variants = {
  animate: {
    opacity: [0.7, 1, 0.7],
    filter: [
      "drop-shadow(0 0 2px hsla(var(--primary) / 0.2))",
      "drop-shadow(0 0 8px hsla(var(--primary) / 0.4))",
      "drop-shadow(0 0 2px hsla(var(--primary) / 0.2))"
    ],
    transition: {
      duration: 3.5,
      repeat: Infinity,
      ease: "easeInOut",
    }
  }
};

export const landingVariants = {
  hudFadeIn,
  staggerChildren,
  technicalGlow,
  technicalPulse,
};

export default landingVariants;