import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-[0.75rem] border border-input/60 bg-background px-4 py-2.5 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30 focus-visible:ring-offset-[2px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm shadow-[0_1px_3px_-1px_rgba(0,0,0,0.06)] focus-visible:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08),inset_0_1px_2px_-1px_rgba(0,0,0,0.04)] transition-all duration-200",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
