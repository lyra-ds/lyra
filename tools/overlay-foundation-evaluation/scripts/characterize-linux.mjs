import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import * as filesystem from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { characterizeIncumbent, incumbentDescriptor } from '../candidates/incumbent.mjs';
import { runIncumbentCli } from './incumbent.mjs';

export async function runLinuxCharacterization({
  argv = process.argv.slice(2),
  platform = process.platform,
  fs = filesystem,
  characterize = characterizeIncumbent,
} = {}) {
  assert.equal(platform, 'linux', 'characterization requires Linux');
  assert.equal(process.versions.node, '24.18.0');
  assert.ok(
    argv.length === 4 && argv[0] === '--repository' && argv[2] === '--output',
    'usage: characterize-linux.mjs --repository <absolute-directory> --output <absolute-new-directory>',
  );
  const repository = argv[1],
    output = argv[3],
    uid = process.getuid();
  for (const path of [repository, output])
    assert.ok(
      typeof path === 'string' && isAbsolute(path) && resolve(path) === path,
      'canonical absolute paths required',
    );
  assert.equal(await fs.realpath(repository), repository);
  assert.equal(await fs.realpath(dirname(output)), dirname(output));
  const relation = relative(repository, output);
  assert.ok(
    relation === '..' || relation.startsWith('../') || isAbsolute(relation),
    'output must be outside repository',
  );
  const parent = await fs.lstat(dirname(output));
  assert.ok(
    parent.isDirectory() && !parent.isSymbolicLink() && parent.uid === uid,
    'owned output parent required',
  );
  await fs.mkdir(output, { mode: 0o700 });
  const identity = await fs.lstat(output);
  const verify = async () => {
    const current = await fs.lstat(output);
    assert.ok(
      current.isDirectory() && !current.isSymbolicLink(),
      'owned output must remain regular directory',
    );
    assert.deepEqual(
      [current.dev, current.ino, current.uid],
      [identity.dev, identity.ino, uid],
      'owned output identity changed',
    );
    assert.equal(await fs.realpath(output), output);
  };
  return runIncumbentCli({
    argv: ['--output', join(output, 'incumbent.json')],
    repositoryRoot: repository,
    characterize: async (options) => {
      const result = await characterize(options);
      assert.deepEqual(
        result.artifacts.map((a) => a.name),
        incumbentDescriptor.publicPackages,
      );
      for (const [index, artifact] of result.artifacts.entries()) {
        const path = artifact.path,
          inside = relative(options.outputRoot, path);
        assert.ok(
          inside !== '' && inside !== '..' && !inside.startsWith('../') && !isAbsolute(inside),
          'archive outside owned packs',
        );
        const stat = await fs.lstat(path);
        assert.ok(
          stat.isFile() && !stat.isSymbolicLink() && stat.uid === uid,
          'archive must be owned regular file',
        );
        assert.equal(await fs.realpath(path), path);
        const bytes = await fs.readFile(path);
        const after = await fs.lstat(path);
        assert.deepEqual(
          [after.dev, after.ino, after.uid, after.size],
          [stat.dev, stat.ino, stat.uid, stat.size],
          'source archive identity changed',
        );
        assert.equal(bytes.length, artifact.bytes, 'archive byte size');
        assert.equal(
          createHash('sha256').update(bytes).digest('hex'),
          artifact.sha256,
          'archive hash mismatch',
        );
        await verify();
        await fs.writeFile(join(output, index + '.tgz'), bytes, { flag: 'wx', mode: 0o600 });
      }
      return result;
    },
    writeResult: async (path, bytes, options) => {
      await verify();
      return fs.writeFile(path, bytes, options);
    },
  });
}
export async function main(options = {}) {
  try {
    await runLinuxCharacterization(options);
    return 0;
  } catch (error) {
    (options.stderr ?? process.stderr).write((error.stack ?? String(error)) + '\n');
    return 1;
  }
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url)
  process.exitCode = await main();
