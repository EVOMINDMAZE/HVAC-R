import * as React from "react";

import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[100px] w-full rounded-[0.75rem] border border-input/60 bg-background px-4 py-3 text-base ring-offset-background placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30 focus-visible:ring-offset-[2px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm shadow-[0_1px_3px_-1px_rgba(0,0,0,0.06)] focus-visible:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08),inset_0_1px_2px_-1px_rgba(0,0,0,0.04)] transition-all duration-200 resize-none",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
