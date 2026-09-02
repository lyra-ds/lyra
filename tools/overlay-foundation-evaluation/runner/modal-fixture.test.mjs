import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rename, rm, stat, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { test } from 'node:test';
import { pathToFileURL } from 'node:url';

const modulePath = new URL('./modal-fixture.mjs', import.meta.url);

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

async function loadPrepareModalFixture() {
  const module = await import(modulePath);
  assert.equal(typeof module.prepareModalFixture, 'function');
  return module.prepareModalFixture;
}

async function testDirectory(t) {
  const root = await mkdtemp(join(tmpdir(), 'lyra-modal-fixture-'));
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
    'modal',
  );
  const adapterEntry = join(
    repositoryRoot,
    'tools',
    'overlay-foundation-evaluation',
    'candidates',
    'modal',
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
    JSON.stringify({ name: 'axe-core', version: '4.13.0' }),
  );
  await writeFile(
    join(repositoryRoot, 'node_modules', 'axe-core', 'axe.js'),
    'export default {};\n',
  );
  const files = {
    [adapterEntry]: 'export const adapter = "synthetic";\n',
    [join(fixtureSourceRoot, 'protocol.mjs')]: 'export const protocol = 1;\n',
    [join(fixtureSourceRoot, 'runtime.mjs')]: 'export const runtime = 1;\n',
    [join(fixtureSourceRoot, 'runtime.react-browser-node-util.mjs')]:
      'export const isDeepStrictEqual = () => true;\n',
    [join(fixtureSourceRoot, 'entry-client.mjs')]: 'export const client = 1;\n',
    [join(fixtureSourceRoot, 'entry-server.mjs')]: 'export const server = 1;\n',
    [join(fixtureSourceRoot, 'index.html')]: '<main id="modal-fixture-root"></main>\n',
  };
  for (const [path, bytes] of Object.entries(files)) await writeFile(path, bytes);
  return { adapterEntry, files, fixtureSourceRoot, repositoryRoot };
}

async function createFixtureSetup(t, overrides = {}) {
  const root = await testDirectory(t);
  const sources = await createSources(root);
  const runRoot = join(root, 'owned-run');
  await mkdir(runRoot);
  const candidate = { id: overrides.candidateId ?? 'radix' };
  const artifacts = [{ record: { name: 'synthetic-modal', version: '1.0.0' } }];
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
    if (options.env.LYRA_MODAL_BUILD_TARGET === 'client') {
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
    reactVersion: '19.2.8',
    runRoot: setup.runRoot,
    repositoryRoot: setup.sources.repositoryRoot,
    runCommand: setup.runCommand,
    ...overrides,
  };
}

test('copies each allowed source once with hashes and returns verified contained builds and evidence', async (t) => {
  const prepareModalFixture = await loadPrepareModalFixture();
  const setup = await createFixtureSetup(t);
  const reads = new Map();
  const result = await prepareModalFixture(input(setup), {
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
  assert.equal(reads.size, 7);
  assert.deepEqual([...reads.values()], [1, 1, 1, 1, 1, 1, 1]);
  assert.deepEqual(Object.keys(result.sourceHashes).sort(), [
    'adapter',
    'entryClient',
    'entryServer',
    'indexHtml',
    'protocol',
    'runtime',
    'runtimeBrowserNodeUtil',
  ]);
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
      join(setup.fixtureRoot, 'modal-fixture'),
      join(setup.fixtureRoot, 'candidates'),
      join(setup.fixtureRoot, 'fixtures'),
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
        join(setup.fixtureRoot, 'modal-fixture', 'vite.config.mjs'),
        '--outDir',
        join(setup.fixtureRoot, 'modal-fixture', 'dist-client'),
        '--emptyOutDir',
        '--logLevel',
        'silent',
      ],
      [
        vitePath,
        'build',
        setup.fixtureRoot,
        '--config',
        join(setup.fixtureRoot, 'modal-fixture', 'vite.config.mjs'),
        '--outDir',
        join(setup.fixtureRoot, 'modal-fixture', 'dist-ssr'),
        '--emptyOutDir',
        '--logLevel',
        'silent',
        '--ssr',
        join(setup.fixtureRoot, 'fixtures', 'modal', 'entry-server.mjs'),
      ],
    ],
  );
  assert.equal(setup.calls[0].options.env.LYRA_MODAL_VITE_DEFINE, undefined);
  assert.equal(setup.calls[1].options.env.LYRA_MODAL_VITE_DEFINE, undefined);
  assert.deepEqual(
    setup.calls.map(({ options }) => options.cwd),
    [setup.fixtureRoot, setup.fixtureRoot],
  );
});

