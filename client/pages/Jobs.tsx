import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, MapPin, Calendar, Briefcase, User, FileText, Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/use-toast";

interface Job {
    id: string;
    created_at: string;
    client_name: string;
    job_name: string;
    status: 'active' | 'completed' | 'pending';
    address: string | null;
    notes: string | null;
    photos: string[] | null;
}

export default function Jobs() {
    const { user } = useSupabaseAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    // New Job State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newJob, setNewJob] = useState({
        client_name: "",
        job_name: "",
        status: "active" as const,
        address: "",
        notes: ""
    });

    useEffect(() => {
        if (user) {
            fetchJobs();
        }
    }, [user]);

    const fetchJobs = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('jobs')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setJobs(data || []);
        } catch (error: any) {
            console.error('Error fetching jobs:', error);
            toast({
                title: "Error",
                description: "Failed to load jobs. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateJob = async () => {
        if (!user) return;
        if (!newJob.client_name || !newJob.job_name) {
            toast({
                title: "Missing Information",
                description: "Please provide both a client name and a job name.",
                variant: "destructive",
            });
            return;
        }

        try {
            setCreating(true);
            const { data, error } = await supabase
                .from('jobs')
                .insert({
                    user_id: user.id,
                    client_name: newJob.client_name,
                    job_name: newJob.job_name,
                    status: newJob.status,
                    address: newJob.address || null,
                    notes: newJob.notes || null,
                    photos: []
                })
                .select()
                .single();

            if (error) throw error;

            setJobs([data, ...jobs]);
            setIsDialogOpen(false);
            setNewJob({
                client_name: "",
                job_name: "",
                status: "active",
                address: "",
                notes: ""
            });
            toast({
                title: "Success",
                description: "Job created successfully.",
            });
        } catch (error: any) {
            console.error('Error creating job:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to create job.",
                variant: "destructive",
            });
        } finally {
            setCreating(false);
        }
    };

    const filteredJobs = jobs.filter(job => {
        const matchesSearch =
            job.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.job_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (job.address && job.address.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = statusFilter === "all" || job.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800';
            case 'completed': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
            case 'pending': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800';
            default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <Button
                        variant="ghost"
                        className="mb-4 pl-0 hover:bg-transparent hover:text-blue-600"
                        onClick={() => navigate('/dashboard')}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Job Management</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Track and manage your HVAC service jobs</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 hover:-translate-y-0.5">
                            <Plus className="w-4 h-4 mr-2" /> New Job
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] glass-card border-0">
                        <DialogHeader>
                            <DialogTitle>Create New Job</DialogTitle>
                            <DialogDescription>
                                Enter the details for the new service job.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="client-name">Client Name</Label>
                                    <Input
                                        id="client-name"
                                        placeholder="e.g. John Doe"
                                        value={newJob.client_name}
                                        onChange={(e) => setNewJob({ ...newJob, client_name: e.target.value })}
                                        className="glass-input"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="job-name">Job Title</Label>
                                    <Input
                                        id="job-name"
                                        placeholder="e.g. AC Repair"
                                        value={newJob.job_name}
                                        onChange={(e) => setNewJob({ ...newJob, job_name: e.target.value })}
                                        className="glass-input"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={newJob.status}
                                    onValueChange={(val: any) => setNewJob({ ...newJob, status: val })}
                                >
                                    <SelectTrigger className="glass-input">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address">Address</Label>
                                <Input
                                    id="address"
                                    placeholder="Service location address"
                                    value={newJob.address}
                                    onChange={(e) => setNewJob({ ...newJob, address: e.target.value })}
                                    className="glass-input"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Additional job details..."
                                    value={newJob.notes}
                                    onChange={(e) => setNewJob({ ...newJob, notes: e.target.value })}
                                    className="glass-input min-h-[100px]"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={creating}>Cancel</Button>
                            <Button onClick={handleCreateJob} disabled={creating} className="bg-primary text-white">
                                {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Create Job
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                        placeholder="Search jobs, clients, or addresses..."
                        className="pl-10 glass-input w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px] glass-input">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : filteredJobs.length === 0 ? (
                <Card className="glass-card border-dashed border-2 border-slate-200 dark:border-slate-700 bg-transparent">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                            <Briefcase className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white">No jobs found</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                            {searchTerm || statusFilter !== 'all'
                                ? "Try adjusting your search or filters to find what you're looking for."
                                : "Get started by creating your first service job to track your work."}
                        </p>
                        {!searchTerm && statusFilter === 'all' && (
                            <Button
                                variant="outline"
                                className="mt-6 border-primary/20 text-primary hover:bg-primary/5"
                                onClick={() => setIsDialogOpen(true)}
                            >
                                <Plus className="w-4 h-4 mr-2" /> Create First Job
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredJobs.map((job) => (
                        <Card key={job.id} className="glass-card border-0 hover:shadow-xl transition-all duration-300 group">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <Badge className={`${getStatusColor(job.status)} border px-2.5 py-0.5 capitalize shadow-sm`}>
                                        {job.status}
                                    </Badge>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <FileText className="w-4 h-4 text-slate-400" />
                                    </Button>
                                </div>
                                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white mt-2 line-clamp-1">
                                    {job.job_name}
                                </CardTitle>
                                <CardDescription className="flex items-center mt-1">
                                    <User className="w-3.5 h-3.5 mr-1.5" />
                                    {job.client_name}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {job.address && (
                                    <div className="flex items-start text-sm text-slate-500 dark:text-slate-400">
                                        <MapPin className="w-3.5 h-3.5 mr-1.5 mt-0.5 shrink-0" />
                                        <span className="line-clamp-2">{job.address}</span>
                                    </div>
                                )}

                                <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-400">
                                    <div className="flex items-center">
                                        <Calendar className="w-3.5 h-3.5 mr-1.5" />
                                        {new Date(job.created_at).toLocaleDateString()}
                                    </div>
                                    {job.photos && job.photos.length > 0 && (
                                        <span>{job.photos.length} photos</span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
