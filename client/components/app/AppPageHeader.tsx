import { cn } from "@/lib/utils";

interface AppPageHeaderProps {
  title: string;
  subtitle?: string;
  kicker?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function AppPageHeader({
  title,
  subtitle,
  kicker,
  actions,
  className,
}: AppPageHeaderProps) {
  return (
    <header
      className={cn(
        "app-surface app-elev-1 flex flex-col gap-5 p-6 sm:p-7 lg:flex-row lg:items-end lg:justify-between lg:p-8",
        className,
      )}
    >
      <div className="space-y-3">
        {kicker ? (
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-primary/80">
            {kicker}
          </p>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-[2.15rem]">{title}</h1>
        {subtitle ? (
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2.5">{actions}</div> : null}
    </header>
  );
}
