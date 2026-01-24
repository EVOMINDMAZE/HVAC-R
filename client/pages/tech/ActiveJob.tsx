
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { MapPin, Navigation, CheckCircle, ArrowLeft, Phone, AlertTriangle } from 'lucide-react';

export default function ActiveJob() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (id) fetchJob();
    }, [id]);

    useEffect(() => {
        if (!job) return;
        const currentStatus = getEffectiveStatus(job);
        if (currentStatus === 'completed' || currentStatus === 'pending') return;

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                updateLocation(pos.coords.latitude, pos.coords.longitude);
            },
            (err) => console.error('Geo Error:', err),
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
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
        client:clients(name, address, phone),
        asset:assets(name, type, serial_number),
        job_timeline(status, created_at)
      `)
            .eq('id', id)
            .order('created_at', { foreignTable: 'job_timeline', ascending: false })
            // Note: .limit(1) on foreign table requires specific Supabase syntax or just slice it in JS if needed,
            // but standard Supabase JOIN usually returns array. Order matters.
            .single();

        if (!error) {
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

    return (
        <div className="min-h-screen bg-white">
            {/* Navbar */}
            <div className="bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
                <button onClick={() => navigate(-1)} className="p-2 bg-gray-100 rounded-full">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h2 className="font-bold text-lg">{job.ticket_number}</h2>
                    <span className="text-xs text-gray-500 uppercase">{displayStatus.replace('_', ' ')}</span>
                </div>
            </div>

            <div className="p-5 pb-32 space-y-6">
                {/* Client Info */}
                <section>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Client</h3>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div className="text-xl font-bold text-gray-900 mb-1">{job.client?.name}</div>
                        <div className="flex items-start gap-2 text-gray-600 mb-3">
                            <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                            <span>{job.client?.address}</span>
                        </div>
                        {job.client?.phone && (
                            <a href={`tel:${job.client.phone}`} className="flex items-center gap-2 text-blue-600 font-medium bg-blue-50 px-3 py-2 rounded-lg w-fit">
                                <Phone className="w-4 h-4" />
                                Call Client
                            </a>
                        )}
                    </div>
                </section>

                {/* Asset Info */}
                {job.asset && (
                    <section>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Equipment</h3>
                        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 border-l-4 border-l-orange-400">
                            <div className="font-bold text-orange-900">{job.asset.name}</div>
                            <div className="text-sm text-orange-700">{job.asset.type} • {job.asset.serial_number}</div>
                            <div className="text-sm mt-2 text-orange-800 italic">"{job.description || 'No description provided'}"</div>
                        </div>
                    </section>
                )}

                {/* Timeline (Mini) */}
                <section>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Action Required</h3>
                    {displayStatus === 'pending' && <p>Accept this job to start navigation.</p>}
                    {displayStatus === 'assigned' && <p>Ready to head out?</p>}
                    {displayStatus === 'en_route' && <p className="animate-pulse text-blue-600 font-bold">Sharing location with client...</p>}
                </section>
            </div>

            {/* Floating Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t safe-area-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
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
            </div>
        </div>
    );
}
