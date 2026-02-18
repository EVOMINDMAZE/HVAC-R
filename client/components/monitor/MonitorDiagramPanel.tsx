import { ArrowDown, Orbit, Workflow } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MonitorDiagramItem } from "@/types/monitor";
import type { FutureMonitorSkin } from "@/lib/featureFlags";

interface MonitorDiagramPanelProps {
  diagram?: MonitorDiagramItem;
  skin?: FutureMonitorSkin;
  layout?: "default" | "pipeline" | "network";
}

const nodeToneClasses: Record<string, string> = {
  default: "border-border/70 bg-card/60",
  success: "border-success/30 bg-success/5",
  warning: "border-warning/30 bg-warning/5",
  danger: "border-destructive/30 bg-destructive/5",
  info: "border-info/30 bg-info/5",
};

export function MonitorDiagramPanel({
  diagram,
  skin = "classic",
  layout = "default",
}: MonitorDiagramPanelProps) {
  const nodes = diagram?.nodes || [];
  const isHud = skin === "hud";
  const isPipeline = layout === "pipeline";
  const isNetwork = layout === "network";
  const topologyLabel = isPipeline ? "PIPELINE MAP" : isNetwork ? "NETWORK MAP" : isHud ? "TOPOLOGY MAP" : "FLOW MAP";

  return (
    <section
      className="monitor-panel monitor-panel-diagram rounded-xl border border-border/70 bg-card/70 p-4"
      data-testid="monitor-diagram-panel"
      data-skin={skin}
      data-layout={layout}
    >
      <div className="monitor-panel-grid" aria-hidden />
      {isHud ? (
        <div className="monitor-blueprint" aria-hidden>
          <svg
            className="monitor-blueprint-svg"
            viewBox="0 0 420 220"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
          >
            <path
              d="M16 36H160M16 72H120M16 108H184M16 144H140M16 180H210"
              stroke="hsl(var(--primary) / 0.28)"
              strokeWidth="1"
              strokeLinecap="round"
              strokeDasharray="2 6"
            />
            <path
              d="M220 24H404V196H220V24Z"
              stroke="hsl(var(--highlight) / 0.26)"
              strokeWidth="1.2"
              opacity="0.9"
            />
            <path
              d="M240 48H384M240 84H372M240 120H392M240 156H360"
              stroke="hsl(var(--primary) / 0.22)"
              strokeWidth="1"
              strokeLinecap="round"
            />
            <circle cx="196" cy="64" r="18" stroke="hsl(var(--info) / 0.24)" strokeWidth="1.2" />
            <circle cx="196" cy="64" r="4" fill="hsl(var(--info) / 0.38)" />
            <path
              d="M196 82V118"
              stroke="hsl(var(--info) / 0.22)"
              strokeWidth="1"
              strokeDasharray="3 5"
            />
            <circle cx="196" cy="134" r="14" stroke="hsl(var(--primary) / 0.22)" strokeWidth="1.2" />
            <circle cx="196" cy="134" r="3" fill="hsl(var(--primary) / 0.36)" />
          </svg>
          <div className="monitor-blueprint-connectors" />
        </div>
      ) : null}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="monitor-panel-kicker inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/70 px-2 py-1 text-[10px] font-semibold tracking-[0.1em] text-muted-foreground">
            <Orbit className="h-3 w-3 text-primary" />
            {topologyLabel}
          </p>
          <p className="text-sm font-semibold text-foreground">
            {diagram?.title || "Context Tile"}
          </p>
          <p className="text-xs text-muted-foreground">
            {diagram?.description || "Route-level execution context"}
          </p>
        </div>
        {nodes.length > 0 ? (
          <p className="monitor-chip inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/80 px-2.5 py-1 text-xs text-muted-foreground">
            <Workflow className="h-3.5 w-3.5 text-primary" />
            {nodes.length} stages
          </p>
        ) : null}
      </div>

      {!nodes.length ? (
        <div className="monitor-diagram-empty mt-3 rounded-lg border border-dashed border-border/80 bg-background/60 p-4 text-sm text-muted-foreground">
          No contextual nodes available.
        </div>
      ) : isPipeline ? (
        <div className="monitor-pipeline mt-3" data-testid="monitor-pipeline">
          <div className="monitor-pipeline-track">
            {nodes.map((node, index) => {
              const tone = node.tone || "default";
              return (
                <div key={node.id} className="monitor-pipeline-step">
                  <article
                    className={cn(
                      "monitor-pipeline-node rounded-lg border border-border/70 bg-background/60 px-3 py-2",
                      tone === "success"
                        ? "border-success/30"
                        : tone === "warning"
                          ? "border-warning/30"
                          : tone === "danger"
                            ? "border-destructive/30"
                            : tone === "info"
                              ? "border-info/30"
                              : null,
                    )}
                    data-tone={tone}
                  >
                    <p className="monitor-pipeline-label">
                      <span className="monitor-pipeline-index" aria-hidden>
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {node.label}
                    </p>
                    <p className="monitor-pipeline-value">{node.value}</p>
                  </article>
                  {index < nodes.length - 1 ? (
                    <div className="monitor-pipeline-connector" aria-hidden />
                  ) : null}
                </div>
              );
            })}
          </div>
          {nodes.length > 1 ? (
            <div className="monitor-topology-legend mt-2 flex items-center justify-between gap-2 rounded-lg border border-border/70 bg-background/60 px-3 py-2 text-[11px] text-muted-foreground">
              <span className="truncate">Start: {nodes[0]?.label}</span>
              <span className="truncate text-right">End: {nodes[nodes.length - 1]?.label}</span>
            </div>
          ) : null}
        </div>
      ) : isNetwork ? (
        <div className="monitor-network mt-3" data-testid="monitor-network">
          <div className="monitor-network-grid">
            <div className="monitor-network-hub rounded-xl border border-border/70 bg-background/60 px-3 py-3 text-center">
              <p className="monitor-network-hub-kicker">CORE</p>
              <p className="monitor-network-hub-title">{diagram?.title || "Network"}</p>
              <p className="monitor-network-hub-subtitle">{nodes.length} nodes</p>
            </div>
            {nodes.length <= 8 ? (
              nodes.map((node, index) => {
                const tone = node.tone || "default";
                const slots = [
                  { col: 2, row: 1 },
                  { col: 3, row: 2 },
                  { col: 2, row: 3 },
                  { col: 1, row: 2 },
                  { col: 1, row: 1 },
                  { col: 3, row: 1 },
                  { col: 3, row: 3 },
                  { col: 1, row: 3 },
                ];
                const slot = slots[index] || { col: 2, row: 1 };

                return (
                  <article
                    key={node.id}
                    className={cn(
                      "monitor-network-node rounded-lg border border-border/70 bg-background/60 p-2.5",
                      tone === "success"
                        ? "border-success/30"
                        : tone === "warning"
                          ? "border-warning/30"
                          : tone === "danger"
                            ? "border-destructive/30"
                            : tone === "info"
                              ? "border-info/30"
                              : null,
                    )}
                    style={{ gridColumn: slot.col, gridRow: slot.row }}
                    data-tone={tone}
                  >
                    <p className="monitor-network-label">{node.label}</p>
                    <p className="monitor-network-value">{node.value}</p>
                  </article>
                );
              })
            ) : (
              <div className="monitor-network-fallback grid gap-2 sm:grid-cols-2">
                {nodes.map((node) => (
                  <article
                    key={node.id}
                    className="rounded-lg border border-border/70 bg-background/60 p-2.5"
                  >
                    <p className="monitor-network-label">{node.label}</p>
                    <p className="monitor-network-value">{node.value}</p>
                  </article>
                ))}
              </div>
            )}
            <div className="monitor-network-lines" aria-hidden />
          </div>
          {nodes.length > 1 ? (
            <div className="monitor-topology-legend mt-2 flex items-center justify-between gap-2 rounded-lg border border-border/70 bg-background/60 px-3 py-2 text-[11px] text-muted-foreground">
              <span className="truncate">Start: {nodes[0]?.label}</span>
              <span className="truncate text-right">End: {nodes[nodes.length - 1]?.label}</span>
            </div>
          ) : null}
        </div>
      ) : isHud ? (
        <div className="monitor-topology mt-3">
          <div className="monitor-topology-grid">
            {nodes.map((node) => {
              const tone = node.tone || "default";
              return (
                <article
                  key={node.id}
                  className={cn(
                    "monitor-topology-node rounded-lg border border-border/70 bg-background/60 p-3",
                    tone === "success"
                      ? "border-success/30"
                      : tone === "warning"
                        ? "border-warning/30"
                        : tone === "danger"
                          ? "border-destructive/30"
                          : tone === "info"
                            ? "border-info/30"
                            : null,
                  )}
                  data-tone={tone}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="monitor-topology-port" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="monitor-topology-label">{node.label}</p>
                      <p className="monitor-topology-value">{node.value}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          {nodes.length > 1 ? (
            <div className="monitor-topology-legend mt-2 flex items-center justify-between gap-2 rounded-lg border border-border/70 bg-background/60 px-3 py-2 text-[11px] text-muted-foreground">
              <span className="truncate">Start: {nodes[0]?.label}</span>
              <span className="truncate text-right">End: {nodes[nodes.length - 1]?.label}</span>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="monitor-diagram-flow mt-3">
          {nodes.map((node, index) => {
            const tone = node.tone || "default";
            return (
              <div key={node.id} className="monitor-diagram-step">
                <div className="flex items-start gap-2.5">
                  <span className="monitor-diagram-index inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/85 text-[10px] font-semibold tracking-[0.08em] text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div
                    className={cn(
                      "monitor-diagram-node flex-1 rounded-lg border p-2.5",
                      nodeToneClasses[tone] || nodeToneClasses.default,
                    )}
                    data-tone={tone}
                  >
                    <p className="text-[11px] font-medium tracking-[0.04em] text-muted-foreground">
                      {node.label}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {node.value}
                    </p>
                  </div>
                </div>
                {index < nodes.length - 1 ? (
                  <div className="monitor-diagram-connector" aria-hidden>
                    <ArrowDown className="h-3.5 w-3.5" />
                  </div>
                ) : null}
              </div>
            );
          })}
          {nodes.length > 1 ? (
            <div className="monitor-diagram-legend mt-2 flex items-center justify-between gap-2 rounded-lg border border-border/70 bg-background/70 px-2.5 py-1.5 text-[11px] text-muted-foreground">
              <span className="truncate">Start: {nodes[0]?.label}</span>
              <span className="truncate text-right">End: {nodes[nodes.length - 1]?.label}</span>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
