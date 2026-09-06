import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { realpathSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rename, rm, stat, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { resolveContractEntry } from './adapter-entry.mjs';

const modulePath = new URL('./wave2-fixture.mjs', import.meta.url);
// CI may check out the repository owned by another UID, so only the real-Vite adapters
// scope a git safe.directory exception to the resolved checkout path per command.
const realRepositoryRoot = fileURLToPath(new URL('../../../', import.meta.url));
const realRepositoryGitConfig = ['-c', `safe.directory=${realpathSync(realRepositoryRoot)}`];

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

async function loadPrepareWave2Fixture() {
  const module = await import(modulePath);
  assert.equal(typeof module.prepareWave2Fixture, 'function');
  return module.prepareWave2Fixture;
}

async function testDirectory(t) {
  const root = await mkdtemp(join(tmpdir(), 'lyra-wave2-fixture-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

async function createSources(root) {
  const repositoryRoot = join(root, 'repository');
  const fixtureSourceRoot = join(
    repositoryRoot,
    'tools',
    'overlay-foundation-evaluation',
    'fixtures',
    'wave2',
  );
  const adapterEntry = join(
    repositoryRoot,
    'tools',
    'overlay-foundation-evaluation',
    'candidates',
    'anchored',
    'radix.mjs',
  );
  await mkdir(fixtureSourceRoot, { recursive: true });
  await mkdir(dirname(adapterEntry), { recursive: true });
  await mkdir(join(repositoryRoot, 'node_modules', 'vite', 'bin'), { recursive: true });
  await mkdir(join(repositoryRoot, 'node_modules', 'axe-core'), { recursive: true });
  await writeFile(
    join(repositoryRoot, 'package.json'),
    JSON.stringify({ devDependencies: { vite: '8.2.1' } }),
  );
  await writeFile(
    join(repositoryRoot, 'node_modules', 'vite', 'package.json'),
    JSON.stringify({ name: 'vite', version: '8.2.1' }),
  );
  await writeFile(join(repositoryRoot, 'node_modules', 'vite', 'bin', 'vite.js'), 'vite bin\n');
  await writeFile(
    join(repositoryRoot, 'node_modules', 'axe-core', 'package.json'),
    JSON.stringify({ name: 'axe-core', version: '4.13.0', license: 'MPL-2.0' }),
  );
  await writeFile(
    join(repositoryRoot, 'node_modules', 'axe-core', 'axe.js'),
    'export default {};\n',
  );
  const files = {
    [adapterEntry]: 'export const adapter = "synthetic";\n',
    [join(fixtureSourceRoot, '..', 'shared', 'protocol.mjs')]: 'export const sharedProtocol = 1;\n',
    [join(fixtureSourceRoot, '..', 'shared', 'resource-tracker.mjs')]:
      'export const sharedResourceTracker = 1;\n',
    [join(fixtureSourceRoot, '..', '..', 'contracts', 'cells.mjs')]:
      'export const BEHAVIORAL_WAVE_CELLS = [];\n',
    [join(fixtureSourceRoot, 'protocol.mjs')]: 'export const protocol = 1;\n',
    [join(fixtureSourceRoot, 'runtime.mjs')]: 'export const runtime = 1;\n',
    [join(fixtureSourceRoot, 'react-fixture.mjs')]: 'export const fixture = 1;\n',
    [join(fixtureSourceRoot, 'measurements.mjs')]: 'export const measurements = 1;\n',
    [join(fixtureSourceRoot, '..', '..', 'contracts', 'protocol.mjs')]:
      'export const contractProtocol = 1;\n',
    [join(fixtureSourceRoot, 'entry-client.mjs')]: 'export const client = 1;\n',
    [join(fixtureSourceRoot, 'entry-server.mjs')]: 'export const server = 1;\n',
    [join(fixtureSourceRoot, 'index.html')]: '<main id="wave2-fixture-root"></main>\n',
  };
  for (const [path, bytes] of Object.entries(files)) {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, bytes);
  }
  await writeFile(join(repositoryRoot, 'pnpm-lock.yaml'), 'baseline lock');
  return { adapterEntry, files, fixtureSourceRoot, repositoryRoot };
}

async function createFixtureSetup(t, overrides = {}) {
  const root = await testDirectory(t);
  const sources = await createSources(root);
  const runRoot = join(root, 'owned-run');
  await mkdir(runRoot);
  const candidate = { id: overrides.candidateId ?? 'radix' };
  const artifacts = [{ record: { name: 'synthetic-wave2', version: '1.0.0' } }];
  const evidence = {};
  const fixtureRoot = join(runRoot, `candidate-${candidate.id}`, 'fixture');
  const evidenceNames = [
    'fixtureManifest',
    'lockfile',
    'resolvedGraph',
    'audit',
    'licenseInventory',
  ];
  let installInput;

  async function installCandidate(input) {
    installInput = input;
    await mkdir(fixtureRoot, { recursive: true });
    for (const name of evidenceNames) {
      const path = join(fixtureRoot, `${name}.evidence`);
      const bytes = Buffer.from(`${name}\n`);
      await writeFile(path, bytes);
      evidence[`${name}Path`] = path;
      evidence[`${name}Sha256`] = sha256(bytes);
    }
    if (overrides.afterInstall) await overrides.afterInstall({ fixtureRoot, sources });
    return Object.freeze({ ...evidence, ...(overrides.installEvidence ?? {}) });
  }

  const calls = [];
  async function runCommand(command, args, options) {
    if (command === 'git') return { stdout: Buffer.from('') };
    calls.push({ command, args: [...args], options: structuredClone(options) });
    const outputIndex = args.indexOf('--outDir');
    const outputRoot = args[outputIndex + 1];
    if (overrides.runCommand) {
      return overrides.runCommand({
        args,
        calls,
        command,
        fixtureRoot,
        options,
        outputRoot,
        sources,
      });
    }
    if (options.env.LYRA_WAVE2_BUILD_TARGET === 'client') {
      await mkdir(join(outputRoot, 'assets'), { recursive: true });
      await writeFile(
        join(outputRoot, 'index.html'),
        '<script src="/assets/entry-client.js"></script>',
      );
      await writeFile(join(outputRoot, 'assets', 'entry-client.js'), 'client output\n');
    } else {
      await mkdir(outputRoot, { recursive: true });
      await writeFile(join(outputRoot, 'entry-server.mjs'), 'server output\n');
    }
    return { stdout: Buffer.alloc(0), stderr: Buffer.alloc(0) };
  }

  return {
    artifacts,
    calls,
    candidate,
    evidence,
    fixtureRoot,
    get installInput() {
      return installInput;
    },
    installCandidate,
    root,
    runCommand,
    runRoot,
    sources,
  };
}

function input(setup, overrides = {}) {
  return {
    candidate: setup.candidate,
    artifacts: setup.artifacts,
    adapterEntry: setup.sources.adapterEntry,
    contractId: 'OF-ANCHORED',
    request: {
      schemaVersion: 1,
      scenario: {
        scenarioId: 'of-anchored.fixture.v1',
        operations: [{ operation: 'open', target: 'trigger' }],
        probes: [],
      },
      cell: {
        id: 'chromium',
        reactVersion: '19.2.8',
        direction: 'ltr',
        colorScheme: 'light',
        forcedColors: false,
        reducedMotion: false,
        coarsePointer: false,
      },
    },
    reactVersion: '19.2.8',
    runRoot: setup.runRoot,
    repositoryRoot: setup.sources.repositoryRoot,
    runCommand: setup.runCommand,
    ...overrides,
  };
}

test('copies each allowed source once with hashes and returns verified contained builds and evidence', async (t) => {
  const prepareWave2Fixture = await loadPrepareWave2Fixture();
  const setup = await createFixtureSetup(t);
  const reads = new Map();
  const result = await prepareWave2Fixture(input(setup), {
    installCandidate: setup.installCandidate,
    async readSourceHandle(handle, path) {
      reads.set(path, (reads.get(path) ?? 0) + 1);
      return handle.readFile();
    },
  });

  assert.deepEqual(setup.installInput.fixtureDependencies, {
    react: '19.2.8',
    'react-dom': '19.2.8',
  });
  assert.equal(reads.size, 14);
  assert.deepEqual([...reads.values()], Array(14).fill(1));
  assert.deepEqual(
    Object.keys(result.sourceHashes).sort(),
    [
      'adapter',
      'axe',
      'axeMetadata',
      'cells',
      'contractProtocol',
      'entryClient',
      'entryServer',
      'indexHtml',
      'measurements',
      'protocol',
      'reactFixture',
      'runtime',
      'sharedProtocol',
      'sharedResourceTracker',
    ].sort(),
  );
  for (const source of Object.values(result.sourceHashes)) {
    assert.equal(relative(setup.runRoot, source.path).startsWith('..'), false);
    assert.equal(sha256(await readFile(source.path)), source.sha256);
    assert.equal((await stat(source.path)).isFile(), true);
  }
  for (const [pathKey, shaKey] of [
    ['clientPath', 'clientSha256'],
    ['clientHtmlPath', 'clientHtmlSha256'],
    ['ssrPath', 'ssrSha256'],
  ]) {
    assert.equal(relative(setup.runRoot, result[pathKey]).startsWith('..'), false);
    assert.equal(sha256(await readFile(result[pathKey])), result[shaKey]);
  }
  for (const [key, value] of Object.entries(setup.evidence)) assert.equal(result[key], value);
  assert.deepEqual(result.cleanup, {
    paths: [
      join(setup.fixtureRoot, 'wave2-fixture'),
      join(setup.fixtureRoot, 'candidates'),
      join(setup.fixtureRoot, 'fixtures'),
      join(setup.fixtureRoot, 'contracts'),
      join(setup.fixtureRoot, 'tools'),
      join(setup.fixtureRoot, 'index.html'),
    ],
    runRoot: setup.runRoot,
  });

  const vitePath = join(setup.sources.repositoryRoot, 'node_modules', 'vite', 'bin', 'vite.js');
  assert.equal(setup.calls.length, 2);
  assert.deepEqual(
    setup.calls.map(({ command }) => command),
    [process.execPath, process.execPath],
  );
  assert.deepEqual(
    setup.calls.map(({ args }) => args),
    [
      [
        vitePath,
        'build',
        setup.fixtureRoot,
        '--config',
        join(setup.fixtureRoot, 'wave2-fixture', 'vite.config.mjs'),
        '--outDir',
        join(setup.fixtureRoot, 'wave2-fixture', 'dist-client'),
        '--emptyOutDir',
        '--logLevel',
        'silent',
      ],
      [
        vitePath,
        'build',
        setup.fixtureRoot,
        '--config',
        join(setup.fixtureRoot, 'wave2-fixture', 'vite.config.mjs'),
        '--outDir',
        join(setup.fixtureRoot, 'wave2-fixture', 'dist-ssr'),
        '--emptyOutDir',
        '--logLevel',
        'silent',
        '--ssr',
        join(setup.fixtureRoot, 'fixtures', 'wave2', 'entry-server.mjs'),
      ],
    ],
  );
  assert.equal(setup.calls[0].options.env.LYRA_WAVE2_VITE_DEFINE, undefined);
  assert.equal(setup.calls[1].options.env.LYRA_WAVE2_VITE_DEFINE, undefined);
  assert.deepEqual(
    setup.calls.map(({ options }) => options.cwd),
    [setup.fixtureRoot, setup.fixtureRoot],
  );
});

for (const [label, mutate, expected] of [
  [
    'adapter symlink',
    async ({ sources }) => {
      const target = `${sources.adapterEntry}.target`;
      await rename(sources.adapterEntry, target);
      await symlink(target, sources.adapterEntry);
    },
    /symbolic link|regular file/u,
  ],
  [
    'protocol symlink',
    async ({ sources }) => {
      const path = join(sources.fixtureSourceRoot, 'protocol.mjs');
      const target = `${path}.target`;
      await rename(path, target);
      await symlink(target, path);
    },
    /symbolic link|regular file/u,
  ],
  [
    'missing runtime',
    async ({ sources }) =>
      rename(
        join(sources.fixtureSourceRoot, 'runtime.mjs'),
        join(sources.fixtureSourceRoot, 'runtime.missing'),
      ),
    /ENOENT|does not exist/u,
  ],
]) {
  test(`rejects ${label.startsWith('adapter') ? 'an' : 'a'} ${label} before either build`, async (t) => {
    const prepareWave2Fixture = await loadPrepareWave2Fixture();
    const setup = await createFixtureSetup(t);
    await mutate(setup);
    await assert.rejects(
      prepareWave2Fixture(input(setup), { installCandidate: setup.installCandidate }),
      expected,
    );
    assert.deepEqual(setup.calls, []);
  });
}

test('rejects a named source replacement while reading before either build', async (t) => {
  const prepareWave2Fixture = await loadPrepareWave2Fixture();
  const setup = await createFixtureSetup(t);
  let replaced = false;
  await assert.rejects(
    prepareWave2Fixture(input(setup), {
      installCandidate: setup.installCandidate,
      async readSourceHandle(handle, path) {
        const bytes = await handle.readFile();
        if (!replaced) {
          replaced = true;
          await rename(path, `${path}.original`);
          await writeFile(path, 'replacement\n');
        }
        return bytes;
      },
    }),
    /identity|changed/u,
  );
  assert.deepEqual(setup.calls, []);
});

test('uses exclusive source destinations and never starts a build after a collision', async (t) => {
  const prepareWave2Fixture = await loadPrepareWave2Fixture();
  const setup = await createFixtureSetup(t, {
    async afterInstall({ fixtureRoot }) {
      const destination = join(fixtureRoot, 'candidates', 'wave2');
      await mkdir(destination, { recursive: true });
      await writeFile(join(destination, 'adapter.mjs'), 'foreign bytes\n');
    },
  });
  await assert.rejects(
    prepareWave2Fixture(input(setup), { installCandidate: setup.installCandidate }),
    /EEXIST|exist/u,
  );
  assert.deepEqual(setup.calls, []);
  assert.equal(
    await readFile(join(setup.fixtureRoot, 'candidates', 'wave2', 'adapter.mjs'), 'utf8'),
    'foreign bytes\n',
  );
});

test('detects copied-source drift after the client build and refuses the SSR build', async (t) => {
  const prepareWave2Fixture = await loadPrepareWave2Fixture();
  const setup = await createFixtureSetup(t, {
    async runCommand({ options, outputRoot, fixtureRoot }) {
      await mkdir(join(outputRoot, 'assets'), { recursive: true });
      await writeFile(join(outputRoot, 'index.html'), 'client html\n');
      await writeFile(join(outputRoot, 'assets', 'entry-client.js'), 'client output\n');
      if (options.env.LYRA_WAVE2_BUILD_TARGET === 'client') {
        await writeFile(join(fixtureRoot, 'candidates', 'wave2', 'adapter.mjs'), 'changed\n');
      }
      return { stdout: Buffer.alloc(0) };
    },
  });
  await assert.rejects(
    prepareWave2Fixture(input(setup), { installCandidate: setup.installCandidate }),
    /checksum|changed/u,
  );
  assert.equal(setup.calls.length, 1);
});

test('rejects installation evidence whose fixture root escapes the owned run root', async (t) => {
  const prepareWave2Fixture = await loadPrepareWave2Fixture();
  const setup = await createFixtureSetup(t, {
    installEvidence: {
      fixtureManifestPath: join(dirname(setupPlaceholder()), 'outside', 'package.json'),
    },
  });
  await assert.rejects(
    prepareWave2Fixture(input(setup), { installCandidate: setup.installCandidate }),
    /fixture root must be inside the owned run root/u,
  );
  assert.deepEqual(setup.calls, []);
});

test('rejects a client output directory symlink that escapes the owned run root', async (t) => {
  const prepareWave2Fixture = await loadPrepareWave2Fixture();
  const setup = await createFixtureSetup(t);
  const escaped = join(setup.root, 'escaped-client-output');
  setup.runCommand = async (command, args, options) => {
    if (command === 'git') return { stdout: Buffer.from('') };
    setup.calls.push({ command, args: [...args], options: structuredClone(options) });
    const outputRoot = args[args.indexOf('--outDir') + 1];
    if (options.env.LYRA_WAVE2_BUILD_TARGET === 'client') {
      await mkdir(join(escaped, 'assets'), { recursive: true });
      await writeFile(join(escaped, 'index.html'), 'escaped client html\n');
      await writeFile(join(escaped, 'assets', 'entry-client.js'), 'escaped client output\n');
      await symlink(escaped, outputRoot);
    }
    return { stdout: Buffer.alloc(0) };
  };

  await assert.rejects(
    prepareWave2Fixture(input(setup), { installCandidate: setup.installCandidate }),
    /output escapes the owned run root/u,
  );
  assert.equal(
    await readFile(join(escaped, 'assets', 'entry-client.js'), 'utf8'),
    'escaped client output\n',
  );
});

function setupPlaceholder() {
  return '/synthetic/placeholder';
}

for (const target of ['client', 'ssr']) {
  test(`requires and hashes the ${target} output before success`, async (t) => {
    const prepareWave2Fixture = await loadPrepareWave2Fixture();
    const setup = await createFixtureSetup(t, {
      async runCommand({ options, outputRoot }) {
        await mkdir(outputRoot, { recursive: true });
        if (options.env.LYRA_WAVE2_BUILD_TARGET === 'client' && target !== 'client') {
          await mkdir(join(outputRoot, 'assets'));
          await writeFile(join(outputRoot, 'index.html'), 'client html\n');
          await writeFile(join(outputRoot, 'assets', 'entry-client.js'), 'client output\n');
        }
        return { stdout: Buffer.alloc(0) };
      },
    });
    await assert.rejects(
      prepareWave2Fixture(input(setup), { installCandidate: setup.installCandidate }),
      /ENOENT|output/u,
    );
  });
}

test('aggregates primary and cleanup failures in that order', async (t) => {
  const prepareWave2Fixture = await loadPrepareWave2Fixture();
  const primary = new Error('synthetic client build failure');
  const cleanup = new Error('synthetic cleanup failure');
  const setup = await createFixtureSetup(t, {
    async runCommand() {
      throw primary;
    },
  });
  let caught;
  try {
    await prepareWave2Fixture(input(setup), {
      installCandidate: setup.installCandidate,
      async removeWave2Root() {
        throw cleanup;
      },
    });
  } catch (error) {
    caught = error;
  }
  assert.ok(caught instanceof AggregateError);
  assert.deepEqual(caught.errors, [primary, cleanup]);
});

for (const [label, source] of [
  ['missing local import', "import './missing.mjs';"],
  ['dynamic import escape', "await import('../../../outside.mjs');"],
  ['computed import', 'await import(globalThis.path);'],
  ['bare checkout fallback', "import 'repo-only-package';"],
])
  test(`rejects ${label} in the closed copied graph`, async (t) => {
    const setup = await createFixtureSetup(t);
    await writeFile(setup.sources.adapterEntry, source);
    await assert.rejects(
      (await loadPrepareWave2Fixture())(input(setup), { installCandidate: setup.installCandidate }),
      /import|closure|isolated|resolve/,
    );
    assert.equal(setup.calls.length, 0);
  });
for (const version of ['18.3.1', '19.2.8'])
  test(`prepares the exact React ${version} pair and canonical execution request`, async (t) => {
    const setup = await createFixtureSetup(t);
    const args = input(setup, { reactVersion: version });
    args.request.cell.reactVersion = version;
    const result = await (
      await loadPrepareWave2Fixture()
    )(args, { installCandidate: setup.installCandidate });
    assert.deepEqual(setup.installInput.fixtureDependencies, {
      react: version,
      'react-dom': version,
    });
    const configText = await readFile(
      join(setup.fixtureRoot, 'wave2-fixture/vite.config.mjs'),
      'utf8',
    );
    assert.equal(configText.includes(setup.sources.repositoryRoot), false);
    assert.match(configText, /__LYRA_WAVE2_REQUEST__/);
    assert.match(configText, /OF-ANCHORED/);
    assert.equal(result.contractId, 'OF-ANCHORED');
  });
for (const change of [
  (args) => {
    args.request.scenario.expected = {};
  },
  (args) => {
    args.contractId = 'OF-MENU';
  },
  (args) => {
    args.request.cell.reactVersion = '18.3.1';
  },
])
  test('rejects mismatched or oracle-bearing requests before install', async (t) => {
    const setup = await createFixtureSetup(t);
    const args = input(setup);
    change(args);
    await assert.rejects(
      (await loadPrepareWave2Fixture())(args, {
        installCandidate() {
          throw new Error('must not install');
        },
      }),
      /request|contract|reactVersion/,
    );
  });

test('server renderer repeats actual output, permits safe capability checks, and binds execution request', async () => {
  const module = await import('../fixtures/wave2/entry-server.mjs');
  const React = await import('react');
  const { renderToString } = await import('react-dom/server');
  const request = {
    schemaVersion: 1,
    scenario: {
      scenarioId: 'of-anchored.server.v1',
      operations: [{ operation: 'updateContent', target: 'server-render-closed' }],
      probes: [],
    },
    cell: {
      id: 'ssr',
      reactVersion: '19.2.8',
      direction: 'ltr',
      colorScheme: 'light',
      forcedColors: false,
      reducedMotion: false,
      coarsePointer: false,
    },
  };
  const render = module.createWave2ServerRenderer({
    React,
    renderToString,
    request,
    contractId: 'OF-ANCHORED',
    loadAdapter: async () => ({
      createAnchoredCandidate: async () => ({
        AnchoredFixture: () => {
          assert.equal(typeof window, 'undefined');
          assert.equal(globalThis.document, undefined);
          return React.createElement(
            'button',
            { 'data-overlay-id': 'trigger', 'aria-expanded': false },
            'Open',
          );
        },
      }),
    }),
  });
  const result = await render();
  assert.equal(result.html, result.repeatHtml);
  assert.deepEqual(result.facts, {
    'browser-globals:accessed': false,
    'server-render:deterministic': true,
    'trigger:closed-aria-expanded': false,
  });
  assert.equal(Object.hasOwn(globalThis, 'document'), false);
  await assert.rejects(render({ renderTarget: 'undeclared' }), /declared/);
});

test('client entry installs tracking before adapter import and captures resources before restoring instrumentation', async () => {
  const { mountWave2FixtureClient } = await import('../fixtures/wave2/entry-client.mjs');
  const order = [];
  let ready;
  const request = {
    schemaVersion: 1,
    scenario: {
      scenarioId: 'of-anchored.client.v1',
      operations: [{ operation: 'open', target: 'trigger' }],
      probes: [],
    },
    cell: {
      id: 'chromium',
      reactVersion: '19.2.8',
      direction: 'ltr',
      colorScheme: 'light',
      forcedColors: false,
      reducedMotion: false,
      coarsePointer: false,
    },
  };
  const root = {
    render(element) {
      ready = element.props.onReady;
      ready({
        operations: {},
        observe() {},
        async destroy() {
          order.push('handle-destroy');
          return { status: 'destroyed' };
        },
      });
    },
    unmount() {
      order.push('root-unmount');
    },
  };
  const scope = {
    document: { querySelector: () => ({ innerHTML: '<button>Open</button>' }) },
    __LYRA_WAVE2_NATIVE_INPUT__: async (method, args) => {
      order.push([method, args]);
      return { facts: { 'server-render:deterministic': true, invented: true } };
    },
  };
  let fixture;
  let suppliedDriver;
  const mounted = await mountWave2FixtureClient({
    request,
    contractId: 'OF-ANCHORED',
    scope,
    React: { createElement: (type, props) => ({ type, props }) },
    ReactDOM: { flushSync: (fn) => fn() },
    createRoot: () => root,
    installTracker() {
      order.push('tracker');
      return {
        restore() {
          order.push('tracker-restore');
        },
      };
    },
    installInstrumentation() {
      order.push('instrumentation');
      return {
        restore() {
          order.push('instrumentation-restore');
        },
      };
    },
    createRuntime() {
      return {
        beginScenario(value) {
          fixture = value.fixture;
          order.push('begin');
        },
        async destroy() {
          await fixture.destroy();
          order.push('resource-capture');
          return { status: 'destroyed' };
        },
        observe: () => ({}),
      };
    },
    loadAdapter: async () => {
      order.push('import');
      return {
        createAnchoredCandidate: async ({ driver }) => {
          suppliedDriver = driver;
          return { AnchoredFixture() {} };
        },
      };
    },
    axe: {
      setup() {},
      teardown() {},
      commons: { aria: { getRole: () => 'button' }, text: { accessibleText: () => 'Open' } },
    },
  });
  assert.deepEqual(order, ['tracker', 'instrumentation', 'import', 'begin']);
  await suppliedDriver.press({ key: 'Tab' });
  assert.deepEqual(order.at(-1), ['press', { key: 'Tab' }]);
  await suppliedDriver.lifecycle({ target: 'server-render-closed' });
  assert.deepEqual(suppliedDriver.facts(), { 'server-render:deterministic': true });
  await mounted.cleanup();
  assert.deepEqual(order.slice(-4), [
    'handle-destroy',
    'root-unmount',
    'resource-capture',
    'instrumentation-restore',
  ]);
});

for (const kind of ['lock', 'status'])
  test(`detects repository ${kind} drift across builds`, async (t) => {
    const setup = await createFixtureSetup(t);
    const args = input(setup);
    const original = args.runCommand;
    let built = false;
    args.runCommand = async (command, argv, options) => {
      if (command === 'git')
        return { stdout: Buffer.from(built && kind === 'status' ? ' M tracked.txt\n' : '') };
      const result = await original(command, argv, options);
      built = true;
      if (kind === 'lock')
        await writeFile(join(setup.sources.repositoryRoot, 'pnpm-lock.yaml'), 'changed lock');
      return result;
    };
    await assert.rejects(
      (await loadPrepareWave2Fixture())(args, { installCandidate: setup.installCandidate }),
      /repository.*changed/,
    );
  });

test('defers hydration until the declared operation and preserves real prehydration focus', async () => {
  const { mountWave2FixtureClient } = await import('../fixtures/wave2/entry-client.mjs');
  const order = [];
  const operations = [
    { operation: 'updateContent', target: 'server-render-open' },
    { operation: 'focus', target: 'trigger' },
    { operation: 'updateContent', target: 'hydrate-first-tree' },
  ];
  const request = {
    schemaVersion: 1,
    scenario: { scenarioId: 'of-anchored.hydration.v1', operations, probes: [] },
    cell: {
      id: 'hydration',
      reactVersion: '19.2.8',
      direction: 'ltr',
      colorScheme: 'light',
      forcedColors: false,
      reducedMotion: false,
      coarsePointer: false,
    },
  };
  const container = { innerHTML: '<button>SSR</button>' };
  const trigger = {
    isConnected: true,
    getAttribute: () => 'trigger',
    focus() {
      scope.document.activeElement = trigger;
      order.push('focus');
    },
  };
  const scope = {
    document: {
      querySelector: () => container,
      querySelectorAll: () => [trigger],
      createElement: () => ({ innerHTML: '' }),
    },
    __LYRA_WAVE2_SSR__: {
      html: container.innerHTML,
      requestJSON: JSON.stringify(request),
      contractId: 'OF-ANCHORED',
      renderTarget: 'server-render-open',
      facts: {},
    },
  };
  let proxy;
  const mounted = await mountWave2FixtureClient({
    request,
    contractId: 'OF-ANCHORED',
    scope,
    React: { createElement: (type, props) => ({ type, props }) },
    ReactDOM: { flushSync: (fn) => fn() },
    createRoot() {
      throw new Error('must not client mount');
    },
    hydrateRoot(node, element) {
      order.push('hydrate');
      assert.equal(scope.document.activeElement, trigger);
      element.props.onReady({
        operations: {},
        observe: () => ({ measured: true }),
        destroy: async () => ({ status: 'destroyed' }),
      });
      return { unmount() {} };
    },
    installTracker: () => ({ restore() {} }),
    installInstrumentation: () => ({ restore() {} }),
    createRuntime: () => ({
      beginScenario({ fixture }) {
        proxy = fixture;
      },
      runOperation: (op) => proxy.operations[op.operation](op),
      observe: () => proxy.observe(),
    }),
    loadAdapter: async () => {
      order.push('import');
      return { createAnchoredCandidate: async () => ({ AnchoredFixture() {} }) };
    },
    axe: {},
  });
  assert.deepEqual(order, []);
  await mounted.runOperation(operations[0]);
  await mounted.runOperation(operations[1]);
  assert.deepEqual(order, ['focus']);
  assert.equal(mounted.observe().focus.target, 'trigger');
  await mounted.runOperation(operations[2]);
  assert.deepEqual(order, ['focus', 'import', 'hydrate']);
  assert.deepEqual(mounted.observe(), { measured: true });
});

for (const version of ['^19.2.8', '19.3.0'])
  test(`rejects unsupported React version ${version}`, async (t) => {
    const setup = await createFixtureSetup(t);
    const args = input(setup, { reactVersion: version });
    args.request.cell.reactVersion = version;
    await assert.rejects(
      (await loadPrepareWave2Fixture())(args, { installCandidate: setup.installCandidate }),
      /reactVersion|React|version/,
    );
  });

test('checks and hashes every emitted chunk, rejecting an escaped secondary asset', async (t) => {
  const setup = await createFixtureSetup(t);
  const original = setup.runCommand;
  setup.runCommand = async (command, args, options) => {
    const result = await original(command, args, options);
    if (options.env?.LYRA_WAVE2_BUILD_TARGET === 'client') {
      const outside = join(setup.root, 'outside-chunk.js');
      await writeFile(outside, 'escaped');
      await symlink(outside, join(args[args.indexOf('--outDir') + 1], 'assets/chunk-escape.js'));
    }
    return result;
  };
  await assert.rejects(
    (await loadPrepareWave2Fixture())(input(setup), { installCandidate: setup.installCandidate }),
    /output.*escapes/,
  );
});

async function realInstallerSetup(t, version = '19.2.8') {
  const setup = await createFixtureSetup(t);
  const { createOwnedRunRoot } = await import('./isolation.mjs');
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const run = promisify(execFile);
  const { runRoot } = await createOwnedRunRoot({ tmpdir: setup.root, runId: 'wave2' });
  setup.runRoot = runRoot;
  await writeFile(join(setup.sources.repositoryRoot, '.nvmrc'), '24.18.0\n');
  await writeFile(
    join(setup.sources.repositoryRoot, 'package.json'),
    JSON.stringify({ packageManager: 'pnpm@11.13.1', devDependencies: { vite: '8.2.1' } }),
  );
  const name = 'synthetic-wave2';
  const manifest = { name, version: '1.0.0', license: 'MIT' };
  const archiveRoot = join(setup.root, 'archive/package');
  await mkdir(archiveRoot, { recursive: true });
  await writeFile(join(archiveRoot, 'package.json'), JSON.stringify(manifest));
  const archive = join(setup.root, 'candidate.tgz');
  await run('tar', ['-czf', archive, '-C', dirname(archiveRoot), 'package']);
  const bytes = await readFile(archive);
  const hash = sha256(bytes);
  setup.artifacts = [
    {
      record: { ...manifest, sha256: hash },
      path: archive,
      sha256: hash,
      bytes: bytes.length,
      packageName: name,
      packageVersion: '1.0.0',
      license: 'MIT',
    },
  ];
  const calls = [];
  let graph;
  const fakeBuild = setup.runCommand;
  setup.runCommand = async (command, args, options) => {
    calls.push({ command, args, options });
    if (command !== 'pnpm') return fakeBuild(command, args, options);
    if (args[0] === '--version') return { stdout: Buffer.from('11.13.1\n') };
    if (args[0] === 'install') {
      assert.ok(args.includes('--ignore-workspace'));
      assert.ok(args.includes('--ignore-scripts'));
      const installs = calls.filter((c) => c.command === 'pnpm' && c.args[0] === 'install');
      if (installs.length === 2) {
        assert.ok(args.includes('--offline'));
        assert.ok(args.includes('--frozen-lockfile'));
      }
      const fixtureManifest = JSON.parse(await readFile(join(options.cwd, 'package.json'), 'utf8'));
      assert.deepEqual(
        Object.keys(fixtureManifest.dependencies).sort(),
        ['react', 'react-dom', name].sort(),
      );
      assert.equal(fixtureManifest.dependencies.react, version);
      assert.equal(fixtureManifest.dependencies['react-dom'], version);
      const artifactCopy = join(dirname(options.cwd), 'artifacts', hash + '.tgz');
      assert.equal(fixtureManifest.dependencies[name], 'file:' + artifactCopy);
      assert.equal(sha256(await readFile(artifactCopy)), hash);
      graph = { dependencies: {} };
      for (const pkg of [
        manifest,
        { name: 'react', version, license: 'MIT' },
        { name: 'react-dom', version, license: 'MIT' },
      ]) {
        const path = join(options.cwd, 'node_modules', pkg.name);
        await mkdir(path, { recursive: true });
        await writeFile(join(path, 'package.json'), JSON.stringify(pkg));
        graph.dependencies[pkg.name] = { version: pkg.version, path };
      }
      await writeFile(join(options.cwd, 'pnpm-lock.yaml'), 'frozen synthetic lock');
      return { stdout: Buffer.from('') };
    }
    if (args[0] === 'list') return { stdout: Buffer.from(JSON.stringify([graph])) };
    if (args[0] === 'audit')
      return {
        stdout: Buffer.from(
          JSON.stringify({
            metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0 } },
          }),
        ),
      };
    throw new Error('unexpected command');
  };
  return { setup, calls };
}
for (const version of ['18.3.1', '19.2.8'])
  test(`real installer preserves exact artifacts and script-disabled frozen React ${version} installs`, async (t) => {
    const { setup, calls } = await realInstallerSetup(t, version);
    const args = input(setup, { reactVersion: version });
    args.request.cell.reactVersion = version;
    const result = await (await loadPrepareWave2Fixture())(args);
    assert.equal(calls.filter((c) => c.command === 'pnpm' && c.args[0] === 'install').length, 2);
    for (const field of [
      'lockfile',
      'audit',
      'licenseInventory',
      'fixtureManifest',
      'resolvedGraph',
    ])
      assert.equal(sha256(await readFile(result[field + 'Path'])), result[field + 'Sha256']);
  });
test('real installer rejects duplicate artifact package names', async (t) => {
  const { setup } = await realInstallerSetup(t);
  setup.artifacts.push(setup.artifacts[0]);
  await assert.rejects((await loadPrepareWave2Fixture())(input(setup)), /names must be unique/);
});

async function writeSyntheticModules(fixtureRoot, adapterText) {
  const specifiers = [
    'react',
    'react-dom',
    'react-dom/client',
    'react-dom/server',
    ...[...adapterText.matchAll(/import\('([^']+)'\)/gu)].map((m) => m[1]),
  ];
  for (const specifier of specifiers) {
    const parts = specifier.split('/');
    const name = specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
    const root = join(fixtureRoot, 'node_modules', name);
    await mkdir(root, { recursive: true });
    await writeFile(
      join(root, 'package.json'),
      JSON.stringify({
        name,
        version: '1.0.0',
        type: 'module',
        exports: { '.': './index.mjs', './*': './index.mjs' },
      }),
    );
    await writeFile(
      join(root, 'index.mjs'),
      'export default {}; export const createRoot = () => {}, hydrateRoot = () => {}, flushSync = fn => fn(), renderToString = () => "synthetic";',
    );
  }
}
for (const family of ['anchored', 'menu', 'tooltip'])
  for (const candidate of ['incumbent', 'radix', 'base-ui', 'zag'])
    test(`actual ${candidate} ${family} source graph is closed inside the isolated tree`, async (t) => {
      const setup = await createFixtureSetup(t);
      const actualEvaluationRoot = new URL('../', import.meta.url);
      for (const file of [
        'wave2/protocol.mjs',
        'wave2/runtime.mjs',
        'wave2/react-fixture.mjs',
        'wave2/measurements.mjs',
        'wave2/entry-client.mjs',
        'wave2/entry-server.mjs',
        'wave2/index.html',
        'shared/protocol.mjs',
        'shared/resource-tracker.mjs',
      ]) {
        await writeFile(
          join(setup.sources.fixtureSourceRoot, '..', file),
          await readFile(new URL('fixtures/' + file, actualEvaluationRoot)),
        );
      }
      for (const file of ['protocol.mjs', 'cells.mjs'])
        await writeFile(
          join(setup.sources.fixtureSourceRoot, '../../contracts', file),
          await readFile(new URL('contracts/' + file, actualEvaluationRoot)),
        );
      const adapterEntry = join(
        setup.sources.repositoryRoot,
        'tools/overlay-foundation-evaluation/candidates',
        family,
        candidate + '.mjs',
      );
      await mkdir(dirname(adapterEntry), { recursive: true });
      const adapterText = await readFile(
        new URL('candidates/' + family + '/' + candidate + '.mjs', actualEvaluationRoot),
        'utf8',
      );
      await writeFile(adapterEntry, adapterText);
      const args = input(setup, {
        candidate: { id: candidate },
        adapterEntry,
        contractId: 'OF-' + family.toUpperCase(),
      });
      args.request.scenario.scenarioId = 'of-' + family + '.fixture.v1';
      const result = await (
        await loadPrepareWave2Fixture()
      )(args, {
        async installCandidate(input) {
          const evidence = await setup.installCandidate(input);
          await writeSyntheticModules(setup.fixtureRoot, adapterText);
          return evidence;
        },
      });
      assert.equal(Object.keys(result.sourceHashes).length, 14);
      assert.equal(
        Object.values(result.sourceHashes).some((record) =>
          /catalog|expected|\.test\./.test(record.path),
        ),
        false,
      );
      assert.equal(await readFile(result.sourceHashes.adapter.path, 'utf8'), adapterText);
    });

test('real pinned Vite builds the copied axe tool and isolated client/SSR module graph', async (t) => {
  const { fileURLToPath } = await import('node:url');
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const run = promisify(execFile);
  const setup = await createFixtureSetup(t);
  const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url));
  const adapterEntry = join(
    repositoryRoot,
    'tools/overlay-foundation-evaluation/candidates/anchored/radix.mjs',
  );
  const adapterText = await readFile(adapterEntry, 'utf8');
  const args = input(setup, {
    repositoryRoot,
    adapterEntry,
    runCommand: (command, argv, options) =>
      run(command, command === 'git' ? [...realRepositoryGitConfig, ...argv] : argv, options),
  });
  const result = await (
    await loadPrepareWave2Fixture()
  )(args, {
    async installCandidate(input) {
      const evidence = await setup.installCandidate(input);
      await writeSyntheticModules(setup.fixtureRoot, adapterText);
      return evidence;
    },
  });
  assert.ok(Object.keys(result.buildOutputs).length >= 5);
  assert.equal(result.toolEvidence.axe.version, '4.13.0');
  assert.match(await readFile(result.sourceHashes.axe.path, 'utf8'), /Mozilla Public/u);
  for (const [path, hash] of Object.entries(result.buildOutputs))
    assert.equal(sha256(await readFile(path)), hash);
});

