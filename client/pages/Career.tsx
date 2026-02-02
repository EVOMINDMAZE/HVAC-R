import React, { useEffect, useState } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { supabase } from '@/lib/supabase';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Award, Briefcase, Zap, Star, Loader2, Trophy, Clock, Hammer } from 'lucide-react';
import { format } from 'date-fns';

interface SkillLog {
    id: string;
    skill_type: string;
    xp_value: number;
    verified_at: string;
    project_id?: string;
    projects?: {
        name: string;
    }
}

export default function Career() {
    const { user } = useSupabaseAuth();
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<SkillLog[]>([]);
    const [totalXP, setTotalXP] = useState(0);

    useEffect(() => {
        async function fetchParams() {
            if (!user) return;
            setLoading(true);

            // In a real app we would join properly if Supabase types were fully gen'd, 
            // but for now we fetch raw and simple relations
            const { data, error } = await supabase
                .from('skill_logs')
                .select(`
                    id, 
                    skill_type, 
                    xp_value, 
                    verified_at, 
                    project_id,
                    projects (
                        name
                    )
                `)
                .eq('user_id', user.id)
                .order('verified_at', { ascending: false });

            if (error) {
                console.error("Error fetching skills", error);
            } else {
                const formattedLogs: SkillLog[] = (data || []).map((log: any) => ({
                    ...log,
                    projects: Array.isArray(log.projects) ? log.projects[0] : log.projects
                }));
                setLogs(formattedLogs);
                const xp = formattedLogs.reduce((acc, curr) => acc + (curr.xp_value || 0), 0);
                setTotalXP(xp);
            }
            setLoading(false);
        }

        fetchParams();
    }, [user]);

    const getLevel = (xp: number) => Math.floor(xp / 100) + 1;
    const getProgress = (xp: number) => xp % 100;

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <main className="flex items-center justify-center h-[calc(100vh-200px)]">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background transition-colors duration-500">
            <Header />
            <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-500">

                {/* Hero Profile Section */}
                <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-2xl p-8 md:p-12">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 blur-[120px] rounded-full -mr-20 -mt-20 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 blur-[100px] rounded-full -ml-20 -mb-20 pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
                        <div className="relative">
                            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border-4 border-slate-800 shadow-xl flex items-center justify-center">
                                <span className="text-3xl md:text-5xl">👷</span>
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg border-2 border-slate-900">
                                Lvl {getLevel(totalXP)}
                            </div>
                        </div>

                        <div className="flex-1 text-center md:text-left space-y-2">
                            <h1 className="text-3xl md:text-4xl font-bold">{user?.user_metadata?.full_name || user?.email?.split('@')[0]}</h1>
                            <p className="text-slate-400 flex items-center justify-center md:justify-start gap-2">
                                <Trophy className="w-4 h-4 text-amber-400" />
                                <span>Certified HVAC Professional</span>
                            </p>

                            <div className="mt-6 max-w-lg">
                                <div className="flex justify-between text-sm mb-2 text-slate-300">
                                    <span>Level Progress</span>
                                    <span>{getProgress(totalXP)} / 100 XP</span>
                                </div>
                                <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000"
                                        style={{ width: `${getProgress(totalXP)}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                                <CardContent className="p-4 flex flex-col items-center">
                                    <Star className="w-6 h-6 text-amber-400 mb-2" />
                                    <span className="text-2xl font-bold">{totalXP}</span>
                                    <span className="text-xs text-slate-400">Total XP</span>
                                </CardContent>
                            </Card>
                            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                                <CardContent className="p-4 flex flex-col items-center">
                                    <AwardsIcon className="w-6 h-6 text-purple-400 mb-2" />
                                    <span className="text-2xl font-bold">{logs.length}</span>
                                    <span className="text-xs text-slate-400">Skills Logged</span>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left: Skill Timeline */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <Hammer className="w-6 h-6 text-primary" />
                                Digital Logbook
                            </h2>
                        </div>

                        <div className="space-y-4">
                            {logs.length === 0 ? (
                                <Card className="bg-muted/30 border-dashed">
                                    <CardContent className="p-12 text-center space-y-4">
                                        <Briefcase className="w-12 h-12 text-muted-foreground mx-auto" />
                                        <div>
                                            <h3 className="font-semibold text-lg">No Skills Verified Yet</h3>
                                            <p className="text-muted-foreground">Perform calculations on job sites to earn XP and verify your skills.</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                logs.map((log) => (
                                    <Card key={log.id} className="hover:shadow-md transition-shadow group animate-in slide-in-from-bottom-2">
                                        <CardContent className="p-4 flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                                                <CheckCircle className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap justify-between items-start gap-2">
                                                    <h4 className="font-bold text-foreground truncate">{log.skill_type}</h4>
                                                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                                                        +{log.xp_value} XP
                                                    </Badge>
                                                </div>
                                                {log.projects?.name && (
                                                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                                                        <Briefcase className="w-3.5 h-3.5" />
                                                        {log.projects.name}
                                                    </p>
                                                )}
                                                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    Verified on {format(new Date(log.verified_at), "MMM d, yyyy 'at' h:mm a")}
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right: Achievements / Next Steps */}
                    <div className="space-y-6">
                        <Card className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 border-primary/10">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-amber-500" />
                                    Next Milestones
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm font-medium">
                                        <span className="text-slate-600 dark:text-slate-400">Master Technician</span>
                                        <span className="text-slate-900 dark:text-white">Lvl 5</span>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                        <div className="bg-slate-400 h-full w-[20%]" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm font-medium">
                                        <span className="text-slate-600 dark:text-slate-400">Winterization Expert</span>
                                        <span className="text-slate-900 dark:text-white">0/10 Certs</span>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                        <div className="bg-slate-400 h-full w-[0%]" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="rounded-xl bg-blue-50 dark:bg-blue-900/10 p-4 border border-blue-100 dark:border-blue-900/50">
                            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Did you know?</h4>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                Verified skills can be exported to your resume or shared with your employer to prove your field experience.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

function AwardsIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="8" r="6" />
            <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
        </svg>
    )
}

function CheckCircle(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <path d="m9 11 3 3L22 4" />
        </svg>
    )
}
