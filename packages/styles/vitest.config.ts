import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";

// Browser Mode (chromium via @vitest/browser-playwright) is REQUIRED for @lyra-ds/styles:
// jsdom applies zero CSS, so `color-mix()` and the [data-theme]/[data-brand] custom-property
// cascade cannot resolve there (false negatives/positives). Only a real browser resolves the
// white-label derivation (STY-04) and dark theming (STY-03). See UI-SPEC "Validation contract (D-04)".
//
// FIXTURE LOADING MECHANISM (chosen: option (b) — explicit in-test injection; NOT testerHtmlPath):
//   1. The built entry CSS is loaded by `import "../styles.css"` inside the test. Vite resolves
//      styles.css's `@import` graph and injects it as a <style> into document.head — this is the
//      "@import of the entry styles.css" injection the plan requires, and it is what makes
//      color-mix() resolve in chromium.
//   2. The fixture DOM (tests/fixtures/brand-theme.html) is imported raw (`?raw`) and injected
//      into document.body by the test's setup. The test toggles data-theme/data-brand on the
//      fixture root across the four permutations.
// We deliberately keep Vitest's default tester page (no browser.testerHtmlPath); the test does the
// DOM + CSS setup itself so the mechanism is explicit and self-contained.
//
// LOCAL/CI PREREQUISITE: `pnpm exec playwright install chromium --with-deps` must run BEFORE any
// step that triggers Browser Mode. CI wires this ahead of the root test command in plan 02-06.
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [{ browser: "chromium" }],
    },
  },
});
