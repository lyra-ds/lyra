import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { access, chmod, mkdir, mkdtemp, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter, join, resolve } from 'node:path';
import { test } from 'node:test';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

import { checkManifestFile, main } from './check.mjs';

const revision = 'b'.repeat(40);
const sha = 'a'.repeat(64);
const execFilePromise = promisify(execFile);

function externalCandidate(id, name) {
  return {
    id,
    adapter: `candidates/${id}.mjs`,
    contracts: ['OF-MODAL'],
    artifacts: [
      {
        source: 'registry',
        name,
        version: '1.2.3',
        tarballUrl: `https://registry.example.invalid/${id}-1.2.3.tgz`,
        sha256: sha,
        license: 'MIT',
        repositoryUrl: `https://github.com/example/${id}`,
      },
    ],
  };
}

function candidateManifest() {
  return {
    schemaVersion: 1,
    lyraRevision: revision,
    toolchain: { node: '24.18.0', pnpm: '11.13.1' },
    candidates: [
      {
        id: 'incumbent',
        adapter: 'candidates/incumbent.mjs',
        contracts: ['OF-MODAL'],
        revision,
        artifacts: [
          {
            source: 'workspace-pack',
            name: '@lyra-ds/react',
            version: '0.5.0',
            sha256: sha,
          },
        ],
      },
      externalCandidate('radix', '@radix-ui/react-dialog'),
      externalCandidate('base-ui', '@base-ui-components/react'),
      externalCandidate('zag', '@zag-js/dialog'),
    ],
  };
}

function captureStream() {
  let output = '';
  return {
    stream: {
      write(chunk) {
        output += chunk;
        return true;
      },
    },
    output: () => output,
  };
}

async function createFixture(
  t,
  { adapterSource = 'throw new Error("adapter module imported");\n' } = {},
) {
  const root = await mkdtemp(join(process.env.TMPDIR ?? tmpdir(), 'overlay-check-test-'));
  t.after(() => rm(root, { recursive: true }));
  const repositoryRoot = join(root, 'repository');
  const candidateRoot = join(
    repositoryRoot,
    'tools',
    'overlay-foundation-evaluation',
    'candidates',
  );
  const manifestPath = join(root, 'manifest.json');
  await mkdir(candidateRoot, { recursive: true });
  await writeFile(join(repositoryRoot, '.nvmrc'), '24.18.0\n');
  await writeFile(
    join(repositoryRoot, 'package.json'),
    `${JSON.stringify({ name: 'synthetic-repository', private: true, packageManager: 'pnpm@11.13.1' })}\n`,
  );
  for (const id of ['incumbent', 'radix', 'base-ui', 'zag']) {
    await writeFile(join(candidateRoot, `${id}.mjs`), adapterSource);
  }
  await writeFile(manifestPath, `${JSON.stringify(candidateManifest(), null, 2)}\n`);
  return { candidateRoot, manifestPath, repositoryRoot, root };
}

test('creates checker fixtures when TMPDIR is unset', async (t) => {
  const originalTmpdir = process.env.TMPDIR;
  delete process.env.TMPDIR;
  t.after(() => {
    if (originalTmpdir === undefined) delete process.env.TMPDIR;
    else process.env.TMPDIR = originalTmpdir;
  });

  const fixture = await createFixture(t);

  assert.match(fixture.root, /overlay-check-test-/u);
});

test('validates only: no fetch, pnpm process, adapter import, or repository write occurs', async (t) => {
  const fixture = await createFixture(t);
  const binRoot = join(fixture.root, 'bin');
  const pnpmMarker = join(fixture.root, 'pnpm-ran.txt');
  await mkdir(binRoot);
  await writeFile(join(binRoot, 'pnpm'), `#!/bin/sh\nprintf ran > ${pnpmMarker}\nexit 91\n`);
  await chmod(join(binRoot, 'pnpm'), 0o755);
  const originalPath = process.env.PATH;
  const originalFetch = globalThis.fetch;
  let fetchCalls = 0;
  process.env.PATH = `${binRoot}${delimiter}${originalPath}`;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    throw new Error('fetch must not run');
  };
  t.after(() => {
    process.env.PATH = originalPath;
    globalThis.fetch = originalFetch;
  });
  const before = await readdir(fixture.repositoryRoot, { recursive: true });

  const checked = await checkManifestFile({
    manifestPath: fixture.manifestPath,
    repositoryRoot: fixture.repositoryRoot,
  });

  assert.deepEqual(checked, candidateManifest());
  assert.equal(fetchCalls, 0);
  await assert.rejects(access(pnpmMarker), { code: 'ENOENT' });
  assert.deepEqual(await readdir(fixture.repositoryRoot, { recursive: true }), before);
});

