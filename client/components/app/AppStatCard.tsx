import { cn } from "@/lib/utils";

interface AppStatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  meta?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: "default" | "success" | "warning" | "danger";
}

const toneClasses: Record<NonNullable<AppStatCardProps["tone"]>, string> = {
  default: "border-border/60",
  success: "border-success/25",
  warning: "border-warning/25",
  danger: "border-destructive/25",
};

const toneGradient: Record<NonNullable<AppStatCardProps["tone"]>, string> = {
  default: "",
  success: "bg-gradient-to-br from-success/5 to-transparent",
  warning: "bg-gradient-to-br from-warning/5 to-transparent",
  danger: "bg-gradient-to-br from-destructive/5 to-transparent",
};

export function AppStatCard({
  label,
  value,
  meta,
  icon,
  tone = "default",
  className,
  ...props
}: AppStatCardProps) {
  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-xl border bg-card text-card-foreground",
        "shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.03)]",
        "hover:shadow-[0_4px_12px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.04)]",
        "transition-all duration-200 ease-out",
        toneClasses[tone],
        toneGradient[tone],
        className,
      )}
      {...props}
    >
      <div className="relative z-10 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-muted-foreground/80">
              {label}
            </p>
            <p className="text-2xl font-semibold tracking-tight text-foreground/90">{value}</p>
          </div>
          {icon ? (
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted/50 text-muted-foreground/70">
              {icon}
            </div>
          ) : null}
        </div>
        {meta ? (
          <p className="mt-3 text-sm text-muted-foreground/70">{meta}</p>
        ) : null}
      </div>
      {tone !== "default" && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent to-current opacity-20" />
      )}
    </article>
  );
}
