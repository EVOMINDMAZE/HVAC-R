import { Calendar, Wrench } from "lucide-react";
import { useState } from "react";

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
import { cn } from "@/lib/utils";

export interface QuickActionsPanelProps {
  selectedJobId?: string;
  technicians: Array<{ id: string; name: string; available: boolean }>;
  onDispatch?: (jobId: string, techId: string, priority: string, notes: string) => void;
  onSchedule?: (clientId: string, jobType: string, datetime: string) => void;
  className?: string;
}

export function QuickActionsPanel({
  selectedJobId,
  technicians,
  onDispatch,
  onSchedule,
  className,
}: QuickActionsPanelProps) {
  const [selectedTech, setSelectedTech] = useState<string>("");
  const [priority, setPriority] = useState<string>("urgent");
  const [notes] = useState<string>("");
  const [clientId, setClientId] = useState<string>("");
  const [jobType, setJobType] = useState<string>("");
  const [datetime, setDatetime] = useState<string>("");

  const handleDispatch = () => {
    if (selectedJobId && selectedTech && onDispatch) {
      onDispatch(selectedJobId, selectedTech, priority, notes);
    }
  };

  const handleSchedule = () => {
    if (clientId && jobType && datetime && onSchedule) {
      onSchedule(clientId, jobType, datetime);
    }
  };

  const availableTechs = technicians.filter((t) => t.available);

  return (
    <div className={cn("quick-actions-panel", className)} data-testid="quick-actions-panel">
      {selectedJobId && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground/90">Quick Dispatch</h3>
            <span className="text-xs font-mono text-muted-foreground/70">#{selectedJobId}</span>
          </div>

          <div className="quick-actions-panel__form">
            <div className="space-y-2">
              <Label htmlFor="technician" className="text-xs font-medium text-muted-foreground/80">Technician</Label>
              <Select value={selectedTech} onValueChange={setSelectedTech}>
                <SelectTrigger id="technician" className="h-9">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {availableTechs.map((tech) => (
                    <SelectItem key={tech.id} value={tech.id}>
                      {tech.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority" className="text-xs font-medium text-muted-foreground/80">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger id="priority" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleDispatch} disabled={!selectedTech} className="w-full h-9">
              <Wrench className="w-4 h-4 mr-2" />
              Dispatch
            </Button>
          </div>

          <div className="h-px bg-border/50" />
        </>
      )}

      <div>
        <h4 className="quick-actions-panel__section-title">Schedule New</h4>
        <div className="quick-actions-panel__form">
          <div className="space-y-2">
            <Label htmlFor="client" className="text-xs font-medium text-muted-foreground/80">Client</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger id="client" className="h-9">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client-1">ABC Corp</SelectItem>
                <SelectItem value="client-2">XYZ Industries</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="jobType" className="text-xs font-medium text-muted-foreground/80">Job Type</Label>
            <Select value={jobType} onValueChange={setJobType}>
              <SelectTrigger id="jobType" className="h-9">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="repair">Repair</SelectItem>
                <SelectItem value="install">Installation</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="datetime" className="text-xs font-medium text-muted-foreground/80">Date & Time</Label>
            <Input
              id="datetime"
              type="datetime-local"
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
              className="h-9"
            />
          </div>

          <Button
            variant="outline"
            onClick={handleSchedule}
            disabled={!clientId || !jobType || !datetime}
            className="w-full h-9"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Schedule
          </Button>
        </div>
      </div>
    </div>
  );
}