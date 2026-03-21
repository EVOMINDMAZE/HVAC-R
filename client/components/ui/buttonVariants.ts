import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[0.75rem] text-sm font-medium ring-offset-background transition-all duration-200 ease-out motion-interactive motion-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.15),0_1px_3px_-1px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.18),0_2px_4px_-2px_rgba(0,0,0,0.12)] hover:scale-[1.02] active:scale-[0.98]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-[0_2px_8px_-2px_rgba(220,38,38,0.25),0_1px_3px_-1px_rgba(220,38,38,0.15)] hover:shadow-[0_4px_12px_-2px_rgba(220,38,38,0.3),0_2px_4px_-2px_rgba(220,38,38,0.2)] hover:scale-[1.02] active:scale-[0.98]",
        outline:
          "border border-input/60 bg-background hover:bg-accent/50 hover:text-accent-foreground shadow-sm hover:shadow-md",
        secondary:
          "bg-secondary/90 text-secondary-foreground hover:bg-secondary/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.12),0_1px_3px_-1px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.15),0_2px_4px_-2px_rgba(0,0,0,0.1)] hover:scale-[1.02] active:scale-[0.98]",
        ghost: "hover:bg-accent/70 hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        neon: "bg-transparent border border-primary/70 text-primary-foreground glow-primary hover:bg-primary/10 hover:border-primary",
        neonSuccess: "bg-transparent border border-success/70 text-foreground glow-success hover:bg-success/10 hover:border-success",
        neonWarning: "bg-transparent border border-warning/70 text-foreground glow-warning hover:bg-warning/10 hover:border-warning",
        neonHighlight: "bg-transparent border border-highlight/70 text-foreground glow-highlight hover:bg-highlight/10 hover:border-highlight",
        neonInfo: "bg-transparent border border-info/70 text-foreground glow-info hover:bg-info/10 hover:border-info",
        neonDestructive: "bg-transparent border border-destructive/70 text-foreground glow-destructive hover:bg-destructive/10 hover:border-destructive",
        neonPulse: "bg-transparent border border-primary/70 text-primary-foreground glow-primary hover:bg-primary/10 animate-pulse",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 rounded-[0.65rem] px-4 py-2",
        lg: "h-12 rounded-[0.85rem] px-10 py-3",
        icon: "h-11 w-11 rounded-[0.75rem]",
        "icon-sm": "h-9 w-9 rounded-[0.65rem]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export { buttonVariants };
export type { VariantProps as ButtonVariantProps };
