import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Plus, Search, Filter, Map, Calendar, User, Building2, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { CreateJobDialog } from '@/components/jobs/CreateJobDialog';
import MapView from '@/components/dashboard/MapView';

export default function Dispatch() {
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showMapView, setShowMapView] = useState(false);

    useEffect(() => {
        fetchJobs();

        // Subscribe to realtime updates
        const channel = supabase
            .channel('dispatch-jobs')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => {
                fetchJobs();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    async function fetchJobs() {
        const { data, error } = await supabase
            .from('jobs')
            .select(`
        *,
        client:clients(name, contact_phone),
        asset:assets(name),
        technician:technician_id(email)
      `)
            .order('scheduled_at', { ascending: true }); // Show upcoming first

        if (!error && data) {
            setJobs(data);
        }
        setLoading(false);
    }

    const filteredJobs = jobs.filter(job =>
        job.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.ticket_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                        Dispatch Center 🚁
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage active service calls and technician assignments.</p>
                </div>
                <button
                    onClick={() => setShowCreateDialog(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-200 transition-all hover:scale-105 active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    New Job
                </button>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search tickets, clients, or status..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-slate-900 dark:text-white"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium">
                    <Filter className="w-5 h-5" />
                    Filter
                </button>
                <button
                    onClick={() => setShowMapView(true)}
                    className={`flex items-center gap-2 px-4 py-3 border rounded-xl shadow-sm font-medium transition-colors ${showMapView ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                    <Map className="w-5 h-5" />
                    Map View
                </button>
            </div>

            {/* Jobs Table / Map View Switch */}
            {showMapView ? (
                <MapView jobs={filteredJobs} />
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="grid grid-cols-12 bg-slate-50/50 dark:bg-slate-800/50 p-4 font-semibold text-slate-500 dark:text-slate-400 text-sm border-b border-slate-200 dark:border-slate-800">
                        <div className="col-span-3">Client / Asset</div>
                        <div className="col-span-2">Scheduled</div>
                        <div className="col-span-3">Technician</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-2 text-right">Actions</div>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center text-gray-400">Loading Dispatch Board...</div>
                    ) : filteredJobs.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-500 mb-4">
                                <Calendar className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No active jobs</h3>
                            <p className="text-slate-500">Create a new job to get started.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredJobs.map((job) => (
                                <div key={job.id} className="grid grid-cols-12 p-4 items-center hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <div className="col-span-3 pr-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                                                <Building2 className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-slate-900 dark:text-white line-clamp-1">{job.client?.name}</div>
                                                <div className="text-xs text-slate-500 line-clamp-1">{job.asset?.name || 'General Service'}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-span-2 text-slate-600 dark:text-slate-400 font-medium text-sm flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-slate-400" />
                                        {job.scheduled_at ? format(new Date(job.scheduled_at), 'MMM d, h:mm a') : 'Unscheduled'}
                                    </div>

                                    <div className="col-span-3">
                                        {job.technician ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xs font-bold">
                                                    {job.technician.email[0].toUpperCase()}
                                                </div>
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{job.technician.email.split('@')[0]}</span>
                                            </div>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-300">
                                                Unassigned
                                            </span>
                                        )}
                                    </div>

                                    <div className="col-span-2">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${job.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                            job.status === 'en_route' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                job.status === 'on_site' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                    job.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                                                        'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-300'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${job.status === 'pending' ? 'bg-yellow-500' :
                                                job.status === 'en_route' ? 'bg-blue-500' :
                                                    job.status === 'on_site' ? 'bg-purple-500' :
                                                        job.status === 'completed' ? 'bg-green-500' :
                                                            'bg-gray-500'
                                                }`}></span>
                                            {job.status.replace('_', ' ').toUpperCase()}
                                        </span>
                                    </div>

                                    <div className="col-span-2 text-right">
                                        <Link to={`/jobs/${job.id}`} className="text-blue-500 hover:text-blue-700 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                            View Details
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <CreateJobDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} onSuccess={fetchJobs} />

        </div>
    );
}
