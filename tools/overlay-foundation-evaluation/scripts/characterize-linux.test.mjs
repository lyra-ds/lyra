import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import * as fs from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { runLinuxCharacterization } from './characterize-linux.mjs';
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
async function fixture(t, mutate = () => {}) {
  const root = await fs.realpath(await fs.mkdtemp(join(tmpdir(), 'wave2-linux-characterization-')));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const output = join(root, 'output');
  const repository = join(root, 'repository');
  await fs.mkdir(repository);
  let temporary;
  const run = (options) =>
    runLinuxCharacterization({
      argv: ['--repository', repository, '--output', output],
      platform: 'linux',
      ...options,
      characterize: async ({ outputRoot }) => {
        temporary = outputRoot;
        await fs.mkdir(outputRoot, { recursive: true });
        const artifacts = [];
        for (const [index, name] of [
          '@lyra-ds/styles',
          '@lyra-ds/react',
          '@lyra-ds/alpine',
        ].entries()) {
          const bytes = Buffer.from('exact packed bytes ' + name),
            path = join(outputRoot, index + '.tgz');
          await fs.writeFile(path, bytes);
          artifacts.push({
            name,
            version: index === 2 ? '0.6.0' : '0.5.0',
            license: 'MIT',
            lifecycleScripts: [],
            bytes: bytes.length,
            sha256: digest(bytes),
            path,
          });
        }
        const value = {
          schemaVersion: 1,
          candidateId: 'incumbent',
          revision: 'a'.repeat(40),
          artifacts,
        };
        await mutate({ value, output, outputRoot });
        return value;
      },
    });
  return {
    root,
    output,
    run,
    get temporary() {
      return temporary;
    },
  };
}
test('retains actual packed bytes and standard metadata before existing CLI removes temporary packs', async (t) => {
  const f = await fixture(t);
  await f.run();
  const metadata = JSON.parse(await fs.readFile(join(f.output, 'incumbent.json'), 'utf8'));
  assert.equal(metadata.artifacts.length, 3);
  for (const [i, a] of metadata.artifacts.entries()) {
    assert.equal(a.path, undefined);
    assert.equal(digest(await fs.readFile(join(f.output, i + '.tgz'))), a.sha256);
  }
  assert.equal((await fs.stat(f.output)).mode & 0o777, 0o700);
  await assert.rejects(fs.stat(f.temporary), { code: 'ENOENT' });
});
for (const type of ['hash', 'source-symlink', 'output-replacement'])
  test('retention rejects ' + type + ' without publishing metadata', async (t) => {
    const f = await fixture(t, async ({ value, output, outputRoot }) => {
      if (type === 'hash') value.artifacts[0].sha256 = 'f'.repeat(64);
      if (type === 'source-symlink') {
        await fs.rename(value.artifacts[0].path, join(outputRoot, 'original'));
        await fs.symlink(join(outputRoot, 'original'), value.artifacts[0].path);
      }
      if (type === 'output-replacement') {
        await fs.rename(output, output + '-original');
        await fs.mkdir(output);
        await fs.writeFile(join(output, 'unrelated'), 'keep');
      }
    });
    await assert.rejects(f.run(), /hash|regular|identity/);
    await assert.rejects(fs.stat(join(f.output, 'incumbent.json')), { code: 'ENOENT' });
    if (type === 'output-replacement')
      assert.equal(await fs.readFile(join(f.output, 'unrelated'), 'utf8'), 'keep');
  });
test('strict paths and Linux boundary reject before characterization', async (t) => {
  const f = await fixture(t);
  await assert.rejects(f.run({ platform: 'darwin' }), /Linux/);
  await assert.rejects(
    f.run({ argv: ['--repository', f.root, '--output', 'relative'] }),
    /absolute/,
  );
  await fs.mkdir(f.output);
  await assert.rejects(f.run(), /exist/);
});
