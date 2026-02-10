import { type Variants } from "framer-motion";

/**
 * Framer Motion animation presets for futuristic military-grade AI interface
 */

// Basic transitions
export const fastTransition = { duration: 0.2, ease: "easeOut" as const };
export const smoothTransition = { duration: 0.3, ease: "easeOut" as const };
export const deliberateTransition = { duration: 0.5, ease: "easeInOut" as const };

// Fade animations
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: fastTransition },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: smoothTransition },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: smoothTransition },
};

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: smoothTransition },
};

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: smoothTransition },
};

// Scale animations
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: smoothTransition },
};

export const scaleOut: Variants = {
  hidden: { opacity: 0, scale: 1.05 },
  visible: { opacity: 1, scale: 1, transition: smoothTransition },
};

// Neon glow pulse animation
export const neonPulse: Variants = {
  hidden: { boxShadow: "0 0 0px rgba(0, 255, 255, 0)" },
  visible: {
    boxShadow: [
      "0 0 0px rgba(0, 255, 255, 0)",
      "0 0 15px rgba(0, 255, 255, 0.5)",
      "0 0 0px rgba(0, 255, 255, 0)",
    ],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      repeatType: "loop",
    },
  },
};

// Success pulse (green)
export const successPulse: Variants = {
  hidden: { boxShadow: "0 0 0px rgba(0, 255, 128, 0)" },
  visible: {
    boxShadow: [
      "0 0 0px rgba(0, 255, 128, 0)",
      "0 0 15px rgba(0, 255, 128, 0.5)",
      "0 0 0px rgba(0, 255, 128, 0)",
    ],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      repeatType: "loop",
    },
  },
};

// Warning pulse (orange)
export const warningPulse: Variants = {
  hidden: { boxShadow: "0 0 0px rgba(255, 204, 0, 0)" },
  visible: {
    boxShadow: [
      "0 0 0px rgba(255, 204, 0, 0)",
      "0 0 15px rgba(255, 204, 0, 0.5)",
      "0 0 0px rgba(255, 204, 0, 0)",
    ],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      repeatType: "loop",
    },
  },
};

// Destructive pulse (red)
export const destructivePulse: Variants = {
  hidden: { boxShadow: "0 0 0px rgba(255, 0, 0, 0)" },
  visible: {
    boxShadow: [
      "0 0 0px rgba(255, 0, 0, 0)",
      "0 0 15px rgba(255, 0, 0, 0.5)",
      "0 0 0px rgba(255, 0, 0, 0)",
    ],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      repeatType: "loop",
    },
  },
};

// Staggered container animations for lists/grids
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// Glassmorphism entrance
export const glassEntrance: Variants = {
  hidden: { opacity: 0, backdropFilter: "blur(0px)" },
  visible: {
    opacity: 1,
    backdropFilter: "blur(12px)",
    transition: deliberateTransition,
  },
};

// Hover effects
export const hoverLift = {
  scale: 1.02,
  y: -4,
  transition: fastTransition,
};

export const hoverGlow = {
  boxShadow: "0 0 20px rgba(0, 255, 255, 0.3)",
  transition: fastTransition,
};

// Loading spinner animation
export const loadingSpinner: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear" as const,
    },
  },
};

// Data panel entrance with numeric count-up
export const countUp = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
};

// Command panel slide-in
export const commandSlideIn: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  },
};

// Page transitions
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

// Utility function to combine variants
export const combineVariants = (...variants: Variants[]): Variants => {
  return variants.reduce((acc, variant) => {
    return {
      ...acc,
      ...variant,
    };
  }, {});
};

// Pre-configured animation presets
export const animations = {
  fadeIn,
  fadeInUp,
  fadeInDown,
  fadeInLeft,
  fadeInRight,
  scaleIn,
  scaleOut,
  neonPulse,
  successPulse,
  warningPulse,
  destructivePulse,
  staggerContainer,
  staggerItem,
  glassEntrance,
  hoverLift,
  hoverGlow,
  loadingSpinner,
  countUp,
  commandSlideIn,
  pageTransition,
  transitions: {
    fast: fastTransition,
    smooth: smoothTransition,
    deliberate: deliberateTransition,
  },
};

export default animations;