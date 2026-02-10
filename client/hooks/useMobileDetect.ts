import { useState, useEffect } from "react";

interface MobileDetect {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  prefersReducedMotion: boolean;
}

/**
 * Hook to detect mobile devices and user preferences
 * Used to optimize animations and performance
 */
export function useMobileDetect(): MobileDetect {
  const [state, setState] = useState<MobileDetect>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    prefersReducedMotion: false,
  });

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const isTouch = window.matchMedia("(pointer: coarse)").matches;
      
      // Check for reduced motion preference
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      setState({
        isMobile: width < 768 && isTouch,
        isTablet: width >= 768 && width < 1024 && isTouch,
        isDesktop: width >= 1024 || !isTouch,
        prefersReducedMotion,
      });
    };

    // Check initially
    checkDevice();

    // Listen for resize and preference changes
    window.addEventListener("resize", checkDevice);
    
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    motionQuery.addEventListener("change", checkDevice);

    return () => {
      window.removeEventListener("resize", checkDevice);
      motionQuery.removeEventListener("change", checkDevice);
    };
  }, []);

  return state;
}

/**
 * Get animation settings based on device capabilities
 */
export function useAnimationSettings() {
  const { isMobile, prefersReducedMotion } = useMobileDetect();

  return {
    // Disable complex animations on mobile
    enableBlur: !isMobile,
    enableScanLine: !isMobile,
    enableParallax: !isMobile && !prefersReducedMotion,
    
    // Reduce animation complexity
    blurAmount: isMobile ? "60px" : "120px",
    staggerDelay: isMobile ? 0.05 : 0.15,
    
    // Respect user preferences
    shouldAnimate: !prefersReducedMotion,
  };
}
