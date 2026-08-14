import { resolve } from 'node:path';

export const PLAYWRIGHT_IMAGE_REFERENCE =
  'mcr.microsoft.com/playwright:v1.62.1-noble@sha256:dcc5531e97840b9b5e794f2814476b21571c5124a3fca2267d73041f56e7580e';

export const PLAYWRIGHT_BROWSER_INSTANCES = [
  { browser: 'chromium' },
  { browser: 'firefox' },
  { browser: 'webkit' },
];

export function createBrowserEvidenceConfig(artifactRoot) {
  const screenshotDirectory = resolve(artifactRoot, 'screenshots');
  const tracesDir = resolve(artifactRoot, 'traces');
  const contextOptions =
    process.env.CI === 'true' ? { recordVideo: { dir: resolve(artifactRoot, 'videos') } } : {};

  return {
    screenshotFailures: true,
    screenshotDirectory,
    trace: {
      mode: 'retain-on-failure',
      tracesDir,
    },
    contextOptions,
  };
}
