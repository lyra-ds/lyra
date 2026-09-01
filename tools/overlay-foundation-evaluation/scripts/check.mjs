import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { readExpectedToolchain, validateManifestAdapterPaths } from '../runner/core.mjs';
import { validateCandidateManifest } from '../runner/manifest.mjs';

const defaultRepositoryRoot = resolve(import.meta.dirname, '../../..');
const utf8Decoder = new TextDecoder('utf-8', { fatal: true });

function parseArguments(argv) {
  if (
    argv.length !== 2 ||
    argv[0] !== '--manifest' ||
    typeof argv[1] !== 'string' ||
    argv[1].length === 0
  ) {
    throw new Error('usage: check.mjs --manifest <path>');
  }
  return resolve(argv[1]);
}

function decodeManifest(bytes) {
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    throw new Error('candidate manifest must not contain a BOM');
  }
  try {
    return utf8Decoder.decode(bytes);
  } catch (error) {
    throw new Error('candidate manifest must be valid UTF-8', { cause: error });
  }
}

export async function checkManifestFile({ manifestPath, repositoryRoot }) {
  const text = decodeManifest(await readFile(manifestPath));
  let manifest;
  try {
    manifest = JSON.parse(text);
  } catch (error) {
    throw new Error(`candidate manifest must be valid JSON: ${error.message}`, {
      cause: error,
    });
  }

  const expectedToolchain = await readExpectedToolchain(repositoryRoot);
  const errors = validateCandidateManifest(manifest, expectedToolchain);
  errors.push(...(await validateManifestAdapterPaths(manifest, repositoryRoot)));
  if (errors.length !== 0) throw new Error(errors.join('\n'));
  return manifest;
}

export async function main(options = {}) {
  const stdout = options.stdout ?? process.stdout;
  const stderr = options.stderr ?? process.stderr;
  const checkManifest = options.checkManifest ?? checkManifestFile;
  try {
    const manifestPath = parseArguments(options.argv ?? process.argv.slice(2));
    await checkManifest({
      manifestPath,
      repositoryRoot: resolve(options.repositoryRoot ?? defaultRepositoryRoot),
    });
    stdout.write('Overlay candidate manifest passed core validation.\n');
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
