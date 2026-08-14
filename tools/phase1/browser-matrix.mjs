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

function includesBrowserMatrix(config) {
  const uncommentedConfig = config.replace(/\/\*[\s\S]*?\*\//g, '');

  return /^\s*(?!\/\/)instances:\s*PLAYWRIGHT_BROWSER_INSTANCES\b/m.test(uncommentedConfig);
}

function getComposeServiceBlock(compose, serviceName) {
  const service = new RegExp(`^  ${serviceName}:\\s*$`, 'm').exec(compose);

  if (!service) {
    return undefined;
  }

  const content = compose.slice(service.index + service[0].length);
  const nextService = /^  [^\s][^\n]*:\s*$/m.exec(content);

  return nextService ? content.slice(0, nextService.index) : content;
}

export function validateBrowserMatrix({ compose, scripts, configs }) {
  const errors = [];
  const browserTestsService = getComposeServiceBlock(compose, 'browser-tests');

  if (!browserTestsService) {
    return ['Compose service "browser-tests" is missing.'];
  }

  if (
    !new RegExp(`^    image: ${PLAYWRIGHT_IMAGE_REFERENCE}\\s*$`, 'm').test(browserTestsService)
  ) {
    errors.push('Compose service "browser-tests" must use the pinned Playwright image.');
  }

  if (!/^    init: true\s*$/m.test(browserTestsService)) {
    errors.push('Compose service "browser-tests" must set init: true.');
  }

  if (!/^    ipc: host\s*$/m.test(browserTestsService)) {
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
