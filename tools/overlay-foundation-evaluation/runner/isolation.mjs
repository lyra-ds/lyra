import { execFile } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rename,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { promisify } from 'node:util';

import { isPlainRecord } from '../contracts/protocol.mjs';

const execFilePromise = promisify(execFile);
const OWNER_FILE = '.lyra-overlay-evaluation-owner.json';
const REQUIRED_NODE_VERSION = '24.18.0';
const REQUIRED_PNPM_VERSION = '11.13.1';
const RUN_ID = /^[0-9A-Za-z][0-9A-Za-z._-]{0,99}$/u;
const CANDIDATE_ID = /^[a-z0-9][a-z0-9-]*$/u;
const AUDIT_SEVERITIES = Object.freeze(['info', 'low', 'moderate', 'high', 'critical']);
const DEPENDENCY_FIELDS = Object.freeze([
  'dependencies',
  'devDependencies',
  'optionalDependencies',
]);

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function outputBytes(result) {
  const output = isPlainRecord(result) && Object.hasOwn(result, 'stdout') ? result.stdout : result;
  if (typeof output === 'string') return Buffer.from(output);
  if (ArrayBuffer.isView(output)) {
    return Buffer.from(output.buffer, output.byteOffset, output.byteLength);
  }
  throw new Error('command must return stdout bytes or a string');
}

async function defaultRunCommand(command, args, options = {}) {
  const { allowExitCode, ...execOptions } = options;
  try {
    return await execFilePromise(command, args, {
      ...execOptions,
      encoding: null,
      maxBuffer: 50_000_000,
    });
  } catch (error) {
    if (error?.code === allowExitCode) return error;
    throw error;
  }
}

function identity(statValue) {
  return {
    device: statValue.dev.toString(),
    inode: statValue.ino.toString(),
  };
}

function sameIdentity(record, statValue) {
  const current = identity(statValue);
  return record.device === current.device && record.inode === current.inode;
}

function parseOwnerRecord(bytes) {
  let record;
  try {
    record = JSON.parse(bytes);
  } catch (error) {
    throw new Error('run-root ownership marker is malformed', { cause: error });
  }
  if (!isPlainRecord(record) || typeof record.ownerToken !== 'string') {
    throw new Error('run-root ownership marker is malformed');
  }
  return record;
}

async function readOwnedRoot(runRoot) {
  const current = await lstat(runRoot, { bigint: true });
  if (!current.isDirectory() || current.isSymbolicLink()) {
    throw new Error('owned run root must be a real directory');
  }
  const record = parseOwnerRecord(await readFile(join(runRoot, OWNER_FILE), 'utf8'));
  return { current, record };
}

function requireAbsolutePath(value, name) {
  if (typeof value !== 'string' || !isAbsolute(value)) {
    throw new Error(`${name} must be absolute`);
  }
  return resolve(value);
}

async function rollbackCreatedRunRoot({ tmpdir, runRoot, createdIdentity }) {
  let current;
  try {
    current = await lstat(runRoot, { bigint: true });
  } catch (error) {
    if (error?.code === 'ENOENT') return;
    throw error;
  }
  if (
    !current.isDirectory() ||
    current.isSymbolicLink() ||
    !sameIdentity(createdIdentity, current)
  ) {
    return;
  }

  const quarantine = join(tmpdir, `.lyra-overlay-rollback-${randomUUID()}`);
  await rename(runRoot, quarantine);
  const quarantined = await lstat(quarantine, { bigint: true });
  if (!sameIdentity(createdIdentity, quarantined)) {
    await rename(quarantine, runRoot).catch(() => {});
    throw new Error('run-root identity changed during creation rollback');
  }
  await rm(quarantine, { recursive: true });
}

