import { AlertTriangle, Inbox, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FeedbackVariant = "loading" | "empty" | "error";

interface AppFeedbackStateProps {
  variant: FeedbackVariant;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const variantStyles: Record<FeedbackVariant, string> = {
  loading: "border-border/70",
  empty: "border-border/70",
  error: "border-destructive/40 bg-destructive/5",
};

function resolveIcon(variant: FeedbackVariant, icon?: React.ReactNode) {
  if (icon) {
    return icon;
  }

  if (variant === "loading") {
    return <Loader2 className="h-8 w-8 animate-spin text-primary" />;
  }

  if (variant === "error") {
    return <AlertTriangle className="h-8 w-8 text-destructive" />;
  }

  return <Inbox className="h-8 w-8 text-muted-foreground" />;
}

export function AppFeedbackState({
  variant,
  title,
  description,
  icon,
  action,
  className,
}: AppFeedbackStateProps) {
  return (
    <section
      className={cn(
        "app-surface app-elev-1 flex min-h-[280px] flex-col items-center justify-center gap-4 px-6 py-12 text-center sm:px-8",
        variantStyles[variant],
        className,
      )}
      role={variant === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/70">
        {resolveIcon(variant, icon)}
      </div>
      <div className="max-w-xl space-y-2">
        <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">{title}</h2>
        {description ? (
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem]">{description}</p>
        ) : null}
      </div>
      {action ? (
        <Button onClick={action.onClick} className="mt-1">
          {action.label}
        </Button>
      ) : null}
    </section>
  );
}
