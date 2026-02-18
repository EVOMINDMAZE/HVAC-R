import { AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface MonitorEmptyStateProps {
  title: string;
  message: string;
  tone?: "empty" | "error";
  className?: string;
}

export function MonitorEmptyState({
  title,
  message,
  tone = "empty",
  className,
}: MonitorEmptyStateProps) {
  return (
    <div
      className={cn(
        "monitor-panel rounded-2xl border p-4 sm:p-5",
        tone === "error"
          ? "border-destructive/30 bg-destructive/5"
          : "border-border/70 bg-card/70",
        className,
      )}
      data-testid="monitor-empty-state"
      data-monitor-shell
      data-tone={tone}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 inline-flex rounded-full p-1.5",
            tone === "error"
              ? "bg-destructive/10 text-destructive"
              : "bg-secondary text-muted-foreground",
          )}
        >
          {tone === "error" ? (
            <AlertTriangle className="h-4 w-4" />
          ) : (
            <Info className="h-4 w-4" />
          )}
        </span>

        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    </div>
  );
}
