import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

import {
  PLAYWRIGHT_BROWSER_INSTANCES,
  PLAYWRIGHT_IMAGE_REFERENCE,
  createBrowserEvidenceConfig,
  validateBrowserMatrix,
} from './browser-matrix.mjs';

const validCompose = `services:
  browser-tests:
    image: ${PLAYWRIGHT_IMAGE_REFERENCE}
    init: true
    ipc: host
`;

const validScripts = '{"scripts":{"test:browsers":"pnpm -r run test:browser"}}';

const validConfigs = {
  styles: 'instances: PLAYWRIGHT_BROWSER_INSTANCES',
  react: 'instances: PLAYWRIGHT_BROWSER_INSTANCES',
  alpine: 'instances: PLAYWRIGHT_BROWSER_INSTANCES',
};

const validWorkflow = `jobs:
  test:
    runs-on: ubuntu-latest
    container:
      image: ${PLAYWRIGHT_IMAGE_REFERENCE}
      options: --init --ipc=host
    steps:
      - run: pnpm run test
      - name: Upload browser diagnostics
        if: failure()
        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        with:
          name: browser-diagnostics-\${{ github.run_id }}
          path: |
            packages/styles/.artifacts/browser/
            packages/react/.artifacts/browser/
            packages/alpine/.artifacts/browser/
          if-no-files-found: ignore
          retention-days: 14
`;

test('defines the digest-pinned three-browser matrix', () => {
  assert.equal(
    PLAYWRIGHT_IMAGE_REFERENCE,
    'mcr.microsoft.com/playwright:v1.62.1-noble@sha256:dcc5531e97840b9b5e794f2814476b21571c5124a3fca2267d73041f56e7580e',
  );
  assert.deepEqual(PLAYWRIGHT_BROWSER_INSTANCES, [
    { browser: 'chromium' },
    { browser: 'firefox' },
    { browser: 'webkit' },
  ]);
});

test('keeps failure evidence under the supplied artifact root', () => {
  const artifactRoot = 'packages/example/.artifacts/browser';
  const previousCi = process.env.CI;

  try {
    delete process.env.CI;

    assert.deepEqual(createBrowserEvidenceConfig(artifactRoot), {
      screenshotFailures: true,
      screenshotDirectory: resolve(artifactRoot, 'screenshots'),
      trace: {
        mode: 'retain-on-failure',
        tracesDir: resolve(artifactRoot, 'traces'),
      },
      contextOptions: {},
    });

    process.env.CI = 'true';

    assert.deepEqual(createBrowserEvidenceConfig(artifactRoot), {
      screenshotFailures: true,
      screenshotDirectory: resolve(artifactRoot, 'screenshots'),
      trace: {
        mode: 'retain-on-failure',
        tracesDir: resolve(artifactRoot, 'traces'),
      },
      contextOptions: {
        recordVideo: {
          dir: resolve(artifactRoot, 'videos'),
        },
      },
    });
  } finally {
    if (previousCi === undefined) {
      delete process.env.CI;
    } else {
      process.env.CI = previousCi;
    }
  }
});

test('validates the local browser matrix entry point', () => {
  const projectRoot = resolve(import.meta.dirname, '../..');
  const composePath = resolve(projectRoot, 'compose.playwright.yml');
  const errors = validateBrowserMatrix({
    compose: existsSync(composePath) ? readFileSync(composePath, 'utf8') : 'services: {}\n',
    scripts: readFileSync(resolve(projectRoot, 'package.json'), 'utf8'),
    configs: {
      styles: readFileSync(resolve(projectRoot, 'packages/styles/vitest.config.ts'), 'utf8'),
      react: readFileSync(resolve(projectRoot, 'packages/react/vitest.config.ts'), 'utf8'),
      alpine: readFileSync(resolve(projectRoot, 'packages/alpine/vitest.config.ts'), 'utf8'),
    },
    workflow: readFileSync(resolve(projectRoot, '.github/workflows/ci.yml'), 'utf8'),
  });

  assert.deepEqual(errors, []);
});

test('requires browser infrastructure settings in the browser-tests service', () => {
  const errors = validateBrowserMatrix({
    compose: `services:
  browser-tests:
    image: node:22
  unrelated:
    image: ${PLAYWRIGHT_IMAGE_REFERENCE}
    init: true
    ipc: host
`,
    scripts: validScripts,
    configs: validConfigs,
  });

  assert.deepEqual(errors, [
    'Compose service "browser-tests" must use the pinned Playwright image.',
    'Compose service "browser-tests" must set init: true.',
    'Compose service "browser-tests" must set ipc: host.',
  ]);
});

