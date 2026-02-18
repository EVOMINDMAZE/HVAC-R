import { Skeleton } from "@/components/ui/skeleton";

interface MonitorSkeletonProps {
  compact?: boolean;
}

export function MonitorSkeleton({ compact = false }: MonitorSkeletonProps) {
  return (
    <section
      className="monitor-shell rounded-2xl border border-border/70 bg-card/80 p-4 sm:p-5"
      data-testid="monitor-skeleton"
      data-monitor-shell
      data-compact={compact ? "true" : "false"}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-44" />
          </div>
          <Skeleton className="h-4 w-24" />
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-xl" />
          ))}
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          <Skeleton className="h-40 rounded-xl lg:col-span-2" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    </section>
  );
}
