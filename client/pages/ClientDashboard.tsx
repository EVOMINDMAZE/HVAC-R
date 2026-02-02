import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { AlertTriangle, CheckCircle, Smartphone, Thermometer, Wind, Activity, Settings } from "lucide-react";
import { format } from "date-fns";
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { ClientNotificationSettings } from "@/components/settings/ClientNotificationSettings";
import { useNavigate } from "react-router-dom";

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
    const { user, signOut } = useSupabaseAuth();
    const navigate = useNavigate();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [telemetryMap, setTelemetryMap] = useState<Record<string, TelemetryReading[]>>({});

    useEffect(() => {
        async function fetchData() {
            try {
                // 1. Fetch My Assets (RLS filters automatically)
                const { data: assetsData, error: assetsError } = await supabase
                    .from('assets')
                    .select('*');

                if (assetsError) throw assetsError;
                setAssets(assetsData || []);

                // 2. Fetch My Alerts (RLS filters automatically)
                const { data: alertsData, error: alertsError } = await supabase
                    .from('rules_alerts')
                    .select('*')
                    .eq('status', 'new')
                    .order('created_at', { ascending: false });

                if (alertsError) throw alertsError;
                setAlerts(alertsData || []);

            } catch (error) {
                console.error('Error fetching client data:', error);
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
            .channel('dashboard-pulse')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'telemetry_readings' },
                (payload) => {
                    setTelemetryMap(prev => {
                        // Fix for mismatched column in payload vs interface if needed, but payload is raw DB row. 
                        // DB row has 'value', interface has 'value'.
                        const newReading = payload.new as TelemetryReading;

                        const existing = prev[newReading.asset_id] || [];
                        // Keep last 20 readings for the sparkline
                        const updated = [...existing, newReading].slice(-20);
                        return { ...prev, [newReading.asset_id]: updated };
                    });
                }
            )
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'rules_alerts' },
                (payload) => {
                    const newAlert = payload.new as Alert;
                    setAlerts(prev => [newAlert, ...prev]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
            <div className="max-w-[1600px] mx-auto space-y-6">
                <header className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            Client Portal <Activity className="text-blue-500 animate-pulse" />
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400">
                            Live Monitoring for {user?.email}
                        </p>
                    </div>
                </header>

                {/* Tabs Navigation */}
                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-white dark:bg-slate-900 p-1 rounded-lg border">
                        <TabsTrigger value="overview" className="flex items-center gap-2">
                            <Activity className="h-4 w-4" />
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="settings" className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            Settings
                        </TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-6">
                        {/* Status Overview */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <Card className="border-l-4 border-l-blue-500">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-500">Total Assets</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{assets.length}</div>
                                    <p className="text-xs text-muted-foreground">Monitored Units</p>
                                </CardContent>
                            </Card>

                            <Card className={`border-l-4 ${alerts.length > 0 ? 'border-l-red-500' : 'border-l-green-500'}`}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-500">System Status</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-2">
                                        {alerts.length > 0 ? (
                                            <>
                                                <AlertTriangle className="h-6 w-6 text-red-500" />
                                                <div className="text-2xl font-bold text-red-600">{alerts.length} Alerts</div>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="h-6 w-6 text-green-500" />
                                                <div className="text-2xl font-bold text-green-600">Healthy</div>
                                            </>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Continue with the rest of the Overview content */}
                        {alerts.length > 0 && (
                            <div>
                                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-red-500" />
                                    Active Alerts
                                </h2>
                                <div className="space-y-2">
                                    {alerts.map((alert) => (
                                        <Card key={alert.id} className="border-l-4 border-l-red-500">
                                            <CardContent className="p-4">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-medium text-red-600">{alert.alert_msg}</p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {format(new Date(alert.created_at), 'PPpp')}
                                                        </p>
                                                    </div>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${alert.severity === 'critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {alert.severity}
                                                    </span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Assets List */}
                        <div>
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <Smartphone className="h-5 w-5 text-blue-500" />
                                My Assets
                            </h2>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {assets.map((asset) => {
                                    const readings = telemetryMap[asset.id] || [];
                                    const latestReading = readings[readings.length - 1]?.value; // Changed to last element for latest

                                    return (
                                        <Card key={asset.id} className="hover:shadow-lg transition-shadow">
                                            <CardContent className="p-5">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div>
                                                        <h3 className="font-semibold text-lg">{asset.name}</h3>
                                                        <p className="text-sm text-muted-foreground">{asset.type}</p>
                                                    </div>
                                                    {asset.type === 'Chiller' ? (
                                                        <Wind className="h-6 w-6 text-blue-500" />
                                                    ) : (
                                                        <Thermometer className="h-6 w-6 text-blue-500" />
                                                    )}
                                                </div>

                                                <div className="flex items-end justify-between">
                                                    <div>
                                                        <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">
                                                            Real-Time
                                                        </div>
                                                        <span className={`text-3xl font-bold ${latestReading > 40 ? 'text-red-500' : 'text-blue-600'}`}>
                                                            {latestReading !== undefined ? `${latestReading}°` : '--'}
                                                        </span>
                                                    </div>

                                                    <div className="w-24 h-12">
                                                        {readings.length > 1 ? (
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <LineChart data={readings}>
                                                                    <Line
                                                                        type="monotone"
                                                                        dataKey="value"
                                                                        stroke={latestReading > 40 ? '#ef4444' : '#3b82f6'}
                                                                        strokeWidth={2}
                                                                        dot={false}
                                                                        isAnimationActive={false}
                                                                    />
                                                                </LineChart>
                                                            </ResponsiveContainer>
                                                        ) : (
                                                            <div className="h-full w-full bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center text-[10px] text-muted-foreground">
                                                                Waiting for data...
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                        Active
                                                    </span>
                                                    <Button variant="ghost" className="h-6 text-xs" onClick={() => navigate('/history')}>
                                                        View History
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                            {assets.length === 0 && !loading && (
                                <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-lg border border-dashed">
                                    <p className="text-muted-foreground">No assets found linked to your account.</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* Settings Tab */}
                    <TabsContent value="settings" className="space-y-6">
                        <ClientNotificationSettings />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
