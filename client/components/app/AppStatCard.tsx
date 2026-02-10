import React from "react";
import { cn } from "@/lib/utils";

interface AppStatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  meta?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: "default" | "success" | "warning" | "danger";
}

const toneClasses: Record<NonNullable<AppStatCardProps["tone"]>, string> = {
  default: "border-border/70",
  success: "border-success/30",
  warning: "border-warning/30",
  danger: "border-destructive/30",
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
        "app-surface app-elev-1 p-5 sm:p-6",
        toneClasses[tone],
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="app-stack-8">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
            {label}
          </p>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
        </div>
        {icon ? <div className="text-muted-foreground">{icon}</div> : null}
      </div>
      {meta ? <p className="mt-3 text-sm text-muted-foreground">{meta}</p> : null}
    </article>
  );
}