export async function createOwnedRunRoot({ tmpdir, runId }, { writeOwnerMarker = writeFile } = {}) {
  const resolvedTmpdir = requireAbsolutePath(tmpdir, 'TMPDIR');
  if (typeof runId !== 'string' || !RUN_ID.test(runId)) {
    throw new Error('runId must contain only safe path characters');
  }
  const temporaryDirectory = await stat(resolvedTmpdir);
  if (!temporaryDirectory.isDirectory()) throw new Error('TMPDIR must be a directory');

  const runRoot = await mkdtemp(join(resolvedTmpdir, `lyra-overlay-${runId}-`));
  const created = await lstat(runRoot, { bigint: true });
  const createdIdentity = identity(created);
  try {
    const ownerToken = randomUUID();
    const marker = JSON.stringify({ ownerToken, ...createdIdentity });
    await writeOwnerMarker(join(runRoot, OWNER_FILE), marker, { flag: 'wx', mode: 0o600 });
    return { runRoot, ownerToken };
  } catch (error) {
    try {
      await rollbackCreatedRunRoot({
        tmpdir: resolvedTmpdir,
        runRoot,
        createdIdentity,
      });
    } catch (rollbackError) {
      throw new AggregateError(
        [error, rollbackError],
        'owner-marker creation and owned-root rollback both failed',
      );
    }
    throw error;
  }
}

export async function cleanupOwnedRunRoot({ tmpdir, runRoot, ownerToken }) {
  const resolvedTmpdir = requireAbsolutePath(tmpdir, 'tmpdir');
  const resolvedRunRoot = requireAbsolutePath(runRoot, 'runRoot');
  if (dirname(resolvedRunRoot) !== resolvedTmpdir) {
    throw new Error('owned run root must be a direct child of TMPDIR');
  }

  const { current, record } = await readOwnedRoot(resolvedRunRoot);
  if (record.ownerToken !== ownerToken) throw new Error('run-root ownership mismatch');
  if (!sameIdentity(record, current)) throw new Error('run-root identity mismatch');

  const quarantine = join(resolvedTmpdir, `.lyra-overlay-cleanup-${randomUUID()}`);
  await rename(resolvedRunRoot, quarantine);
  const quarantined = await readOwnedRoot(quarantine);
  if (
    quarantined.record.ownerToken !== ownerToken ||
    !sameIdentity(record, quarantined.current) ||
    !sameIdentity(quarantined.record, quarantined.current)
  ) {
    await rename(quarantine, resolvedRunRoot).catch(() => {});
    throw new Error('run-root identity mismatch during cleanup');
  }
  await rm(quarantine, { recursive: true });
}

export function validateAuditReport(value) {
  const errors = [];
  if (!isPlainRecord(value)) return ['audit report must be a plain record'];
  if (!isPlainRecord(value.metadata)) return ['audit metadata must be a plain record'];
  const vulnerabilities = value.metadata.vulnerabilities;
  if (!isPlainRecord(vulnerabilities)) {
    return ['audit metadata.vulnerabilities must be a plain record'];
  }

  for (const severity of AUDIT_SEVERITIES) {
    const total = vulnerabilities[severity];
    if (!Number.isSafeInteger(total) || total < 0) {
      errors.push(`audit ${severity} vulnerability total must be a non-negative integer`);
    }
  }
  for (const severity of ['high', 'critical']) {
    if (Number.isSafeInteger(vulnerabilities[severity]) && vulnerabilities[severity] > 0) {
      errors.push(`audit reports ${vulnerabilities[severity]} ${severity} vulnerabilities`);
    }
  }
  return errors;
}

function assertCandidateInputs(candidate, artifacts) {
  if (
    !isPlainRecord(candidate) ||
    typeof candidate.id !== 'string' ||
    !CANDIDATE_ID.test(candidate.id)
  ) {
    throw new Error('candidate must have a safe ID');
  }
  if (!Array.isArray(artifacts) || artifacts.length === 0) {
    throw new Error('candidate must have inspected artifacts');
  }

  const names = new Set();
  for (const artifact of artifacts) {
    if (!isPlainRecord(artifact) || !isPlainRecord(artifact.record)) {
      throw new Error('candidate artifact must be inspected');
    }
    if (
      artifact.packageName !== artifact.record.name ||
      artifact.packageVersion !== artifact.record.version
    ) {
      throw new Error('direct artifact package identity mismatch');
    }
    if (artifact.license !== artifact.record.license) {
      throw new Error('direct artifact license mismatch');
    }
    if (
      typeof artifact.packageName !== 'string' ||
      artifact.packageName.length === 0 ||
      typeof artifact.packageVersion !== 'string' ||
      artifact.packageVersion.length === 0 ||
      typeof artifact.license !== 'string' ||
      artifact.license.trim().length === 0 ||
      typeof artifact.path !== 'string'
    ) {
      throw new Error('candidate artifact metadata is incomplete');
    }
    if (!isAbsolute(artifact.path)) throw new Error('artifact path must be absolute');
    if (names.has(artifact.packageName)) throw new Error('candidate artifact names must be unique');
    names.add(artifact.packageName);
  }
}

