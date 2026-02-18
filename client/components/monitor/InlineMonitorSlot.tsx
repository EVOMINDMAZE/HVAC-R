import { useLocation } from "react-router-dom";
import { resolveFutureMonitorsFlag, resolveFutureMonitorsSkin } from "@/lib/featureFlags";
import { useMonitorPageModel } from "@/hooks/useMonitorPageModel";
import { MonitorDock } from "@/components/monitor/MonitorDock";

export function InlineMonitorSlot() {
  const location = useLocation();
  const enabled = resolveFutureMonitorsFlag({ search: location.search });
  const skin = resolveFutureMonitorsSkin({ search: location.search });

  if (!enabled) return null;

  return <InlineMonitorSlotEnabled skin={skin} />;
}

function InlineMonitorSlotEnabled({ skin }: { skin: ReturnType<typeof resolveFutureMonitorsSkin> }) {
  const model = useMonitorPageModel();
  return <MonitorDock model={model} skin={skin} />;
}
