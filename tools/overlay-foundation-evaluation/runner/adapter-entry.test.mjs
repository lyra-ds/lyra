import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { resolveContractEntry } from './adapter-entry.mjs';

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'overlay-adapter-entry-'));
  t.after(() => rm(root, { force: true, recursive: true }));
  const candidates = join(root, 'tools', 'overlay-foundation-evaluation', 'candidates');
  const modal = join(candidates, 'modal');
  await mkdir(modal, { recursive: true });
  const adapterPath = join(candidates, 'radix.mjs');
  await writeFile(adapterPath, "export const modalAdapterPath = 'candidates/modal/radix.mjs';\n");
  return { adapterPath, candidates, modal, root };
}

const entries = {
  'OF-MODAL': ['modalAdapterPath', 'modal'],
  'OF-ANCHORED': ['anchoredAdapterPath', 'anchored'],
  'OF-MENU': ['menuAdapterPath', 'menu'],
  'OF-TOOLTIP': ['tooltipAdapterPath', 'tooltip'],
};

test('resolves only each matching contract export and strict candidate path', async (t) => {
  const setup = await fixture(t);
  for (const [contractId, [exportName, directory]] of Object.entries(entries)) {
    const entryDirectory = join(setup.candidates, directory);
    const entry = join(entryDirectory, 'radix.mjs');
    await mkdir(entryDirectory, { recursive: true });
    await writeFile(entry, 'export {};\n');
    assert.equal(await resolveContractEntry({
      adapterModule: { [exportName]: `candidates/${directory}/radix.mjs` },
      adapterPath: setup.adapterPath,
      contractId,
      repositoryRoot: setup.root,
    }), entry);
  }
});

test('rejects unknown, composed, missing, and mismatched contract entries', async (t) => {
  const setup = await fixture(t);
  await assert.rejects(resolveContractEntry({ ...options(setup), contractId: 'OF-COMPOSED' }), /contract/u);
  await assert.rejects(resolveContractEntry({ ...options(setup), contractId: 'OF-UNKNOWN' }), /contract/u);
  await assert.rejects(resolveContractEntry({
    ...options(setup), contractId: 'OF-MENU', adapterModule: {},
  }), /menuAdapterPath/u);
  await assert.rejects(resolveContractEntry({
    ...options(setup), contractId: 'OF-ANCHORED',
    adapterModule: { anchoredAdapterPath: 'candidates/modal/radix.mjs' },
  }), /anchoredAdapterPath/u);
});

for (const [contractId, [exportName, directory]] of Object.entries(entries)) {
  test(`rejects unsafe ${contractId} paths and entries`, async (t) => {
    const setup = await fixture(t);
    const entryDirectory = join(setup.candidates, directory);
    await mkdir(entryDirectory, { recursive: true });
    await mkdir(join(entryDirectory, 'radix.mjs'));
    const base = { adapterPath: setup.adapterPath, contractId, repositoryRoot: setup.root };
    for (const declaredPath of [
      '/tmp/radix.mjs',
      `../${directory}/radix.mjs`,
      'candidates/modal/radix.mjs',
      `candidates/${directory}/other.mjs`,
    ]) {
      await assert.rejects(
        resolveContractEntry({ ...base, adapterModule: { [exportName]: declaredPath } }),
        /relative|exact|candidate|regular file/u,
      );
    }
    await assert.rejects(
      resolveContractEntry({ ...base, adapterModule: { [exportName]: `candidates/${directory}/radix.mjs` } }),
      /regular file|file/u,
    );
  });
}

test('rejects a main adapter path outside the direct candidates directory', async (t) => {
  const setup = await fixture(t);
  await writeFile(join(setup.modal, 'radix.mjs'), 'export {};\n');
  const nested = join(setup.candidates, 'nested', 'radix.mjs');
  await mkdir(join(setup.candidates, 'nested'), { recursive: true });
  await writeFile(nested, 'export {};\n');
  await assert.rejects(resolveContractEntry({ ...options(setup), adapterPath: nested }), /direct candidate/u);
});

function options(setup, modalAdapterPath) {
  return {
    adapterModule: {
      modalAdapterPath: arguments.length === 1 ? 'candidates/modal/radix.mjs' : modalAdapterPath,
    },
    adapterPath: setup.adapterPath,
    contractId: 'OF-MODAL',
    repositoryRoot: setup.root,
  };
}

test('accepts the exact modal entry under candidates/modal', async (t) => {
  const setup = await fixture(t);
  const entry = join(setup.modal, 'radix.mjs');
  await writeFile(entry, 'export const ModalFixture = {};\n');
  assert.equal(await resolveContractEntry(options(setup)), entry);
});

for (const modalAdapterPath of [undefined, '/tmp/radix.mjs', '../modal/radix.mjs']) {
  test(`rejects missing, absolute, or parent modal entry ${String(modalAdapterPath)}`, async (t) => {
    const setup = await fixture(t);
    await assert.rejects(
      resolveContractEntry(options(setup, modalAdapterPath)),
      /modalAdapterPath|relative/u,
    );
  });
}

test('rejects a modal entry whose basename differs from the candidate ID', async (t) => {
  const setup = await fixture(t);
  await writeFile(join(setup.modal, 'other.mjs'), 'export {};\n');
  await assert.rejects(
    resolveContractEntry(options(setup, 'candidates/modal/other.mjs')),
    /candidate|basename|modal entry/u,
  );
});

test('rejects a symlink that escapes candidates/modal', async (t) => {
  const setup = await fixture(t);
  const outside = join(setup.root, 'outside.mjs');
  await writeFile(outside, 'export {};\n');
  await symlink(outside, join(setup.modal, 'radix.mjs'));
  await assert.rejects(resolveContractEntry(options(setup)), /beneath|modal/u);
});

test('rejects a directory presented as a modal entry', async (t) => {
  const setup = await fixture(t);
  await mkdir(join(setup.modal, 'radix.mjs'));
  await assert.rejects(resolveContractEntry(options(setup)), /regular file|file/u);
});

test('accepts an internal modal symlink after realpath containment', async (t) => {
  const setup = await fixture(t);
  const implementation = join(setup.modal, 'implementation.mjs');
  await writeFile(implementation, 'export const ModalFixture = {};\n');
  await symlink(implementation, join(setup.modal, 'radix.mjs'));
  assert.equal(await resolveContractEntry(options(setup)), implementation);
});
