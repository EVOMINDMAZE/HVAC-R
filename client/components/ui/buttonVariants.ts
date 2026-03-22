import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[0.75rem] text-sm font-semibold tracking-wide ring-offset-background transition-all duration-200 ease-out motion-interactive motion-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light-accent/50 dark:focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-light-accent dark:bg-primary text-white dark:text-primary-foreground border border-light-accent/20 dark:border-primary/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_4px_12px_-4px_rgba(0,0,0,0.25)] hover:bg-light-accent/90 dark:hover:bg-primary/90 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_8px_20px_-6px_rgba(0,0,0,0.35)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
        destructive:
          "bg-destructive text-destructive-foreground border border-destructive/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_4px_12px_-4px_rgba(0,0,0,0.25)] hover:bg-destructive/90 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_8px_20px_-6px_rgba(0,0,0,0.35)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
        outline:
          "border border-input/60 bg-background/50 backdrop-blur-sm hover:bg-accent/10 hover:border-light-accent/40 dark:hover:border-primary/40 hover:text-light-accent dark:hover:text-foreground shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0",
        secondary:
          "bg-secondary/90 text-secondary-foreground border border-secondary/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_4px_12px_-4px_rgba(0,0,0,0.15)] hover:bg-secondary/80 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_8px_20px_-6px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 active:translate-y-0",
        ghost: "hover:bg-accent/70 hover:text-accent-foreground",
        link: "text-light-accent dark:text-primary underline-offset-4 hover:underline",
        neon: "bg-transparent border border-light-accent/70 dark:border-primary/70 text-light-accent dark:text-primary-foreground glow-primary hover:bg-light-accent/10 dark:hover:bg-primary/10 hover:border-light-accent dark:hover:border-primary",
        neonSuccess: "bg-transparent border border-success/70 text-foreground glow-success hover:bg-success/10 hover:border-success",
        neonWarning: "bg-transparent border border-warning/70 text-foreground glow-warning hover:bg-warning/10 hover:border-warning",
        neonHighlight: "bg-transparent border border-highlight/70 text-foreground glow-highlight hover:bg-highlight/10 hover:border-highlight",
        neonInfo: "bg-transparent border border-info/70 text-foreground glow-info hover:bg-info/10 hover:border-info",
        neonDestructive: "bg-transparent border border-destructive/70 text-foreground glow-destructive hover:bg-destructive/10 hover:border-destructive",
        neonPulse: "bg-transparent border border-light-accent/70 dark:border-primary/70 text-light-accent dark:text-primary-foreground glow-primary hover:bg-light-accent/10 dark:hover:bg-primary/10 animate-pulse",
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
