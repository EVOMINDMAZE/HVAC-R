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
import { Plus, Search, MapPin, Calendar, Briefcase, User, FileText, Loader2, ArrowLeft, Filter } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

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
            case 'active': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200 border-blue-200 dark:border-blue-800';
            case 'completed': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800';
            case 'pending': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200 border-amber-200 dark:border-amber-800';
            default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground animate-in fade-in duration-500">
            {/* Background Elements */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-[100px]" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-purple-500/5 blur-[100px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div>
                        <Button
                            variant="ghost"
                            className="mb-4 pl-0 hover:bg-transparent hover:text-primary transition-colors -ml-2"
                            onClick={() => navigate('/dashboard')}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                        </Button>
                        <h1 className="text-4xl font-bold tracking-tight text-foreground">Job Management</h1>
                        <p className="text-muted-foreground mt-2 text-lg">Track, organize, and manage your HVAC service jobs efficiently.</p>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5">
                                <Plus className="w-5 h-5 mr-2" /> New Job
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px] bg-card/95 backdrop-blur-md border-border">
                            <DialogHeader>
                                <DialogTitle className="text-2xl">Create New Job</DialogTitle>
                                <DialogDescription>
                                    Enter the details for the new service job assignment.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-6 py-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="client-name">Client Name</Label>
                                        <Input
                                            id="client-name"
                                            placeholder="e.g. John Doe"
                                            value={newJob.client_name}
                                            onChange={(e) => setNewJob({ ...newJob, client_name: e.target.value })}
                                            className="bg-background/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="job-name">Job Title</Label>
                                        <Input
                                            id="job-name"
                                            placeholder="e.g. AC Repair - Unit 2"
                                            value={newJob.job_name}
                                            onChange={(e) => setNewJob({ ...newJob, job_name: e.target.value })}
                                            className="bg-background/50"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select
                                        value={newJob.status}
                                        onValueChange={(val: any) => setNewJob({ ...newJob, status: val })}
                                    >
                                        <SelectTrigger className="bg-background/50">
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
                                    <Label htmlFor="address">Service Address</Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="address"
                                            placeholder="123 Main St, City, ST"
                                            value={newJob.address}
                                            onChange={(e) => setNewJob({ ...newJob, address: e.target.value })}
                                            className="pl-10 bg-background/50"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="notes">Job Notes</Label>
                                    <Textarea
                                        id="notes"
                                        placeholder="Detailed description of the issue or required service..."
                                        value={newJob.notes}
                                        onChange={(e) => setNewJob({ ...newJob, notes: e.target.value })}
                                        className="min-h-[100px] bg-background/50"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={creating}>Cancel</Button>
                                <Button onClick={handleCreateJob} disabled={creating} className="bg-primary hover:bg-primary/90">
                                    {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Create Job
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card className="bg-card/50 backdrop-blur-sm border-border shadow-sm mb-8">
                    <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <Input
                                    placeholder="Search by job title, client name, or address..."
                                    className="pl-10 bg-background/50 border-input"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="w-full sm:w-[200px]">
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="bg-background/50 border-input">
                                        <div className="flex items-center">
                                            <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                                            <SelectValue placeholder="Filter by status" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24">
                        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                        <p className="text-muted-foreground">Loading your jobs...</p>
                    </div>
                ) : (
                    <div className="min-h-[300px]">
                        <AnimatePresence mode="popLayout">
                            {filteredJobs.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                >
                                    <Card className="bg-card/30 border-dashed border-2 border-muted flex flex-col items-center justify-center text-center py-16">
                                        <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
                                            <Briefcase className="w-10 h-10 text-muted-foreground" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-foreground mb-2">No jobs found</h3>
                                        <p className="text-muted-foreground max-w-sm mx-auto mb-8">
                                            {searchTerm || statusFilter !== 'all'
                                                ? "We couldn't find any jobs matching your current filters."
                                                : "Get started by creating a new job assignment for your team."}
                                        </p>
                                        {!searchTerm && statusFilter === 'all' && (
                                            <Button onClick={() => setIsDialogOpen(true)}>
                                                Create your first job
                                            </Button>
                                        )}
                                    </Card>
                                </motion.div>
                            ) : (
                                <motion.div
                                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                                    layout
                                >
                                    {filteredJobs.map((job) => (
                                        <motion.div
                                            key={job.id}
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <Card className="h-full bg-card/60 backdrop-blur-sm border-border hover:shadow-xl hover:bg-card/80 transition-all duration-300 group cursor-pointer hover:-translate-y-1">
                                                <CardHeader className="pb-3">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <Badge variant="outline" className={`${getStatusColor(job.status)} border px-2.5 py-0.5 capitalize shadow-sm font-medium`}>
                                                            {job.status}
                                                        </Badge>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted">
                                                            <FileText className="w-4 h-4 text-muted-foreground" />
                                                        </Button>
                                                    </div>
                                                    <CardTitle className="text-xl font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                                                        {job.job_name}
                                                    </CardTitle>
                                                    <div className="flex items-center mt-1 text-sm text-muted-foreground">
                                                        <User className="w-3.5 h-3.5 mr-1.5" />
                                                        <span className="font-medium">{job.client_name}</span>
                                                    </div>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-4">
                                                        {job.address ? (
                                                            <div className="flex items-start text-sm text-muted-foreground bg-muted/30 p-2.5 rounded-lg">
                                                                <MapPin className="w-3.5 h-3.5 mr-2 mt-0.5 shrink-0 text-primary" />
                                                                <span className="line-clamp-2">{job.address}</span>
                                                            </div>
                                                        ) : (
                                                            <div className="h-[42px] flex items-center text-sm text-muted-foreground/50 italic px-2">
                                                                No address provided
                                                            </div>
                                                        )}

                                                        <div className="pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                                                            <div className="flex items-center">
                                                                <Calendar className="w-3.5 h-3.5 mr-1.5" />
                                                                {new Date(job.created_at).toLocaleDateString(undefined, {
                                                                    year: 'numeric',
                                                                    month: 'short',
                                                                    day: 'numeric'
                                                                })}
                                                            </div>
                                                            {job.photos && job.photos.length > 0 && (
                                                                <Badge variant="secondary" className="text-xs">
                                                                    {job.photos.length} photos
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
