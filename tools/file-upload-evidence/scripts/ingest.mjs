import { lstat, mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
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
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
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
    .replace(/\r?\n/gu, '<br>');
}

function titleCase(value) {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}

function artifactLink(destinationName, path) {
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
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
    for (const path of [...record.artifactPaths].sort(compareStrings)) {
      lines.push(`- [\`${path}\`](${artifactLink(destinationName, path)})`);
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
      lines.push(`- [\`${path}\`](${artifactLink(destinationName, path)})`);
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

async function removeOwnedPath(path, fileSystem) {
  let firstError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await fileSystem.rm(path, { force: true, recursive: true });
      return;
    } catch (error) {
      firstError ??= error;
    }
  }
  throw firstError;
}

function sameIdentity(left, right) {
  return left.dev === right.dev && left.ino === right.ino;
}

async function rollbackPublishedDirectory(path, expectedIdentity, fileSystem) {
  const actual = await pathState(path, fileSystem);
  if (actual === undefined) return;
  if (!sameIdentity(actual, expectedIdentity)) {
    throw ingestError('published directory identity changed; refusing unsafe cleanup');
  }
  await removeOwnedPath(path, fileSystem);
}

function combinedFailure(error, cleanupErrors) {
  if (cleanupErrors.length === 0) return error;
  return new AggregateError([error, ...cleanupErrors], errorMessage(error), { cause: error });
}

async function stageAndPublish(
  { destinationDirectory, markdownPath, parent },
  outputFiles,
  markdownBytes,
  fileSystem,
) {
  const destinationName = basename(destinationDirectory);
  const stagingPrefix = `.${destinationName}.stage-${process.pid}-`;
  let stagingRoot;
  let publishedIdentity;
  try {
    stagingRoot = await fileSystem.mkdtemp(join(parent, stagingPrefix));
    if (dirname(stagingRoot) !== parent || !basename(stagingRoot).startsWith(stagingPrefix)) {
      throw ingestError('staging directory was not created as a destination sibling');
    }
    const stagedDirectory = join(stagingRoot, destinationName);
    const stagedMarkdown = join(stagingRoot, basename(markdownPath));
    await fileSystem.mkdir(stagedDirectory);
    for (const [path, bytes] of outputFiles) {
      const destination = join(stagedDirectory, ...path.split('/'));
      await fileSystem.mkdir(dirname(destination), { recursive: true });
      await fileSystem.writeFile(destination, bytes, { flag: 'wx' });
    }
    await fileSystem.writeFile(stagedMarkdown, markdownBytes, { flag: 'wx' });

    const concurrentState = await inspectDestinations(
      { destinationDirectory, markdownPath },
      outputFiles,
      markdownBytes,
      fileSystem,
    );
    if (concurrentState === 'idempotent') {
      await removeOwnedPath(stagingRoot, fileSystem);
      return 'idempotent';
    }

    publishedIdentity = await fileSystem.lstat(stagedDirectory);
    await fileSystem.rename(stagedDirectory, destinationDirectory);
    if ((await pathState(markdownPath, fileSystem)) !== undefined) {
      throw ingestError('Markdown destination appeared during publication; refusing to overwrite');
    }
    await fileSystem.rename(stagedMarkdown, markdownPath);
  } catch (error) {
    const cleanupErrors = [];
    if (publishedIdentity !== undefined) {
      try {
        await rollbackPublishedDirectory(destinationDirectory, publishedIdentity, fileSystem);
      } catch (cleanupError) {
        cleanupErrors.push(cleanupError);
      }
    }
    if (stagingRoot !== undefined) {
      try {
        await removeOwnedPath(stagingRoot, fileSystem);
      } catch (cleanupError) {
        cleanupErrors.push(cleanupError);
      }
    }
    throw combinedFailure(error, cleanupErrors);
  }
  await removeOwnedPath(stagingRoot, fileSystem);
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
  const preflight = await inspectDestinations(destinations, outputFiles, markdownBytes, fileSystem);
  if (preflight === 'idempotent') {
    return {
      destinationDirectory,
      markdownPath,
      revision: identity.revision,
      status: 'idempotent',
    };
  }
  const status = await stageAndPublish(destinations, outputFiles, markdownBytes, fileSystem);
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
