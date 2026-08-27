import { createHash, randomUUID } from 'node:crypto';
import {
  link,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  rmdir,
  unlink,
  writeFile,
} from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { readEvidenceArchive } from './archive.mjs';
import {
  canonicalArchivePathKey,
  validateAutomatedResult,
  validateManifest,
  validateObservation,
} from '../src/contracts.ts';

const REQUIRED_MANUAL = Object.freeze(['DF-FU-M01', 'DF-FU-M02']);
const REQUIRED_AUTOMATED = Object.freeze(['DF-FU-17', 'DF-FU-18']);
const COMPARISON_PATH = Object.freeze([
  'docs',
  'superpowers',
  'baselines',
  'lyra-v1',
  'comparisons',
  'file-upload',
]);
const decoder = new TextDecoder('utf-8', { fatal: true });
const defaultRepositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const defaultFileSystem = Object.freeze({
  link,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  rmdir,
  unlink,
  writeFile,
});

function ingestError(message) {
  return new Error(`Cannot ingest FileUpload evidence: ${message}`);
}

function argumentError(message) {
  return new Error(`Invalid ingest arguments: ${message}`);
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function compareStrings(left, right) {
  return left.localeCompare(right, 'en');
}

function parseJson(bytes, path) {
  try {
    return JSON.parse(decoder.decode(bytes));
  } catch {
    throw ingestError(`${path} is not valid UTF-8 JSON`);
  }
}

function validatedManifest(archive, expectedKind) {
  const validation = validateManifest(archive.manifest);
  if (!validation.ok) throw ingestError(`${expectedKind} manifest is invalid`);
  if (validation.value.kind !== expectedKind) {
    throw ingestError(`expected a ${expectedKind} archive`);
  }
  return validation.value;
}

function deploymentOrigin(deploymentUrl) {
  return new URL(deploymentUrl).origin;
}

function assertSharedEvidenceIdentity(manifests, records) {
  const [firstManifest] = manifests;
  if (firstManifest === undefined) throw ingestError('no evidence manifests were provided');
  const expectedRevision = firstManifest.revision;
  const expectedOrigin = deploymentOrigin(firstManifest.deploymentUrl);
  for (const manifest of manifests) {
    if (manifest.revision !== expectedRevision) {
      throw ingestError('all manifests and results must share one exact full revision');
    }
    if (deploymentOrigin(manifest.deploymentUrl) !== expectedOrigin) {
      throw ingestError('all manifests and results must share one immutable deployment origin');
    }
  }
  for (const record of records) {
    if (record.revision !== expectedRevision) {
      throw ingestError('all manifests and results must share one exact full revision');
    }
    if (deploymentOrigin(record.deploymentUrl) !== expectedOrigin) {
      throw ingestError('all manifests and results must share one immutable deployment origin');
    }
    if (new URL(record.deploymentUrl).pathname !== `/${record.locale}/file-upload-evidence/`) {
      throw ingestError(`${record.scenario} locale does not match its immutable route`);
    }
  }
  return { origin: expectedOrigin, revision: expectedRevision };
}

function recordPaths(archive, root) {
  return [...archive.entries.keys()]
    .filter((path) => path.startsWith(`${root}/`) && path.endsWith('.json'))
    .sort(compareStrings);
}

function collectManualRecords(archives) {
  const records = new Map();
  for (const archive of archives) {
    for (const path of recordPaths(archive, 'manual')) {
      const validation = validateObservation(parseJson(archive.entries.get(path), path));
      if (!validation.ok) throw ingestError(`invalid manual result: ${path}`);
      const record = validation.value;
      if (path !== `manual/${record.scenario}.json`) {
        throw ingestError(`manual scenario does not match its record path: ${path}`);
      }
      if (records.has(record.scenario)) {
        throw ingestError(`duplicate manual scenario ${record.scenario}`);
      }
      if (record.result !== 'PASS' || record.reviewer.approval !== 'approved') {
        throw ingestError(`${record.scenario} must be PASS with an approved reviewer`);
      }
      records.set(record.scenario, { archive, record });
    }
  }
  const actual = [...records.keys()].sort(compareStrings);
  if (
    actual.length !== REQUIRED_MANUAL.length ||
    REQUIRED_MANUAL.some((scenario, index) => scenario !== actual[index])
  ) {
    throw ingestError(`manual evidence must contain exactly ${REQUIRED_MANUAL.join(' and ')}`);
  }
  return records;
}

function collectAutomatedRecords(archive) {
  const records = new Map();
  for (const path of recordPaths(archive, 'automation')) {
    const validation = validateAutomatedResult(parseJson(archive.entries.get(path), path));
    if (!validation.ok) throw ingestError(`invalid automated result: ${path}`);
    const record = validation.value;
    if (path !== `automation/${record.scenario}.json`) {
      throw ingestError(`automated scenario does not match its record path: ${path}`);
    }
    if (records.has(record.scenario)) {
      throw ingestError(`duplicate automated scenario ${record.scenario}`);
    }
    if (record.result !== 'PASS') throw ingestError(`${record.scenario} must be derived PASS`);
    records.set(record.scenario, { archive, record });
  }
  const actual = [...records.keys()].sort(compareStrings);
  if (
    actual.length !== REQUIRED_AUTOMATED.length ||
    REQUIRED_AUTOMATED.some((scenario, index) => scenario !== actual[index])
  ) {
    throw ingestError(
      `automation evidence must contain exactly ${REQUIRED_AUTOMATED.join(' and ')}`,
    );
  }
  return records;
}

function sortedObject(value) {
  if (Array.isArray(value)) return value.map(sortedObject);
  if (value === null || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => compareStrings(left, right))
      .map(([key, entry]) => [key, sortedObject(entry)]),
  );
}