function parseJson(bytes, message) {
  try {
    return JSON.parse(bytes.toString('utf8'));
  } catch (error) {
    throw new Error(message, { cause: error });
  }
}

async function readExpectedToolchain(repositoryRoot) {
  const node = (await readFile(join(repositoryRoot, '.nvmrc'), 'utf8')).trim();
  const repositoryManifest = parseJson(
    await readFile(join(repositoryRoot, 'package.json')),
    'repository package manifest must be valid JSON',
  );
  if (node !== REQUIRED_NODE_VERSION) {
    throw new Error(`repository Node pin must equal ${REQUIRED_NODE_VERSION}`);
  }
  if (
    !isPlainRecord(repositoryManifest) ||
    repositoryManifest.packageManager !== `pnpm@${REQUIRED_PNPM_VERSION}`
  ) {
    throw new Error(`repository pnpm pin must equal ${REQUIRED_PNPM_VERSION}`);
  }
  return { node: REQUIRED_NODE_VERSION, pnpm: REQUIRED_PNPM_VERSION };
}

async function removeOwnedNodeModules({ fixtureRoot, runRoot }) {
  const resolvedFixtureRoot = resolve(fixtureRoot);
  const resolvedRunRoot = resolve(runRoot);
  const fixtureRelative = relative(resolvedRunRoot, resolvedFixtureRoot);
  if (fixtureRelative.startsWith('..') || isAbsolute(fixtureRelative) || fixtureRelative === '') {
    throw new Error('fixture root must be an owned child of the run root');
  }
  const nodeModules = join(resolvedFixtureRoot, 'node_modules');
  if (dirname(resolve(nodeModules)) !== resolvedFixtureRoot) {
    throw new Error('node_modules must be a direct fixture child');
  }
  const nodeModulesStat = await lstat(nodeModules);
  if (!nodeModulesStat.isDirectory() || nodeModulesStat.isSymbolicLink()) {
    throw new Error('fixture node_modules must be a real directory');
  }
  await rm(nodeModules, { recursive: true });
}

function dependencyEntries(node) {
  const entries = [];
  for (const field of DEPENDENCY_FIELDS) {
    const dependencies = node[field];
    if (dependencies === undefined) continue;
    if (!isPlainRecord(dependencies)) {
      throw new Error(`resolved graph ${field} must be a plain record`);
    }
    entries.push(...Object.entries(dependencies));
  }
  return entries;
}

function collectResolvedPackages(value) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error('resolved graph must be a non-empty array');
  }
  const packages = [];
  const visit = (dependencyName, node) => {
    if (!isPlainRecord(node)) throw new Error('resolved graph package must be a plain record');
    packages.push({ dependencyName, node });
    for (const [childName, child] of dependencyEntries(node)) visit(childName, child);
  };
  for (const root of value) {
    if (!isPlainRecord(root)) throw new Error('resolved graph root must be a plain record');
    for (const [dependencyName, node] of dependencyEntries(root)) visit(dependencyName, node);
  }
  if (packages.length === 0) throw new Error('resolved graph must contain installed packages');
  return packages;
}

function pathIsInside(parent, child) {
  const childRelative = relative(parent, child);
  return childRelative !== '' && !childRelative.startsWith('..') && !isAbsolute(childRelative);
}

function compareInventory(left, right) {
  for (const key of ['name', 'version', 'license']) {
    if (left[key] < right[key]) return -1;
    if (left[key] > right[key]) return 1;
  }
  return 0;
}

