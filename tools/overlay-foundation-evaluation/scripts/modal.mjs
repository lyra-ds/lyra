#!/usr/bin/env node

import { execFile } from 'node:child_process';
import { lstat, realpath } from 'node:fs/promises';
import { isAbsolute, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

import { checkManifestFile } from './check.mjs';
import { runModalWave as executeModalWave } from '../runner/modal.mjs';

const execFilePromise = promisify(execFile);
const usage =
  'usage: modal.mjs --manifest <absolute-path> --repository <absolute-path> --evidence <absolute-path>';

async function defaultRunCommand(command, args, options = {}) {
  return execFilePromise(command, args, { ...options, maxBuffer: 50_000_000 });
}

function outputText(result) {
  const value =
    result !== null && typeof result === 'object' && Object.hasOwn(result, 'stdout')
      ? result.stdout
      : result;
  if (typeof value === 'string') return value;
  if (ArrayBuffer.isView(value)) {
    return Buffer.from(value.buffer, value.byteOffset, value.byteLength).toString('utf8');
  }
  throw new Error('repository command must return stdout bytes or a string');
}

function parseArguments(argv) {
  if (!Array.isArray(argv) || argv.length !== 6) throw new Error(usage);
  const values = {};
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!['--manifest', '--repository', '--evidence'].includes(flag)) throw new Error(usage);
    if (Object.hasOwn(values, flag)) throw new Error(usage);
    if (typeof value !== 'string' || value.length === 0 || value.startsWith('--')) {
      throw new Error(usage);
    }
    values[flag] = value;
  }
  if (Object.keys(values).length !== 3) throw new Error(usage);
  for (const [flag, value] of Object.entries(values)) {
    if (!isAbsolute(value)) throw new Error(`${flag.slice(2)} path must be absolute`);
  }
  return {
    manifestPath: resolve(values['--manifest']),
    repositoryRoot: resolve(values['--repository']),
    evidenceRoot: resolve(values['--evidence']),
  };
}

async function pathExists(path) {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

async function rejectConflictingEvidence(evidenceRoot, revision) {
  const attemptsRoot = resolve(evidenceRoot, 'attempts');
  for (const runId of [`core-${revision.slice(0, 12)}`, `modal-${revision.slice(0, 12)}`]) {
    if (await pathExists(resolve(attemptsRoot, runId))) {
      throw new Error(`conflicting evidence attempt already exists for ${runId}`);
    }
  }
}

export async function runModalCli({
  argv,
  runCommand = defaultRunCommand,
  importPlaywright = () => import('playwright'),
  runModalWave = executeModalWave,
  temporaryDirectory = process.env.TMPDIR ?? tmpdir(),
}) {
  if (process.versions.node !== '24.18.0') {
    throw new Error(`Node version must equal 24.18.0; received ${process.versions.node}`);
  }
  const paths = parseArguments(argv);
  const repositoryRoot = await realpath(paths.repositoryRoot);
  const manifest = await checkManifestFile({
    manifestPath: paths.manifestPath,
    repositoryRoot,
  });
  if (manifest.candidates[0]?.revision !== manifest.lyraRevision) {
    throw new Error('manifest incumbent revision must equal manifest Lyra revision');
  }
  const status = outputText(
    await runCommand('git', ['status', '--porcelain=v1', '--untracked-files=all'], {
      cwd: repositoryRoot,
    }),
  );
  if (status !== '') throw new Error('modal evaluation requires a clean worktree');
  const revision = outputText(
    await runCommand('git', ['rev-parse', 'HEAD'], { cwd: repositoryRoot }),
  ).trim();
  if (revision !== manifest.lyraRevision) {
    throw new Error('repository revision must equal manifest Lyra revision');
  }
  await rejectConflictingEvidence(paths.evidenceRoot, manifest.lyraRevision);

  const playwright = await importPlaywright();
  return runModalWave({
    manifest,
    repositoryRoot,
    tmpdir: resolve(temporaryDirectory),
    evidenceRoot: paths.evidenceRoot,
    playwright,
    fetchImpl: globalThis.fetch,
    runCommand,
  });
}

export async function main(options = {}) {
  const stderr = options.stderr ?? process.stderr;
  const stdout = options.stdout ?? process.stdout;
  try {
    const summary = await runModalCli({ argv: options.argv ?? process.argv.slice(2), ...options });
    stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
    return 0;
  } catch (error) {
    stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    return 1;
  }
}

if (
  process.argv[1] !== undefined &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url
) {
  process.exitCode = await main();
}
