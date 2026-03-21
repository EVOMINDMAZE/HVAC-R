import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Plus,
  Search,
  MapPin,
  Calendar,
  Briefcase,
  User,
  FileText,
  Loader2,
  ArrowLeft,
  Filter,
  HardHat,
  LayoutGrid,
  Rows3,
  ChevronDown,
  Eye,
} from "lucide-react";
import { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";

import { AppFeedbackState } from "@/components/app/AppFeedbackState";
import { AppPageHeader } from "@/components/app/AppPageHeader";
import { AppSectionCard } from "@/components/app/AppSectionCard";
import { PageContainer } from "@/components/PageContainer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { useToast } from "@/hooks/use-toast";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { supabase } from "@/lib/supabase";

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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"cards" | "compact">("compact");
  const [technicians, setTechnicians] = useState<Technician[]>([]); // Store technicians
  const prefersReducedMotion = useReducedMotion();

  // New Job State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newJob, setNewJob] = useState({
    client_name: "",
    job_name: "",
    status: "active" as const,
    address: "",
    notes: "",
    technician_id: "" as string, // Add technician_id
  });

  useEffect(() => {
    if (user) {
      fetchJobs();
      // Only fetch technicians if NOT a client (security/privacy)
      if (role !== "client") {
        fetchTechnicians();
      }
    } else if (user === null) {
      // If user is explicitly null (not loading), we should stop the spinner
      setLoading(false);
    }

    // Safety Timeout: Force loading to false after 5s if anything hangs
    const timer = setTimeout(() => {
      if (loading) {
        console.warn("[Jobs] Safety timeout reached. Forcing loading false.");
        setLoading(false);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [user]);

  const fetchTechnicians = async () => {
    try {
      console.log("[Jobs] Fetching technicians from user_roles...");
      // profiles table doesn't exist, use user_roles instead
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["technician", "tech"]);

      console.log("[Jobs] Technicians query result:", { data, error });

      if (error) {
        console.error("[Jobs] Error fetching technicians:", error);
        // Fallback or silent fail if table setup is incomplete
      } else if (data) {
        // Transform to match Technician interface
        const techs = data.map((t: any) => ({
          id: t.user_id,
          full_name: `${t.role === "technician" ? "Technician" : "Tech"} (${t.user_id.slice(0, 8)})`,
          email: "technician@example.com",
          role: t.role,
        }));
        console.log("[Jobs] Setting technicians:", techs.length);
        setTechnicians(techs);
      } else {
        console.log("[Jobs] No technicians data returned");
        setTechnicians([]);
      }
    } catch (err) {
      console.error("[Jobs] Failed to fetch techs", err);
    }
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setLoadError(null);

      // Create a promise for the Supabase query
      const jobsPromise = supabase
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false });

      // Create a timeout promise to prevents indefinite spinners
      const timeoutPromise = new Promise<{ data: null; error: any }>(
        (_, reject) => {
          setTimeout(() => reject(new Error("Request timed out")), 10000);
        },
      );

      // Race them
      const { data, error } = (await Promise.race([
        jobsPromise,
        timeoutPromise,
      ])) as any;

      if (error) throw error;
      setJobs(data || []);
    } catch (error: any) {
      console.error("Error fetching jobs:", error);
      setLoadError(
        error.message === "Request timed out"
          ? "Loading jobs is taking longer than expected. Please check your connection and retry."
          : "We couldn’t load jobs right now. Please try again.",
      );
      toast({
        title: "Error loading jobs",
        description:
          error.message === "Request timed out"
            ? "Network request timed out. Please check your connection."
            : "Failed to load jobs. Please try again.",
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
      if (!companyId) {
        throw new Error("You must be assigned to a company to create jobs");
      }
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
      console.error("Error creating job:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create job.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.job_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (job.address &&
        job.address.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "all" || job.status === statusFilter;

    return matchesSearch && matchesStatus;
  });
  const activeJobs = jobs.filter((job) => job.status === "active").length;
  const pendingJobs = jobs.filter((job) => job.status === "pending").length;
  const completedJobs = jobs.filter((job) => job.status === "completed").length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-200 border-cyan-200 dark:border-cyan-800";
      case "completed":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800";
      case "pending":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200 border-amber-200 dark:border-amber-800";
      case "assigned":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200 border-purple-200 dark:border-purple-800";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  return (
    <PageContainer variant="standard" className="app-stack-24">
      <AppPageHeader
        kicker="Work"
        title={role === "client" ? "My Service Jobs" : "Open Jobs"}
        subtitle={
          role === "client"
            ? "Track your active requests and completed service visits."
            : "Track, organize, and assign HVAC service jobs across your team."
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(role === "client" ? "/portal" : "/dashboard")}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            {role !== "client" ? (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4" /> Create Job
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
                      onChange={(e) =>
                        setNewJob({ ...newJob, client_name: e.target.value })
                      }
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="job-name">Job Title</Label>
                    <Input
                      id="job-name"
                      placeholder="e.g. AC Repair - Unit 2"
                      value={newJob.job_name}
                      onChange={(e) =>
                        setNewJob({ ...newJob, job_name: e.target.value })
                      }
                      className="bg-background"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={newJob.status}
                      onValueChange={(val: any) =>
                        setNewJob({ ...newJob, status: val })
                      }
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Technician Assignment */}
                  <div className="space-y-2">
                    <Label htmlFor="technician">Assign Technician</Label>
                    <Select
                      value={newJob.technician_id || "unassigned"}
                      onValueChange={(val) =>
                        setNewJob({
                          ...newJob,
                          technician_id: val === "unassigned" ? "" : val,
                        })
                      }
                    >
                      <SelectTrigger className="bg-background">
                        <div className="flex items-center gap-2">
                          <HardHat className="w-4 h-4 text-muted-foreground" />
                          <SelectValue placeholder="Select Technician" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">
                          -- Unassigned --
                        </SelectItem>
                        {technicians.length > 0 ? (
                          technicians.map((tech) => (
                            <SelectItem key={tech.id} value={tech.id}>
                              {tech.full_name || tech.email || "Unknown Tech"}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-xs text-muted-foreground">
                            No technicians found
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Service Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="address"
                      placeholder="123 Main St, City, ST"
                      value={newJob.address}
                      onChange={(e) =>
                        setNewJob({ ...newJob, address: e.target.value })
                      }
                      className="pl-10 bg-background"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Job Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Detailed description of the issue or required service..."
                    value={newJob.notes}
                    onChange={(e) =>
                      setNewJob({ ...newJob, notes: e.target.value })
                    }
                    className="min-h-[100px] bg-background"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={creating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateJob}
                  disabled={creating}
                  className="bg-primary hover:bg-primary/90"
                >
                  {creating ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Create Job
                </Button>
              </DialogFooter>
            </DialogContent>
              </Dialog>
            ) : (
              <Button onClick={() => navigate("/triage")}>
                <Plus className="h-4 w-4" /> Request Service
              </Button>
            )}
          </div>
        }
      />

      <AppSectionCard className="mb-2">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="outline" className="bg-background">Total {jobs.length}</Badge>
              <Badge variant="outline" className="bg-background text-cyan-700 dark:text-cyan-300">Active {activeJobs}</Badge>
              <Badge variant="outline" className="bg-background text-amber-700 dark:text-amber-300">Pending {pendingJobs}</Badge>
              <Badge variant="outline" className="bg-background text-emerald-700 dark:text-emerald-300">Completed {completedJobs}</Badge>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by job title, client name, or address..."
                className="pl-10 bg-background border-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-[200px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-background border-input">
                  <div className="flex items-center">
                    <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Filter by status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="inline-flex w-full sm:w-auto rounded-md border border-input bg-background p-1">
              <Button
                type="button"
                variant={viewMode === "compact" ? "default" : "ghost"}
                size="sm"
                className="gap-2"
                onClick={() => setViewMode("compact")}
              >
                <Rows3 className="h-4 w-4" />
                Compact
              </Button>
              <Button
                type="button"
                variant={viewMode === "cards" ? "default" : "ghost"}
                size="sm"
                className="gap-2"
                onClick={() => setViewMode("cards")}
              >
                <LayoutGrid className="h-4 w-4" />
                Cards
              </Button>
            </div>
            </div>
          </div>
        </CardContent>
      </AppSectionCard>

      {loading ? (
        <AppFeedbackState
          variant="loading"
          title="Loading jobs"
          description="Syncing active jobs, assignments, and customer records."
        />
      ) : loadError ? (
        <AppFeedbackState
          variant="error"
          title="Unable to load jobs"
          description={loadError}
          action={{ label: "Try again", onClick: fetchJobs }}
        />
      ) : (
        <div className="min-h-[300px]">
          <AnimatePresence mode="popLayout">
            {filteredJobs.length === 0 ? (
              <motion.div
                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.16 }}
              >
                <AppFeedbackState
                  variant="empty"
                  icon={<Briefcase className="w-8 h-8 text-muted-foreground" />}
                  title={searchTerm || statusFilter !== "all" ? "No jobs match these filters" : "No jobs yet"}
                  description={
                    searchTerm || statusFilter !== "all"
                      ? "Try a broader search, clear filters, or check another status bucket."
                      : "Get started by creating your first job assignment."
                  }
                  action={{
                    label: searchTerm || statusFilter !== "all" ? "Clear filters" : "Create your first job",
                    onClick: () => {
                      if (searchTerm || statusFilter !== "all") {
                        setSearchTerm("");
                        setStatusFilter("all");
                        return;
                      }
                      setIsDialogOpen(true);
                    },
                  }}
                />
              </motion.div>
            ) : viewMode === "cards" ? (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                layout
              >
                {filteredJobs.map((job) => (
                  <motion.div
                    key={job.id}
                    layout
                    initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.16 }}
                  >
                    <Card
                      className="h-full bg-gradient-to-br from-card to-card/80 backdrop-blur-sm border-border/60 hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-0.5 motion-interactive motion-card-feedback group cursor-pointer transition-all duration-300"
                      onClick={() => navigate(`/dashboard/jobs/${job.id}`)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start mb-3">
                          <Badge
                            variant="outline"
                            className={`${getStatusColor(job.status)} border px-2.5 py-0.5 capitalize shadow-sm font-medium text-[11px]`}
                          >
                            {job.status}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-100 hover:bg-muted/80 hover:scale-110 motion-interactive-micro transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/dashboard/jobs/${job.id}`)
                            }}
                          >
                            <FileText className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </div>
                        <CardTitle className="text-lg font-semibold text-foreground line-clamp-1 group-hover:text-primary motion-interactive-micro transition-colors">
                          {job.job_name}
                        </CardTitle>
                        <div className="flex items-center mt-1.5 text-sm text-muted-foreground/80">
                          <User className="w-3.5 h-3.5 mr-1.5 text-primary/60" />
                          <span className="font-medium">{job.client_name}</span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {job.address ? (
                            <div className="flex items-start text-sm text-muted-foreground/80 bg-muted/30 p-2.5 rounded-xl border border-transparent hover:border-muted/50 transition-colors">
                              <MapPin className="w-3.5 h-3.5 mr-2 mt-0.5 shrink-0 text-primary/60" />
                              <span className="line-clamp-2">
                                {job.address}
                              </span>
                            </div>
                          ) : (
                            <div className="h-[42px] flex items-center text-sm text-muted-foreground/50 italic px-2">
                              No address provided
                            </div>
                          )}

                          <div className="pt-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground/70">
                            <div className="flex items-center">
                              <Calendar className="w-3.5 h-3.5 mr-1.5 text-primary/50" />
                              {new Date(job.created_at).toLocaleDateString(
                                undefined,
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                },
                              )}
                            </div>
                            {job.photos && job.photos.length > 0 && (
                              <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary/80 hover:bg-primary/15">
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
            ) : (
              <motion.div className="space-y-3" layout>
                {filteredJobs.map((job) => (
                  <motion.div
                    key={job.id}
                    layout
                    initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.16 }}
                  >
                    <Card className="border-border/60 bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300">
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={`${getStatusColor(job.status)} border px-2.5 py-0.5 capitalize font-medium text-[11px] shadow-sm`}>
                                {job.status}
                              </Badge>
                              <h3 className="truncate font-semibold text-foreground text-sm">{job.job_name}</h3>
                            </div>
                            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground/70">
                              <span className="inline-flex items-center"><User className="mr-1 h-3.5 w-3.5 text-primary/60" />{job.client_name}</span>
                              <span className="inline-flex items-center"><Calendar className="mr-1 h-3.5 w-3.5 text-primary/50" />{new Date(job.created_at).toLocaleDateString()}</span>
                              {job.photos && job.photos.length > 0 ? <span className="text-muted-foreground/50">{job.photos.length} photos</span> : null}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2 h-8 text-xs hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all"
                              onClick={() => navigate(`/dashboard/jobs/${job.id}`)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Open
                            </Button>
                          </div>
                        </div>
                        <Collapsible className="mt-3 border-t border-border/40 pt-3">
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-2 px-0 text-xs text-muted-foreground/70 hover:text-foreground transition-colors">
                              More details
                              <ChevronDown className="h-3.5 w-3.5 transition-transform" />
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="pt-2">
                            <div className="space-y-2 text-sm text-muted-foreground/70">
                              <div className="inline-flex items-start">
                                <MapPin className="mr-2 mt-0.5 h-3.5 w-3.5 text-primary/50" />
                                {job.address || "No address provided"}
                              </div>
                              {job.notes ? (
                                <p className="line-clamp-2">{job.notes}</p>
                              ) : null}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </PageContainer>
  );
}
