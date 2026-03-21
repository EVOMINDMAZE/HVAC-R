import { cva, type VariantProps } from "class-variance-authority";

const toggleVariants = cva(
  "inline-flex items-center justify-center rounded-[0.75rem] text-sm font-medium ring-offset-background transition-all duration-200 hover:bg-muted/60 hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-input/60 bg-transparent hover:bg-accent/60 hover:text-accent-foreground shadow-[0_1px_2px_-1px_rgba(0,0,0,0.06)] hover:shadow-[0_2px_4px_-2px_rgba(0,0,0,0.08)]",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-9 px-3",
        lg: "h-11 px-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export { toggleVariants };
export type { VariantProps as ToggleVariantProps };