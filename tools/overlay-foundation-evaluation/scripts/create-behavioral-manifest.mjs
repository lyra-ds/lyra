import { realpath } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { BEHAVIORAL_EXTERNAL_ARTIFACTS } from '../candidates/catalog.mjs';
import {
  EXPECTED_TOOLCHAIN,
  parseManifestArguments,
  requireMatchingIncumbent,
  writeCandidateManifest,
} from './manifest-common.mjs';

const BEHAVIORAL_CONTRACTS = Object.freeze(['OF-MODAL', 'OF-ANCHORED', 'OF-MENU', 'OF-TOOLTIP']);

export function createBehavioralManifest({ lyraRevision, incumbentCharacterization }) {
  const incumbentArtifacts = requireMatchingIncumbent(lyraRevision, incumbentCharacterization);
  return {
    schemaVersion: 1,
    lyraRevision,
    toolchain: { ...EXPECTED_TOOLCHAIN },
    candidates: [
      {
        id: 'incumbent',
        adapter: 'candidates/incumbent.mjs',
        contracts: [...BEHAVIORAL_CONTRACTS],
        revision: lyraRevision,
        artifacts: incumbentArtifacts,
      },
      ...['radix', 'base-ui', 'zag'].map((id) => ({
        id,
        adapter: `candidates/${id}.mjs`,
        contracts: [...BEHAVIORAL_CONTRACTS],
        artifacts: structuredClone(BEHAVIORAL_EXTERNAL_ARTIFACTS[id]),
      })),
    ],
  };
}

export async function writeBehavioralManifest({ outputPath, lyraRevision, incumbentPath }) {
  return writeCandidateManifest({
    outputPath,
    lyraRevision,
    incumbentPath,
    createManifest: createBehavioralManifest,
  });
}

export async function main(options = {}) {
  try {
    await writeBehavioralManifest(
      parseManifestArguments(
        options.argv ?? process.argv.slice(2),
        'create-behavioral-manifest.mjs',
      ),
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
