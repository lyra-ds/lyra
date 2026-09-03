import { realpath, stat } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, relative } from 'node:path';

import { CANDIDATE_IDS, isPlainRecord } from '../contracts/protocol.mjs';

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
  if (contractId !== 'OF-MODAL') throw new Error('modal adapter entry requires OF-MODAL');
  if (typeof repositoryRoot !== 'string' || !isAbsolute(repositoryRoot)) {
    throw new Error('repositoryRoot must be absolute');
  }
  if (typeof adapterPath !== 'string' || !isAbsolute(adapterPath)) {
    throw new Error('adapterPath must be absolute');
  }
  if (!isPlainRecord(adapterModule) || typeof adapterModule.modalAdapterPath !== 'string') {
    throw new Error('adapterModule.modalAdapterPath must be a relative string');
  }
  if (isAbsolute(adapterModule.modalAdapterPath)) {
    throw new Error('adapterModule.modalAdapterPath must be relative');
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
  const declaredPath = `candidates/modal/${candidateId}.mjs`;
  if (adapterModule.modalAdapterPath !== declaredPath) {
    throw new Error('modalAdapterPath must name the exact candidate modal entry');
  }

  const modalDirectoryReal = await requiredRealpath(
    join(candidatesReal, 'modal'),
    'candidates/modal directory does not exist',
  );
  if (!isStrictDescendant(candidatesReal, modalDirectoryReal)) {
    throw new Error('candidates/modal must resolve beneath candidates');
  }
  const entryReal = await requiredRealpath(
    join(candidatesReal, 'modal', `${candidateId}.mjs`),
    'modal entry does not resolve to an existing file',
  );
  if (!isStrictDescendant(modalDirectoryReal, entryReal)) {
    throw new Error('modal entry must resolve strictly beneath candidates/modal');
  }
  let entryStat;
  try {
    entryStat = await stat(entryReal);
  } catch (error) {
    throw new Error('modal entry does not resolve to an existing regular file', { cause: error });
  }
  if (!entryStat.isFile()) throw new Error('modal entry must resolve to a regular file');
  return entryReal;
}
