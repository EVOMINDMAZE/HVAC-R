export type MarketingEventName =
  | "landing_view"
  | "landing_capability_matrix_view"
  | "landing_view_all_tools_click"
  | "landing_hero_primary_click"
  | "landing_hero_secondary_click"
  | "landing_segment_path_click"
  | "landing_inventory_toggle"
  | "landing_pricing_cta_click"
  | "landing_workflow_view"
  | "features_view"
  | "features_primary_click"
  | "features_secondary_click"
  | "pricing_view"
  | "pricing_interval_toggle"
  | "pricing_plan_cta_click";

export type MarketingEventPayload = {
  section?: string;
  segment?: string;
  destination?: string;
  plan?: string;
};

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackMarketingEvent(
  eventName: MarketingEventName,
  payload: MarketingEventPayload = {},
) {
  if (typeof window === "undefined") return;

  const device = window.innerWidth < 768 ? "mobile" : "desktop";
  const eventPayload = {
    device,
    section: payload.section,
    segment: payload.segment,
    destination: payload.destination,
    plan: payload.plan,
    timestamp: new Date().toISOString(),
  };

  window.dataLayer?.push({ event: eventName, ...eventPayload });

  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, eventPayload);
  }
}
