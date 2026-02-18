import { test as base } from "@playwright/test";

export const test = base.extend({
  storageState: (_fixtures, run) => {
    // This will be overridden by project configuration
    run(undefined);
  },
});

export { expect } from "@playwright/test";
