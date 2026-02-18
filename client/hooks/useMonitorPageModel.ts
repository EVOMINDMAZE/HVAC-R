import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  buildMonitorModel,
  getNavigationTimingSnapshot,
} from "@/config/monitorRegistry";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useRevenueAnalytics } from "@/hooks/useRevenueAnalytics";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useSupabaseCalculations } from "@/hooks/useSupabaseCalculations";
import { useMonitorOpsTelemetry } from "@/hooks/useMonitorOpsTelemetry";
import type { MonitorPageModel } from "@/types/monitor";

function getNowMs() {
  if (typeof performance !== "undefined") return performance.now();
  return Date.now();
}

export function useMonitorPageModel(): MonitorPageModel {
  const location = useLocation();
  const pathKey = `${location.pathname}${location.search}`;
  const renderStartRef = useRef<number>(getNowMs());
  const [routeRenderMs, setRouteRenderMs] = useState<number | null>(null);
  const disableHeavyDashboardHooks = location.pathname === "/dashboard";

  const auth = useSupabaseAuth();
  const { stats, isLoading: dashboardLoading } = useDashboardStats({
    enabled: !disableHeavyDashboardHooks,
  });
  const { revenueStats, pipelineStats, isLoading: revenueLoading } =
    useRevenueAnalytics({ enabled: !disableHeavyDashboardHooks });
  const { calculations, isLoading: calculationsLoading } =
    useSupabaseCalculations({ enabled: !disableHeavyDashboardHooks });
  const { telemetry: opsTelemetry, isLoading: opsTelemetryLoading } =
    useMonitorOpsTelemetry();

  useEffect(() => {
    renderStartRef.current = getNowMs();
    setRouteRenderMs(null);

    let mounted = true;
    const timer = window.setTimeout(() => {
      if (!mounted) return;
      setRouteRenderMs(Math.max(0, Math.round(getNowMs() - renderStartRef.current)));
    }, 0);

    return () => {
      mounted = false;
      window.clearTimeout(timer);
    };
  }, [pathKey]);

  const navigationSnapshot = useMemo(
    () => getNavigationTimingSnapshot(),
    [pathKey],
  );

  return useMemo(
    () =>
      buildMonitorModel(location.pathname, {
        role: auth.role,
        isAuthenticated: auth.isAuthenticated,
        companyName: auth.activeCompany?.company_name || null,
        now: new Date(),
        isLoading:
          auth.isLoading ||
          dashboardLoading ||
          revenueLoading ||
          calculationsLoading ||
          opsTelemetryLoading,
        companyId: auth.activeCompany?.company_id || auth.companyId || null,
        userId: auth.user?.id || null,
        dashboardStats: stats,
        revenueStats,
        pipelineStats,
        calculations,
        opsTelemetry,
        navigation: navigationSnapshot,
        routeRenderMs,
      }),
    [
      auth.role,
      auth.isAuthenticated,
      auth.activeCompany?.company_name,
      auth.isLoading,
      dashboardLoading,
      revenueLoading,
      calculationsLoading,
      opsTelemetryLoading,
      stats,
      revenueStats,
      pipelineStats,
      calculations,
      opsTelemetry,
      navigationSnapshot,
      routeRenderMs,
      auth.activeCompany?.company_id,
      auth.companyId,
      auth.user?.id,
      location.pathname,
    ],
  );
}