function normalizedManualRecord(record) {
  return sortedObject({
    ...record,
    artifactPaths: [...record.artifactPaths].sort(compareStrings),
    artifactMetadata: [...record.artifactMetadata].sort((left, right) =>
      compareStrings(left.path, right.path),
    ),
    findingUrls: [...record.findingUrls].sort(compareStrings),
    inputMethods: [...record.inputMethods].sort(compareStrings),
    checkAttestations: sortedObject(record.checkAttestations),
    mediaQueries: sortedObject(record.mediaQueries),
  });
}

function normalizedAutomatedRecord(record) {
  return sortedObject({
    ...record,
    runs: [...record.runs]
      .sort((left, right) => compareStrings(left.engine, right.engine))
      .map((run) => ({
        ...run,
        artifactPaths: [...run.artifactPaths].sort(compareStrings),
        checks: sortedObject(run.checks),
        mediaQueries: sortedObject(run.mediaQueries),
      })),
  });
}

function jsonBytes(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
}

function addOutput(output, canonicalPaths, path, bytes) {
  const canonical = canonicalArchivePathKey(path);
  const existing = canonicalPaths.get(canonical);
  if (existing !== undefined) {
    throw ingestError(`output path collision between ${existing} and ${path}`);
  }
  canonicalPaths.set(canonical, path);
  output.set(path, Buffer.from(bytes));
}

function buildOutputFiles(manualRecords, automatedRecords) {
  const output = new Map();
  const canonicalPaths = new Map();
  for (const scenario of REQUIRED_MANUAL) {
    const { archive, record } = manualRecords.get(scenario);
    addOutput(
      output,
      canonicalPaths,
      `manual/${scenario}.json`,
      jsonBytes(normalizedManualRecord(record)),
    );
    for (const path of [...record.artifactPaths].sort(compareStrings)) {
      const bytes = archive.entries.get(path);
      if (bytes === undefined)
        throw ingestError(`${scenario} is missing verified artifact ${path}`);
      addOutput(output, canonicalPaths, path, bytes);
    }
  }
  for (const scenario of REQUIRED_AUTOMATED) {
    const { archive, record } = automatedRecords.get(scenario);
    addOutput(
      output,
      canonicalPaths,
      `automation/${scenario}.json`,
      jsonBytes(normalizedAutomatedRecord(record)),
    );
    const artifactPaths = record.runs.flatMap((run) => run.artifactPaths).sort(compareStrings);
    for (const path of artifactPaths) {
      const bytes = archive.entries.get(path);
      if (bytes === undefined)
        throw ingestError(`${scenario} is missing verified artifact ${path}`);
      addOutput(output, canonicalPaths, path, bytes);
    }
  }
  return new Map([...output].sort(([left], [right]) => compareStrings(left, right)));
}

function markdownText(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('`', '&#96;')
    .replaceAll('\\', '&#92;')
    .replaceAll('[', '&#91;')
    .replaceAll(']', '&#93;')
    .replaceAll('(', '&#40;')
    .replaceAll(')', '&#41;')
    .replaceAll('|', '&#124;')
    .replace(/\r\n?|\n/gu, '<br>');
}

function titleCase(value) {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}

