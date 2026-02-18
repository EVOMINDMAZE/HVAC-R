import { describe, expect, it } from "vitest";
import {
  resolveFutureMonitorsFlag,
  type FutureMonitorFlagOptions,
  resolveFutureMonitorsSkin,
  withPersistedUiFlags,
} from "@/lib/featureFlags";

function resolve(options: FutureMonitorFlagOptions) {
  return resolveFutureMonitorsFlag(options);
}

describe("featureFlags", () => {
  it("defaults future monitors to enabled when env is missing or invalid", () => {
    expect(resolve({ envValue: undefined, search: "" })).toBe(true);
    expect(resolve({ envValue: "unknown", search: "" })).toBe(true);
  });

  it("uses environment value by default", () => {
    expect(resolve({ envValue: "true", search: "" })).toBe(true);
    expect(resolve({ envValue: "false", search: "" })).toBe(false);
  });

  it("supports truthy and falsy environment aliases", () => {
    expect(resolve({ envValue: "1", search: "" })).toBe(true);
    expect(resolve({ envValue: "yes", search: "" })).toBe(true);
    expect(resolve({ envValue: "0", search: "" })).toBe(false);
    expect(resolve({ envValue: "off", search: "" })).toBe(false);
  });

  it("lets uiFuture query override environment when present", () => {
    expect(resolve({ envValue: "false", search: "?uiFuture=1" })).toBe(true);
    expect(resolve({ envValue: "true", search: "?uiFuture=0" })).toBe(false);
  });

  it("falls back to environment for invalid query values", () => {
    expect(resolve({ envValue: "true", search: "?uiFuture=maybe" })).toBe(true);
    expect(resolve({ envValue: "false", search: "?uiFuture=maybe" })).toBe(
      false,
    );
  });

  it("preserves ui flags on redirect targets", () => {
    expect(
      withPersistedUiFlags("/dashboard", {
        search: "?uiFuture=1&bypassAuth=1",
      }),
    ).toBe("/dashboard?uiFuture=1&bypassAuth=1");
    expect(
      withPersistedUiFlags("/pricing?plan=pro", {
        search: "?uiFuture=0&bypassAuth=0",
      }),
    ).toBe("/pricing?plan=pro&uiFuture=0&bypassAuth=0");
  });

  it("ignores invalid values while preserving valid ones", () => {
    expect(
      withPersistedUiFlags("/signin", {
        search: "?uiFuture=maybe&bypassAuth=1",
      }),
    ).toBe("/signin?bypassAuth=1");
  });

  it("resolves future monitor skin from query override", () => {
    expect(
      resolveFutureMonitorsSkin({ envValue: "classic", search: "?uiFutureSkin=hud" }),
    ).toBe("hud");
    expect(
      resolveFutureMonitorsSkin({ envValue: "hud", search: "?uiFutureSkin=classic" }),
    ).toBe("classic");
  });

  it("falls back to environment for invalid skin values", () => {
    expect(
      resolveFutureMonitorsSkin({ envValue: "classic", search: "?uiFutureSkin=maybe" }),
    ).toBe("classic");
    expect(
      resolveFutureMonitorsSkin({ envValue: "hud", search: "?uiFutureSkin=maybe" }),
    ).toBe("hud");
  });

  it("defaults future monitor skin to hud when env is missing or invalid", () => {
    expect(resolveFutureMonitorsSkin({ envValue: undefined, search: "" })).toBe(
      "hud",
    );
    expect(resolveFutureMonitorsSkin({ envValue: "retro", search: "" })).toBe(
      "hud",
    );
  });

  it("preserves uiFutureSkin on redirect targets", () => {
    expect(
      withPersistedUiFlags("/dashboard", {
        search: "?uiFuture=1&bypassAuth=1&uiFutureSkin=hud",
      }),
    ).toBe("/dashboard?uiFuture=1&bypassAuth=1&uiFutureSkin=hud");

    expect(
      withPersistedUiFlags("/pricing?plan=pro", {
        search: "?uiFutureSkin=classic",
      }),
    ).toBe("/pricing?plan=pro&uiFutureSkin=classic");
  });

  it("ignores invalid uiFutureSkin values while preserving others", () => {
    expect(
      withPersistedUiFlags("/signin", {
        search: "?uiFuture=1&uiFutureSkin=alien",
      }),
    ).toBe("/signin?uiFuture=1");
  });
});