test('rejects a destination parent symlink before writing outside the owned run root', async (t) => {
  const setup = await createFixtureSetup(t);
  const outside = join(setup.root, 'foreign');
  await mkdir(outside);
  let injected = false;
  await assert.rejects(
    (await loadPrepareWave2Fixture())(input(setup), {
      installCandidate: setup.installCandidate,
      async readSourceHandle(handle) {
        if (!injected) {
          injected = true;
          await symlink(outside, join(setup.fixtureRoot, 'candidates/wave2'));
        }
        return handle.readFile();
      },
    }),
    /destination|escapes|canonical/,
  );
  await assert.rejects(readFile(join(outside, 'adapter.mjs')), /ENOENT/);
});

test('actual Vite resolution rejects a transitive package file outside the isolated graph', async (t) => {
  const { fileURLToPath } = await import('node:url');
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const run = promisify(execFile);
  const setup = await createFixtureSetup(t);
  const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url));
  const adapterEntry = join(
    repositoryRoot,
    'tools/overlay-foundation-evaluation/candidates/anchored/radix.mjs',
  );
  const text = await readFile(adapterEntry, 'utf8');
  const foreign = join(setup.root, 'foreign.mjs');
  await writeFile(foreign, 'export const escaped = 1;');
  await assert.rejects(
    (await loadPrepareWave2Fixture())(
      input(setup, {
        repositoryRoot,
        adapterEntry,
        runCommand: async (cmd, args, options) => {
          try {
            return await run(
              cmd,
              (cmd === 'git' ? realRepositoryGitConfig : []).concat(
                args.map((arg) => (arg === 'silent' ? 'error' : arg)),
              ),
              options,
            );
          } catch (error) {
            error.message += error.stderr;
            throw error;
          }
        },
      }),
      {
        async installCandidate(input) {
          const evidence = await setup.installCandidate(input);
          await writeSyntheticModules(setup.fixtureRoot, text);
          await writeFile(
            join(setup.fixtureRoot, 'node_modules/@radix-ui/react-popover/index.mjs'),
            'export * from ' + JSON.stringify(foreign) + ';',
          );
          return evidence;
        },
      },
    ),
    /isolated|escape|source closure/,
  );
});

