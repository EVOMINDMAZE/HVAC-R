import { useState } from "react";
import { Calendar, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
            <h3 className="text-sm font-semibold text-foreground">Quick Dispatch</h3>
            <span className="text-xs font-mono text-muted-foreground">#{selectedJobId}</span>
          </div>

          <div className="quick-actions-panel__form">
            <div className="space-y-2">
              <Label htmlFor="technician">Technician</Label>
              <Select value={selectedTech} onValueChange={setSelectedTech}>
                <SelectTrigger id="technician">
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
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleDispatch} disabled={!selectedTech} className="w-full">
              <Wrench className="w-4 h-4 mr-2" />
              Dispatch
            </Button>
          </div>

          <div className="h-px bg-border" />
        </>
      )}

      <div>
        <h4 className="quick-actions-panel__section-title">Schedule New</h4>
        <div className="quick-actions-panel__form">
          <div className="space-y-2">
            <Label htmlFor="client">Client</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger id="client">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client-1">ABC Corp</SelectItem>
                <SelectItem value="client-2">XYZ Industries</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="jobType">Job Type</Label>
            <Select value={jobType} onValueChange={setJobType}>
              <SelectTrigger id="jobType">
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
            <Label htmlFor="datetime">Date & Time</Label>
            <Input
              id="datetime"
              type="datetime-local"
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
            />
          </div>

          <Button
            variant="outline"
            onClick={handleSchedule}
            disabled={!clientId || !jobType || !datetime}
            className="w-full"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Schedule
          </Button>
        </div>
      </div>
    </div>
  );
}