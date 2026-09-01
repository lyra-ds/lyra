import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const immutablePaths = ['pnpm-lock.yaml', 'docs/superpowers/baselines/lyra-v1/program.json'];

async function hashFiles(paths) {
  return Promise.all(
    paths.map(async (path) =>
      createHash('sha256')
        .update(await readFile(resolve(repositoryRoot, path)))
        .digest('hex'),
    ),
  );
}

test('wires core tests without a production dependency or external manifest', async () => {
  const immutableBefore = await hashFiles(immutablePaths);
  const rootPackage = JSON.parse(await readFile(resolve(repositoryRoot, 'package.json'), 'utf8'));
  assert.equal(
    rootPackage.scripts['overlay:evaluate:core:test'],
    'node --test tools/overlay-foundation-evaluation/*.test.mjs tools/overlay-foundation-evaluation/*/*.test.mjs',
  );
  assert.equal(
    rootPackage.scripts['overlay:evaluate:check'],
    'node tools/overlay-foundation-evaluation/scripts/check.mjs',
  );
  assert.equal(
    rootPackage.scripts['overlay:evaluate:incumbent'],
    'node tools/overlay-foundation-evaluation/scripts/incumbent.mjs',
  );
  assert.match(rootPackage.scripts.test, /pnpm overlay:evaluate:core:test/u);
  for (const section of ['dependencies', 'devDependencies', 'optionalDependencies']) {
    for (const name of Object.keys(rootPackage[section] ?? {})) {
      assert.doesNotMatch(name, /radix|base-ui|zag/u);
    }
  }
  await assert.rejects(
    stat(resolve(repositoryRoot, 'tools/overlay-foundation-evaluation/candidates.json')),
    { code: 'ENOENT' },
  );
  assert.deepEqual(await hashFiles(immutablePaths), immutableBefore);
});