test('preserves verified axe version and MPL license metadata with the tool source', async (t) => {
  const setup = await createFixtureSetup(t);
  const result = await (
    await loadPrepareWave2Fixture()
  )(input(setup), { installCandidate: setup.installCandidate });
  const metadata = JSON.parse(await readFile(result.sourceHashes.axeMetadata.path));
  assert.equal(metadata.version, '4.13.0');
  assert.equal(metadata.license, 'MPL-2.0');
});

test('server failures preserve unavailable DOM access errors and never fabricate success facts', async () => {
  const { createWave2ServerRenderer } = await import('../fixtures/wave2/entry-server.mjs');
  const React = await import('react');
  const { renderToString } = await import('react-dom/server');
  const request = {
    schemaVersion: 1,
    scenario: {
      scenarioId: 'of-anchored.server.v1',
      operations: [{ operation: 'open', target: 'trigger' }],
      probes: [],
    },
    cell: {
      id: 'ssr',
      reactVersion: '19.2.8',
      direction: 'ltr',
      colorScheme: 'light',
      forcedColors: false,
      reducedMotion: false,
      coarsePointer: false,
    },
  };
  const make = (Fixture) =>
    createWave2ServerRenderer({
      React,
      renderToString,
      request,
      contractId: 'OF-ANCHORED',
      loadAdapter: async () => ({
        createAnchoredCandidate: async () => ({ AnchoredFixture: Fixture }),
      }),
    });
  await assert.rejects(make(() => document.createElement('button'))(), ReferenceError);
  const result = await make(() => React.createElement('button', null, 'safe'))();
  assert.equal(result.requestJSON, JSON.stringify(request));
  assert.equal(result.contractId, 'OF-ANCHORED');
});

