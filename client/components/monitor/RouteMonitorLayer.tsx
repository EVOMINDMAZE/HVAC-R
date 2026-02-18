import { cn } from "@/lib/utils";
import { MonitorShell } from "@/components/monitor/MonitorShell";
import { useMonitorPageModel } from "@/hooks/useMonitorPageModel";
import type { FutureMonitorSkin } from "@/lib/featureFlags";

interface RouteMonitorLayerProps {
  skin?: FutureMonitorSkin;
}

export function RouteMonitorLayer({ skin = "classic" }: RouteMonitorLayerProps) {
  const model = useMonitorPageModel();
  const skinClass = skin === "hud" ? "monitor-skin-hud" : "monitor-skin-classic";

  return (
    <div
      className={cn(
        "monitor-route-layer border-b border-border/70 bg-background/95 backdrop-blur-sm",
        skinClass,
      )}
      data-monitor-skin={skin}
    >
      <div className="app-page py-4 sm:py-5 lg:py-6">
        <MonitorShell model={model} compact skin={skin} />
      </div>
    </div>
  );
}
