import { describe, it, expect, vi, beforeEach } from "vitest";
import { trackMarketingEvent } from "./marketingAnalytics";

describe("trackMarketingEvent", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.dataLayer = [];
    window.gtag = vi.fn();
  });

  it("pushes event payload to dataLayer with context", () => {
    vi.spyOn(window, "innerWidth", "get").mockReturnValue(1280);

    trackMarketingEvent("landing_hero_primary_click", {
      section: "hero",
      destination: "/signup",
    });

    expect(window.dataLayer).toHaveLength(1);
    const pushed = window.dataLayer?.[0] as Record<string, unknown>;
    expect(pushed.event).toBe("landing_hero_primary_click");
    expect(pushed.device).toBe("desktop");
    expect(pushed.section).toBe("hero");
    expect(pushed.destination).toBe("/signup");
    expect(typeof pushed.timestamp).toBe("string");
  });

  it("calls gtag with matching payload", () => {
    const gtagMock = window.gtag as ReturnType<typeof vi.fn>;
    vi.spyOn(window, "innerWidth", "get").mockReturnValue(390);

    trackMarketingEvent("pricing_plan_cta_click", {
      section: "plan_card",
      plan: "pro",
      destination: "stripe_checkout",
    });

    expect(gtagMock).toHaveBeenCalledTimes(1);
    expect(gtagMock).toHaveBeenCalledWith(
      "event",
      "pricing_plan_cta_click",
      expect.objectContaining({
        device: "mobile",
        section: "plan_card",
        plan: "pro",
        destination: "stripe_checkout",
      }),
    );
  });
});
