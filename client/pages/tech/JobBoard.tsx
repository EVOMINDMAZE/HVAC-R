
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MapPin, Calendar, Clock, Phone, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useSupabaseAuth';

export default function JobBoard() {
    const { user, session } = useAuth();
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            fetchJobs();
        }

        // Safety Timeout
        const timer = setTimeout(() => {
            if (loading) {
                console.warn('[JobBoard] Safety timeout reached.');
                setLoading(false);
            }
        }, 5000);

        return () => clearTimeout(timer);
    }, [user, session]);

    async function fetchJobs() {
        if (!user) return;

        try {
            // RLS filters this automatically to assigned jobs
            const { data, error } = await supabase
                .from('jobs')
                .select('*')
                .eq('technician_id', user.id)
                .neq('status', 'completed')
                .order('scheduled_at', { ascending: true });

            if (error) throw error;
            setJobs(data || []);
        } catch (err: any) {
            console.error('Error fetching jobs:', err);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <div className="p-8 text-center">Loading your jobs...</div>;
    }


    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <div
                className="bg-card shadow-sm sticky top-0 z-10 px-4 pb-4"
                style={{
                    paddingTop: '1rem'
                }}
            >
                <h1 className="text-xl font-bold text-foreground">My Jobs</h1>
                <p className="text-sm text-muted-foreground">
                    {format(new Date(), 'EEEE, MMMM d')}
                </p>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                {loading ? (
                    <div className="text-center py-10 font-bold text-muted-foreground/50">Loading...</div>
                ) : jobs.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground">
                        <p>No active jobs.</p>
                        <p className="text-xs mt-2">Go grab a coffee ☕</p>
                    </div>
                ) : (
                    jobs.map((job) => (
                        <div
                            key={job.id}
                            onClick={() => navigate(`/tech/jobs/${job.id}`)}
                            className="bg-card rounded-xl p-5 shadow-sm border border-border active:scale-[0.98] transition-transform cursor-pointer"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold
                  ${job.status === 'en_route' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : ''}
                  ${job.status === 'on_site' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' : ''}
                  ${job.status === 'pending' || job.status === 'assigned' ? 'bg-muted text-muted-foreground' : ''}
`}>
                                    {job.status.replace('_', ' ').toUpperCase()}
                                </span>
                                <span className="text-xs text-muted-foreground font-mono">{job.ticket_number}</span>
                            </div>

                            <h3 className="font-bold text-lg text-foreground mb-1">
                                {job.client?.name || job.client_name || 'Unknown Client'}
                            </h3>
                            {job.title && (
                                <p className="text-sm font-medium text-primary mb-2">{job.title}</p>
                            )}

                            <div className="space-y-2 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-muted-foreground/70" />
                                    <span className="truncate w-full">{job.client?.address || 'No Address'}</span>
                                </div>
                                {job.asset && (
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-orange-400" />
                                        <span>{job.asset.name} ({job.asset.type})</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-muted-foreground/70" />
                                    <span>
                                        {job.scheduled_at
                                            ? format(new Date(job.scheduled_at), 'h:mm a')
                                            : 'ASAP'}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-border/50 flex justify-between items-center text-primary font-medium text-sm">
                                <span>View Details</span>
                                <ArrowRight className="w-4 h-4" />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