async function createLicenseInventory({ graph, fixtureRoot, artifacts }) {
  const nodeModulesRoot = await realpath(join(fixtureRoot, 'node_modules'));
  const seenPaths = new Set();
  const inventory = [];

  for (const { dependencyName, node } of collectResolvedPackages(graph)) {
    if (typeof node.path !== 'string' || typeof node.version !== 'string') {
      throw new Error(`resolved package ${dependencyName} must include path and version`);
    }
    const packageRoot = await realpath(node.path);
    if (!pathIsInside(nodeModulesRoot, packageRoot)) {
      throw new Error(`resolved package ${dependencyName} escapes fixture node_modules`);
    }
    if (seenPaths.has(packageRoot)) continue;
    seenPaths.add(packageRoot);

    const manifest = parseJson(
      await readFile(join(packageRoot, 'package.json')),
      `installed package ${dependencyName} manifest must be valid JSON`,
    );
    if (
      !isPlainRecord(manifest) ||
      typeof manifest.name !== 'string' ||
      manifest.name.length === 0 ||
      typeof manifest.version !== 'string' ||
      manifest.version.length === 0 ||
      manifest.version !== node.version
    ) {
      throw new Error(`installed package ${dependencyName} identity mismatch`);
    }
    if (typeof manifest.license !== 'string' || manifest.license.trim().length === 0) {
      throw new Error(
        `installed package ${manifest.name} must declare a non-empty SPDX license string`,
      );
    }
    inventory.push({
      name: manifest.name,
      version: manifest.version,
      license: manifest.license,
    });
  }

  for (const artifact of artifacts) {
    const direct = inventory.find(
      ({ name, version }) => name === artifact.packageName && version === artifact.packageVersion,
    );
    if (direct === undefined) {
      throw new Error(`direct artifact ${artifact.packageName} is absent from resolved graph`);
    }
    if (direct.license !== artifact.license) throw new Error('direct artifact license mismatch');
  }

  return inventory.sort(compareInventory);
}

async function writeEvidence(path, bytes) {
  await writeFile(path, bytes, { flag: 'wx', mode: 0o600 });
  return sha256(bytes);
}