test('importing and calling the checker never loads the real incumbent module', async (t) => {
  const fixture = await createFixture(t);
  const markerPath = join(fixture.root, 'real-incumbent-loaded.txt');
  const preloadPath = join(fixture.root, 'module-load-hook.mjs');
  const childPath = join(fixture.root, 'check-in-child.mjs');
  const realIncumbentUrl = pathToFileURL(
    resolve(import.meta.dirname, '../candidates/incumbent.mjs'),
  ).href;
  const checkerUrl = pathToFileURL(resolve(import.meta.dirname, 'check.mjs')).href;
  await writeFile(
    preloadPath,
    `import { appendFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
const target = ${JSON.stringify(realIncumbentUrl)};
registerHooks({
  resolve(specifier, context, nextResolve) {
    const resolved = nextResolve(specifier, context);
    if (resolved.url === target) appendFileSync(process.env.INCUMBENT_LOAD_MARKER, 'loaded\\n');
    return resolved;
  },
});
`,
  );
  await writeFile(
    childPath,
    `import { checkManifestFile } from ${JSON.stringify(checkerUrl)};
await checkManifestFile({
  manifestPath: process.env.CHECK_MANIFEST_PATH,
  repositoryRoot: process.env.CHECK_REPOSITORY_ROOT,
});
`,
  );

  await execFilePromise(process.execPath, ['--import', preloadPath, childPath], {
    env: {
      ...process.env,
      CHECK_MANIFEST_PATH: fixture.manifestPath,
      CHECK_REPOSITORY_ROOT: fixture.repositoryRoot,
      INCUMBENT_LOAD_MARKER: markerPath,
    },
  });

  await assert.rejects(access(markerPath), { code: 'ENOENT' });
});

test('prints exactly one success line for a valid explicit manifest', async (t) => {
  const fixture = await createFixture(t);
  const stdout = captureStream();
  const stderr = captureStream();

  const code = await main({
    argv: ['--manifest', fixture.manifestPath],
    repositoryRoot: fixture.repositoryRoot,
    stdout: stdout.stream,
    stderr: stderr.stream,
  });

  assert.equal(code, 0);
  assert.equal(stdout.output(), 'Overlay candidate manifest passed core validation.\n');
  assert.equal(stderr.output(), '');
});

for (const [name, argv] of [
  ['missing arguments', []],
  ['missing manifest value', ['--manifest']],
  ['duplicate manifest argument', ['--manifest', 'a.json', '--manifest', 'b.json']],
  ['empty manifest value', ['--manifest', '']],
  ['unknown argument', ['--candidate', 'manifest.json']],
  ['extra positional argument', ['--manifest', 'manifest.json', 'extra']],
]) {
  test(`${name} exits nonzero before reading a manifest`, async () => {
    let calls = 0;
    const stdout = captureStream();
    const stderr = captureStream();

    const code = await main({
      argv,
      checkManifest: async () => {
        calls += 1;
      },
      repositoryRoot: '/must/not/be/read',
      stdout: stdout.stream,
      stderr: stderr.stream,
    });

    assert.equal(code, 1);
    assert.equal(calls, 0);
    assert.equal(stdout.output(), '');
    assert.equal(stderr.output(), 'usage: check.mjs --manifest <path>\n');
  });
}

for (const [name, bytes, pattern] of [
  [
    'a UTF-8 BOM',
    Buffer.from(`\uFEFF${JSON.stringify(candidateManifest())}`),
    /must not contain a BOM/u,
  ],
  ['malformed JSON', Buffer.from('{"schemaVersion":'), /JSON/u],
  ['invalid UTF-8', Buffer.from([0x7b, 0x22, 0x78, 0x22, 0x3a, 0xff, 0x7d]), /UTF-8/u],
  ['a non-record JSON root', Buffer.from('[]'), /plain record/u],
]) {
  test(`rejects ${name}`, async (t) => {
    const fixture = await createFixture(t);
    await writeFile(fixture.manifestPath, bytes);

    await assert.rejects(
      checkManifestFile({
        manifestPath: fixture.manifestPath,
        repositoryRoot: fixture.repositoryRoot,
      }),
      pattern,
    );
  });
}

