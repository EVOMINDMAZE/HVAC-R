import { Lock } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

export interface AuthTeaserOverlayProps {
  /**
   * The path to redirect to after successful signup.
   * e.g., "/tools/load-calc"
   */
  redirectPath?: string;
  /**
   * The heading text for the overlay.
   */
  heading?: string;
  /**
   * The description text for the overlay.
   */
  description?: string;
}

export function AuthTeaserOverlay({
  redirectPath,
  heading = "Unlock Full Capabilities",
  description = "Sign up for free to edit, save, and export your calculations.",
}: AuthTeaserOverlayProps) {
  const signupUrl = redirectPath
    ? `/signup?redirect=${encodeURIComponent(redirectPath)}`
    : "/signup";

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[3px] bg-gradient-to-t from-background via-background/80 to-transparent rounded-[inherit]">
      <div className="mt-auto mb-12 sm:mb-24 p-6 sm:p-8 w-[calc(100%-2rem)] max-w-md mx-auto bg-card/95 border border-border/50 shadow-2xl rounded-2xl text-center backdrop-blur-md relative overflow-hidden">
        {/* Subtle inner glow */}
        <div className="absolute inset-0 pointer-events-none rounded-2xl" style={{ boxShadow: 'var(--inner-glow-subtle)' }} />
        
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20 relative z-10">
          <Lock className="w-6 h-6 text-primary" />
        </div>
        
        <h3 className="text-xl sm:text-2xl font-bold font-display text-foreground mb-3 relative z-10">
          {heading}
        </h3>
        
        <p className="text-muted-foreground text-sm sm:text-base mb-6 font-sans relative z-10">
          {description}
        </p>
        
        <Button asChild size="lg" className="w-full font-semibold relative z-10 hover:shadow-md transition-shadow">
          <Link to={signupUrl}>Sign Up Free</Link>
        </Button>
      </div>
    </div>
  );
}
