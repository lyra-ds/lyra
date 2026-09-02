import { lstat, readFile, realpath, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { MODAL_EXTERNAL_ARTIFACTS } from '../candidates/catalog.mjs';
import { isPlainRecord } from '../contracts/protocol.mjs';
import { canonicalJson } from '../evidence/results.mjs';
import { validateCandidateManifest } from '../runner/manifest.mjs';

const EXPECTED_TOOLCHAIN = Object.freeze({ node: '24.18.0', pnpm: '11.13.1' });
const FULL_SHA = /^[a-f0-9]{40}$/u;
const SHA_256 = /^[a-f0-9]{64}$/u;
const INCUMBENT_PACKAGES = Object.freeze([
  Object.freeze({ name: '@lyra-ds/styles', version: '0.5.0' }),
  Object.freeze({ name: '@lyra-ds/react', version: '0.5.0' }),
  Object.freeze({ name: '@lyra-ds/alpine', version: '0.6.0' }),
]);
const utf8Decoder = new TextDecoder('utf-8', { fatal: true });

function requireFullRevision(value) {
  if (!FULL_SHA.test(value)) {
    throw new Error('Lyra revision must be a full 40-character lowercase Git SHA');
  }
}

function canonicalIncumbentArtifacts(artifacts) {
  if (!Array.isArray(artifacts) || artifacts.length !== INCUMBENT_PACKAGES.length) {
    throw new Error('incumbent artifacts must be exactly the canonical incumbent package records');
  }
  return artifacts.map((artifact, index) => {
    const expected = INCUMBENT_PACKAGES[index];
    if (
      !isPlainRecord(artifact) ||
      artifact.name !== expected.name ||
      artifact.version !== expected.version
    ) {
      throw new Error(
        'incumbent artifacts must be exactly the canonical incumbent package records',
      );
    }
    if (!SHA_256.test(artifact.sha256)) {
      throw new Error('incumbent artifact hash must be a lowercase SHA-256');
    }
    return {
      source: 'workspace-pack',
      name: artifact.name,
      version: artifact.version,
      sha256: artifact.sha256,
    };
  });
}

function requireMatchingIncumbent(lyraRevision, incumbentCharacterization) {
  requireFullRevision(lyraRevision);
  if (
    !isPlainRecord(incumbentCharacterization) ||
    incumbentCharacterization.schemaVersion !== 1 ||
    incumbentCharacterization.candidateId !== 'incumbent'
  ) {
    throw new Error('incumbent characterization must be a schema version 1 incumbent record');
  }
  if (incumbentCharacterization.revision !== lyraRevision) {
    throw new Error('incumbent characterization revision must exactly match Lyra revision');
  }
  return canonicalIncumbentArtifacts(incumbentCharacterization.artifacts);
}

export function createModalManifest({ lyraRevision, incumbentCharacterization }) {
  const incumbentArtifacts = requireMatchingIncumbent(lyraRevision, incumbentCharacterization);
  return {
    schemaVersion: 1,
    lyraRevision,
    toolchain: { ...EXPECTED_TOOLCHAIN },
    candidates: [
      {
        id: 'incumbent',
        adapter: 'candidates/incumbent.mjs',
        contracts: ['OF-MODAL'],
        revision: lyraRevision,
        artifacts: incumbentArtifacts,
      },
      ...['radix', 'base-ui', 'zag'].map((id) => ({
        id,
        adapter: `candidates/${id}.mjs`,
        contracts: ['OF-MODAL'],
        artifacts: structuredClone(MODAL_EXTERNAL_ARTIFACTS[id]),
      })),
    ],
  };
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

function decodeCharacterization(bytes) {
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    throw new Error('incumbent characterization must not contain a BOM');
  }
  try {
    return utf8Decoder.decode(bytes);
  } catch (error) {
    throw new Error('incumbent characterization must be valid UTF-8', { cause: error });
  }
}

async function readCharacterization(path) {
  let value;
  try {
    value = JSON.parse(decodeCharacterization(await readFile(path)));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`incumbent characterization must be valid JSON: ${error.message}`, {
        cause: error,
      });
    }
    throw error;
  }
  return value;
}

function assertValidManifest(manifest) {
  const errors = validateCandidateManifest(manifest, EXPECTED_TOOLCHAIN);
  if (errors.length !== 0) throw new Error(errors.join('\n'));
}

export async function writeModalManifest({ outputPath, lyraRevision, incumbentPath }) {
  if (typeof outputPath !== 'string' || outputPath.length === 0) {
    throw new Error('output path must be a non-empty string');
  }
  if (typeof incumbentPath !== 'string' || incumbentPath.length === 0) {
    throw new Error('incumbent path must be a non-empty string');
  }
  const output = resolve(outputPath);
  await requireMissing(output);
  const manifest = createModalManifest({
    lyraRevision,
    incumbentCharacterization: await readCharacterization(resolve(incumbentPath)),
  });
  assertValidManifest(manifest);
  const bytes = canonicalJson(manifest);
  await writeFile(output, bytes, { flag: 'wx', mode: 0o600 });

  const reread = JSON.parse(decodeCharacterization(await readFile(output)));
  assertValidManifest(reread);
  if (canonicalJson(reread) !== bytes) throw new Error('written manifest is not canonical');
  return reread;
}

function parseArguments(argv) {
  if (argv.length !== 6) {
    throw new Error(
      'usage: create-modal-manifest.mjs --revision <sha> --incumbent <path> --output <path>',
    );
  }
  const values = {};
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (
      !['--revision', '--incumbent', '--output'].includes(flag) ||
      Object.hasOwn(values, flag) ||
      typeof value !== 'string' ||
      value.length === 0
    ) {
      throw new Error(
        'usage: create-modal-manifest.mjs --revision <sha> --incumbent <path> --output <path>',
      );
    }
    values[flag] = value;
  }
  if (Object.keys(values).length !== 3) {
    throw new Error(
      'usage: create-modal-manifest.mjs --revision <sha> --incumbent <path> --output <path>',
    );
  }
  return {
    incumbentPath: resolve(values['--incumbent']),
    lyraRevision: values['--revision'],
    outputPath: resolve(values['--output']),
  };
}

export async function main(options = {}) {
  try {
    await writeModalManifest(parseArguments(options.argv ?? process.argv.slice(2)));
    return 0;
  } catch (error) {
    const stderr = options.stderr ?? process.stderr;
    stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    return 1;
  }
}

if (
  process.argv[1] !== undefined &&
  pathToFileURL(await realpath(resolve(process.argv[1]))).href === import.meta.url
) {
  process.exitCode = await main();
}