for (const [name, mutate, pattern] of [
  [
    'a missing canonical candidate',
    async (fixture, manifest) => {
      manifest.candidates.pop();
    },
    /candidate IDs must be exactly/u,
  ],
  [
    'a manifest Node pin that differs from the repository',
    async (fixture, manifest) => {
      manifest.toolchain.node = '24.18.1';
    },
    /toolchain.node must exactly match/u,
  ],
  [
    'an edited repository Node pin',
    async (fixture) => {
      await writeFile(join(fixture.repositoryRoot, '.nvmrc'), '24.18.1\n');
    },
    /repository Node pin must equal 24\.18\.0/u,
  ],
  [
    'an edited repository package-manager pin',
    async (fixture) => {
      await writeFile(
        join(fixture.repositoryRoot, 'package.json'),
        `${JSON.stringify({ private: true, packageManager: 'pnpm@11.13.2' })}\n`,
      );
    },
    /repository pnpm pin must equal 11\.13\.1/u,
  ],
]) {
  test(`rejects ${name}`, async (t) => {
    const fixture = await createFixture(t);
    const manifest = candidateManifest();
    await mutate(fixture, manifest);
    await writeFile(fixture.manifestPath, `${JSON.stringify(manifest)}\n`);

    await assert.rejects(
      checkManifestFile({
        manifestPath: fixture.manifestPath,
        repositoryRoot: fixture.repositoryRoot,
      }),
      pattern,
    );
  });
}

test('rejects a missing adapter file without importing any other adapter', async (t) => {
  const fixture = await createFixture(t);
  await rm(join(fixture.candidateRoot, 'base-ui.mjs'));

  await assert.rejects(
    checkManifestFile({
      manifestPath: fixture.manifestPath,
      repositoryRoot: fixture.repositoryRoot,
    }),
    /base-ui.*existing adapter file/u,
  );
});

test('rejects an adapter symlink whose real path escapes the candidates directory', async (t) => {
  const fixture = await createFixture(t);
  const outside = join(fixture.root, 'outside-adapter.mjs');
  await writeFile(outside, 'export const adapterDescriptor = {};\n');
  await rm(join(fixture.candidateRoot, 'zag.mjs'));
  await symlink(outside, join(fixture.candidateRoot, 'zag.mjs'));

  await assert.rejects(
    checkManifestFile({
      manifestPath: fixture.manifestPath,
      repositoryRoot: fixture.repositoryRoot,
    }),
    /zag.*resolve beneath.*candidates/u,
  );
});

test('accepts an adapter symlink when its real path remains inside the candidates directory', async (t) => {
  const fixture = await createFixture(t);
  const contained = join(fixture.candidateRoot, 'contained-zag.mjs');
  await writeFile(contained, 'throw new Error("contained adapter imported");\n');
  await rm(join(fixture.candidateRoot, 'zag.mjs'));
  await symlink(contained, join(fixture.candidateRoot, 'zag.mjs'));

  const checked = await checkManifestFile({
    manifestPath: fixture.manifestPath,
    repositoryRoot: fixture.repositoryRoot,
  });

  assert.equal(checked.candidates[3].id, 'zag');
});

test('writes validation failures as line-oriented messages without a stack trace', async (t) => {
  const fixture = await createFixture(t);
  const manifest = candidateManifest();
  manifest.candidates[1].contracts.push('OF-MODAL');
  manifest.candidates[2].artifacts[0].sha256 = sha.toUpperCase();
  await writeFile(fixture.manifestPath, `${JSON.stringify(manifest)}\n`);
  const stdout = captureStream();
  const stderr = captureStream();

  const code = await main({
    argv: ['--manifest', fixture.manifestPath],
    repositoryRoot: fixture.repositoryRoot,
    stdout: stdout.stream,
    stderr: stderr.stream,
  });

  assert.equal(code, 1);
  assert.equal(stdout.output(), '');
  assert.match(stderr.output(), /contracts must be unique/u);
  assert.match(stderr.output(), /lowercase SHA-256/u);
  assert.equal(stderr.output().includes('    at '), false);
  assert.equal(stderr.output().endsWith('\n'), true);
  for (const line of stderr.output().trimEnd().split('\n')) assert.notEqual(line.trim(), '');
});
