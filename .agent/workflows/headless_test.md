---
description: Standard workflow for running performant, headless E2E tests with automated visual fallbacks.
---

Use this workflow whenever you need to verify feature implementation or perform regression testing.

### 🏁 Step 1: Pre-Flight Check
1.  **Confirm Server**: Ensure the dev server is running (`npm run dev`).
2.  **Environment**: Verify `.env` is populated with test credentials.

### 🚀 Step 2: Execute Headless Test
Run the optimized playwright command:
// turbo
```bash
npx playwright test
```
*Note: This automatically uses the headless configuration in `playwright.config.ts`.*

### 🔍 Step 3: Handle Failures (Visual Fallback)
If tests fail:
1.  **Do NOT switch to Headed mode**.
2.  **Analyze Traces**: Playwright is configured to save a trace on retry. Locate the `.zip` trace in `test-results/`.
3.  **Inspect Screenshots**: Check the failure screenshots generated in the results folder.
4.  **Actionable Feedback**: Report the exact visual state found in the trace to the user.

### 📦 Step 4: Verification Summary
1.  Generate a `walkthrough.md` if this is a major feature completion.
2.  Include performance metrics (execution time) to confirm the "Headless Power" is being utilized.
