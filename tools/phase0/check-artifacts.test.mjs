import assert from 'node:assert/strict';
import test from 'node:test';
import { validateNodeToolchain } from './check-artifacts.mjs';

const baseline = { environment: { node: 'v24.18.0' } };

test('validateNodeToolchain inspects each setup-node step instead of matching comments', () => {
  const workflow = `
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      # node-version-file: .nvmrc
      - uses: actions/setup-node@pinned
        with:
          node-version: 24
`;

  assert.deepEqual(
    validateNodeToolchain({ baseline, nodeVersion: '24.18.0', workflows: [workflow] }),
    [
      'ci.yml must configure every setup-node step from .nvmrc; found node-version-file="undefined".',
    ],
  );
});

test('validateNodeToolchain accepts every setup-node step configured from .nvmrc', () => {
  const workflow = `
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-node@pinned
        with:
          node-version-file: .nvmrc
      - uses: actions/setup-node@pinned
        with:
          node-version-file: .nvmrc
`;

  assert.deepEqual(
    validateNodeToolchain({ baseline, nodeVersion: '24.18.0', workflows: [workflow] }),
    [],
  );
});
