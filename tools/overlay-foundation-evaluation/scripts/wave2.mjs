#!/usr/bin/env node
import { execFile } from 'node:child_process';
import { realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { isAbsolute, resolve } from 'node:path';
import { promisify, types } from 'node:util';
import { pathToFileURL } from 'node:url';
import { checkManifestFile } from './check.mjs';
import { inspectWave2Evidence as inspect, runWave2 as run } from '../runner/wave2.mjs';
const command = promisify(execFile);
const usage =
  'usage: wave2.mjs --manifest <absolute-path> --repository <absolute-path> --evidence <absolute-path>';
export async function runWave2Cli({
  argv,
  runCommand = (cmd, args, options) => command(cmd, args, { ...options, maxBuffer: 50_000_000 }),
  importPlaywright = () => import('playwright'),
  inspectWave2Evidence = inspect,
  runWave2 = run,
  temporaryDirectory = process.env.TMPDIR ?? tmpdir(),
}) {
  if (process.versions.node !== '24.18.0') throw new Error('Node version must equal 24.18.0');
  if (!Array.isArray(argv) || argv.length !== 6) throw new Error(usage);
  const paths = {};
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index],
      value = argv[index + 1];
    if (
      !['--manifest', '--repository', '--evidence'].includes(flag) ||
      Object.hasOwn(paths, flag) ||
      typeof value !== 'string' ||
      !value ||
      value.startsWith('--')
    )
      throw new Error(usage);
    if (!isAbsolute(value)) throw new Error(flag.slice(2) + ' path must be absolute');
    paths[flag] = resolve(value);
  }
  const repositoryRoot = await realpath(paths['--repository']);
  const manifest = await checkManifestFile({ manifestPath: paths['--manifest'], repositoryRoot });
  if (
    manifest.candidates.some(
      (c) =>
        JSON.stringify(c.contracts) !==
        JSON.stringify(['OF-MODAL', 'OF-ANCHORED', 'OF-MENU', 'OF-TOOLTIP']),
    )
  )
    throw new Error('Wave2 requires all four behavioral contracts in exact order');
  if (manifest.candidates[0].revision !== manifest.lyraRevision)
    throw new Error('manifest incumbent revision must equal manifest Lyra revision');
  const text = (result) =>
    typeof result === 'string'
      ? result
      : Buffer.isBuffer(result.stdout)
        ? result.stdout.toString('utf8')
        : result.stdout;
  if (
    text(
      await runCommand('git', ['status', '--porcelain=v1', '--untracked-files=all'], {
        cwd: repositoryRoot,
      }),
    ) !== ''
  )
    throw new Error('Wave2 evaluation requires a clean worktree');
  if (
    text(await runCommand('git', ['rev-parse', 'HEAD'], { cwd: repositoryRoot })).trim() !==
    manifest.lyraRevision
  )
    throw new Error('repository revision must equal manifest Lyra revision');
  const state = await inspectWave2Evidence({ evidenceRoot: paths['--evidence'], manifest });
  const playwright = await importPlaywright();
  return runWave2({
    manifest,
    repositoryRoot,
    tmpdir: resolve(temporaryDirectory),
    evidenceRoot: paths['--evidence'],
    resume: state.resume,
    playwright,
    fetchImpl: globalThis.fetch,
    runCommand,
  });
}
// Fatal diagnostics contain only error fields, never arbitrary thrown objects. Limits
// include JSON escaping: depth 8, 64 errors, 2 KiB per string, 32 KiB of string
// values overall, and a final 64 KiB UTF-8 record (including its newline).
function fatalErrorRecord(error) {
  const seen = new WeakSet();
  let nodes = 0,
    stringBytes = 32768;
  const read = (value, key) => {
    try {
      return value[key];
    } catch {
      return undefined;
    }
  };
  const bounded = (value) => {
    const budget = Math.min(2048, stringBytes);
    if (budget < 16) return undefined;
    let result = value.slice(0, 2048);
    if (value.length > 2048 || Buffer.byteLength(JSON.stringify(result)) > budget) {
      let low = 0,
        high = Math.min(value.length, budget);
      while (low < high) {
        const middle = Math.ceil((low + high) / 2);
        if (Buffer.byteLength(JSON.stringify(value.slice(0, middle) + '[truncated]')) <= budget)
          low = middle;
        else high = middle - 1;
      }
      result = value.slice(0, low) + '[truncated]';
    }
    stringBytes -= Buffer.byteLength(JSON.stringify(result));
    return result;
  };
  const visit = (value, depth) => {
    if (nodes >= 64) return { truncated: 'node limit' };
    nodes++;
    if (depth > 8) return { truncated: 'depth limit' };
    if (!types.isNativeError(value))
      return {
        name: 'NonError',
        message: typeof value === 'string' ? bounded(value) : 'Non-Error thrown value omitted',
      };
    if (seen.has(value)) return { truncated: 'cycle' };
    seen.add(value);
    const result = {};
    for (const key of ['name', 'message', 'stack', 'scope', 'classification']) {
      const field = read(value, key);
      if (typeof field === 'string') {
        result[key] = bounded(field);
        if (result[key] === undefined) result.truncated = 'string byte limit';
      }
    }
    // Aggregate children retain their original order: primary, then cleanup.
    const children = read(value, 'errors');
    let isArray = false;
    try {
      isArray = Array.isArray(children);
    } catch {
      /* Revoked proxy: omit malformed children. */
    }
    if (isArray) {
      result.errors = [];
      const rawLength = read(children, 'length');
      const length = Number.isSafeInteger(rawLength) && rawLength >= 0 ? rawLength : 0;
      for (let index = 0; index < length; index++) {
        if (nodes >= 64) {
          result.errors.push({ truncated: 'node limit' });
          break;
        }
        result.errors.push(visit(read(children, index), depth + 1));
      }
    }
    const cause = read(value, 'cause');
    if (cause !== undefined) result.cause = visit(cause, depth + 1);
    return result;
  };
  const record = JSON.stringify(visit(error, 0)) + '\n';
  return Buffer.byteLength(record) <= 65536 ? record : '{"truncated":"byte limit"}\n';
}
export async function main(options = {}) {
  try {
    const result = await runWave2Cli({ argv: process.argv.slice(2), ...options });
    (options.stdout ?? process.stdout).write(JSON.stringify(result, null, 2) + '\n');
    return 0;
  } catch (error) {
    (options.stderr ?? process.stderr).write(fatalErrorRecord(error));
    return 1;
  }
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url)
  process.exitCode = await main();
