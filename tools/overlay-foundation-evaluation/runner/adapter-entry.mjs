import { realpath, stat } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, relative } from 'node:path';

import { CANDIDATE_IDS, isPlainRecord } from '../contracts/protocol.mjs';

const CONTRACT_ENTRIES = Object.freeze({
  'OF-MODAL': Object.freeze({ exportName: 'modalAdapterPath', directory: 'modal' }),
  'OF-ANCHORED': Object.freeze({ exportName: 'anchoredAdapterPath', directory: 'anchored' }),
  'OF-MENU': Object.freeze({ exportName: 'menuAdapterPath', directory: 'menu' }),
  'OF-TOOLTIP': Object.freeze({ exportName: 'tooltipAdapterPath', directory: 'tooltip' }),
});

function isStrictDescendant(parent, child) {
  const childRelative = relative(parent, child);
  return childRelative !== '' && !childRelative.startsWith('..') && !isAbsolute(childRelative);
}

async function requiredRealpath(path, message) {
  try {
    return await realpath(path);
  } catch (error) {
    throw new Error(message, { cause: error });
  }
}

export async function resolveContractEntry({
  adapterModule,
  adapterPath,
  contractId,
  repositoryRoot,
}) {
  const entryConfig = CONTRACT_ENTRIES[contractId];
  if (!entryConfig) throw new Error('contract requires a supported behavioral entry');
  if (typeof repositoryRoot !== 'string' || !isAbsolute(repositoryRoot)) {
    throw new Error('repositoryRoot must be absolute');
  }
  if (typeof adapterPath !== 'string' || !isAbsolute(adapterPath)) {
    throw new Error('adapterPath must be absolute');
  }
  const declaredPath = adapterModule?.[entryConfig.exportName];
  if (!isPlainRecord(adapterModule) || typeof declaredPath !== 'string') {
    throw new Error(`adapterModule.${entryConfig.exportName} must be a relative string`);
  }
  if (isAbsolute(declaredPath) || declaredPath.startsWith('../')) {
    throw new Error(`adapterModule.${entryConfig.exportName} must be relative`);
  }

  const repositoryReal = await requiredRealpath(repositoryRoot, 'repositoryRoot does not exist');
  const candidatesReal = await requiredRealpath(
    join(repositoryReal, 'tools', 'overlay-foundation-evaluation', 'candidates'),
    'candidates directory does not exist',
  );
  const adapterReal = await requiredRealpath(adapterPath, 'adapterPath does not resolve to a file');
  if (!isStrictDescendant(candidatesReal, adapterReal) || dirname(adapterReal) !== candidatesReal) {
    throw new Error('adapterPath must resolve to a direct candidate module');
  }
  const candidateId = basename(adapterReal, '.mjs');
  if (!CANDIDATE_IDS.includes(candidateId) || basename(adapterReal) !== `${candidateId}.mjs`) {
    throw new Error('adapterPath must name an exact candidate module');
  }
  const exactDeclaredPath = `candidates/${entryConfig.directory}/${candidateId}.mjs`;
  if (declaredPath !== exactDeclaredPath) {
    throw new Error(
      `${entryConfig.exportName} must name the exact candidate ${entryConfig.directory} entry`,
    );
  }

  const contractDirectoryReal = await requiredRealpath(
    join(candidatesReal, entryConfig.directory),
    `candidates/${entryConfig.directory} directory does not exist`,
  );
  if (!isStrictDescendant(candidatesReal, contractDirectoryReal)) {
    throw new Error(`candidates/${entryConfig.directory} must resolve beneath candidates`);
  }
  const entryReal = await requiredRealpath(
    join(candidatesReal, entryConfig.directory, `${candidateId}.mjs`),
    `${entryConfig.directory} entry does not resolve to an existing file`,
  );
  if (!isStrictDescendant(contractDirectoryReal, entryReal)) {
    throw new Error(
      `${entryConfig.directory} entry must resolve strictly beneath candidates/${entryConfig.directory}`,
    );
  }
  let entryStat;
  try {
    entryStat = await stat(entryReal);
  } catch (error) {
    throw new Error(`${entryConfig.directory} entry does not resolve to an existing regular file`, {
      cause: error,
    });
  }
  if (!entryStat.isFile())
    throw new Error(`${entryConfig.directory} entry must resolve to a regular file`);
  return entryReal;
}
