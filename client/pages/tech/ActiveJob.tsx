
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { MapPin, Navigation, CheckCircle, ArrowLeft, Phone, AlertTriangle } from 'lucide-react';
import { ModeToggle } from '@/components/mode-toggle';

export default function ActiveJob() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    // Dev Simulation State
    const [simulating, setSimulating] = useState(false);

    // Simulation Effect
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (simulating && job) {
            let lat = job.geo_lat || 40.7128;
            let lng = job.geo_lng || -74.0060;

            interval = setInterval(() => {
                // Move slightly North-East
                lat += 0.0005; // approx 50 meters
                lng += 0.0005;
                updateLocation(lat, lng);
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [simulating, job]);

    function toggleSimulation() {
        setSimulating(!simulating);
    }

    useEffect(() => {
        if (id) {
            fetchJob();

            // Safety Timeout
            const timer = setTimeout(() => {
                if (loading) {
                    console.warn('[ActiveJob] Safety timeout reached.');
                    setLoading(false);
                }
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [id]);

    useEffect(() => {
        if (!job) return;
        const currentStatus = getEffectiveStatus(job);
        if (currentStatus === 'completed' || currentStatus === 'pending') return;

        // 1. GPS Tracking
        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                updateLocation(pos.coords.latitude, pos.coords.longitude);
            },
            (err) => console.error('Geo Error:', err),
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );

        // 2. Screen Wake Lock (Keep device awake)
        let wakeLock: any = null;
        const requestWakeLock = async () => {
            if ('wakeLock' in navigator) {
                try {
                    wakeLock = await (navigator as any).wakeLock.request('screen');
                } catch (err) {
                    console.log('Wake Lock request failed:', err);
                }
            }
        };
        requestWakeLock();

        return () => {
            navigator.geolocation.clearWatch(watchId);
            if (wakeLock) wakeLock.release();
        };
    }, [job]);

    function getEffectiveStatus(jobData: any) {
        if (!jobData) return 'pending';
        // If job is completed in main table, it's done.
        if (jobData.status === 'completed') return 'completed';

        // Otherwise, look at latest timeline entry (if exists)
        if (jobData.job_timeline && jobData.job_timeline.length > 0) {
            return jobData.job_timeline[0].status;
        }

        return jobData.status; // likely 'pending'
    }

    async function fetchJob() {
        const { data, error } = await supabase
            .from('jobs')
            .select(`
        *,
        client:clients(name, address, contact_phone),
        asset:assets(name, type, serial_number),
        job_timeline(status, created_at)
      `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching job:', error);
        } else if (data) {
            // Sort timeline in memory to be safe
            if (data.job_timeline && Array.isArray(data.job_timeline)) {
                data.job_timeline.sort((a: any, b: any) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
            }
            const effectiveStatus = getEffectiveStatus(data);
            setJob({ ...data, effectiveStatus });
        }
        setLoading(false);
    }

    async function updateLocation(lat: number, lng: number) {
        await supabase.from('jobs').update({ geo_lat: lat, geo_lng: lng }).eq('id', id);
    }

    async function updateStatus(newStatus: string) {
        setUpdating(true);
        try {
            // DB Constraint Workaround: Map active states to 'pending'
            let mainTableStatus = 'pending';
            if (newStatus === 'completed') mainTableStatus = 'completed';
            if (newStatus === 'cancelled') mainTableStatus = 'cancelled';

            // 1. Update Job (Main Table)
            const { error } = await supabase
                .from('jobs')
                .update({ status: mainTableStatus })
                .eq('id', id);

            if (error) throw error;

            // 2. Add Timeline Entry (Real Status)
            await supabase.from('job_timeline').insert({
                job_id: id,
                status: newStatus,
                note: `Status changed to ${newStatus}`,
                geo_lat: job.geo_lat,
                geo_lng: job.geo_lng
            });

            await fetchJob();
        } catch (err) {
            console.error('Update Error:', err);
            alert('Error updating status');
        } finally {
            setUpdating(false);
        }
    }

    if (loading) return <div className="p-8 text-center">Loading Job...</div>;
    if (!job) return <div className="p-8 text-center">Job not found.</div>;

    const displayStatus = job.effectiveStatus || 'pending';

    // Fallback for missing client relation (RLS)
    const clientName = job.client?.name || job.client_name || 'Unknown Client';
    const clientAddress = job.client?.address || 'Address Hidden (Restricted)';


    return (
        <div className="min-h-screen bg-background">
            {/* Navbar */}
            <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 bg-muted rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="font-bold text-lg text-foreground">{job.ticket_number}</h2>
                        <span className="text-xs text-muted-foreground uppercase">{displayStatus.replace('_', ' ')}</span>
                    </div>
                </div>
                <ModeToggle />
            </div>

            <div className="p-5 pb-32 space-y-6">
                {/* Client Info */}
                <section>
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Client</h3>
                    <div className="bg-muted/50 p-4 rounded-xl border border-border">
                        <div className="text-xl font-bold text-foreground mb-1">{clientName}</div>
                        <div className="flex items-start gap-2 text-muted-foreground mb-3">
                            <MapPin className="w-5 h-5 text-muted-foreground/70 mt-0.5" />
                            <span>{clientAddress}</span>
                        </div>
                        {job.client?.contact_phone && (
                            <a href={`tel:${job.client.contact_phone}`} className="flex items-center gap-2 text-primary font-medium bg-primary/10 px-3 py-2 rounded-lg w-fit">
                                <Phone className="w-4 h-4" />
                                Call Client
                            </a>
                        )}
                    </div>
                </section>

                {/* Asset Info */}
                {job.asset && (
                    <section>
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Equipment</h3>
                        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-800/50 border-l-4 border-l-orange-400">
                            <div className="font-bold text-orange-900 dark:text-orange-300">{job.asset.name}</div>
                            <div className="text-sm text-orange-700 dark:text-orange-400">{job.asset.type} • {job.asset.serial_number}</div>
                            <div className="text-sm mt-2 text-orange-800 dark:text-orange-300/80 italic">"{job.description || 'No description provided'}"</div>
                        </div>
                    </section>
                )}

                {/* Timeline (Mini) */}
                <section>
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Action Required</h3>
                    {displayStatus === 'pending' && <p className="text-muted-foreground">Accept this job to start navigation.</p>}
                    {displayStatus === 'assigned' && <p className="text-muted-foreground">Ready to head out?</p>}
                    {displayStatus === 'en_route' && <p className="animate-pulse text-blue-600 dark:text-blue-400 font-bold">Sharing location with client...</p>}
                </section>
            </div>

            {/* Floating Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-card border-t border-border safe-area-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                {displayStatus === 'pending' && (
                    <button
                        onClick={() => updateStatus('assigned')}
                        className="w-full py-4 bg-black text-white rounded-xl font-bold text-lg"
                    >
                        Accept Assignment
                    </button>
                )}

                {displayStatus === 'assigned' && (
                    <button
                        onClick={() => updateStatus('en_route')}
                        className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2"
                    >
                        <Navigation className="w-5 h-5" />
                        Start Travel (En Route)
                    </button>
                )}

                {displayStatus === 'en_route' && (
                    <button
                        onClick={() => updateStatus('on_site')}
                        className="w-full py-4 bg-amber-500 text-white rounded-xl font-bold text-lg"
                    >
                        I Have Arrived
                    </button>
                )}

                {displayStatus === 'on_site' && (
                    <button
                        onClick={() => updateStatus('completed')}
                        className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2"
                    >
                        <CheckCircle className="w-5 h-5" />
                        Complete Job
                    </button>
                )}

                {displayStatus === 'completed' && (
                    <div className="text-center text-green-600 font-bold text-xl flex items-center justify-center gap-2">
                        <CheckCircle className="w-6 h-6" /> Job Done
                    </div>
                )}

                {/* Dev Only: Simulation Button */}
                {process.env.NODE_ENV === 'development' && ['en_route', 'on_site'].includes(displayStatus) && (
                    <div className="mt-4 pt-4 border-t text-center">
                        <button
                            onClick={toggleSimulation}
                            className={`text-xs px-3 py-1 rounded-full border ${simulating ? 'bg-red-50 text-red-600 border-red-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}
                        >
                            {simulating ? '🛑 Stop Simulation' : '🧪 Simulate Movement (Dev Only)'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
