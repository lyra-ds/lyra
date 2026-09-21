import { resolve } from 'node:path';

export const PLAYWRIGHT_IMAGE_REFERENCE =
  'mcr.microsoft.com/playwright:v1.62.1-noble@sha256:dcc5531e97840b9b5e794f2814476b21571c5124a3fca2267d73041f56e7580e';

export const PLAYWRIGHT_BROWSER_INSTANCES = [
  { browser: 'chromium' },
  { browser: 'firefox' },
  { browser: 'webkit' },
];

export const PLAYWRIGHT_DOCKER_COMMAND =
  'env UID="$(id -u)" GID="$(id -g)" docker compose -f compose.playwright.yml run --rm browser-tests';

export function createBrowserEvidenceConfig(artifactRoot, browser) {
  const evidenceRoot = browser === undefined ? artifactRoot : resolve(artifactRoot, browser);
  const screenshotDirectory = resolve(evidenceRoot, 'screenshots');
  const tracesDir = resolve(evidenceRoot, 'traces');
  const contextOptions =
    process.env.CI === 'true' ? { recordVideo: { dir: resolve(evidenceRoot, 'videos') } } : {};

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

function getComposeCommand(service) {
  const command = /^    command:(?:\s*[|>][+-]?)?\s*$/m.exec(service);

  if (!command) {
    return '';
  }

  const content = service.slice(command.index + command[0].length);
  const nextProperty = /^    [^\s#][^\n]*:\s*/m.exec(content);
  const commandBlock = nextProperty ? content.slice(0, nextProperty.index) : content;

  return commandBlock.replace(/^\s*#.*$/gm, '');
}

function getWorkflowJobBlock(workflow, jobName) {
  const job = new RegExp(`^  ${jobName}:\\s*$`, 'm').exec(workflow);

  if (!job) {
    return undefined;
  }

  const content = workflow.slice(job.index + job[0].length);
  const nextJob = /^  [^\s][^\n]*:\s*$/m.exec(content);

  return nextJob ? content.slice(0, nextJob.index) : content;
}

function getWorkflowContainerBlock(job) {
  const container = /^    container:\s*$/m.exec(job);

  if (!container) {
    return undefined;
  }

  const content = job.slice(container.index + container[0].length);
  const nextJobProperty = /^    [^\s][^\n]*:\s*$/m.exec(content);

  return nextJobProperty ? content.slice(0, nextJobProperty.index) : content;
}

function getWorkflowStepBlock(job, name) {
  const step = new RegExp(`^      - name: ${name}\\s*$`, 'm').exec(job);

  if (!step) {
    return undefined;
  }

  const content = job.slice(step.index + step[0].length);
  const nextStep = /^      - \S/m.exec(content);

  return nextStep ? content.slice(0, nextStep.index) : content;
}

function hasBrowserDiagnosticsUpload(job) {
  const diagnostics = getWorkflowStepBlock(job, 'Upload browser diagnostics');

  if (!diagnostics) {
    return false;
  }

  return (
    /^        if: failure\(\)\s*$/m.test(diagnostics) &&
    /^        uses: actions\/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a(?:\s+#.*)?\s*$/m.test(
      diagnostics,
    ) &&
    /^          name: browser-diagnostics-\$\{\{ github\.run_id \}\}\s*$/m.test(diagnostics) &&
    /^          path: \|\s*\n            packages\/styles\/\.artifacts\/browser\/\s*\n            packages\/react\/\.artifacts\/browser\/\s*\n            packages\/alpine\/\.artifacts\/browser\/\s*$/m.test(
      diagnostics,
    ) &&
    /^          if-no-files-found: ignore\s*$/m.test(diagnostics) &&
    /^          retention-days: 14\s*$/m.test(diagnostics)
  );
}

function installsPlaywrightBrowsers(job) {
  const uncommentedJob = job.replace(/^\s*#.*$/gm, '');

  return /(?:^|\s)playwright install(?:\s|$)/m.test(uncommentedJob);
}

function runsBrowserMatrix(job) {
  return /^      - run: pnpm run test:browsers\s*(?:#.*)?$/m.test(job);
}

function hasRootHomeForFirefox(job) {
  const environment = /^    env:\s*\n((?:      [^\n]*\n?)*)/m.exec(job)?.[1];

  return /^      HOME:\s*\/root\s*$/m.test(environment ?? '');
}

function validateCiBrowserMatrix(workflow) {
  const errors = [];
  const testJob = getWorkflowJobBlock(workflow, 'test');

  if (!testJob) {
    return ['CI workflow must define the existing "test" job.'];
  }

  const container = getWorkflowContainerBlock(testJob);

  if (
    !container ||
    !new RegExp(`^      image: ${PLAYWRIGHT_IMAGE_REFERENCE}\\s*$`, 'm').test(container)
  ) {
    errors.push('CI job "test" must run in the pinned Playwright container.');
  }

  if (container && !/^      options: .*--ipc=host(?:\s|$)/m.test(container)) {
    errors.push('CI job "test" container must enable --ipc=host.');
  }

  if (!hasRootHomeForFirefox(testJob)) {
    errors.push('CI job "test" must set HOME: /root for Firefox.');
  }

  if (!runsBrowserMatrix(testJob)) {
    errors.push('CI job "test" must run the browser matrix.');
  }

  if (installsPlaywrightBrowsers(testJob)) {
    errors.push('CI job "test" must not install Playwright browsers.');
  }

  if (!hasBrowserDiagnosticsUpload(testJob)) {
    errors.push('CI job "test" must upload browser diagnostics only on failure.');
  }

  return errors;
}

export function validateBrowserMatrix({ compose, scripts, configs, workflow }) {
  const errors = [];
  const browserTestsService = getComposeServiceBlock(compose, 'browser-tests');

  if (!browserTestsService) {
    return ['Compose service "browser-tests" is missing.'];
  }

  const browserTestsCommand = getComposeCommand(browserTestsService);

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

  if (
    !/^    user: '\$\{UID:\?Set UID with id -u\}:\$\{GID:\?Set GID with id -g\}'\s*$/m.test(
      browserTestsService,
    ) ||
    !/^    working_dir: \/workspace\s*$/m.test(browserTestsService) ||
    !/^      CI: ['"]true['"]\s*$/m.test(browserTestsService) ||
    !/^      - \.:\/workspace\s*$/m.test(browserTestsService)
  ) {
    errors.push(
      'Compose service "browser-tests" must run as the invoking UID/GID with the checkout mounted at /workspace in CI mode.',
    );
  }

  if (!/export PATH="\/tmp\/corepack-shims:\$\$PATH"/m.test(browserTestsCommand)) {
    errors.push(
      'Compose service "browser-tests" must prepend Corepack shims to the container PATH with $$PATH.',
    );
  }

  if (!/corepack pnpm@11\.13\.1 install[^\n]*--frozen-lockfile/m.test(browserTestsCommand)) {
    errors.push(
      'Compose service "browser-tests" must install with pinned pnpm 11.13.1 and a frozen lockfile.',
    );
  }

  if (!/corepack pnpm@11\.13\.1 run test:browsers\s*$/m.test(browserTestsCommand)) {
    errors.push('Compose service "browser-tests" must run test:browsers with pinned pnpm 11.13.1.');
  }

  if (
    !/^      HOME: \/tmp\s*$/m.test(browserTestsService) ||
    !/^      COREPACK_HOME: \/tmp\/corepack\s*$/m.test(browserTestsService) ||
    !/--store-dir=\/tmp\/pnpm-store(?:\s|$)/m.test(browserTestsCommand)
  ) {
    errors.push(
      'Compose service "browser-tests" must keep HOME, Corepack, and the pnpm store under /tmp.',
    );
  }

  if (!/--config\.confirmModulesPurge=false(?:\s|$)/m.test(browserTestsCommand)) {
    errors.push(
      'Compose service "browser-tests" must disable the interactive pnpm modules-purge prompt.',
    );
  }

  const isolatedNodeModules = [
    '/workspace/node_modules',
    '/workspace/packages/styles/node_modules',
    '/workspace/packages/react/node_modules',
    '/workspace/packages/alpine/node_modules',
  ];
  const tmpfsOptions = new Map(
    isolatedNodeModules.map((path) => {
      const escapedPath = path.replaceAll('/', '\\/');
      const options = new RegExp(`^      - ${escapedPath}:([^\\s]+)\\s*$`, 'm').exec(
        browserTestsService,
      )?.[1];

      return [path, options?.split(',') ?? []];
    }),
  );

  if (
    isolatedNodeModules.some(
      (path) =>
        !new RegExp(`^      - ${path.replaceAll('/', '\\/')}(?::[^\\s]+)?\\s*$`, 'm').test(
          browserTestsService,
        ),
    )
  ) {
    errors.push(
      'Compose service "browser-tests" must isolate root and browser-package node_modules with tmpfs.',
    );
  }

  if (isolatedNodeModules.some((path) => !tmpfsOptions.get(path).includes('mode=1777'))) {
    errors.push(
      'Compose service "browser-tests" tmpfs mounts must use mode=1777 for the non-root user.',
    );
  }

  if (isolatedNodeModules.some((path) => !tmpfsOptions.get(path).includes('exec'))) {
    errors.push('Compose service "browser-tests" tmpfs mounts must allow package executables.');
  }

  for (const [name, config] of Object.entries(configs)) {
    if (!includesBrowserMatrix(config)) {
      errors.push(`Vitest config "${name}" must run chromium, firefox, and webkit.`);
    }
  }

  if (!/"test:browsers"\s*:/.test(scripts)) {
    errors.push('Root scripts must define test:browsers.');
  }

  let rootScripts;

  try {
    rootScripts = JSON.parse(scripts).scripts;
  } catch {
    rootScripts = undefined;
  }

  if (rootScripts?.['test:browsers:docker'] !== PLAYWRIGHT_DOCKER_COMMAND) {
    errors.push('Root scripts must define test:browsers:docker through compose.playwright.yml.');
  }

  if (workflow !== undefined) {
    errors.push(...validateCiBrowserMatrix(workflow));
  }

  return errors;
}