function artifactLink(destinationName, path) {
  const encodedPath = path
    .split('/')
    .map((segment) =>
      encodeURIComponent(segment).replace(
        /[!'()*]/gu,
        (character) => `%${character.codePointAt(0).toString(16).toUpperCase()}`,
      ),
    )
    .join('/');
  return `${destinationName}/${encodedPath}`;
}

function safeExternalUrl(value) {
  return new URL(value).href.replaceAll('(', '%28').replaceAll(')', '%29');
}

function formattedMediaQueries(mediaQueries) {
  return Object.entries(mediaQueries)
    .sort(([left], [right]) => compareStrings(left, right))
    .map(([query, value]) => `${markdownText(query)}=${String(value)}`)
    .join('<br>');
}

function renderMarkdown({ automatedRecords, destinationName, manualRecords, origin, revision }) {
  const records = [
    ...REQUIRED_MANUAL.map((scenario) => ({
      kind: 'Manual',
      record: manualRecords.get(scenario).record,
    })),
    ...REQUIRED_AUTOMATED.map((scenario) => ({
      kind: 'Automated',
      record: automatedRecords.get(scenario).record,
    })),
  ].sort((left, right) => compareStrings(left.record.scenario, right.record.scenario));
  const lines = [
    '# FileUpload accessibility evidence',
    '',
    `- Revision: \`${revision}\``,
    `- Immutable deployment origin: [${origin}](${origin})`,
    '- Overall result: **PASS**',
    '',
    '## Scenario summary',
    '',
    '| Scenario | Evidence | Locale | Immutable route | Result |',
    '| --- | --- | --- | --- | --- |',
  ];
  for (const { kind, record } of records) {
    lines.push(
      `| \`${record.scenario}\` | ${kind} | ${record.locale} | [route](${record.deploymentUrl}) | **${record.result}** |`,
    );
  }

  lines.push('', '## Manual assistive-technology evidence');
  for (const scenario of REQUIRED_MANUAL) {
    const record = manualRecords.get(scenario).record;
    lines.push(
      '',
      `### \`${scenario}\``,
      '',
      `- Executed: \`${record.executedAt}\` (${markdownText(record.timezone)})`,
      `- Environment: ${markdownText(record.os.name)} ${markdownText(record.os.version)} (${markdownText(record.os.build)}); ${markdownText(record.browser.name)} ${markdownText(record.browser.version)}; ${markdownText(record.assistiveTechnology.name)} ${markdownText(record.assistiveTechnology.version)}`,
      `- User agent: ${markdownText(record.userAgent)}`,
      `- Input methods: ${record.inputMethods.map(markdownText).sort(compareStrings).join(', ')}`,
      `- Viewport: ${record.viewport.width} x ${record.viewport.height} at ${record.viewport.devicePixelRatio} DPR`,
      `- Media queries: ${formattedMediaQueries(record.mediaQueries)}`,
      `- Reviewer: ${markdownText(record.reviewer.name)} — **${record.reviewer.approval}**`,
      `- Expected: ${markdownText(record.expected)}`,
      `- Actual: ${markdownText(record.actual)}`,
      '',
      '#### Attestations',
      '',
      '| Check | Result |',
      '| --- | --- |',
    );
    for (const [check, passed] of Object.entries(record.checkAttestations).sort(([left], [right]) =>
      compareStrings(left, right),
    )) {
      lines.push(`| \`${check}\` | ${passed ? 'PASS' : 'FAIL'} |`);
    }
    lines.push('', '#### Findings', '');
    if (record.findingUrls.length === 0) lines.push('- None.');
    else {
      for (const [index, finding] of [...record.findingUrls].sort(compareStrings).entries()) {
        lines.push(`- [Finding ${index + 1}](${safeExternalUrl(finding)})`);
      }
    }
    lines.push('', '#### Artifacts', '');
    for (const { path, originalName } of [...record.artifactMetadata].sort((left, right) =>
      compareStrings(left.path, right.path),
    )) {
      lines.push(
        `- ${markdownText(originalName)} → [${markdownText(path)}](${artifactLink(destinationName, path)})`,
      );
    }
    const recordPath = `manual/${scenario}.json`;
    lines.push(`- [Normalized result JSON](${artifactLink(destinationName, recordPath)})`);
  }

  lines.push('', '## Automated evidence');
  for (const scenario of REQUIRED_AUTOMATED) {
    const record = automatedRecords.get(scenario).record;
    const runs = [...record.runs].sort((left, right) => compareStrings(left.engine, right.engine));
    lines.push(
      '',
      `### \`${scenario}\``,
      '',
      `- Executed: \`${record.executedAt}\``,
      `- Immutable route: [${record.deploymentUrl}](${record.deploymentUrl})`,
      '',
      '#### Lane matrix',
      '',
      '| Engine | Viewport | DPR | Media queries | Result |',
      '| --- | ---: | ---: | --- | --- |',
    );
    for (const run of runs) {
      const passed = Object.values(run.checks).every(Boolean);
      lines.push(
        `| ${titleCase(run.engine)} | ${run.viewport.width} x ${run.viewport.height} | ${run.viewport.devicePixelRatio} | ${formattedMediaQueries(run.mediaQueries)} | ${passed ? 'PASS' : 'FAIL'} |`,
      );
    }
    lines.push('', '#### Check matrix', '', '| Engine | Check | Result |', '| --- | --- | --- |');
    for (const run of runs) {
      for (const [check, passed] of Object.entries(run.checks).sort(([left], [right]) =>
        compareStrings(left, right),
      )) {
        lines.push(`| ${titleCase(run.engine)} | \`${check}\` | ${passed ? 'PASS' : 'FAIL'} |`);
      }
    }
    lines.push('', '#### Artifacts', '');
    for (const path of runs.flatMap((run) => run.artifactPaths).sort(compareStrings)) {
      lines.push(`- [${markdownText(path)}](${artifactLink(destinationName, path)})`);
    }
    const recordPath = `automation/${scenario}.json`;
    lines.push(`- [Normalized result JSON](${artifactLink(destinationName, recordPath)})`);
  }
  return Buffer.from(`${lines.join('\n')}\n`);
}

async function pathState(path, fileSystem) {
  try {
    return await fileSystem.lstat(path);
  } catch (error) {
    if (error?.code === 'ENOENT') return undefined;
    throw error;
  }
}

function expectedDirectories(outputFiles) {
  const directories = new Set();
  for (const path of outputFiles.keys()) {
    const segments = path.split('/');
    for (let index = 1; index < segments.length; index += 1) {
      directories.add(segments.slice(0, index).join('/'));
    }
  }
  return directories;
}

async function readDirectoryTree(root, fileSystem) {
  const directories = new Set();
  const files = new Map();
  async function visit(relativeDirectory) {
    const directory = relativeDirectory === '' ? root : join(root, ...relativeDirectory.split('/'));
    const entries = await fileSystem.readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => compareStrings(left.name, right.name));
    for (const entry of entries) {
      const path = relativeDirectory === '' ? entry.name : `${relativeDirectory}/${entry.name}`;
      const absolutePath = join(root, ...path.split('/'));
      const details = await fileSystem.lstat(absolutePath);
      if (details.isSymbolicLink())
        throw ingestError(`existing destination contains symlink ${path}`);
      if (details.isDirectory()) {
        directories.add(path);
        await visit(path);
      } else if (details.isFile()) {
        files.set(path, await fileSystem.readFile(absolutePath));
      } else {
        throw ingestError(`existing destination contains non-regular entry ${path}`);
      }
    }
  }
  await visit('');
  return { directories, files };
}

function equalStringSets(left, right) {
  const leftValues = [...left].sort(compareStrings);
  const rightValues = [...right].sort(compareStrings);
  return (
    leftValues.length === rightValues.length &&
    leftValues.every((value, index) => value === rightValues[index])
  );
}

