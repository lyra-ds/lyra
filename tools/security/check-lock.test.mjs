import assert from 'node:assert/strict';
import { test } from 'node:test';

import { validateSecurityLock } from './check-lock.mjs';

function lockWith(...packageKeys) {
  return {
    lockfileVersion: '9.0',
    packages: Object.fromEntries(packageKeys.map((key) => [key, {}])),
    snapshots: Object.fromEntries(packageKeys.map((key) => [key, {}])),
  };
}

test('accepts each patched floor and unaffected newer majors', () => {
  assert.deepEqual(
    validateSecurityLock(
      lockWith(
        'brace-expansion@1.1.18',
        'brace-expansion@5.0.9',
        'js-yaml@2.1.0',
        'js-yaml@3.15.1',
        'js-yaml@4.3.1',
        'nanoid@3.3.18',
        'nanoid@5.1.16',
      ),
    ),
    [],
  );
});

for (const [packageKey, expected] of [
  [
    'brace-expansion@1.1.17',
    'pnpm-lock.yaml resolves vulnerable brace-expansion@1.1.17; require >=1.1.18.',
  ],
  [
    'js-yaml@3.15.0',
    'pnpm-lock.yaml resolves vulnerable js-yaml@3.15.0; require 3.15.1 within the 3.x line.',
  ],
  ['nanoid@3.3.17', 'pnpm-lock.yaml resolves vulnerable nanoid@3.3.17; require >=3.3.18.'],
]) {
  test(`rejects ${packageKey} from the resolved lock graph`, () => {
    assert.deepEqual(validateSecurityLock(lockWith(packageKey)), [expected]);
  });
}

test('inspects package snapshots and ignores importer declarations', () => {
  const lock = lockWith('brace-expansion@1.1.18', 'js-yaml@3.15.1', 'nanoid@3.3.18');
  lock.importers = {
    '.': {
      dependencies: {
        nanoid: { specifier: '3.3.17', version: '3.3.18' },
      },
    },
  };
  lock.snapshots['nanoid@3.3.17'] = {};

  assert.deepEqual(validateSecurityLock(lock), [
    'pnpm-lock.yaml resolves vulnerable nanoid@3.3.17; require >=3.3.18.',
  ]);
});

test('fails closed when a governed resolved version is not semantic versioning', () => {
  assert.deepEqual(validateSecurityLock(lockWith('nanoid@workspace:patched')), [
    'pnpm-lock.yaml contains an unparseable nanoid version: workspace:patched.',
  ]);
});

for (const [name, lockfile] of [
  ['null', null],
  ['an array', []],
]) {
  test(`rejects a lockfile root that is ${name}`, () => {
    assert.deepEqual(validateSecurityLock(lockfile), [
      'pnpm-lock.yaml root must be a plain record.',
    ]);
  });
}

for (const [name, lockfile] of [
  ['missing', { packages: {}, snapshots: {} }],
  ['unsupported', { lockfileVersion: '8.0', packages: {}, snapshots: {} }],
]) {
  test(`rejects the pnpm lockfile version when it is ${name}`, () => {
    assert.deepEqual(validateSecurityLock(lockfile), [
      'pnpm-lock.yaml lockfileVersion must be the pnpm 11 canonical value "9.0".',
    ]);
  });
}

for (const section of ['packages', 'snapshots']) {
  for (const [shape, value] of [
    ['missing', undefined],
    ['null', null],
    ['an array', []],
  ]) {
    test(`rejects ${section} when it is ${shape}`, () => {
      const lockfile = lockWith('brace-expansion@1.1.18', 'js-yaml@3.15.1', 'nanoid@3.3.18');
      if (value === undefined) delete lockfile[section];
      else lockfile[section] = value;

      assert.deepEqual(validateSecurityLock(lockfile), [
        `pnpm-lock.yaml ${section} must be a plain record.`,
      ]);
    });
  }
}

for (const packageKey of [
  '/brace-expansion@1.1.17',
  '/js-yaml@3.15.0',
  '/nanoid@3.3.17',
  '/nanoid@3.3.18',
]) {
  test(`rejects non-canonical governed key ${packageKey}`, () => {
    assert.deepEqual(validateSecurityLock(lockWith(packageKey)), [
      `pnpm-lock.yaml contains non-canonical governed key ${packageKey}.`,
    ]);
  });
}

test('accepts unrelated package keys even when their encoding is non-canonical', () => {
  const lockfile = lockWith('nanoid@3.3.18');
  lockfile.packages['/unrelated@1.0.0'] = {};
  lockfile.snapshots['file:../unrelated'] = {};

  assert.deepEqual(validateSecurityLock(lockfile), []);
});
