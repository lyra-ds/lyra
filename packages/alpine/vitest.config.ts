// Browser Mode harness for @lyra-ds/alpine — same rationale as @lyra-ds/react:
// jsdom applies zero CSS, so focus traps, `inert`, scroll lock, placement flips and
// axe's color-contrast rule are untestable there. The APG behavior contract of the
// Alpine port is proven HERE, against the real @lyra-ds/styles CSS imported inside
// each test (never in src).
//
// LOCAL/CI PREREQUISITE: `pnpm exec playwright install chromium --with-deps` must run
// BEFORE any step that triggers Browser Mode (CI wires this ahead of the root test).
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
  test: {
    include: ['src/**/*.browser.test.ts'],
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [{ browser: 'chromium' }],
    },
  },
});
