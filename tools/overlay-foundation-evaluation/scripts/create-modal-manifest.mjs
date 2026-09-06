import { realpath } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { MODAL_EXTERNAL_ARTIFACTS } from '../candidates/catalog.mjs';
import {
  EXPECTED_TOOLCHAIN,
  parseManifestArguments,
  requireMatchingIncumbent,
  writeCandidateManifest,
} from './manifest-common.mjs';

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

export async function writeModalManifest({ outputPath, lyraRevision, incumbentPath }) {
  return writeCandidateManifest({
    outputPath,
    lyraRevision,
    incumbentPath,
    createManifest: createModalManifest,
  });
}

export async function main(options = {}) {
  try {
    await writeModalManifest(
      parseManifestArguments(options.argv ?? process.argv.slice(2), 'create-modal-manifest.mjs'),
    );
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
