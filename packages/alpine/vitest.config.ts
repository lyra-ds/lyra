// Browser Mode harness for @lyra-ds/alpine — same rationale as @lyra-ds/react:
// jsdom applies zero CSS, so focus traps, `inert`, scroll lock, placement flips and
// axe's color-contrast rule are untestable there. The APG behavior contract of the
// Alpine port is proven HERE, against the real @lyra-ds/styles CSS imported inside
// each test (never in src).
//
// LOCAL/CI PREREQUISITE: the Playwright browsers must be installed
// BEFORE any step that triggers Browser Mode (CI wires this ahead of the root test).
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import {
  PLAYWRIGHT_BROWSER_INSTANCES,
  createBrowserEvidenceConfig,
} from '../../tools/phase1/browser-matrix.mjs';

const browserEvidence = createBrowserEvidenceConfig(
  resolve(import.meta.dirname, '.artifacts/browser'),
);

export default defineConfig({
  test: {
    include: ['src/**/*.browser.test.ts'],
    setupFiles: ['src/browser-test-setup.ts'],
    browser: {
      enabled: true,
      provider: playwright({ contextOptions: browserEvidence.contextOptions }),
      headless: true,
      fileParallelism: false,
      instances: PLAYWRIGHT_BROWSER_INSTANCES,
      screenshotFailures: browserEvidence.screenshotFailures,
      screenshotDirectory: browserEvidence.screenshotDirectory,
      trace: browserEvidence.trace,
    },
  },
});
