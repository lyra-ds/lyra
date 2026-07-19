// Two-project Vitest harness for @lyra-ds/react (D-26, RESEARCH Pattern 5).
//
//  • "browser" — real chromium via @vitest/browser-playwright. REQUIRED for a CSS-first DS:
//    jsdom applies zero CSS, so focus-visible, focus traps, portal stacking, dark theming and
//    axe's color-contrast rule are all untestable there. *.browser.test.tsx import the
//    @lyra-ds/styles CSS *inside the test* (never in src). Keyboard/a11y suites live here.
//  • "ssr" — environment: node. *.ssr.test.ts renderToString(<Pilot/>) proves no module-scope
//    DOM access (the Portal/SSR guard contract).
//
// LOCAL/CI PREREQUISITE: `pnpm exec playwright install chromium --with-deps` must run BEFORE any
// step that triggers Browser Mode. CI wires this ahead of the root test command (plan 02-06).
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'browser',
          include: ['src/**/*.browser.test.tsx'],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
        },
      },
      {
        test: {
          name: 'ssr',
          include: ['src/**/*.ssr.test.ts'],
          environment: 'node',
        },
      },
    ],
  },
});
