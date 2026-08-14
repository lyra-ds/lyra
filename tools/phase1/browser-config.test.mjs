import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { loadConfigFromFile } from 'vite';

const browserConfigs = [
  'packages/styles/vitest.config.ts',
  'packages/react/vitest.config.ts',
  'packages/alpine/vitest.config.ts',
];

const browserPackages = [
  'packages/styles/package.json',
  'packages/react/package.json',
  'packages/alpine/package.json',
];

async function loadBrowserConfig(configFile) {
  const loaded = await loadConfigFromFile({ command: 'serve', mode: 'test' }, resolve(configFile));
  const projects = loaded.config.test.projects;

  return projects
    ? projects.find((project) => project.test.name === 'browser').test.browser
    : loaded.config.test.browser;
}

test('passes CI video evidence to every Playwright provider', async () => {
  const previousCi = process.env.CI;

  try {
    process.env.CI = 'true';

    for (const configFile of browserConfigs) {
      const browser = await loadBrowserConfig(configFile);
      const artifactRoot = resolve(configFile, '..', '.artifacts/browser');

      assert.deepEqual(browser.provider.options.contextOptions, {
        recordVideo: { dir: resolve(artifactRoot, 'videos') },
      });
      assert.equal('contextOptions' in browser, false);
    }
  } finally {
    if (previousCi === undefined) {
      delete process.env.CI;
    } else {
      process.env.CI = previousCi;
    }
  }
});

test('serializes Browser Mode files before persisting shared trace evidence', async () => {
  for (const configFile of browserConfigs) {
    const browser = await loadBrowserConfig(configFile);

    assert.equal(browser.fileParallelism, false);
  }
});

test('runs each browser instance serially before persisting shared trace evidence', () => {
  for (const packageFile of browserPackages) {
    const { scripts } = JSON.parse(readFileSync(resolve(packageFile), 'utf8'));

    assert.match(
      scripts['test:browser'],
      /--browser\.name chromium && vitest run(?: --project browser)? --browser\.name firefox && vitest run(?: --project browser)? --browser\.name webkit$/,
    );
  }
});
