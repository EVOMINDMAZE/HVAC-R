import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Map, Users, Wrench, AlertTriangle, Truck, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { PageContainer } from "@/components/PageContainer";

interface TechLocation {
    id: string;
    name: string;
    status: 'idle' | 'en-route' | 'working' | 'offline';
    current_job?: string;
    last_seen: string;
}

interface ActiveJob {
    id: string;
    title: string;
    client: string;
    status: string;
    tech_assigned?: string;
}

export default function FleetDashboard() {
    const { user, role } = useSupabaseAuth();
    const navigate = useNavigate();
    const [techs, setTechs] = useState<TechLocation[]>([]);
    const [jobs, setJobs] = useState<ActiveJob[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // In a real implementation, we would fetch from 'user_roles' (techs) and 'jobs'
        // For now, we'll simulate some fleet data
        const fetchFleetData = async () => {
            try {
                // Placeholder for Supabase query
                // const { data: techData } = await supabase...

                // Mock Data for "Enterprise" View
                setTechs([
                    { id: '1', name: 'Mike Anderson', status: 'working', current_job: 'Compressor Repair', last_seen: '2 mins ago' },
                    { id: '2', name: 'Sarah Connor', status: 'en-route', current_job: 'Routine Maintenance', last_seen: '5 mins ago' },
                    { id: '3', name: 'Davos Seaworth', status: 'idle', last_seen: '1 hour ago' },
                ]);

                setJobs([
                    { id: '101', title: 'Walk-in Freezer Down', client: 'Burger King #42', status: 'urgent', tech_assigned: 'Mike Anderson' },
                    { id: '102', title: 'Q1 Maintenance', client: 'Whole Foods Market', status: 'scheduled', tech_assigned: 'Sarah Connor' },
                    { id: '103', title: 'AC leaking water', client: 'Residential - 123 Maple', status: 'pending' },
                ]);
            } catch (e) {
                console.error("Error fetching fleet data", e);
            } finally {
                setLoading(false);
            }
        };

        fetchFleetData();
    }, [user]);

    if (loading) return <div className="p-8">Loading Fleet Command...</div>;

    return (
        <PageContainer variant="standard" className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Fleet Command 🚛</h1>
                    <p className="text-muted-foreground">Real-time overview of your technicians and active jobs.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline"><Calendar className="w-4 h-4 mr-2" /> Schedule</Button>
                    <Button><Truck className="w-4 h-4 mr-2" /> Dispatch Tech</Button>
                </div>
            </div>

            {/* High Level Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Technicians</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{techs.filter(t => t.status !== 'offline').length} / {techs.length}</div>
                        <p className="text-xs text-muted-foreground">2 En-Route, 1 Working</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Open Jobs</CardTitle>
                        <Wrench className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{jobs.length}</div>
                        <p className="text-xs text-muted-foreground">+2 since last hour</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Critcal Alerts</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">1</div>
                        <p className="text-xs text-muted-foreground">Freezer Temp High (BK #42)</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Fleet Efficiency</CardTitle>
                        <Map className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">92%</div>
                        <p className="text-xs text-muted-foreground">On-time arrival rate</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                {/* Live Map Placeholder */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Live Fleet Map</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[400px] flex items-center justify-center bg-slate-100 dark:bg-slate-900 rounded-md">
                        <div className="text-center text-muted-foreground">
                            <Map className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>Google Maps Integration Required</p>
                            <p className="text-xs">Showing locations for {techs.length} technicians</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Technician List */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Technician Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {techs.map((tech) => (
                                <div key={tech.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${tech.status === 'working' ? 'bg-green-500' : tech.status === 'en-route' ? 'bg-yellow-500' : 'bg-slate-300'}`} />
                                        <div>
                                            <p className="font-medium text-sm">{tech.name}</p>
                                            <p className="text-xs text-muted-foreground">{tech.current_job || "Idle"}</p>
                                        </div>
                                    </div>
                                    <Badge variant={tech.status === 'working' ? 'default' : 'outline'}>{tech.status}</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </PageContainer>
    );
}
