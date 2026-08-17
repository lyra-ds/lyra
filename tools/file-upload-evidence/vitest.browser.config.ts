import { resolve } from 'node:path';
import { playwright, PlaywrightBrowserProvider } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';
import {
  PLAYWRIGHT_BROWSER_INSTANCES,
  createBrowserEvidenceConfig,
} from '../phase1/browser-matrix.mjs';

const artifactRoot = resolve(import.meta.dirname, '.artifacts/browser');

function createBrowserProject(instance: (typeof PLAYWRIGHT_BROWSER_INSTANCES)[number]) {
  const browserEvidence = createBrowserEvidenceConfig(artifactRoot, instance.browser);

  return {
    test: {
      name: instance.browser,
      include: ['src/**/*.browser.test.{ts,tsx}'],
      browser: {
        enabled: true,
        provider: playwright({ contextOptions: browserEvidence.contextOptions }),
        headless: true,
        fileParallelism: false,
        instances: [instance],
        screenshotFailures: browserEvidence.screenshotFailures,
        screenshotDirectory: browserEvidence.screenshotDirectory,
        trace: browserEvidence.trace,
        commands: {
          async emulateFileUploadEvidenceMedia({ provider, sessionId }, options) {
            const page = (provider as PlaywrightBrowserProvider).getPage(sessionId);
            await page.emulateMedia(options);
          },
        },
      },
    },
  };
}

export default defineConfig({
  optimizeDeps: {
    include: [
      'alpinejs',
      'axe-core',
      'react',
      'react-dom',
      'react/jsx-runtime',
      'vitest-browser-react',
    ],
  },
  test: {
    projects: PLAYWRIGHT_BROWSER_INSTANCES.map(createBrowserProject),
  },
});
