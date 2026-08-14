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

const BROWSER_NAMES = ['chromium', 'firefox', 'webkit'];

function includesBrowserMatrix(config) {
  return (
    /instances:\s*PLAYWRIGHT_BROWSER_INSTANCES/.test(config) ||
    BROWSER_NAMES.every((browser) => config.includes(browser))
  );
}

export function validateBrowserMatrix({ compose, scripts, configs }) {
  const errors = [];
  const hasBrowserTestsService = /^  browser-tests:\s*$/m.test(compose);

  if (!hasBrowserTestsService) {
    return ['Compose service "browser-tests" is missing.'];
  }

  if (!compose.includes(`image: ${PLAYWRIGHT_IMAGE_REFERENCE}`)) {
    errors.push('Compose service "browser-tests" must use the pinned Playwright image.');
  }

  if (!/^    init: true\s*$/m.test(compose)) {
    errors.push('Compose service "browser-tests" must set init: true.');
  }

  if (!/^    ipc: host\s*$/m.test(compose)) {
    errors.push('Compose service "browser-tests" must set ipc: host.');
  }

  for (const [name, config] of Object.entries(configs)) {
    if (!includesBrowserMatrix(config)) {
      errors.push(`Vitest config "${name}" must run chromium, firefox, and webkit.`);
    }
  }

  if (!/"test:browsers"\s*:/.test(scripts)) {
    errors.push('Root scripts must define test:browsers.');
  }

  return errors;
}
