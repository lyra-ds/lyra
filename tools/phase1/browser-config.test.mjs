import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { loadConfigFromFile } from 'vite';
import { parse } from 'yaml';

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

test('keeps Browser Mode Docker-only and serializes workspace tests that rebuild React dist', () => {
  const rootScripts = JSON.parse(readFileSync(resolve('package.json'), 'utf8')).scripts;
  const packageScripts = Object.fromEntries(
    browserPackages.map((packageFile) => [
      packageFile,
      JSON.parse(readFileSync(resolve(packageFile), 'utf8')).scripts,
    ]),
  );

  assert.match(rootScripts.test, /tools\/phase1\/browser-matrix\.test\.mjs/);
  assert.match(rootScripts.test, /tools\/phase1\/browser-config\.test\.mjs/);
  assert.match(rootScripts.test, /pnpm -r --workspace-concurrency=1 --if-present run test/);
  assert.doesNotMatch(rootScripts.test, /pnpm test:browsers/);
  assert.equal(packageScripts['packages/styles/package.json'].test, undefined);
  assert.equal(packageScripts['packages/react/package.json'].test, 'pnpm run test:ssr');
  assert.equal(packageScripts['packages/alpine/package.json'].test, undefined);
});

test('prebuilds React and Alpine dist before clean root tests', () => {
  const rootScripts = JSON.parse(readFileSync(resolve('package.json'), 'utf8')).scripts;
  const rootTestCommands = rootScripts.test.split(' && ');
  const requiredOrder = [
    'pnpm --filter @lyra-ds/react run build',
    'pnpm --filter @lyra-ds/alpine run build',
    rootTestCommands.find((command) => command.startsWith('node --test ')),
  ];

  assert.deepEqual(
    requiredOrder.map((command) => rootTestCommands.indexOf(command)),
    [0, 1, 2],
  );
});

test('prebuilds React and Alpine dist before clean CI typecheck', () => {
  const workflow = parse(readFileSync(resolve('.github/workflows/ci.yml'), 'utf8'));
  const typecheckCommands = workflow.jobs.typecheck.steps.flatMap(({ run }) => (run ? [run] : []));
  const requiredOrder = [
    'pnpm --filter @lyra-ds/react run build',
    'pnpm --filter @lyra-ds/alpine run build',
    'pnpm run typecheck',
  ];

  assert.deepEqual(
    requiredOrder.map((command) => typecheckCommands.indexOf(command)),
    requiredOrder.map((_, index) => typecheckCommands.length - 3 + index),
  );
});

test('does not leave future styles or Alpine test files outside Browser Mode', async () => {
  const stylesTestFiles = readdirSync('packages/styles/tests', { recursive: true }).filter((file) =>
    file.endsWith('.test.ts'),
  );
  const alpineTestFiles = readdirSync('packages/alpine/src', { recursive: true }).filter((file) =>
    file.endsWith('.test.ts'),
  );

  assert.match(
    readFileSync(resolve('packages/styles/vitest.config.ts'), 'utf8'),
    /include:\s*\['tests\/\*\*\/\*.test\.ts'\]/,
  );
  assert.match(
    readFileSync(resolve('packages/alpine/vitest.config.ts'), 'utf8'),
    /include:\s*\['src\/\*\*\/\*.browser\.test\.ts'\]/,
  );
  assert.ok(stylesTestFiles.length > 0);
  assert.ok(alpineTestFiles.length > 0);
  assert.ok(alpineTestFiles.every((file) => file.endsWith('.browser.test.ts')));
});
