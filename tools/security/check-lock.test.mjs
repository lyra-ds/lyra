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
