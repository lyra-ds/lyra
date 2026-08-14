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