async function inspectDestinations(
  { destinationDirectory, markdownPath },
  outputFiles,
  markdownBytes,
  fileSystem,
) {
  const [directoryState, markdownState] = await Promise.all([
    pathState(destinationDirectory, fileSystem),
    pathState(markdownPath, fileSystem),
  ]);
  if (directoryState === undefined && markdownState === undefined) return 'absent';
  if (directoryState === undefined || markdownState === undefined) {
    throw ingestError('partial destination exists; refusing to write');
  }
  if (!directoryState.isDirectory() || directoryState.isSymbolicLink()) {
    throw ingestError('existing evidence destination is not a regular directory');
  }
  if (!markdownState.isFile() || markdownState.isSymbolicLink()) {
    throw ingestError('existing evidence Markdown is not a regular file');
  }
  const [actualTree, actualMarkdown] = await Promise.all([
    readDirectoryTree(destinationDirectory, fileSystem),
    fileSystem.readFile(markdownPath),
  ]);
  const expectedPaths = new Set(outputFiles.keys());
  const exactPaths = equalStringSets(actualTree.files.keys(), expectedPaths);
  const exactDirectories = equalStringSets(
    actualTree.directories,
    expectedDirectories(outputFiles),
  );
  const exactBytes =
    exactPaths &&
    [...outputFiles].every(([path, bytes]) =>
      Buffer.from(actualTree.files.get(path)).equals(bytes),
    );
  if (
    !exactPaths ||
    !exactDirectories ||
    !exactBytes ||
    !Buffer.from(actualMarkdown).equals(markdownBytes)
  ) {
    throw ingestError('existing destination has different bytes; refusing to overwrite');
  }
  return 'idempotent';
}

async function inspectInterruptedDestinations(
  { destinationDirectory, markdownPath },
  outputFiles,
  markdownBytes,
  journalPath,
  fileSystem,
) {
  const [directoryState, markdownState] = await Promise.all([
    pathState(destinationDirectory, fileSystem),
    pathState(markdownPath, fileSystem),
  ]);
  if (directoryState === undefined && markdownState === undefined) {
    return { state: 'absent', tree: undefined };
  }
  if (directoryState !== undefined && markdownState !== undefined) {
    try {
      await inspectDestinations(
        { destinationDirectory, markdownPath },
        outputFiles,
        markdownBytes,
        fileSystem,
      );
      return { state: 'idempotent', tree: undefined };
    } catch {
      throw interruptedTransactionError('has divergent outputs', journalPath);
    }
  }
  if (
    directoryState === undefined ||
    markdownState !== undefined ||
    directoryState.isSymbolicLink() ||
    !directoryState.isDirectory()
  ) {
    throw interruptedTransactionError('has divergent outputs', journalPath);
  }
  let tree;
  try {
    tree = await readDirectoryTree(destinationDirectory, fileSystem);
  } catch {
    throw interruptedTransactionError('has divergent outputs', journalPath);
  }
  const expectedDirectorySet = expectedDirectories(outputFiles);
  const directoriesAreSubset = [...tree.directories].every((path) =>
    expectedDirectorySet.has(path),
  );
  const filesAreSubset = [...tree.files].every(([path, bytes]) => {
    const expected = outputFiles.get(path);
    return expected !== undefined && Buffer.from(bytes).equals(expected);
  });
  if (!directoriesAreSubset || !filesAreSubset) {
    throw interruptedTransactionError('has divergent outputs', journalPath);
  }
  return { state: 'partial', tree };
}

function sameIdentity(left, right) {
  return left.dev === right.dev && left.ino === right.ino;
}

function combinedFailure(error, cleanupErrors) {
  if (cleanupErrors.length === 0) return error;
  return new AggregateError([error, ...cleanupErrors], errorMessage(error), { cause: error });
}

function incompleteCleanupFailure(error, cleanupErrors) {
  const failure = new AggregateError(
    [error, ...cleanupErrors],
    `${errorMessage(error)}; rollback or staging cleanup is incomplete, transaction journal preserved for recovery`,
    { cause: error },
  );
  Object.defineProperty(failure, 'preserveTransaction', { value: true });
  return failure;
}

function mustPreserveTransaction(error) {
  return (
    error !== null &&
    (typeof error === 'object' || typeof error === 'function') &&
    error.preserveTransaction === true
  );
}

function incompleteTakeoverFailure(error, quarantinePath) {
  const failure = ingestError(
    `takeover incomplete; explicit manual remediation is required at ${quarantinePath}: ${errorMessage(error)}`,
  );
  Object.defineProperty(failure, 'cause', { value: error });
  Object.defineProperty(failure, 'preserveTakeoverMutex', { value: true });
  return failure;
}

function mustPreserveTakeoverMutex(error) {
  return (
    error !== null &&
    (typeof error === 'object' || typeof error === 'function') &&
    error.preserveTakeoverMutex === true
  );
}

function transactionDigest(outputFiles, markdownBytes) {
  const hash = createHash('sha256');
  hash.update('lyra-file-upload-ingest-v1\0');
  for (const [path, bytes] of outputFiles) {
    hash.update(`${Buffer.byteLength(path)}:${path}:${bytes.length}:`);
    hash.update(bytes);
  }
  hash.update(`markdown:${markdownBytes.length}:`);
  hash.update(markdownBytes);
  return hash.digest('hex');
}

async function removeOwnedFile(path, expectedIdentity, expectedBytes, fileSystem) {
  const beforeRead = await pathState(path, fileSystem);
  if (beforeRead === undefined) return;
  if (
    beforeRead.isSymbolicLink() ||
    !beforeRead.isFile() ||
    !sameIdentity(beforeRead, expectedIdentity)
  ) {
    throw ingestError(`owned file identity changed; preserving ${path}`);
  }
  const actualBytes = await fileSystem.readFile(path);
  const afterRead = await pathState(path, fileSystem);
  if (
    afterRead === undefined ||
    !sameIdentity(afterRead, expectedIdentity) ||
    !Buffer.from(actualBytes).equals(expectedBytes)
  ) {
    throw ingestError(`owned file contents changed; preserving ${path}`);
  }
  await fileSystem.unlink(path);
}

async function removeOwnedEmptyDirectory(path, expectedIdentity, fileSystem) {
  const actual = await pathState(path, fileSystem);
  if (actual === undefined) return;
  if (actual.isSymbolicLink() || !actual.isDirectory() || !sameIdentity(actual, expectedIdentity)) {
    throw ingestError(`owned directory identity changed; preserving ${path}`);
  }
  await fileSystem.rmdir(path);
}

