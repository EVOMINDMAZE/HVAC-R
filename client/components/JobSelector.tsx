import { useEffect, useState } from "react";
import { useJob, Job } from "@/context/JobContext";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { supabase } from "@/lib/supabase";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PlusCircle, Briefcase } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/useToast";

export function JobSelector() {
    const { currentJob, selectJob, clearJob } = useJob();
    const { user } = useSupabaseAuth();
    const { addToast } = useToast();
    const [projects, setProjects] = useState<Job[]>([]);
    const [loading, setLoading] = useState(false);
    const [openNewProject, setOpenNewProject] = useState(false);
    const [newProjectName, setNewProjectName] = useState("");
    const [newProjectAddress, setNewProjectAddress] = useState("");

    const fetchProjects = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from("calculations")
            .select("*")
            .eq("calculation_type", "project")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching projects:", error);
        } else {
            setProjects(data || []);
        }
    };

    useEffect(() => {
        if (user) {
            fetchProjects();
        } else {
            setProjects([]);
        }
    }, [user]);

    const handleCreateProject = async () => {
        if (!newProjectName.trim() || !user) return;
        setLoading(true);

        const { data, error } = await supabase
            .from("calculations")
            .insert([
                {
                    name: newProjectName,
                    calculation_type: "project",
                    inputs: {
                        name: newProjectName,
                        address: newProjectAddress,
                    },
                    user_id: user.id
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('[JobSelector] Error creating project:', error);
            addToast({
                type: "error",
                title: "Error creating project",
                description: error.message,
            });
        } else {
            addToast({
                type: "success",
                title: "Project Created",
                description: `Switched to ${data.name}`,
            });
            // @ts-ignore
            setProjects([data, ...projects]);
            selectJob(data);
            setOpenNewProject(false);
            setNewProjectName("");
            setNewProjectAddress("");
        }
        setLoading(false);
    };

    // If user is not logged in, don't show the selector
    if (!user) return null;

    return (
        <div className="flex items-center gap-2">
            <Dialog open={openNewProject} onOpenChange={setOpenNewProject}>
                <Select
                    value={currentJob?.id || "no-job"}
                    onValueChange={(value) => {
                        if (value === "create_new") {
                            setOpenNewProject(true);
                            return;
                        }
                        if (value === "no-job") {
                            clearJob();
                            return;
                        }
                        const selected = projects.find(p => p.id === value);
                        if (selected) selectJob(selected);
                    }}
                >
                    <SelectTrigger className="w-[180px] md:w-[240px] h-9 bg-background/50 backdrop-blur-sm border-primary/20 text-xs md:text-sm">
                        <div className="flex items-center gap-2 truncate">
                            <Briefcase className="h-3 md:h-4 w-3 md:w-4 text-primary shrink-0" />
                            <span className="truncate text-left block flex-1">
                                {currentJob ? currentJob.name : "Select Active Job"}
                            </span>
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="no-job">
                            <span className="text-muted-foreground italic">No Active Job</span>
                        </SelectItem>
                        {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                                {project.name}
                            </SelectItem>
                        ))}
                        <SelectItem value="create_new" className="text-primary focus:text-primary font-medium border-t mt-1 cursor-pointer">
                            <div className="flex items-center">
                                <PlusCircle className="mr-2 h-3.5 w-3.5" />
                                Create New Project...
                            </div>
                        </SelectItem>
                    </SelectContent>
                </Select>

                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Start New Project</DialogTitle>
                        <DialogDescription>
                            Create a job to track calculations, skills, and generate certificates.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Project Name</Label>
                            <Input
                                id="name"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                placeholder="e.g. Smith Residence - Install"
                                autoFocus
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="address">Address (Optional)</Label>
                            <Input
                                id="address"
                                value={newProjectAddress}
                                onChange={(e) => setNewProjectAddress(e.target.value)}
                                placeholder="123 Main St, City, State"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenNewProject(false)}>Cancel</Button>
                        <Button onClick={handleCreateProject} disabled={loading || !newProjectName.trim()}>
                            {loading ? "Creating..." : "Create Project"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
