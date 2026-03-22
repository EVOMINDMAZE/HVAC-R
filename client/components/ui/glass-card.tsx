import * as React from "react";

import { cn } from "@/lib/utils";

const GlassCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "elevated" | "command" | "data";
    glow?: boolean;
  }
>(({ className, variant = "default", glow = false, style, ...props }, ref) => {
  const variantClasses = {
    default: "glass-card border-border/50 bg-card/60 backdrop-blur-xl",
    elevated: "glass-card border-white/10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] bg-card/45 backdrop-blur-2xl",
    command: "glass-command border-primary/30 bg-primary/5 backdrop-blur-xl",
    data: "glass-panel border-highlight/30 bg-highlight/5 backdrop-blur-xl",
  };

  const glowClasses = glow
    ? {
        default: "glow-primary shadow-primary/20",
        elevated: "glow-primary shadow-primary/30",
        command: "glow-highlight shadow-highlight/20",
        data: "glow-success shadow-success/20",
      }
    : {};

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-xl backdrop-blur-md transition-all duration-300 hover:shadow-lg",
        variantClasses[variant],
        glow && glowClasses[variant],
        className
      )}
      style={{
        ...style,
      }}
      {...props}
    />
  );
});
GlassCard.displayName = "GlassCard";

const GlassCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
GlassCardHeader.displayName = "GlassCardHeader";

const GlassCardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-bold tracking-tight text-foreground",
      className
    )}
    {...props}
  />
));
GlassCardTitle.displayName = "GlassCardTitle";

const GlassCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
GlassCardDescription.displayName = "GlassCardDescription";

const GlassCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
GlassCardContent.displayName = "GlassCardContent";

const GlassCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
GlassCardFooter.displayName = "GlassCardFooter";

export {
  GlassCard,
  GlassCardHeader,
  GlassCardFooter,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
};