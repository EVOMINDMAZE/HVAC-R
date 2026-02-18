import { useEffect, useMemo, useState } from "react";
import type { FutureMonitorSkin } from "@/lib/featureFlags";
import type { MonitorPageModel } from "@/types/monitor";
import { MonitorShell } from "@/components/monitor/MonitorShell";

const STORAGE_KEY = "ui.monitorDock.expanded";

function readExpandedOverride(): boolean | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (value === "1") return true;
    if (value === "0") return false;
  } catch {
    // ignore blocked storage
  }
  return null;
}

function writeExpandedOverride(expanded: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, expanded ? "1" : "0");
  } catch {
    // ignore blocked storage
  }
}

function resolveDefaultExpanded(model: MonitorPageModel): boolean {
  return Boolean(model.presentation?.defaultExpanded);
}

interface MonitorDockProps {
  model: MonitorPageModel;
  skin: FutureMonitorSkin;
}

export function MonitorDock({ model, skin }: MonitorDockProps) {
  const defaultExpanded = useMemo(() => resolveDefaultExpanded(model), [model]);
  const presentationKey = model.presentation?.signatureLabel || model.id;

  const [expanded, setExpanded] = useState<boolean>(() => {
    const override = readExpandedOverride();
    return override ?? defaultExpanded;
  });

  useEffect(() => {
    const override = readExpandedOverride();
    setExpanded(override ?? resolveDefaultExpanded(model));
  }, [presentationKey]);

  useEffect(() => {
    if (!expanded) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setExpanded(false);
      writeExpandedOverride(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [expanded]);

  const toggleExpanded = () => {
    setExpanded((prev) => {
      const next = !prev;
      writeExpandedOverride(next);
      return next;
    });
  };

  return (
    <MonitorShell
      model={model}
      skin={skin}
      density={expanded ? "expanded" : "compact"}
      expanded={expanded}
      onToggleExpanded={toggleExpanded}
    />
  );
}