test('builds the client against a contained browser-safe deep equality shim', async (t) => {
  const prepareModalFixture = await loadPrepareModalFixture();
  const setup = await createFixtureSetup(t);
  const result = await prepareModalFixture(input(setup), {
    installCandidate: setup.installCandidate,
  });
  const expectedShim = join(
    setup.fixtureRoot,
    'fixtures',
    'modal',
    'runtime.react-browser-node-util.mjs',
  );

  assert.equal(result.sourceHashes.runtimeBrowserNodeUtil.path, expectedShim);
  const previousTarget = process.env.LYRA_MODAL_BUILD_TARGET;
  process.env.LYRA_MODAL_BUILD_TARGET = 'client';
  let config;
  try {
    config = (
      await import(
        `${pathToFileURL(join(setup.fixtureRoot, 'modal-fixture', 'vite.config.mjs'))}?test`
      )
    ).default;
  } finally {
    if (previousTarget === undefined) delete process.env.LYRA_MODAL_BUILD_TARGET;
    else process.env.LYRA_MODAL_BUILD_TARGET = previousTarget;
  }
  assert.equal(config.resolve.alias['node:util'], expectedShim);
});

test('adapts inspected incumbent workspace packs to the isolated fixture installer', async (t) => {
  const prepareModalFixture = await loadPrepareModalFixture();
  const setup = await createFixtureSetup(t, { candidateId: 'incumbent' });
  setup.sources.adapterEntry = join(dirname(setup.sources.adapterEntry), 'incumbent.mjs');
  await writeFile(setup.sources.adapterEntry, 'export const adapter = "incumbent";\n');
  const artifact = {
    bytes: 123,
    license: 'MIT',
    lifecycleScripts: [],
    name: '@lyra-ds/react',
    path: join(setup.root, 'evidence', 'lyra-react.tgz'),
    sha256: 'a'.repeat(64),
    version: '0.5.0',
  };
  setup.artifacts.splice(0, setup.artifacts.length, artifact);

  await prepareModalFixture(input(setup), { installCandidate: setup.installCandidate });

  assert.deepEqual(setup.installInput.artifacts, [
    {
      ...artifact,
      packageName: '@lyra-ds/react',
      packageVersion: '0.5.0',
      record: {
        source: 'workspace-pack',
        name: '@lyra-ds/react',
        version: '0.5.0',
        sha256: 'a'.repeat(64),
        license: 'MIT',
      },
    },
  ]);
});

test('rejects an edited repository Vite pin before installation or builds', async (t) => {
  const prepareModalFixture = await loadPrepareModalFixture();
  const setup = await createFixtureSetup(t);
  await writeFile(
    join(setup.sources.repositoryRoot, 'node_modules', 'vite', 'package.json'),
    JSON.stringify({ name: 'vite', version: '8.2.2' }),
  );
  await assert.rejects(
    prepareModalFixture(input(setup), { installCandidate: setup.installCandidate }),
    /Vite version must equal 8\.2\.1/u,
  );
  assert.equal(setup.installInput, undefined);
  assert.deepEqual(setup.calls, []);
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
    const prepareModalFixture = await loadPrepareModalFixture();
    const setup = await createFixtureSetup(t);
    await mutate(setup);
    await assert.rejects(
      prepareModalFixture(input(setup), { installCandidate: setup.installCandidate }),
      expected,
    );
    assert.deepEqual(setup.calls, []);
  });
}

