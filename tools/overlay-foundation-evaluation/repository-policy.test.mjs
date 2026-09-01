import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { promisify } from 'node:util';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const immutablePaths = ['pnpm-lock.yaml', 'docs/superpowers/baselines/lyra-v1/program.json'];
const execFilePromise = promisify(execFile);

async function hashFiles(paths) {
  return Promise.all(
    paths.map(async (path) =>
      createHash('sha256')
        .update(await readFile(resolve(repositoryRoot, path)))
        .digest('hex'),
    ),
  );
}

async function documentedPnpmCommand(scriptName) {
  const readme = await readFile(
    resolve(repositoryRoot, 'tools/overlay-foundation-evaluation/README.md'),
    'utf8',
  );
  const line = readme.split('\n').find((value) => value.startsWith(`\`pnpm ${scriptName}`));
  assert.notEqual(line, undefined);
  return line.slice(1, line.indexOf('`', 1)).split(' ');
}

async function runRejectedPnpm(args) {
  assert.equal((await execFilePromise('pnpm', ['--version'])).stdout.trim(), '11.13.1');
  try {
    await execFilePromise('pnpm', args, { cwd: repositoryRoot });
  } catch (error) {
    return `${error.stdout ?? ''}${error.stderr ?? ''}`;
  }
  assert.fail(`pnpm ${args.join(' ')} unexpectedly succeeded`);
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

test('forwards a documented manifest path through pnpm to the checker', async () => {
  const command = await documentedPnpmCommand('overlay:evaluate:check');
  assert.deepEqual(command, ['pnpm', 'overlay:evaluate:check', '--manifest', '<path>']);
  const manifestPath = resolve(
    repositoryRoot,
    'tools/overlay-foundation-evaluation/missing-forwarding-manifest.json',
  );

  const output = await runRejectedPnpm([command[1], command[2], manifestPath]);

  assert.doesNotMatch(output, /usage: check\.mjs/u);
  assert.match(output, /ENOENT|no such file or directory/u);
});

test('forwards a documented output path through pnpm before incumbent build', async (t) => {
  const command = await documentedPnpmCommand('overlay:evaluate:incumbent');
  assert.deepEqual(command, ['pnpm', 'overlay:evaluate:incumbent', '--output', '<path>']);
  const temporaryRoot = await mkdtemp(join(tmpdir(), 'overlay-root-forwarding-'));
  t.after(() => rm(temporaryRoot, { recursive: true }));
  const outputPath = join(temporaryRoot, 'incumbent.json');
  await writeFile(outputPath, 'existing output\n');

  const output = await runRejectedPnpm([command[1], command[2], outputPath]);

  assert.doesNotMatch(output, /usage: incumbent\.mjs/u);
  assert.match(output, /output path must not exist/u);
});
