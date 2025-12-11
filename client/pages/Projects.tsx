import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useSupabaseCalculations } from "@/hooks/useSupabaseCalculations";
import { Plus, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Projects() {
  const { calculations, saveCalculation } = useSupabaseCalculations();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const projects = useMemo(
    () =>
      calculations.filter(
        (c) => (c.calculation_type || "").toLowerCase() === "project",
      ),
    [calculations],
  );
  const attachable = useMemo(
    () =>
      calculations.filter(
        (c) => (c.calculation_type || "").toLowerCase() !== "project",
      ),
    [calculations],
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900">
      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        <Button
          variant="ghost"
          className="mb-2 pl-0 hover:bg-transparent hover:text-blue-600 dark:hover:text-blue-400"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Personal Project Dashboard
          </h1>
          <Badge variant="outline">Projects: {projects.length}</Badge>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Create Project</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Project name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label>Attach items</Label>
                <div className="mt-2 max-h-64 overflow-auto border rounded bg-background dark:bg-slate-800 dark:border-slate-700">
                  {attachable.map((c) => (
                    <label
                      key={c.id}
                      className="flex items-center gap-2 p-2 border-b dark:border-slate-700 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={selectedIds.includes(c.id)}
                        onChange={() => toggleSelect(c.id)}
                      />
                      <div className="flex-1">
                        <div className="text-sm font-semibold truncate">
                          {c.name || `${c.calculation_type}`}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {new Date(c.created_at).toLocaleString()}
                        </div>
                      </div>
                      <Badge variant="secondary">{c.calculation_type}</Badge>
                    </label>
                  ))}
                </div>
              </div>
              <Button
                onClick={createProject}
                disabled={saving || !name.trim()}
                className="inline-flex items-center gap-2"
              >
                <Plus className="h-4 w-4" /> Create Project
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Projects</CardTitle>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No projects yet
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.map((p) => (
                    <div key={p.id} className="p-3 rounded border bg-card dark:border-slate-700">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold truncate">
                          {p.name || p.inputs?.name || "Project"}
                        </div>
                        <Badge variant="outline">
                          {p.results?.itemsCount ??
                            (Array.isArray(p.inputs?.items)
                              ? p.inputs.items.length
                              : 0)}{" "}
                          items
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(p.created_at).toLocaleString()}
                      </div>
                      <div className="text-sm mt-2">
                        {p.inputs?.description || ""}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