test('rejects an SSR bootstrap from a different compiled request', async () => {
  const { mountWave2FixtureClient } = await import('../fixtures/wave2/entry-client.mjs');
  const request = {
    scenario: {
      operations: [
        { operation: 'updateContent', target: 'server-render-open' },
        { operation: 'updateContent', target: 'hydrate-first-tree' },
      ],
    },
  };
  const scope = {
    document: { querySelector: () => ({ innerHTML: '' }) },
    __LYRA_WAVE2_SSR__: {
      renderTarget: 'server-render-open',
      html: '',
      requestJSON: '{}',
      contractId: 'OF-ANCHORED',
    },
  };
  await assert.rejects(
    mountWave2FixtureClient({
      request,
      contractId: 'OF-ANCHORED',
      scope,
      createRuntime: () => ({}),
      installTracker: () => ({ restore() {} }),
      installInstrumentation: () => ({ restore() {} }),
    }),
    /SSR bootstrap.*request/,
  );
});

test('requires SSR bootstrap for declared hydration even in a React compatibility cell', async () => {
  const { mountWave2FixtureClient } = await import('../fixtures/wave2/entry-client.mjs');
  const request = {
    cell: { id: 'react-18' },
    scenario: { operations: [{ operation: 'updateContent', target: 'hydrate-first-tree' }] },
  };
  const scope = { document: { querySelector: () => ({ innerHTML: '' }) } };
  await assert.rejects(
    mountWave2FixtureClient({
      request,
      contractId: 'OF-ANCHORED',
      scope,
      createRuntime: () => ({}),
      installTracker: () => ({ restore() {} }),
      installInstrumentation: () => ({ restore() {} }),
    }),
    /SSR bootstrap.*required/,
  );
});

