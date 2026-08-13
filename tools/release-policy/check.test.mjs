import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const checker = resolve(dirname(fileURLToPath(import.meta.url)), 'check.mjs');

const validSnapshot = `
name: Release
jobs:
  release:
    steps:
      - run: |
          for pkg in packages/styles packages/react packages/alpine; do
            echo "$pkg"
          done
  snapshot:
    permissions:
      contents: read
      id-token: write
    steps:
      - run: pnpm changeset version --snapshot snapshot
      - run: pnpm run build
      - name: Publish versioned snapshots to npm (OIDC)
        run: pnpm changeset publish --tag snapshot
        env:
          NPM_CONFIG_PROVENANCE: 'true'
`;

function runChecker(releaseWorkflow) {
  const fixture = mkdtempSync(join(tmpdir(), 'lyra-release-policy-test-'));
  try {
    mkdirSync(join(fixture, '.changeset'));
    mkdirSync(join(fixture, '.github', 'workflows'), { recursive: true });
    writeFileSync(
      join(fixture, '.changeset', 'config.json'),
      `${JSON.stringify({ fixed: [], linked: [] })}\n`,
    );
    writeFileSync(
      join(fixture, 'VERSIONING.md'),
      'Packages use independent SemVer; all three packages must reach 1.0.0.\n',
    );
    writeFileSync(join(fixture, 'CONTRIBUTING.md'), 'Add a changeset for each affected package.\n');
    writeFileSync(join(fixture, '.github', 'workflows', 'release.yml'), releaseWorkflow);

    return spawnSync(process.execPath, [checker], { cwd: fixture, encoding: 'utf8' });
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
}

test('release policy accepts one Changesets snapshot publish with build and provenance', () => {
  const result = runChecker(validSnapshot);

  assert.equal(result.status, 0, result.stderr);
});

test('release policy rejects per-package snapshot publishing', () => {
  const directPublishes = validSnapshot.replace(
    `      - name: Publish versioned snapshots to npm (OIDC)
        run: pnpm changeset publish --tag snapshot
        env:
          NPM_CONFIG_PROVENANCE: 'true'`,
    `      - name: Publish Styles snapshot (OIDC)
        working-directory: packages/styles
        run: pnpm publish --tag snapshot --no-git-checks
      - name: Publish React snapshot (OIDC)
        working-directory: packages/react
        run: pnpm publish --tag snapshot --no-git-checks`,
  );

  const result = runChecker(directPublishes);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /snapshot/i);
});

test('release policy rejects an additional direct npm snapshot publish', () => {
  const extraPublish = validSnapshot.replace(
    "          NPM_CONFIG_PROVENANCE: 'true'\n",
    "          NPM_CONFIG_PROVENANCE: 'true'\n      - run: npm publish --tag snapshot\n",
  );

  const result = runChecker(extraPublish);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /snapshot/i);
});

test('release policy rejects snapshot mutations that drop build or provenance', () => {
  for (const [mutation, workflow] of [
    ['build', validSnapshot.replace('      - run: pnpm run build\n', '')],
    ['provenance', validSnapshot.replace("          NPM_CONFIG_PROVENANCE: 'true'\n", '')],
  ]) {
    const result = runChecker(workflow);

    assert.notEqual(result.status, 0, mutation);
    assert.match(result.stderr, /snapshot/i, mutation);
  }
});
