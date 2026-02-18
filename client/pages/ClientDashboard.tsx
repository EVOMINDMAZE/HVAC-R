import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import {
  AlertTriangle,
  CheckCircle,
  Smartphone,
  Thermometer,
  Wind,
  Activity,
  Settings,
} from "lucide-react";
import { format } from "date-fns";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import { ClientNotificationSettings } from "@/components/settings/ClientNotificationSettings";
import { useNavigate } from "react-router-dom";
import { AppPageHeader } from "@/components/app/AppPageHeader";
import { AppSectionCard } from "@/components/app/AppSectionCard";
import { AppStatCard } from "@/components/app/AppStatCard";
import { PageContainer } from "@/components/PageContainer";

interface Asset {
  id: string;
  name: string;
  type: string;
  status: string;
  last_reading?: any;
}

interface Alert {
  id: string;
  alert_msg: string;
  severity: string;
  created_at: string;
  asset_id: string;
}

interface TelemetryReading {
  asset_id: string;
  value: number;
  created_at: string;
}

export function ClientDashboard() {
  const { user } = useSupabaseAuth();
  const navigate = useNavigate();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [telemetryMap, setTelemetryMap] = useState<
    Record<string, TelemetryReading[]>
  >({});

  useEffect(() => {
    async function fetchData() {
      try {
        // 1. Fetch My Assets (RLS filters automatically)
        const { data: assetsData, error: assetsError } = await supabase
          .from("assets")
          .select("*");

        if (assetsError) throw assetsError;
        setAssets(assetsData || []);

        // 2. Fetch My Alerts (RLS filters automatically)
        const { data: alertsData, error: alertsError } = await supabase
          .from("rules_alerts")
          .select("*")
          .eq("status", "new")
          .order("created_at", { ascending: false });

        if (alertsError) throw alertsError;
        setAlerts(alertsData || []);
      } catch (error) {
        console.error("Error fetching client data:", error);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchData();
    }
  }, [user]);

  // Realtime Subscription for Telemetry and Alerts
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("dashboard-pulse")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "telemetry_readings" },
        (payload) => {
          setTelemetryMap((prev) => {
            // Fix for mismatched column in payload vs interface if needed, but payload is raw DB row.
            // DB row has 'value', interface has 'value'.
            const newReading = payload.new as TelemetryReading;

            const existing = prev[newReading.asset_id] || [];
            // Keep last 20 readings for the sparkline
            const updated = [...existing, newReading].slice(-20);
            return { ...prev, [newReading.asset_id]: updated };
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "rules_alerts" },
        (payload) => {
          const newAlert = payload.new as Alert;
          setAlerts((prev) => [newAlert, ...prev]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <PageContainer variant="standard" className="app-stack-24">
      <AppPageHeader
        kicker="Client"
        title="Client Dashboard"
        subtitle={`Live system status and alerts for ${user?.email || "your account"}.`}
        actions={<Activity className="h-5 w-5 text-primary" />}
      />

      <AppSectionCard className="app-stack-24">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mx-auto grid w-full max-w-md grid-cols-2 rounded-xl bg-secondary/40 p-1">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="app-stack-24 pt-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <AppStatCard
                label="Total Assets"
                value={assets.length}
                meta="Monitored units"
                icon={<Smartphone className="h-5 w-5" />}
              />
              <AppStatCard
                label="System Status"
                value={alerts.length > 0 ? `${alerts.length} Alerts` : "Healthy"}
                meta={alerts.length > 0 ? "New alerts require review" : "No new alerts detected"}
                icon={
                  alerts.length > 0 ? (
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-success" />
                  )
                }
                tone={alerts.length > 0 ? "danger" : "success"}
              />
            </div>

            {alerts.length > 0 ? (
              <AppSectionCard className="app-stack-16">
                <div className="flex items-center justify-between gap-3">
                  <div className="app-stack-8">
                    <h2 className="text-lg font-semibold">Active Alerts</h2>
                    <p className="text-sm text-muted-foreground">
                      Review alerts and coordinate service if action is needed.
                    </p>
                  </div>
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>

                <div className="grid gap-3">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="app-surface-muted app-border-strong flex flex-wrap items-start justify-between gap-3 p-4"
                    >
                      <div className="min-w-[240px] app-stack-8">
                        <p className="text-sm font-semibold text-foreground">
                          {alert.alert_msg}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(alert.created_at), "PPpp")}
                        </p>
                      </div>
                      <span
                        className={[
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                          alert.severity === "critical"
                            ? "border-destructive/30 bg-destructive/10 text-destructive"
                            : "border-warning/30 bg-warning/10 text-warning",
                        ].join(" ")}
                      >
                        {alert.severity}
                      </span>
                    </div>
                  ))}
                </div>
              </AppSectionCard>
            ) : null}

            <AppSectionCard className="app-stack-16">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="app-stack-8">
                  <h2 className="text-lg font-semibold">My Assets</h2>
                  <p className="text-sm text-muted-foreground">
                    Live readings update automatically when telemetry is available.
                  </p>
                </div>
                <Button variant="outline" onClick={() => navigate("/history")}>
                  View History
                </Button>
              </div>

              {loading ? (
                <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                  Loading assets...
                </p>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {assets.map((asset) => {
                  const readings = telemetryMap[asset.id] || [];
                  const latestReading = readings[readings.length - 1]?.value;

                  return (
                    <AppSectionCard key={asset.id} className="app-stack-16 p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="app-stack-8">
                          <p className="text-sm font-semibold">{asset.name}</p>
                          <p className="text-xs text-muted-foreground">{asset.type}</p>
                        </div>
                        {asset.type === "Chiller" ? (
                          <Wind className="h-5 w-5 text-primary" />
                        ) : (
                          <Thermometer className="h-5 w-5 text-primary" />
                        )}
                      </div>

                      <div className="flex items-end justify-between gap-4">
                        <div className="app-stack-8">
                          <p className="text-xs font-medium tracking-[0.04em] text-muted-foreground">
                            Real-Time
                          </p>
                          <p
                            className={[
                              "text-3xl font-semibold tracking-tight",
                              latestReading !== undefined && latestReading > 40
                                ? "text-destructive"
                                : "text-foreground",
                            ].join(" ")}
                          >
                            {latestReading !== undefined ? `${latestReading}°` : "--"}
                          </p>
                        </div>

                        <div className="h-12 w-28 rounded-xl border border-border bg-background/70 p-2">
                          {readings.length > 1 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={readings}>
                                <YAxis hide domain={["auto", "auto"]} />
                                <Line
                                  type="monotone"
                                  dataKey="value"
                                  stroke={(latestReading ?? 0) > 40 ? "#ef4444" : "#3b82f6"}
                                  strokeWidth={2}
                                  dot={false}
                                  isAnimationActive={false}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                              Waiting for data...
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-border pt-4">
                        <span className="inline-flex items-center rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                          Active
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => navigate("/history")}>
                          View History
                        </Button>
                      </div>
                    </AppSectionCard>
                  );
                })}
              </div>

              {assets.length === 0 && !loading ? (
                <div className="rounded-xl border border-dashed border-border p-10 text-center">
                  <p className="text-sm text-muted-foreground">
                    No assets found linked to your account.
                  </p>
                </div>
              ) : null}
            </AppSectionCard>
          </TabsContent>

          <TabsContent value="settings" className="pt-6">
            <AppSectionCard className="app-stack-16">
              <div className="app-stack-8">
                <h2 className="text-lg font-semibold">Notification Settings</h2>
                <p className="text-sm text-muted-foreground">
                  Choose how you want to receive updates and service notifications.
                </p>
              </div>
              <ClientNotificationSettings />
            </AppSectionCard>
          </TabsContent>
        </Tabs>
      </AppSectionCard>
    </PageContainer>
  );
}
