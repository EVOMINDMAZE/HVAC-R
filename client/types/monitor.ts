export type MonitorDataState = "ready" | "loading" | "empty" | "error";

export type MonitorTone = "default" | "success" | "warning" | "danger" | "info";

export type MonitorLayoutTemplate =
  | "executive"
  | "pipeline"
  | "network"
  | "tool"
  | "auth"
  | "public";

export type MonitorAccent =
  | "cyan"
  | "blue"
  | "amber"
  | "emerald"
  | "violet"
  | "orange"
  | "slate";

export type MonitorPattern =
  | "grid"
  | "radar"
  | "circuit"
  | "pipeline"
  | "constellation";

export type MonitorIconKey =
  | "activity"
  | "gauge"
  | "route"
  | "siren"
  | "briefcase"
  | "users"
  | "truck"
  | "layers"
  | "shieldCheck"
  | "hardHat"
  | "mapPin"
  | "settings"
  | "sparkles";

export interface MonitorPresentation {
  template: MonitorLayoutTemplate;
  accent: MonitorAccent;
  pattern: MonitorPattern;
  icon: MonitorIconKey;
  signatureLabel: string;
  modeLabel: string;
  defaultExpanded?: boolean;
}

export interface MonitorKpiItem {
  id: string;
  label: string;
  value: string | number;
  sublabel?: string;
  trend?: number;
  tone?: MonitorTone;
}

export interface MonitorSeriesPoint {
  label: string;
  value: number;
}

export interface MonitorSeries {
  id: string;
  title: string;
  description?: string;
  unit?: string;
  points: MonitorSeriesPoint[];
}

export interface MonitorDiagramNode {
  id: string;
  label: string;
  value: string;
  tone?: MonitorTone;
}

export interface MonitorDiagramItem {
  id: string;
  title: string;
  description?: string;
  nodes: MonitorDiagramNode[];
}

export interface MonitorPageModel {
  id: string;
  title: string;
  subtitle?: string;
  state: MonitorDataState;
  sourceLabel?: string;
  updatedAt?: string;
  emptyMessage?: string;
  errorMessage?: string;
  presentation?: MonitorPresentation;
  kpis: MonitorKpiItem[];
  series?: MonitorSeries;
  diagram?: MonitorDiagramItem;
}
