import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Briefcase,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Calendar,
  ArrowLeft,
  Eye,
  Edit,
  MoreHorizontal,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/use-toast";
import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHero } from "@/components/shared/PageHero";
import { StatsRow, type StatItem } from "@/components/shared/StatsRow";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";

interface Job {
  id: string;
  created_at: string;
  client_name: string;
  job_name: string;
  status: "active" | "completed" | "pending";
  address: string | null;
  notes: string | null;
  photos: string[] | null;
  technician_id?: string | null;
}

interface Technician {
  id: string;
  full_name: string | null;
  email: string | null;
  role?: string;
}

export default function Jobs() {
  const { user, role, companyId } = useSupabaseAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newJob, setNewJob] = useState({
    client_name: "",
    job_name: "",
    status: "active" as const,
    address: "",
    notes: "",
    technician_id: "",
  });

  useEffect(() => {
    if (user) {
      fetchJobs();
      if (role !== "client") {
        fetchTechnicians();
      }
    } else if (user === null) {
      setLoading(false);
    }
    const timer = setTimeout(() => {
      if (loading) setLoading(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, [user]);

  const fetchTechnicians = async () => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["technician", "tech"]);

      if (error) throw error;
      if (data) {
        const techs = data.map((t) => ({
          id: t.user_id,
          full_name: `${t.role === "technician" ? "Technician" : "Tech"} (${t.user_id.slice(0, 8)})`,
          email: "technician@example.com",
          role: t.role,
        }));
        setTechnicians(techs);
      }
    } catch (err) {
      console.error("[Jobs] Failed to fetch techs", err);
    }
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading jobs",
        description: "Failed to load jobs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async () => {
    if (!user || !newJob.client_name || !newJob.job_name) {
      toast({
        title: "Missing Information",
        description: "Please provide both a client name and a job name.",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreating(true);
      if (!companyId) throw new Error("You must be assigned to a company to create jobs");

      const { data, error } = await supabase
        .from("jobs")
        .insert({
          user_id: user.id,
          company_id: companyId,
          client_name: newJob.client_name,
          job_name: newJob.job_name,
          status: "pending",
          address: newJob.address || null,
          notes: newJob.notes || null,
          technician_id: newJob.technician_id || null,
          photos: [],
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
        notes: "",
        technician_id: "",
      });
      toast({
        title: "Success",
        description: newJob.technician_id
          ? "Job created and assigned to technician."
          : "Job created successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create job.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch =
        job.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.job_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (job.address && job.address.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === "all" || job.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [jobs, searchTerm, statusFilter]);

  const stats: StatItem[] = useMemo(() => {
    const active = jobs.filter((j) => j.status === "active").length;
    const pending = jobs.filter((j) => j.status === "pending").length;
    const completed = jobs.filter((j) => j.status === "completed").length;

    return [
      {
        id: "total",
        label: "Total Jobs",
        value: jobs.length,
        status: "neutral",
        icon: <Briefcase className="w-4 h-4" />,
      },
      {
        id: "active",
        label: "Active",
        value: active,
        status: "warning",
        icon: <Clock className="w-4 h-4" />,
      },
      {
        id: "pending",
        label: "Pending",
        value: pending,
        status: pending > 5 ? "danger" : "neutral",
        icon: <AlertCircle className="w-4 h-4" />,
      },
      {
        id: "completed",
        label: "Completed",
        value: completed,
        status: "success",
        icon: <CheckCircle2 className="w-4 h-4" />,
      },
    ];
  }, [jobs]);

  const statusConfig: Record<string, { label: string; color: string }> = {
    active: { label: "Active", color: "bg-cyan-100 text-cyan-700 border-cyan-200" },
    pending: { label: "Pending", color: "bg-amber-100 text-amber-700 border-amber-200" },
    completed: { label: "Completed", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  };

  return (
    <PageContainer variant="standard" className="jobs-page">
      <PageHero
        title={role === "client" ? "My Service Jobs" : "Jobs"}
        subtitle={role === "client" ? "Track your service requests and completed visits" : "Track, organize, and assign HVAC service jobs"}
        icon={<Briefcase className="w-5 h-5" />}
        actions={
          <>
            <Button variant="outline" onClick={() => navigate(role === "client" ? "/portal" : "/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            {role !== "client" && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Job
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Create New Job</DialogTitle>
                    <DialogDescription>
                      Enter the details for the new service job assignment.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="client-name">Client Name</Label>
                        <Input
                          id="client-name"
                          placeholder="John Doe"
                          value={newJob.client_name}
                          onChange={(e) => setNewJob({ ...newJob, client_name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="job-name">Job Title</Label>
                        <Input
                          id="job-name"
                          placeholder="AC Repair - Unit 2"
                          value={newJob.job_name}
                          onChange={(e) => setNewJob({ ...newJob, job_name: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="technician">Assign Technician</Label>
                        <Select
                          value={newJob.technician_id || "unassigned"}
                          onValueChange={(val) => setNewJob({ ...newJob, technician_id: val === "unassigned" ? "" : val })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {technicians.map((tech) => (
                              <SelectItem key={tech.id} value={tech.id}>
                                {tech.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select value={newJob.status} onValueChange={(val: any) => setNewJob({ ...newJob, status: val })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Service Address</Label>
                      <Input
                        id="address"
                        placeholder="123 Main St, City, ST"
                        value={newJob.address}
                        onChange={(e) => setNewJob({ ...newJob, address: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        placeholder="Description of the issue..."
                        value={newJob.notes}
                        onChange={(e) => setNewJob({ ...newJob, notes: e.target.value })}
                        className="min-h-[80px]"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateJob} disabled={creating}>
                      {creating ? "Creating..." : "Create Job"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </>
        }
      />

      <StatsRow stats={stats} columns={4} />

      <div className="jobs-page__toolbar">
        <div className="jobs-page__search">
          <Search className="jobs-page__search-icon w-4 h-4" />
          <input
            type="text"
            placeholder="Search by job title, client, or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="jobs-page__search-input"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="jobs-page__filter w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="jobs-page__content">
        {loading ? (
          <div className="jobs-page__loading">
            <div className="jobs-page__loading-spinner" />
            <span>Loading jobs...</span>
          </div>
        ) : filteredJobs.length === 0 ? (
          <EmptyState
            icon={<Briefcase className="w-12 h-12" />}
            title="No jobs found"
            description={searchTerm || statusFilter !== "all" ? "Try adjusting your filters" : "Create your first job to get started"}
            action={(!searchTerm && statusFilter === "all" && role !== "client") ? { label: "Create Job", onClick: () => setIsDialogOpen(true) } : undefined}
          />
        ) : (
          <div className="jobs-page__grid">
            {filteredJobs.map((job) => {
              const status = statusConfig[job.status] ?? statusConfig.pending!;
              return (
                <div
                  key={job.id}
                  className="job-card"
                  onClick={() => navigate(`/dashboard/jobs/${job.id}`)}
                >
                  <div className="job-card__header">
                    <span className={cn("job-card__status", status.color)}>
                      {status.label}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <button className="job-card__menu">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/jobs/${job.id}`); }}>
                          <Eye className="w-4 h-4 mr-2" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/jobs/${job.id}?edit=true`); }}>
                          <Edit className="w-4 h-4 mr-2" /> Edit
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="job-card__body">
                    <h3 className="job-card__title">{job.job_name}</h3>
                    <p className="job-card__client">{job.client_name}</p>
                  </div>

                  <div className="job-card__meta">
                    {job.address && (
                      <div className="job-card__meta-item">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{job.address}</span>
                      </div>
                    )}
                    <div className="job-card__meta-item">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(job.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageContainer>
  );
}