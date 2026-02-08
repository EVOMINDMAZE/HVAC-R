import { test as base } from "@playwright/test";

export const test = base.extend({
  storageState: ({}, use) => {
    // This will be overridden by project configuration
    use(undefined);
  },
});

export { expect } from "@playwright/test";