async function removeOwnedStaging(path, expectedIdentity, fileSystem) {
  let firstError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const actual = await pathState(path, fileSystem);
      if (actual === undefined) return;
      if (
        actual.isSymbolicLink() ||
        !actual.isDirectory() ||
        !sameIdentity(actual, expectedIdentity)
      ) {
        throw ingestError('staging identity changed; refusing unsafe cleanup');
      }
      await fileSystem.rm(path, { force: true, recursive: true });
      return;
    } catch (error) {
      firstError ??= error;
    }
  }
  throw firstError;
}

async function rollbackPublishedEntries(publishedFiles, publishedDirectories, fileSystem) {
  const errors = [];
  for (const { bytes, identity, path } of [...publishedFiles].reverse()) {
    try {
      await removeOwnedFile(path, identity, bytes, fileSystem);
    } catch (error) {
      errors.push(error);
    }
  }
  for (const { identity, path } of [...publishedDirectories].reverse()) {
    try {
      await removeOwnedEmptyDirectory(path, identity, fileSystem);
    } catch (error) {
      errors.push(error);
    }
  }
  return errors;
}

async function acquireTransactionLock(
  { destinationName, expectedDigest, lockPath, parent, stagingName },
  fileSystem,
) {
  const takeoverPath = join(parent, `.${destinationName}.takeover.lock`);
  const takeover = await acquireTakeoverMutex(takeoverPath, fileSystem);
  let failure;
  let outcome;
  try {
    outcome = await acquireTransactionLockUnderMutex(
      { destinationName, expectedDigest, lockPath, parent, stagingName },
      fileSystem,
    );
  } catch (error) {
    failure = error;
  }
  if (!mustPreserveTakeoverMutex(failure)) {
    try {
      await removeOwnedEmptyDirectory(takeover.path, takeover.identity, fileSystem);
    } catch (cleanupError) {
      const mutexError = ingestError(
        `takeover mutex cleanup failed; state is preserved for explicit manual remediation at ${takeover.path}`,
      );
      throw combinedFailure(failure ?? mutexError, [
        cleanupError,
        ...(failure ? [mutexError] : []),
      ]);
    }
  }
  if (failure !== undefined) throw failure;
  return outcome;
}

async function acquireTakeoverMutex(path, fileSystem) {
  try {
    await fileSystem.mkdir(path);
  } catch (error) {
    if (error?.code === 'EEXIST') {
      throw ingestError(
        `recovery already in progress; takeover mutex is preserved for explicit manual remediation at ${path}`,
      );
    }
    throw error;
  }
  const identity = await fileSystem.lstat(path);
  if (identity.isSymbolicLink() || !identity.isDirectory()) {
    throw ingestError(
      `takeover mutex is unsafe; explicit manual remediation is required at ${path}`,
    );
  }
  return { identity, path };
}

async function acquireTransactionLockUnderMutex(
  { destinationName, expectedDigest, lockPath, parent, stagingName },
  fileSystem,
) {
  try {
    await fileSystem.mkdir(lockPath);
  } catch (error) {
    if (error?.code !== 'EEXIST') throw error;
    const interrupted = await readInterruptedTransaction(
      { destinationName, expectedDigest, lockPath, parent },
      fileSystem,
    );
    const quarantinePath = join(parent, `.${destinationName}.stale-${process.pid}-${randomUUID()}`);
    await fileSystem.rename(lockPath, quarantinePath);
    try {
      const quarantineIdentity = await fileSystem.lstat(quarantinePath);
      if (!sameIdentity(quarantineIdentity, interrupted.identity)) {
        throw ingestError(
          `interrupted transaction lock identity changed; manual remediation is required at ${quarantinePath}`,
        );
      }
      const current = await createTransactionLock(
        { destinationName, expectedDigest, lockPath, stagingName },
        fileSystem,
      );
      return {
        interrupted: {
          ...interrupted,
          identity: quarantineIdentity,
          markerPath: join(quarantinePath, 'transaction.json'),
          path: quarantinePath,
        },
        transaction: current,
      };
    } catch (takeoverError) {
      throw incompleteTakeoverFailure(takeoverError, quarantinePath);
    }
  }
  return {
    interrupted: undefined,
    transaction: await finishTransactionLock(
      { destinationName, expectedDigest, lockPath, stagingName },
      fileSystem,
    ),
  };
}

async function createTransactionLock(
  { destinationName, expectedDigest, lockPath, stagingName },
  fileSystem,
) {
  await fileSystem.mkdir(lockPath);
  return finishTransactionLock(
    { destinationName, expectedDigest, lockPath, stagingName },
    fileSystem,
  );
}

async function finishTransactionLock(
  { destinationName, expectedDigest, lockPath, stagingName },
  fileSystem,
) {
  const identity = await fileSystem.lstat(lockPath);
  const markerPath = join(lockPath, 'transaction.json');
  const markerBytes = jsonBytes({
    schemaVersion: 1,
    destinationName,
    expectedDigest,
    pid: process.pid,
    stagingName,
    transactionToken: stagingName.slice(`.${destinationName}.stage-`.length),
  });
  try {
    await fileSystem.writeFile(markerPath, markerBytes, { flag: 'wx' });
  } catch (error) {
    const cleanupErrors = [];
    try {
      await removeOwnedEmptyDirectory(lockPath, identity, fileSystem);
    } catch (cleanupError) {
      cleanupErrors.push(cleanupError);
    }
    throw combinedFailure(error, cleanupErrors);
  }
  const markerIdentity = await fileSystem.lstat(markerPath);
  return { identity, markerBytes, markerIdentity, markerPath, path: lockPath };
}

function processIsAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code !== 'ESRCH';
  }
}

function interruptedTransactionError(detail, path) {
  return ingestError(
    `interrupted transaction ${detail}; outputs and journal were preserved for explicit manual remediation at ${path}`,
  );
}

function validateTransactionMarker(value, destinationName) {
  if (
    value === null ||
    typeof value !== 'object' ||
    value.schemaVersion !== 1 ||
    value.destinationName !== destinationName ||
    typeof value.expectedDigest !== 'string' ||
    !/^[0-9a-f]{64}$/u.test(value.expectedDigest) ||
    !Number.isInteger(value.pid) ||
    value.pid < 1 ||
    typeof value.transactionToken !== 'string' ||
    !/^\d+-[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u.test(
      value.transactionToken,
    ) ||
    value.stagingName !== `.${destinationName}.stage-${value.transactionToken}`
  ) {
    return undefined;
  }
  return value;
}

async function readInterruptedTransaction(
  { destinationName, expectedDigest, lockPath, parent },
  fileSystem,
) {
  const identity = await fileSystem.lstat(lockPath);
  if (identity.isSymbolicLink() || !identity.isDirectory()) {
    throw interruptedTransactionError('has an unsafe lock', lockPath);
  }
  const entries = await fileSystem.readdir(lockPath, { withFileTypes: true });
  if (
    entries.length !== 1 ||
    entries[0].name !== 'transaction.json' ||
    !entries[0].isFile() ||
    entries[0].isSymbolicLink()
  ) {
    throw interruptedTransactionError('has an invalid journal', lockPath);
  }
  const markerPath = join(lockPath, 'transaction.json');
  const markerIdentity = await fileSystem.lstat(markerPath);
  if (markerIdentity.isSymbolicLink() || !markerIdentity.isFile()) {
    throw interruptedTransactionError('has an unsafe journal', lockPath);
  }
  const markerBytes = await fileSystem.readFile(markerPath);
  const afterRead = await fileSystem.lstat(markerPath);
  const lockAfterRead = await fileSystem.lstat(lockPath);
  if (!sameIdentity(markerIdentity, afterRead) || !sameIdentity(identity, lockAfterRead)) {
    throw interruptedTransactionError('journal identity changed', lockPath);
  }
  let parsed;
  try {
    parsed = JSON.parse(decoder.decode(markerBytes));
  } catch {
    throw interruptedTransactionError('has an invalid journal', lockPath);
  }
  const marker = validateTransactionMarker(parsed, destinationName);
  if (marker === undefined) {
    throw interruptedTransactionError('has an invalid journal', lockPath);
  }
  if (processIsAlive(marker.pid)) {
    throw ingestError(
      `transaction lock is held by live PID ${marker.pid}; another writer is in progress`,
    );
  }
  if (marker.expectedDigest !== expectedDigest) {
    throw interruptedTransactionError('targets different rendered bytes', lockPath);
  }
  if (
    dirname(join(parent, marker.stagingName)) !== parent ||
    basename(marker.stagingName) !== marker.stagingName
  ) {
    throw interruptedTransactionError('has an unsafe staging path', lockPath);
  }
  return { identity, marker, markerBytes, markerIdentity, markerPath, path: lockPath };
}

async function releaseTransactionLock(transaction, fileSystem, preserveAudit = false) {
  const parent = dirname(transaction.path);
  const lockName = basename(transaction.path);
  const auditStem = lockName.endsWith('.ingest.lock')
    ? lockName.slice(0, -'.ingest.lock'.length)
    : '.evidence-ingest';
  const auditPath = await fileSystem.mkdtemp(join(parent, `${auditStem}.release-audit-`));
  const auditIdentity = await fileSystem.lstat(auditPath);
  if (auditIdentity.isSymbolicLink() || !auditIdentity.isDirectory()) {
    throw ingestError(`release audit root is unsafe; preserving ${transaction.path}`);
  }
  const movedLockPath = join(auditPath, lockName);
  try {
    await fileSystem.rename(transaction.path, movedLockPath);
  } catch (error) {
    const cleanupErrors = [];
    try {
      await removeOwnedEmptyDirectory(auditPath, auditIdentity, fileSystem);
    } catch (cleanupError) {
      cleanupErrors.push(cleanupError);
    }
    throw combinedFailure(error, cleanupErrors);
  }

  const movedTransaction = {
    ...transaction,
    markerPath: join(movedLockPath, 'transaction.json'),
    path: movedLockPath,
  };
  if (preserveAudit) return;
  const auditMarkerPath = join(auditPath, 'transaction.json');
  let auditMarkerIdentity;
  try {
    await fileSystem.writeFile(auditMarkerPath, transaction.markerBytes, { flag: 'wx' });
    auditMarkerIdentity = await fileSystem.lstat(auditMarkerPath);
    if (auditMarkerIdentity.isSymbolicLink() || !auditMarkerIdentity.isFile()) {
      throw ingestError(`release audit journal is unsafe; preserving ${auditPath}`);
    }
    await removeOwnedFile(
      movedTransaction.markerPath,
      movedTransaction.markerIdentity,
      movedTransaction.markerBytes,
      fileSystem,
    );
    await removeOwnedEmptyDirectory(movedTransaction.path, movedTransaction.identity, fileSystem);
    await removeOwnedFile(
      auditMarkerPath,
      auditMarkerIdentity,
      transaction.markerBytes,
      fileSystem,
    );
    await removeOwnedEmptyDirectory(auditPath, auditIdentity, fileSystem);
  } catch (error) {
    const preservationErrors = [];
    try {
      await preserveReleaseJournal(
        auditMarkerPath,
        transaction.markerBytes,
        auditPath,
        auditIdentity,
        fileSystem,
      );
    } catch (preservationError) {
      preservationErrors.push(preservationError);
    }
    throw combinedFailure(error, preservationErrors);
  }
}

async function preserveReleaseJournal(
  markerPath,
  markerBytes,
  auditPath,
  auditIdentity,
  fileSystem,
) {
  const actualAudit = await pathState(auditPath, fileSystem);
  if (
    actualAudit === undefined ||
    actualAudit.isSymbolicLink() ||
    !actualAudit.isDirectory() ||
    !sameIdentity(actualAudit, auditIdentity)
  ) {
    throw ingestError(`release audit root identity changed; preserving ${auditPath}`);
  }

  const markerState = await pathState(markerPath, fileSystem);
  if (markerState === undefined) {
    await fileSystem.writeFile(markerPath, markerBytes, { flag: 'wx' });
  } else {
    if (markerState.isSymbolicLink() || !markerState.isFile()) {
      throw ingestError(`release audit journal is unsafe; preserving ${auditPath}`);
    }
    const actualBytes = await fileSystem.readFile(markerPath);
    const afterRead = await fileSystem.lstat(markerPath);
    if (!sameIdentity(markerState, afterRead) || !Buffer.from(actualBytes).equals(markerBytes)) {
      throw ingestError(`release audit journal changed; preserving ${auditPath}`);
    }
  }
  const afterRestore = await fileSystem.lstat(auditPath);
  if (!sameIdentity(afterRestore, auditIdentity)) {
    throw ingestError(`release audit root identity changed; preserving ${auditPath}`);
  }
}

function orderedDirectories(outputFiles) {
  return [...expectedDirectories(outputFiles)].sort((left, right) => {
    const depth = left.split('/').length - right.split('/').length;
    return depth === 0 ? compareStrings(left, right) : depth;
  });
}

async function stageAndPublish(
  { destinationDirectory, markdownPath, parent },
  outputFiles,
  markdownBytes,
  stagingName,
  interrupted,
  fileSystem,
) {
  const destinationName = basename(destinationDirectory);
  const stagingRoot = join(parent, stagingName);
  const publishedDirectories = [];
  const publishedFiles = [];
  let stagingIdentity;
  let committed = false;
  try {
    await fileSystem.mkdir(stagingRoot);
    stagingIdentity = await fileSystem.lstat(stagingRoot);
    if (dirname(stagingRoot) !== parent || basename(stagingRoot) !== stagingName) {
      throw ingestError('staging directory was not created as a destination sibling');
    }
    const stagedDirectory = join(stagingRoot, destinationName);
    const stagedMarkdown = join(stagingRoot, basename(markdownPath));
    await fileSystem.mkdir(stagedDirectory);
    const stagedFiles = new Map();
    for (const [path, bytes] of outputFiles) {
      const destination = join(stagedDirectory, ...path.split('/'));
      await fileSystem.mkdir(dirname(destination), { recursive: true });
      await fileSystem.writeFile(destination, bytes, { flag: 'wx' });
      stagedFiles.set(path, { identity: await fileSystem.lstat(destination), path: destination });
    }
    await fileSystem.writeFile(stagedMarkdown, markdownBytes, { flag: 'wx' });
    const stagedMarkdownIdentity = await fileSystem.lstat(stagedMarkdown);

    const concurrent =
      interrupted === undefined
        ? {
            state: await inspectDestinations(
              { destinationDirectory, markdownPath },
              outputFiles,
              markdownBytes,
              fileSystem,
            ),
            tree: undefined,
          }
        : await inspectInterruptedDestinations(
            { destinationDirectory, markdownPath },
            outputFiles,
            markdownBytes,
            interrupted.path,
            fileSystem,
          );
    if (concurrent.state === 'idempotent') {
      await removeOwnedStaging(stagingRoot, stagingIdentity, fileSystem);
      return 'idempotent';
    }

    if (concurrent.state === 'absent') {
      await fileSystem.mkdir(destinationDirectory);
      publishedDirectories.push({
        identity: await fileSystem.lstat(destinationDirectory),
        path: destinationDirectory,
      });
    }
    for (const relativeDirectory of orderedDirectories(outputFiles)) {
      if (concurrent.tree?.directories.has(relativeDirectory)) continue;
      const path = join(destinationDirectory, ...relativeDirectory.split('/'));
      await fileSystem.mkdir(path);
      publishedDirectories.push({ identity: await fileSystem.lstat(path), path });
    }
    for (const [path, bytes] of outputFiles) {
      if (concurrent.tree?.files.has(path)) continue;
      const source = stagedFiles.get(path);
      const destination = join(destinationDirectory, ...path.split('/'));
      await fileSystem.link(source.path, destination);
      publishedFiles.push({ bytes, identity: source.identity, path: destination });
    }
    await fileSystem.link(stagedMarkdown, markdownPath);
    publishedFiles.push({
      bytes: markdownBytes,
      identity: stagedMarkdownIdentity,
      path: markdownPath,
    });
    committed = true;
  } catch (error) {
    const cleanupErrors = committed
      ? []
      : await rollbackPublishedEntries(publishedFiles, publishedDirectories, fileSystem);
    if (stagingIdentity !== undefined) {
      try {
        await removeOwnedStaging(stagingRoot, stagingIdentity, fileSystem);
      } catch (cleanupError) {
        cleanupErrors.push(cleanupError);
      }
    }
    throw cleanupErrors.length === 0 ? error : incompleteCleanupFailure(error, cleanupErrors);
  }
  try {
    await removeOwnedStaging(stagingRoot, stagingIdentity, fileSystem);
  } catch {
    // Both required outputs are committed; cleanup cannot turn success into a false rollback claim.
  }
  return 'created';
}

export function parseIngestArgs(arguments_) {
  let automationPath;
  const bundlePaths = [];
  for (let index = 0; index < arguments_.length; index += 2) {
    const option = arguments_[index];
    const value = arguments_[index + 1];
    if (
      (option !== '--automation' && option !== '--bundle') ||
      value === undefined ||
      value.length === 0 ||
      value.startsWith('--')
    ) {
      throw argumentError(`unsupported or incomplete option ${option ?? '<missing>'}`);
    }
    if (option === '--automation') {
      if (automationPath !== undefined) throw argumentError('duplicate --automation option');
      automationPath = value;
    } else {
      if (bundlePaths.includes(value)) throw argumentError('duplicate --bundle value');
      bundlePaths.push(value);
      if (bundlePaths.length > 2) throw argumentError('at most two --bundle options are allowed');
    }
  }
  if (automationPath === undefined || bundlePaths.length < 1) {
    throw argumentError('--automation and one or two --bundle options are required');
  }
  return { automationPath, bundlePaths };
}

export async function ingestEvidence(options, fileSystemOverrides = {}) {
  if (
    typeof options?.automationPath !== 'string' ||
    !Array.isArray(options.bundlePaths) ||
    options.bundlePaths.length < 1 ||
    options.bundlePaths.length > 2 ||
    options.bundlePaths.some((path) => typeof path !== 'string')
  ) {
    throw new TypeError('ingestEvidence requires one automation path and one or two bundle paths');
  }
  const fileSystem = { ...defaultFileSystem, ...fileSystemOverrides };
  const automationArchive = await readEvidenceArchive(resolve(options.automationPath), {
    expectedKind: 'automation',
  });
  const manualArchives = [];
  for (const path of options.bundlePaths) {
    manualArchives.push(
      await readEvidenceArchive(resolve(path), {
        expectedKind: 'manual',
      }),
    );
  }

  const automationManifest = validatedManifest(automationArchive, 'automation');
  const manualManifests = manualArchives.map((archive) => validatedManifest(archive, 'manual'));
  const manualRecords = collectManualRecords(manualArchives);
  const automatedRecords = collectAutomatedRecords(automationArchive);
  const allRecords = [
    ...[...manualRecords.values()].map(({ record }) => record),
    ...[...automatedRecords.values()].map(({ record }) => record),
  ];
  const identity = assertSharedEvidenceIdentity(
    [automationManifest, ...manualManifests],
    allRecords,
  );
  const outputFiles = buildOutputFiles(manualRecords, automatedRecords);
  const destinationName = `${identity.revision}-accessibility`;
  const repositoryRoot = resolve(options.repositoryRoot ?? defaultRepositoryRoot);
  const parent = join(repositoryRoot, ...COMPARISON_PATH);
  const parentState = await pathState(parent, fileSystem);
  if (parentState === undefined || !parentState.isDirectory() || parentState.isSymbolicLink()) {
    throw ingestError('fixed comparison destination parent must be an existing directory');
  }
  const destinationDirectory = join(parent, destinationName);
  const markdownPath = join(parent, `${destinationName}.md`);
  const markdownBytes = renderMarkdown({
    automatedRecords,
    destinationName,
    manualRecords,
    origin: identity.origin,
    revision: identity.revision,
  });
  const destinations = { destinationDirectory, markdownPath, parent };
  const expectedDigest = transactionDigest(outputFiles, markdownBytes);
  const transactionToken = `${process.pid}-${randomUUID()}`;
  const stagingName = `.${destinationName}.stage-${transactionToken}`;
  const { interrupted, transaction } = await acquireTransactionLock(
    {
      destinationName,
      expectedDigest,
      lockPath: join(parent, `.${destinationName}.ingest.lock`),
      parent,
      stagingName,
    },
    fileSystem,
  );
  let status;
  try {
    const preflight =
      interrupted === undefined
        ? {
            state: await inspectDestinations(destinations, outputFiles, markdownBytes, fileSystem),
          }
        : await inspectInterruptedDestinations(
            destinations,
            outputFiles,
            markdownBytes,
            interrupted.path,
            fileSystem,
          );
    status =
      preflight.state === 'idempotent'
        ? 'idempotent'
        : await stageAndPublish(
            destinations,
            outputFiles,
            markdownBytes,
            stagingName,
            interrupted,
            fileSystem,
          );
  } catch (error) {
    if (!mustPreserveTransaction(error)) {
      const cleanupErrors = [];
      try {
        await releaseTransactionLock(transaction, fileSystem, true);
      } catch (cleanupError) {
        cleanupErrors.push(cleanupError);
      }
      throw combinedFailure(error, cleanupErrors);
    }
    throw error;
  }
  // Interrupted staging and its quarantined journal are immutable audit/manual-remediation state.
  // Their creation-time identity is unavailable here, so recovery never deletes either pathname.
  try {
    await releaseTransactionLock(transaction, fileSystem);
  } catch {
    // The output pair is complete (new or exact); lock cleanup is a recoverable concern, not failure.
  }
  return { destinationDirectory, markdownPath, revision: identity.revision, status };
}

export async function runIngestCli(arguments_, options = {}) {
  const parsed = parseIngestArgs(arguments_);
  return ingestEvidence(
    {
      ...parsed,
      ...(options.repositoryRoot === undefined ? {} : { repositoryRoot: options.repositoryRoot }),
    },
    options.fileSystem,
  );
}

async function main() {
  const outcome = await runIngestCli(process.argv.slice(2));
  console.log(
    outcome.status === 'idempotent'
      ? `FileUpload evidence already matches ${outcome.markdownPath}`
      : `FileUpload evidence written to ${outcome.markdownPath}`,
  );
}

const entryPoint = process.argv[1];
if (entryPoint !== undefined && pathToFileURL(resolve(entryPoint)).href === import.meta.url) {
  main().catch((error) => {
    process.exitCode = 1;
    console.error(errorMessage(error));
  });
}
