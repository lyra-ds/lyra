import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import test from 'node:test';
import { loadConfigFromFile } from 'vite';

const browserConfigs = [
  'packages/styles/vitest.config.ts',
  'packages/react/vitest.config.ts',
  'packages/alpine/vitest.config.ts',
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
