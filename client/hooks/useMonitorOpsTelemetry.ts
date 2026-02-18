import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import type { MonitorOpsTelemetrySnapshot } from "@/types/monitorTelemetry";

const OPS_ROUTE_RE =
  /^\/(dashboard(?:\/.*)?|portal|tech(?:\/.*)?|track-job(?:\/.*)?|history|profile|settings(?:\/.*)?|career)$/i;

const STALE_MS = 15_000;

function getStartOfTodayIso(now: Date) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
}

function getStartOfTomorrowIso(now: Date) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
}

function getLastNDaysIso(now: Date, days: number) {
  const start = new Date(now);
  start.setDate(now.getDate() - Math.max(0, days - 1));
  start.setHours(0, 0, 0, 0);
  return start.toISOString();
}

function describeError(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as any).message);
  }
  return String(error);
}

type CachedValue = {
  key: string;
  fetchedAt: number;
  value: MonitorOpsTelemetrySnapshot;
};

const GLOBAL_CACHE = new Map<string, CachedValue>();
const GLOBAL_INFLIGHT = new Map<string, Promise<MonitorOpsTelemetrySnapshot>>();

export function useMonitorOpsTelemetry() {
  const location = useLocation();
  const auth = useSupabaseAuth();
  const companyId = auth.activeCompany?.company_id || auth.companyId || null;
  const userId = auth.user?.id || null;

  const isOpsRoute = OPS_ROUTE_RE.test(location.pathname);
  const cacheKey = useMemo(
    () => `${companyId || "none"}::${userId || "none"}`,
    [companyId, userId],
  );

  const [telemetry, setTelemetry] = useState<MonitorOpsTelemetrySnapshot | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpsRoute) {
      setTelemetry(null);
      setIsLoading(false);
      return;
    }

    const now = new Date();
    const baseSnapshot: MonitorOpsTelemetrySnapshot = {
      updatedAt: now.toISOString(),
      scope: {
        pathname: location.pathname,
        companyId,
        userId,
      },
      jobs: null,
      clients: null,
      triage: null,
      team: null,
      errors: [],
    };

    // If we can't safely scope queries, still provide a baseline snapshot so the
    // monitor can render a route-specific layout without inventing numbers.
    if (!supabase || !companyId) {
      setTelemetry(baseSnapshot);
      setIsLoading(false);
      return;
    }

    const nowMs = Date.now();
    const cached = GLOBAL_CACHE.get(cacheKey) || null;
    if (cached && cached.key === cacheKey && nowMs - cached.fetchedAt < STALE_MS) {
      setTelemetry({
        ...cached.value,
        scope: { ...cached.value.scope, pathname: location.pathname },
      });
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const inflight = GLOBAL_INFLIGHT.get(cacheKey) || null;
    setIsLoading(true);

    if (inflight) {
      inflight
        .then((snapshot) => {
          if (cancelled) return;
          setTelemetry({
            ...snapshot,
            scope: { ...snapshot.scope, pathname: location.pathname },
          });
          setIsLoading(false);
        })
        .catch((error) => {
          if (cancelled) return;
          setTelemetry({
            ...baseSnapshot,
            errors: [describeError(error)],
          });
          setIsLoading(false);
        });

      return () => {
        cancelled = true;
      };
    }

    const promise = (async () => {
      const errors: string[] = [];
      const todayStart = getStartOfTodayIso(now);
      const tomorrowStart = getStartOfTomorrowIso(now);
      const last7dStart = getLastNDaysIso(now, 7);

      async function countExact(promise: PromiseLike<any>): Promise<number | null> {
        try {
          const { count, error } = await promise;
          if (error) throw error;
          return typeof count === "number" ? count : null;
        } catch (error) {
          errors.push(describeError(error));
          return null;
        }
      }

      async function fetchCreatedAt(
        table: string,
        column: string,
        startIso: string,
      ): Promise<string[]> {
        try {
          const { data, error } = await supabase
            .from(table)
            .select(column)
            .eq("company_id", companyId)
            .gte(column, startIso);
          if (error) throw error;
          if (!Array.isArray(data)) return [];
          return data
            .map((row) => String((row as any)[column] || ""))
            .filter(Boolean);
        } catch (error) {
          errors.push(describeError(error));
          return [];
        }
      }

      const jobsBase = () =>
        supabase
          .from("jobs")
          .select("id", { count: "exact", head: true })
          .eq("company_id", companyId);

      const clientsBase = () =>
        supabase
          .from("clients")
          .select("id", { count: "exact", head: true })
          .eq("company_id", companyId);

      const teamBase = () =>
        supabase
          .from("user_roles")
          .select("user_id", { count: "exact", head: true })
          .eq("company_id", companyId);

      const [
        jobsTotal,
        jobsPending,
        jobsEnRoute,
        jobsOnSite,
        jobsCompleted,
        jobsCancelled,
        jobsAssigned,
        jobsUnassigned,
        jobsScheduledToday,
        jobsAssignedToMeOpen,
        clientsTotal,
        teamMembers,
        teamTechs,
        jobsCreatedAtLast7d,
        clientsCreatedAtLast7d,
      ] = await Promise.all([
        countExact(jobsBase()),
        countExact(jobsBase().eq("status", "pending")),
        countExact(jobsBase().eq("status", "en_route")),
        countExact(jobsBase().eq("status", "on_site")),
        countExact(jobsBase().eq("status", "completed")),
        countExact(jobsBase().eq("status", "cancelled")),
        countExact(jobsBase().not("technician_id", "is", null)),
        countExact(
          jobsBase()
            .is("technician_id", null)
            .neq("status", "completed")
            .neq("status", "cancelled"),
        ),
        countExact(
          jobsBase().gte("scheduled_at", todayStart).lt("scheduled_at", tomorrowStart),
        ),
        userId
          ? countExact(
              jobsBase()
                .eq("technician_id", userId)
                .neq("status", "completed")
                .neq("status", "cancelled"),
            )
          : Promise.resolve(null),
        countExact(clientsBase()),
        countExact(teamBase()),
        countExact(teamBase().in("role", ["technician", "tech"])),
        fetchCreatedAt("jobs", "created_at", last7dStart),
        fetchCreatedAt("clients", "created_at", last7dStart),
      ]);

      // triage_submissions is optional in some environments; keep it best-effort.
      const triageBase = () =>
        supabase
          .from("triage_submissions")
          .select("id", { count: "exact", head: true })
          .eq("company_id", companyId);

      const [
        triageTotal,
        triageNew,
        triageAnalyzed,
        triageConverted,
        triageArchived,
        triageCreatedAtLast7d,
      ] = await Promise.all([
        countExact(triageBase()),
        countExact(triageBase().eq("status", "new")),
        countExact(triageBase().eq("status", "analyzed")),
        countExact(triageBase().eq("status", "converted")),
        countExact(triageBase().eq("status", "archived")),
        fetchCreatedAt("triage_submissions", "created_at", last7dStart),
      ]);

      const snapshot: MonitorOpsTelemetrySnapshot = {
        updatedAt: now.toISOString(),
        scope: {
          pathname: location.pathname,
          companyId,
          userId,
        },
        jobs: {
          total: jobsTotal,
          pending: jobsPending,
          enRoute: jobsEnRoute,
          onSite: jobsOnSite,
          completed: jobsCompleted,
          cancelled: jobsCancelled,
          assigned: jobsAssigned,
          unassigned: jobsUnassigned,
          scheduledToday: jobsScheduledToday,
          assignedToMeOpen: jobsAssignedToMeOpen,
          createdAtLast7d: jobsCreatedAtLast7d,
        },
        clients: {
          total: clientsTotal,
          createdAtLast7d: clientsCreatedAtLast7d,
        },
        triage: {
          total: triageTotal,
          new: triageNew,
          analyzed: triageAnalyzed,
          converted: triageConverted,
          archived: triageArchived,
          createdAtLast7d: triageCreatedAtLast7d,
        },
        team: {
          members: teamMembers,
          technicians: teamTechs,
        },
        errors,
      };

      return snapshot;
    })();

    GLOBAL_INFLIGHT.set(cacheKey, promise);

    promise
      .then((snapshot) => {
        GLOBAL_CACHE.set(cacheKey, { key: cacheKey, fetchedAt: nowMs, value: snapshot });
        GLOBAL_INFLIGHT.delete(cacheKey);
        if (cancelled) return;
        setTelemetry(snapshot);
        setIsLoading(false);
      })
      .catch((error) => {
        GLOBAL_INFLIGHT.delete(cacheKey);
        if (cancelled) return;
        setTelemetry({
          ...baseSnapshot,
          errors: [describeError(error)],
        });
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [cacheKey, companyId, isOpsRoute, location.pathname, userId]);

  return { telemetry, isLoading };
}