test('rechecks the compiled request configuration after the client build', async (t) => {
  const setup = await createFixtureSetup(t);
  const original = setup.runCommand;
  setup.runCommand = async (command, args, options) => {
    const result = await original(command, args, options);
    if (options.env?.LYRA_WAVE2_BUILD_TARGET === 'client')
      await writeFile(args[args.indexOf('--config') + 1], 'changed request config');
    return result;
  };
  await assert.rejects(
    (await loadPrepareWave2Fixture())(input(setup), { installCandidate: setup.installCandidate }),
    /checksum.*changed/,
  );
  assert.equal(setup.calls.length, 1);
});

test('rejects client output changes during the SSR build', async (t) => {
  const setup = await createFixtureSetup(t);
  const original = setup.runCommand;
  setup.runCommand = async (command, args, options) => {
    const result = await original(command, args, options);
    if (options.env?.LYRA_WAVE2_BUILD_TARGET === 'ssr')
      await writeFile(
        join(setup.fixtureRoot, 'wave2-fixture/dist-client/assets/entry-client.js'),
        'changed output',
      );
    return result;
  };
  await assert.rejects(
    (await loadPrepareWave2Fixture())(input(setup), { installCandidate: setup.installCandidate }),
    /output.*changed/,
  );
});

for (const failure of ['both', 'runtime', 'instrumentation']) {
  test(`review regression: terminal cleanup preserves ${failure} failure identity and order`, async () => {
    const { mountWave2FixtureClient } = await import('../fixtures/wave2/entry-client.mjs');
    const primary = new Error('runtime destroy');
    const secondary = new Error('instrumentation restore');
    const calls = [];
    let fail = true;
    const request = { scenario: { operations: [{ operation: 'open', target: 'trigger' }] } };
    const mounted = await mountWave2FixtureClient({
      request,
      contractId: 'OF-ANCHORED',
      scope: { document: { querySelector: () => ({ innerHTML: '' }) } },
      React: { createElement: (type, props) => ({ type, props }) },
      ReactDOM: { flushSync: (fn) => fn() },
      createRoot: () => ({
        render(element) {
          element.props.onReady({});
        },
      }),
      installTracker: () => ({ restore() {} }),
      installInstrumentation: () => ({
        restore() {
          calls.push('instrumentation');
          if (fail && failure !== 'runtime') throw secondary;
        },
      }),
      createRuntime: () => ({
        beginScenario() {},
        async destroy() {
          calls.push('runtime');
          if (fail && failure !== 'instrumentation') throw primary;
          return { status: 'destroyed' };
        },
      }),
      loadAdapter: async () => ({
        createAnchoredCandidate: async () => ({ AnchoredFixture() {} }),
      }),
    });
    await assert.rejects(mounted.cleanup(), (error) => {
      if (failure === 'both') {
        assert.ok(error instanceof AggregateError);
        assert.deepEqual(error.errors, [primary, secondary]);
      } else assert.equal(error, failure === 'runtime' ? primary : secondary);
      return true;
    });
    assert.deepEqual(calls, ['runtime', 'instrumentation']);
    fail = false;
    if (failure !== 'instrumentation')
      assert.deepEqual(await mounted.destroy(), { status: 'destroyed' });
    const count = calls.length;
    assert.deepEqual(await mounted.cleanup(), { status: 'already-destroyed' });
    assert.equal(calls.length, count);
  });
}
