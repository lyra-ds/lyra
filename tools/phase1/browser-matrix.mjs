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
    /^        uses: actions\/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02(?:\s+#.*)?\s*$/m.test(
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

  if (
    /^      - run: pnpm exec playwright install chromium(?:\s+--with-deps)?\s*(?:#.*)?$/m.test(
      testJob,
    )
  ) {
    errors.push('CI job "test" must not install Chromium separately.');
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

  if (workflow !== undefined) {
    errors.push(...validateCiBrowserMatrix(workflow));
  }

  return errors;
}