test('rejects a named source replacement while reading before either build', async (t) => {
  const prepareModalFixture = await loadPrepareModalFixture();
  const setup = await createFixtureSetup(t);
  let replaced = false;
  await assert.rejects(
    prepareModalFixture(input(setup), {
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
  const prepareModalFixture = await loadPrepareModalFixture();
  const setup = await createFixtureSetup(t, {
    async afterInstall({ fixtureRoot }) {
      const destination = join(fixtureRoot, 'candidates', 'modal');
      await mkdir(destination, { recursive: true });
      await writeFile(join(destination, 'adapter.mjs'), 'foreign bytes\n');
    },
  });
  await assert.rejects(
    prepareModalFixture(input(setup), { installCandidate: setup.installCandidate }),
    /EEXIST|exist/u,
  );
  assert.deepEqual(setup.calls, []);
  assert.equal(
    await readFile(join(setup.fixtureRoot, 'candidates', 'modal', 'adapter.mjs'), 'utf8'),
    'foreign bytes\n',
  );
});

test('detects copied-source drift after the client build and refuses the SSR build', async (t) => {
  const prepareModalFixture = await loadPrepareModalFixture();
  const setup = await createFixtureSetup(t, {
    async runCommand({ options, outputRoot, fixtureRoot }) {
      await mkdir(join(outputRoot, 'assets'), { recursive: true });
      await writeFile(join(outputRoot, 'index.html'), 'client html\n');
      await writeFile(join(outputRoot, 'assets', 'entry-client.js'), 'client output\n');
      if (options.env.LYRA_MODAL_BUILD_TARGET === 'client') {
        await writeFile(join(fixtureRoot, 'candidates', 'modal', 'adapter.mjs'), 'changed\n');
      }
      return { stdout: Buffer.alloc(0) };
    },
  });
  await assert.rejects(
    prepareModalFixture(input(setup), { installCandidate: setup.installCandidate }),
    /checksum|changed/u,
  );
  assert.equal(setup.calls.length, 1);
});

test('rejects installation evidence whose fixture root escapes the owned run root', async (t) => {
  const prepareModalFixture = await loadPrepareModalFixture();
  const setup = await createFixtureSetup(t, {
    installEvidence: {
      fixtureManifestPath: join(dirname(setupPlaceholder()), 'outside', 'package.json'),
    },
  });
  await assert.rejects(
    prepareModalFixture(input(setup), { installCandidate: setup.installCandidate }),
    /fixture root must be inside the owned run root/u,
  );
  assert.deepEqual(setup.calls, []);
});

test('rejects a client output directory symlink that escapes the owned run root', async (t) => {
  const prepareModalFixture = await loadPrepareModalFixture();
  const setup = await createFixtureSetup(t);
  const escaped = join(setup.root, 'escaped-client-output');
  setup.runCommand = async (command, args, options) => {
    setup.calls.push({ command, args: [...args], options: structuredClone(options) });
    const outputRoot = args[args.indexOf('--outDir') + 1];
    if (options.env.LYRA_MODAL_BUILD_TARGET === 'client') {
      await mkdir(join(escaped, 'assets'), { recursive: true });
      await writeFile(join(escaped, 'index.html'), 'escaped client html\n');
      await writeFile(join(escaped, 'assets', 'entry-client.js'), 'escaped client output\n');
      await symlink(escaped, outputRoot);
    }
    return { stdout: Buffer.alloc(0) };
  };

  await assert.rejects(
    prepareModalFixture(input(setup), { installCandidate: setup.installCandidate }),
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
    const prepareModalFixture = await loadPrepareModalFixture();
    const setup = await createFixtureSetup(t, {
      async runCommand({ options, outputRoot }) {
        await mkdir(outputRoot, { recursive: true });
        if (options.env.LYRA_MODAL_BUILD_TARGET === 'client' && target !== 'client') {
          await mkdir(join(outputRoot, 'assets'));
          await writeFile(join(outputRoot, 'index.html'), 'client html\n');
          await writeFile(join(outputRoot, 'assets', 'entry-client.js'), 'client output\n');
        }
        return { stdout: Buffer.alloc(0) };
      },
    });
    await assert.rejects(
      prepareModalFixture(input(setup), { installCandidate: setup.installCandidate }),
      /ENOENT|output/u,
    );
  });
}

test('aggregates primary and cleanup failures in that order', async (t) => {
  const prepareModalFixture = await loadPrepareModalFixture();
  const primary = new Error('synthetic client build failure');
  const cleanup = new Error('synthetic cleanup failure');
  const setup = await createFixtureSetup(t, {
    async runCommand() {
      throw primary;
    },
  });
  let caught;
  try {
    await prepareModalFixture(input(setup), {
      installCandidate: setup.installCandidate,
      async removeModalRoot() {
        throw cleanup;
      },
    });
  } catch (error) {
    caught = error;
  }
  assert.ok(caught instanceof AggregateError);
  assert.deepEqual(caught.errors, [primary, cleanup]);
});