test('requires the CI test job to use the Playwright browser matrix container', () => {
  const errors = validateBrowserMatrix({
    compose: validCompose,
    scripts: validScripts,
    configs: validConfigs,
    workflow: `jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: pnpm exec playwright install chromium --with-deps
`,
  });

  assert.deepEqual(errors, [
    'CI job "test" must run in the pinned Playwright container.',
    'CI job "test" must not install Chromium separately.',
    'CI job "test" must upload browser diagnostics only on failure.',
  ]);
});

test('rejects Chromium-only Playwright installs when flags precede the browser argument', () => {
  const errors = validateBrowserMatrix({
    compose: validCompose,
    scripts: validScripts,
    configs: validConfigs,
    workflow: validWorkflow.replace(
      '- run: pnpm run test',
      '- run: pnpm exec playwright install --with-deps chromium --force\n      - run: pnpm run test',
    ),
  });

  assert.deepEqual(errors, ['CI job "test" must not install Chromium separately.']);
});

test('allows Playwright installs that include more than Chromium', () => {
  const errors = validateBrowserMatrix({
    compose: validCompose,
    scripts: validScripts,
    configs: validConfigs,
    workflow: validWorkflow.replace(
      '- run: pnpm run test',
      '- run: pnpm exec playwright install --with-deps chromium firefox\n      - run: pnpm run test',
    ),
  });

  assert.deepEqual(errors, []);
});

test('does not mistake a non-install Playwright command for a Chromium-only install', () => {
  const errors = validateBrowserMatrix({
    compose: validCompose,
    scripts: validScripts,
    configs: validConfigs,
    workflow: validWorkflow.replace(
      '- run: pnpm run test',
      '- run: pnpm exec playwright install-deps chromium\n      - run: pnpm run test',
    ),
  });

  assert.deepEqual(errors, []);
});

test('accepts a CI test job with the pinned browser matrix and failure diagnostics', () => {
  const errors = validateBrowserMatrix({
    compose: validCompose,
    scripts: validScripts,
    configs: validConfigs,
    workflow: validWorkflow,
  });

  assert.deepEqual(errors, []);
});

test('requires the CI test container image and IPC setting to remain pinned', () => {
  const errors = validateBrowserMatrix({
    compose: validCompose,
    scripts: validScripts,
    configs: validConfigs,
    workflow: validWorkflow
      .replace(PLAYWRIGHT_IMAGE_REFERENCE, 'mcr.microsoft.com/playwright:v1.62.1-noble')
      .replace('options: --init --ipc=host', 'options: --init'),
  });

  assert.deepEqual(errors, [
    'CI job "test" must run in the pinned Playwright container.',
    'CI job "test" container must enable --ipc=host.',
  ]);
});

test('requires CI browser diagnostics to upload only after a failure', () => {
  const errors = validateBrowserMatrix({
    compose: validCompose,
    scripts: validScripts,
    configs: validConfigs,
    workflow: validWorkflow.replace('if: failure()', 'if: always()'),
  });

  assert.deepEqual(errors, ['CI job "test" must upload browser diagnostics only on failure.']);
});

test('requires each config to operationally use the browser instances', () => {
  const errors = validateBrowserMatrix({
    compose: validCompose,
    scripts: validScripts,
    configs: {
      ...validConfigs,
      styles: '// chromium firefox webkit only appear in this comment',
    },
  });

  assert.deepEqual(errors, ['Vitest config "styles" must run chromium, firefox, and webkit.']);
});

test('rejects a browser matrix reference that appears only in a comment', () => {
  const errors = validateBrowserMatrix({
    compose: validCompose,
    scripts: validScripts,
    configs: {
      ...validConfigs,
      styles: '// instances: PLAYWRIGHT_BROWSER_INSTANCES',
    },
  });

  assert.deepEqual(errors, ['Vitest config "styles" must run chromium, firefox, and webkit.']);
});

test('rejects a browser matrix reference that appears only in a block comment', () => {
  const errors = validateBrowserMatrix({
    compose: validCompose,
    scripts: validScripts,
    configs: {
      ...validConfigs,
      styles: '/*\ninstances: PLAYWRIGHT_BROWSER_INSTANCES\n*/',
    },
  });

  assert.deepEqual(errors, ['Vitest config "styles" must run chromium, firefox, and webkit.']);
});

test('rejects a pinned image reference that appears only in a service comment', () => {
  const errors = validateBrowserMatrix({
    compose: `services:
  browser-tests:
    image: node:22
    # image: ${PLAYWRIGHT_IMAGE_REFERENCE}
    init: true
    ipc: host
`,
    scripts: validScripts,
    configs: validConfigs,
  });

  assert.deepEqual(errors, [
    'Compose service "browser-tests" must use the pinned Playwright image.',
  ]);
});
