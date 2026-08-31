import { lstat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

import { characterizeIncumbent } from '../candidates/incumbent.mjs';
import { canonicalJson } from '../evidence/results.mjs';
import { cleanupOwnedRunRoot, createOwnedRunRoot } from '../runner/isolation.mjs';

const defaultRepositoryRoot = resolve(import.meta.dirname, '../../..');

function parseArguments(argv) {
  if (
    argv.length !== 2 ||
    argv[0] !== '--output' ||
    typeof argv[1] !== 'string' ||
    argv[1].length === 0
  ) {
    throw new Error('usage: incumbent.mjs --output <path>');
  }
  return resolve(argv[1]);
}

async function requireMissing(path) {
  try {
    await lstat(path);
  } catch (error) {
    if (error?.code === 'ENOENT') return;
    throw error;
  }
  throw new Error('output path must not exist');
}

function isInsideOrEqual(parent, child) {
  const path = relative(parent, child);
  return path === '' || (path !== '..' && !path.startsWith(`..${sep}`));
}

export async function runIncumbentCli({
  argv = process.argv.slice(2),
  characterize = characterizeIncumbent,
  cleanupRunRoot = cleanupOwnedRunRoot,
  createRunRoot = createOwnedRunRoot,
  repositoryRoot = defaultRepositoryRoot,
  temporaryDirectory = tmpdir(),
  writeResult = writeFile,
} = {}) {
  const output = parseArguments(argv);
  await requireMissing(output);
  const resolvedTemporaryDirectory = resolve(temporaryDirectory);
  const owned = await createRunRoot({ runId: 'incumbent', tmpdir: resolvedTemporaryDirectory });
  let characterization;
  let primaryError;
  try {
    if (isInsideOrEqual(owned.runRoot, output)) {
      throw new Error('output path must be outside the temporary run root');
    }
    characterization = await characterize({
      outputRoot: resolve(owned.runRoot, 'packs'),
      repositoryRoot: resolve(repositoryRoot),
    });
  } catch (error) {
    primaryError = error;
  }

  try {
    await cleanupRunRoot({ tmpdir: resolvedTemporaryDirectory, ...owned });
  } catch (cleanupError) {
    if (primaryError !== undefined) {
      throw new AggregateError(
        [primaryError, cleanupError],
        'incumbent characterization and owned-root cleanup both failed',
      );
    }
    throw cleanupError;
  }
  if (primaryError !== undefined) throw primaryError;

  await writeResult(output, canonicalJson(characterization), { flag: 'wx', mode: 0o600 });
  return { characterization, output };
}

export async function main(options = {}) {
  try {
    await runIncumbentCli(options);
    return 0;
  } catch (error) {
    const stderr = options.stderr ?? process.stderr;
    stderr.write(`${error?.stack ?? error}\n`);
    return 1;
  }
}

if (
  process.argv[1] !== undefined &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url
) {
  process.exitCode = await main();
}
