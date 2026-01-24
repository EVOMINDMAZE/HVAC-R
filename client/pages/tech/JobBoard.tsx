import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, ArrowRight, User, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function JobBoard() {
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchJobs();
    }, []);

    async function fetchJobs() {
        try {
            // RLS filters this automatically to assigned jobs
            const { data, error } = await supabase
                .from('jobs')
                .select(`
          *,
          client:clients(name, address),
          asset:assets(name, type)
        `)
                .neq('status', 'completed') // Show active jobs primarily
                .order('scheduled_at', { ascending: true });

            if (error) throw error;
            setJobs(data || []);
        } catch (err) {
            console.error('Error fetching jobs:', err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white p-4 shadow-sm sticky top-0 z-10">
                <h1 className="text-xl font-bold text-gray-900">My Jobs</h1>
                <p className="text-sm text-gray-500">
                    {format(new Date(), 'EEEE, MMMM d')}
                </p>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                {loading ? (
                    <div className="text-center py-10 font-bold text-gray-300">Loading...</div>
                ) : jobs.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <p>No active jobs.</p>
                        <p className="text-xs mt-2">Go grab a coffee ☕</p>
                    </div>
                ) : (
                    jobs.map((job) => (
                        <div
                            key={job.id}
                            onClick={() => navigate(`/tech/jobs/${job.id}`)}
                            className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform cursor-pointer"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <span className={`
                  px-2 py-1 rounded-full text-xs font-semibold
                  ${job.status === 'en_route' ? 'bg-blue-100 text-blue-700' : ''}
                  ${job.status === 'on_site' ? 'bg-amber-100 text-amber-700' : ''}
                  ${job.status === 'pending' || job.status === 'assigned' ? 'bg-gray-100 text-gray-600' : ''}
                `}>
                                    {job.status.replace('_', ' ').toUpperCase()}
                                </span>
                                <span className="text-xs text-gray-400 font-mono">{job.ticket_number}</span>
                            </div>

                            <h3 className="font-bold text-lg text-gray-900 mb-1">
                                {job.client?.name || 'Unknown Client'}
                            </h3>

                            <div className="space-y-2 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                    <span className="truncate w-full">{job.client?.address || 'No Address'}</span>
                                </div>
                                {job.asset && (
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-orange-400" />
                                        <span>{job.asset.name} ({job.asset.type})</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-gray-400" />
                                    <span>
                                        {job.scheduled_at
                                            ? format(new Date(job.scheduled_at), 'h:mm a')
                                            : 'ASAP'}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between items-center text-blue-600 font-medium text-sm">
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
