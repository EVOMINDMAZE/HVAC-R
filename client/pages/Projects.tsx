import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  FolderOpen,
  Calculator,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useSupabaseCalculations } from "@/hooks/useSupabaseCalculations";
import { PageHero } from "@/components/shared/PageHero";
import { StatsRow, type StatItem } from "@/components/shared/StatsRow";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";

export default function Projects() {
  const { calculations, saveCalculation } = useSupabaseCalculations();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const projects = useMemo(
    () => calculations.filter((c) => (c.calculation_type || "").toLowerCase() === "project"),
    [calculations]
  );

  const attachable = useMemo(
    () => calculations.filter((c) => (c.calculation_type || "").toLowerCase() !== "project"),
    [calculations]
  );

  const stats: StatItem[] = useMemo(() => [
    {
      id: "projects",
      label: "Projects",
      value: projects.length,
      status: "neutral",
      icon: <FolderOpen className="w-4 h-4" />,
    },
    {
      id: "attachable",
      label: "Attachable Items",
      value: attachable.length,
      status: "success",
      icon: <Calculator className="w-4 h-4" />,
    },
    {
      id: "selected",
      label: "Selected",
      value: selectedIds.length,
      status: selectedIds.length > 0 ? "warning" : "neutral",
      icon: <CheckCircle2 className="w-4 h-4" />,
    },
  ], [projects, attachable, selectedIds]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const createProject = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const inputs = {
        name: name.trim(),
        description: desc.trim(),
        items: selectedIds,
      };
      const results = { status: "active", itemsCount: selectedIds.length };
      await saveCalculation("Project", inputs, results, name.trim());
      setName("");
      setDesc("");
      setSelectedIds([]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer variant="standard" className="projects-page">
      <PageHero
        title="Projects"
        subtitle="Group calculations and estimates into reusable client project folders"
        icon={<FolderOpen className="w-5 h-5" />}
        actions={
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        }
      />

      <StatsRow stats={stats} columns={3} />

      <div className="projects-page__content">
        <div className="projects-page__form">
          <div className="projects-page__section">
            <h3 className="projects-page__section-title">Create Project</h3>
            <div className="projects-page__fields">
              <div className="projects-page__field">
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Quarterly maintenance package"
                />
              </div>
              <div className="projects-page__field">
                <Label htmlFor="project-description">Description</Label>
                <Input
                  id="project-description"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Scope and notes"
                />
              </div>
            </div>
          </div>

          <div className="projects-page__section">
            <h3 className="projects-page__section-title">
              Attach Existing Items
              {selectedIds.length > 0 && (
                <span className="projects-page__section-badge">{selectedIds.length} selected</span>
              )}
            </h3>
            <div className="projects-page__items-list">
              {attachable.length === 0 ? (
                <p className="projects-page__items-empty">
                  No calculations available to attach.
                </p>
              ) : (
                attachable.map((item) => (
                  <label
                    key={item.id}
                    className={cn(
                      "projects-page__item",
                      selectedIds.includes(item.id) && "projects-page__item--selected"
                    )}
                  >
                    <input
                      type="checkbox"
                      className="projects-page__item-checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => toggleSelect(item.id)}
                    />
                    <div className="projects-page__item-content">
                      <p className="projects-page__item-name">{item.name || item.calculation_type}</p>
                      <p className="projects-page__item-date">
                        <Clock className="w-3 h-3" />
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="secondary" className="projects-page__item-badge">
                      {item.calculation_type}
                    </Badge>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="projects-page__actions">
            <Button onClick={createProject} disabled={saving || !name.trim()} size="lg">
              <Plus className="w-4 h-4 mr-2" />
              {saving ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </div>

        <div className="projects-page__list">
          <h3 className="projects-page__list-title">Saved Projects</h3>
          {projects.length === 0 ? (
            <EmptyState
              icon={<FolderOpen className="w-12 h-12" />}
              title="No projects yet"
              description="Create one to start grouping recurring calculations"
            />
          ) : (
            <div className="projects-page__projects">
              {projects.map((project) => {
                const count =
                  project.results?.itemsCount ??
                  (Array.isArray(project.inputs?.items) ? project.inputs.items.length : 0);
                return (
                  <div key={project.id} className="project-card">
                    <div className="project-card__header">
                      <h4 className="project-card__name">
                        {project.name || project.inputs?.name || "Project"}
                      </h4>
                      <Badge variant="outline">{count} items</Badge>
                    </div>
                    <p className="project-card__date">
                      <Clock className="w-3 h-3" />
                      {new Date(project.created_at).toLocaleDateString()}
                    </p>
                    {project.inputs?.description && (
                      <p className="project-card__description">{project.inputs.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}