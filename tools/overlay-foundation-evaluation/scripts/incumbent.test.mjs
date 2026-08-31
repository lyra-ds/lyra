import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { main, runIncumbentCli } from './incumbent.mjs';

const characterization = Object.freeze({
  artifacts: [],
  candidateId: 'incumbent',
  revision: '1234567890abcdef1234567890abcdef12345678',
  schemaVersion: 1,
});

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'lyra-incumbent-cli-test-'));
  t.after(() => rm(root, { force: true, recursive: true }));
  const runRoot = join(root, 'owned-run');
  const output = join(root, 'incumbent.json');
  const calls = [];
  const dependencies = {
    characterize: async (options) => {
      calls.push({ options, type: 'characterize' });
      return characterization;
    },
    cleanupRunRoot: async (owned) => {
      calls.push({ owned, type: 'cleanup' });
      await rm(owned.runRoot, { force: true, recursive: true });
    },
    createRunRoot: async () => {
      calls.push({ type: 'create' });
      await mkdir(runRoot);
      return { ownerToken: 'test-owner', runRoot };
    },
  };
  return { calls, dependencies, output, root, runRoot };
}

for (const [description, argv] of [
  ['missing arguments', []],
  ['missing output value', ['--output']],
  ['duplicate output', ['--output', '/tmp/a.json', '--output', '/tmp/b.json']],
  ['empty output', ['--output', '']],
  ['unknown argument', ['--unknown', '/tmp/a.json']],
]) {
  test(`${description} exits nonzero before characterization`, async (t) => {
    const setup = await fixture(t);
    const errors = [];
    const exitCode = await main({
      argv,
      ...setup.dependencies,
      stderr: { write: (message) => errors.push(message) },
    });
    assert.notEqual(exitCode, 0);
    assert.equal(setup.calls.length, 0);
    assert.equal(errors.length, 1);
  });
}

test('writes one canonical result to a nonexistent explicit output with wx', async (t) => {
  const setup = await fixture(t);
  const writes = [];
  const writeResult = async (path, bytes, options) => {
    writes.push({ options, path });
    await writeFile(path, bytes, options);
  };
  const exitCode = await main({
    argv: ['--output', setup.output],
    ...setup.dependencies,
    repositoryRoot: setup.root,
    stderr: { write: assert.fail },
    temporaryDirectory: setup.root,
    writeResult,
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(writes, [{ options: { flag: 'wx', mode: 0o600 }, path: setup.output }]);
  assert.deepEqual(JSON.parse(await readFile(setup.output, 'utf8')), characterization);
  assert.deepEqual(
    setup.calls.map(({ type }) => type),
    ['create', 'characterize', 'cleanup'],
  );
  await assert.rejects(stat(setup.runRoot), { code: 'ENOENT' });
});

test('rejects an existing output before creating a run root or characterizing', async (t) => {
  const setup = await fixture(t);
  await writeFile(setup.output, 'preserve me');
  await assert.rejects(
    runIncumbentCli({
      argv: ['--output', setup.output],
      ...setup.dependencies,
      temporaryDirectory: setup.root,
    }),
    /output path must not exist/u,
  );
  assert.equal(await readFile(setup.output, 'utf8'), 'preserve me');
  assert.equal(setup.calls.length, 0);
});

test('rejects an output inside the owned temporary run root before characterizing', async (t) => {
  const setup = await fixture(t);
  const nestedOutput = join(setup.runRoot, 'incumbent.json');
  await assert.rejects(
    runIncumbentCli({
      argv: ['--output', nestedOutput],
      ...setup.dependencies,
      temporaryDirectory: setup.root,
    }),
    /output path must be outside the temporary run root/u,
  );
  assert.deepEqual(
    setup.calls.map(({ type }) => type),
    ['create', 'cleanup'],
  );
  await assert.rejects(stat(setup.runRoot), { code: 'ENOENT' });
});

test('preserves a file created in the output race because the final write is exclusive', async (t) => {
  const setup = await fixture(t);
  const characterize = async () => {
    setup.calls.push({ type: 'characterize' });
    await writeFile(setup.output, 'race winner');
    return characterization;
  };
  await assert.rejects(
    runIncumbentCli({
      argv: ['--output', setup.output],
      ...setup.dependencies,
      characterize,
      temporaryDirectory: setup.root,
    }),
    { code: 'EEXIST' },
  );
  assert.equal(await readFile(setup.output, 'utf8'), 'race winner');
  assert.deepEqual(
    setup.calls.map(({ type }) => type),
    ['create', 'characterize', 'cleanup'],
  );
});
