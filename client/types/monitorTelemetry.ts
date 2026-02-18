export interface MonitorOpsTelemetrySnapshot {
  updatedAt: string;
  scope: {
    pathname: string;
    companyId: string | null;
    userId: string | null;
  };
  jobs: null | {
    total: number | null;
    pending: number | null;
    enRoute: number | null;
    onSite: number | null;
    completed: number | null;
    cancelled: number | null;
    assigned: number | null;
    unassigned: number | null;
    scheduledToday: number | null;
    assignedToMeOpen: number | null;
    createdAtLast7d: string[];
  };
  clients: null | {
    total: number | null;
    createdAtLast7d: string[];
  };
  triage: null | {
    total: number | null;
    new: number | null;
    analyzed: number | null;
    converted: number | null;
    archived: number | null;
    createdAtLast7d: string[];
  };
  team: null | {
    members: number | null;
    technicians: number | null;
  };
  errors: string[];
}

