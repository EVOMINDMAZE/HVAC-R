import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useJob } from "@/context/JobContext";
import { ArrowLeft, MapPin, Calendar, User, FileText, CheckCircle, Activity, Clock } from "lucide-react";

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

export default function JobDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { selectJob, currentJob } = useJob();
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchJob(id);
        }
    }, [id]);

    const fetchJob = async (jobId: string) => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('jobs')
                .select('*')
                .eq('id', jobId)
                .single();

            if (error) throw error;
            setJob(data);
        } catch (error: any) {
            console.error('Error fetching job:', error);
            toast({
                title: "Error",
                description: "Failed to load job details.",
                variant: "destructive",
            });
            navigate('/jobs');
        } finally {
            setLoading(false);
        }
    };

    const handleSetActive = () => {
        if (job) {
            selectJob({
                id: job.id,
                name: job.job_name,
                address: job.address || undefined,
                status: job.status
            });
            toast({
                title: "Context Updated",
                description: `${job.job_name} is now the active job.`,
            });
            navigate('/dashboard');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!job) return null;

    const isActive = currentJob?.id === job.id;

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/jobs')}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">{job.job_name}</h1>
                            <div className="flex items-center text-muted-foreground mt-1">
                                <User className="w-4 h-4 mr-1" />
                                <span>{job.client_name}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge variant={job.status === 'active' ? 'default' : 'secondary'} className="text-sm px-3 py-1 capitalize">
                            {job.status}
                        </Badge>
                        <Button
                            variant={isActive ? "secondary" : "default"}
                            onClick={handleSetActive}
                            disabled={isActive}
                        >
                            {isActive ? (
                                <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Active Context
                                </>
                            ) : (
                                <>
                                    <Activity className="w-4 h-4 mr-2" />
                                    Set as Active Job
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Column: Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Job Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-muted-foreground">Address</label>
                                        <div className="flex items-start">
                                            <MapPin className="w-4 h-4 mr-2 mt-1 text-primary" />
                                            <span>{job.address || "No address provided"}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-muted-foreground">Created Date</label>
                                        <div className="flex items-center">
                                            <Calendar className="w-4 h-4 mr-2 text-primary" />
                                            <span>{new Date(job.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1 pt-2">
                                    <label className="text-sm font-medium text-muted-foreground">Notes</label>
                                    <div className="bg-muted/50 p-4 rounded-md text-sm whitespace-pre-wrap">
                                        {job.notes || "No notes available."}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Tabs defaultValue="photos">
                            <TabsList>
                                <TabsTrigger value="photos">Photos</TabsTrigger>
                                <TabsTrigger value="docs">Documents</TabsTrigger>
                                <TabsTrigger value="history">History</TabsTrigger>
                            </TabsList>
                            <TabsContent value="photos" className="mt-4">
                                <Card>
                                    <CardContent className="p-6">
                                        {job.photos && job.photos.length > 0 ? (
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {job.photos.map((photo, index) => (
                                                    <div key={index} className="aspect-square bg-muted rounded-md overflow-hidden relative group">
                                                        <img src={photo} alt={`Job photo ${index + 1}`} className="w-full h-full object-cover" />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 text-muted-foreground">
                                                <div className="bg-muted/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <FileText className="w-8 h-8 opacity-50" />
                                                </div>
                                                <p>No photos uploaded yet.</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            <TabsContent value="docs" className="mt-4">
                                <div className="text-center py-12 text-muted-foreground">
                                    <p>Document management coming soon.</p>
                                </div>
                            </TabsContent>
                            <TabsContent value="history" className="mt-4">
                                <div className="text-center py-12 text-muted-foreground">
                                    <p>Job history tracking coming soon.</p>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Right Column: Actions / Status */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/estimate-builder')}>
                                    <FileText className="w-4 h-4 mr-2" />
                                    Create Estimate
                                </Button>
                                <Button variant="outline" className="w-full justify-start" disabled>
                                    <Clock className="w-4 h-4 mr-2" />
                                    Log Hours (Soon)
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                </div>
            </div>
        </div>
    );
}
