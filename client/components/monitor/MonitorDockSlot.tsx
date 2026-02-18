import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  resolveFutureMonitorsFlag,
  resolveFutureMonitorsSkin,
} from "@/lib/featureFlags";
import { useMonitorPageModel } from "@/hooks/useMonitorPageModel";
import { MonitorDock } from "@/components/monitor/MonitorDock";

export function MonitorDockSlot({ className }: { className?: string }) {
  const location = useLocation();
  const enabled = resolveFutureMonitorsFlag({ search: location.search });
  const skin = resolveFutureMonitorsSkin({ search: location.search });

  if (!enabled) return null;

  return <MonitorDockSlotEnabled skin={skin} className={className} />;
}

function MonitorDockSlotEnabled({
  skin,
  className,
}: {
  skin: ReturnType<typeof resolveFutureMonitorsSkin>;
  className?: string;
}) {
  const model = useMonitorPageModel();
  const presentation = model.presentation;
  const isDashboard = presentation?.icon === "gauge" && (presentation?.template || "executive") === "executive";
  const isHud = skin === "hud";

  const skinClass = skin === "hud" ? "monitor-skin-hud" : "monitor-skin-classic";
  const accentClass = presentation?.accent ? `monitor-accent-${presentation.accent}` : null;
  const patternClass = presentation?.pattern ? `monitor-pattern-${presentation.pattern}` : null;

  return (
    <section
      className={cn(
        "monitor-dock-layer border-b border-border/60",
        skinClass,
        accentClass,
        patternClass,
        className,
      )}
      data-monitor-dock-layer
      data-monitor-skin={skin}
      data-monitor-accent={presentation?.accent || ""}
      data-monitor-pattern={presentation?.pattern || ""}
    >
      <div
        className={cn(
          "mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8",
          isDashboard ? "py-2.5 sm:py-3" : isHud ? "py-2.5 sm:py-3" : "py-3 sm:py-4",
        )}
      >
        <MonitorDock model={model} skin={skin} />
      </div>
    </section>
  );
}
