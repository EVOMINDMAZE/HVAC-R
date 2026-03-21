import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shadow-[0_1px_3px_-1px_rgba(0,0,0,0.08)]",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary/90 text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary/90 text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive/90 text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground border-border/60",
        neon: "border-primary/70 bg-transparent text-primary-foreground glow-primary hover:bg-primary/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export { badgeVariants };
export type { VariantProps as BadgeVariantProps };