async function installAndCapture({ candidate, artifacts, runRoot, repositoryRoot, runCommand }) {
  const expectedToolchain = await readExpectedToolchain(repositoryRoot);
  if (process.versions.node !== REQUIRED_NODE_VERSION) {
    throw new Error(
      `Node version mismatch: expected ${REQUIRED_NODE_VERSION}, received ${process.versions.node}`,
    );
  }

  const fixtureRoot = join(runRoot, `candidate-${candidate.id}`);
  const storeRoot = join(runRoot, 'pnpm-store');
  await mkdir(fixtureRoot, { mode: 0o700 });
  await mkdir(storeRoot, { recursive: true, mode: 0o700 });

  const pnpmVersionBytes = outputBytes(
    await runCommand('pnpm', ['--version'], { cwd: repositoryRoot }),
  );
  const actualPnpm = pnpmVersionBytes.toString('utf8').trim();
  if (actualPnpm !== REQUIRED_PNPM_VERSION) {
    throw new Error(
      `pnpm version mismatch: expected ${REQUIRED_PNPM_VERSION}, received ${actualPnpm}`,
    );
  }

  const dependencies = {};
  for (const artifact of [...artifacts].sort((left, right) =>
    left.packageName < right.packageName ? -1 : left.packageName > right.packageName ? 1 : 0,
  )) {
    dependencies[artifact.packageName] = `file:${resolve(artifact.path)}`;
  }
  const fixtureManifest = Buffer.from(
    JSON.stringify({
      name: `lyra-overlay-evaluation-${candidate.id}`,
      version: '0.0.0',
      private: true,
      packageManager: `pnpm@${expectedToolchain.pnpm}`,
      dependencies,
    }),
  );
  const fixtureManifestPath = join(fixtureRoot, 'package.json');
  const fixtureManifestSha256 = await writeEvidence(fixtureManifestPath, fixtureManifest);

  await runCommand(
    'pnpm',
    ['install', '--ignore-workspace', '--ignore-scripts', '--store-dir', storeRoot],
    { cwd: fixtureRoot },
  );
  await removeOwnedNodeModules({ fixtureRoot, runRoot });
  await runCommand(
    'pnpm',
    [
      'install',
      '--frozen-lockfile',
      '--offline',
      '--ignore-workspace',
      '--ignore-scripts',
      '--store-dir',
      storeRoot,
    ],
    { cwd: fixtureRoot },
  );

  const resolvedGraphBytes = outputBytes(
    await runCommand('pnpm', ['list', '--json', '--depth', 'Infinity', '--ignore-workspace'], {
      cwd: fixtureRoot,
    }),
  );
  const resolvedGraphPath = join(fixtureRoot, 'resolved-graph.json');
  const resolvedGraphSha256 = await writeEvidence(resolvedGraphPath, resolvedGraphBytes);
  const graph = parseJson(resolvedGraphBytes, 'resolved graph output must be valid JSON');

  const auditBytes = outputBytes(
    await runCommand('pnpm', ['audit', '--json'], {
      cwd: fixtureRoot,
      allowExitCode: 1,
    }),
  );
  const auditPath = join(fixtureRoot, 'audit.json');
  const auditSha256 = await writeEvidence(auditPath, auditBytes);
  const audit = parseJson(auditBytes, 'audit output must be valid JSON');
  const auditErrors = validateAuditReport(audit);
  if (auditErrors.length > 0) throw new Error(`audit report rejected: ${auditErrors.join('; ')}`);

  const inventory = await createLicenseInventory({ graph, fixtureRoot, artifacts });
  const licenseInventoryBytes = Buffer.from(JSON.stringify(inventory));
  const licenseInventoryPath = join(fixtureRoot, 'license-inventory.json');
  const licenseInventorySha256 = await writeEvidence(licenseInventoryPath, licenseInventoryBytes);

  const lockfilePath = join(fixtureRoot, 'pnpm-lock.yaml');
  const lockfileBytes = await readFile(lockfilePath);
  return {
    fixtureManifestPath,
    fixtureManifestSha256,
    lockfilePath,
    lockfileSha256: sha256(lockfileBytes),
    resolvedGraphPath,
    resolvedGraphSha256,
    auditPath,
    auditSha256,
    licenseInventoryPath,
    licenseInventorySha256,
  };
}

export async function installExternalCandidate({
  candidate,
  artifacts,
  runRoot,
  repositoryRoot,
  runCommand = defaultRunCommand,
}) {
  const resolvedRunRoot = requireAbsolutePath(runRoot, 'runRoot');
  const resolvedRepositoryRoot = requireAbsolutePath(repositoryRoot, 'repositoryRoot');
  assertCandidateInputs(candidate, artifacts);
  const owned = await readOwnedRoot(resolvedRunRoot);
  if (!sameIdentity(owned.record, owned.current)) throw new Error('run-root identity mismatch');
  const repositoryStat = await stat(resolvedRepositoryRoot);
  if (!repositoryStat.isDirectory()) throw new Error('repository root must be a directory');

  const statusArguments = ['status', '--porcelain=v1', '--untracked-files=all'];
  const repositoryBefore = outputBytes(
    await runCommand('git', statusArguments, { cwd: resolvedRepositoryRoot }),
  );
  let evidence;
  let primaryError;
  try {
    evidence = await installAndCapture({
      candidate,
      artifacts,
      runRoot: resolvedRunRoot,
      repositoryRoot: resolvedRepositoryRoot,
      runCommand,
    });
  } catch (error) {
    primaryError = error;
  }

  let repositoryAfter;
  try {
    repositoryAfter = outputBytes(
      await runCommand('git', statusArguments, { cwd: resolvedRepositoryRoot }),
    );
  } catch (error) {
    throw new Error('repository worktree status could not be verified after installation', {
      cause: primaryError === undefined ? error : new AggregateError([primaryError, error]),
    });
  }
  if (!repositoryBefore.equals(repositoryAfter)) {
    throw new Error('repository worktree changed during candidate installation', {
      cause: primaryError,
    });
  }
  if (primaryError !== undefined) throw primaryError;
  return evidence;
}
