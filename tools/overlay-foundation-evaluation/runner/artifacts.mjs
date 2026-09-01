import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { constants as fsConstants } from 'node:fs';
import { lstat, open, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';

import { isPlainRecord } from '../contracts/protocol.mjs';
import { validateSpdxExpression } from '../contracts/spdx.mjs';

const execFilePromise = promisify(execFile);
const PACKAGE_MANIFEST = 'package/package.json';
const MAX_MEMBER_LIST_BYTES = 8_388_608;
const MAX_MANIFEST_BYTES = 1_048_576;
const FORBIDDEN_LIFECYCLE_SCRIPTS = Object.freeze([
  'preinstall',
  'install',
  'postinstall',
  'prepare',
]);

export function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function sameFileIdentity(left, right) {
  return left.dev === right.dev && left.ino === right.ino && left.size === right.size;
}

export async function verifyRegularFile({ path, expectedSha256 }) {
  let input;
  try {
    input = await open(path, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW);
  } catch (error) {
    if (error?.code === 'ELOOP') {
      throw new Error('approved artifact path must not be a symbolic link', { cause: error });
    }
    throw error;
  }

  try {
    const before = await input.stat({ bigint: true });
    if (!before.isFile()) throw new Error('approved artifact path must be a regular file');
    const bytes = await input.readFile();
    const after = await input.stat({ bigint: true });
    if (!sameFileIdentity(before, after) || BigInt(bytes.byteLength) !== before.size) {
      throw new Error('approved artifact file identity or size changed while reading');
    }

    const named = await lstat(path, { bigint: true });
    if (named.isSymbolicLink() || !named.isFile()) {
      throw new Error('approved artifact path must remain a regular file, not a symbolic link');
    }
    if (!sameFileIdentity(before, named)) {
      throw new Error('approved artifact path identity or size changed while reading');
    }

    const actual = sha256(bytes);
    if (actual !== expectedSha256) throw new Error('artifact checksum mismatch');
    return {
      bytes,
      device: before.dev,
      inode: before.ino,
      sha256: actual,
      size: before.size,
    };
  } finally {
    await input.close();
  }
}

export async function acquireExternalArtifact({
  record,
  destinationRoot,
  fetchImpl = fetch,
  maxBytes = 50_000_000,
}) {
  const path = join(destinationRoot, `${record.sha256}.tgz`);
  let output;
  let created = false;

  try {
    const response = await fetchImpl(record.tarballUrl, { redirect: 'error' });
    if (response.status !== 200 || response.body === null) {
      throw new Error(`artifact request failed with HTTP ${response.status}`);
    }
    const declared = response.headers.get('content-length');
    if (declared !== null && Number(declared) > maxBytes) {
      throw new Error(`artifact exceeds ${maxBytes} bytes`);
    }

    const chunks = [];
    let bytes = 0;
    for await (const chunk of response.body) {
      bytes += chunk.byteLength;
      if (bytes > maxBytes) throw new Error(`artifact exceeds ${maxBytes} bytes`);
      chunks.push(Buffer.from(chunk));
    }

    const body = Buffer.concat(chunks);
    const actual = sha256(body);
    if (actual !== record.sha256) throw new Error('artifact checksum mismatch');

    output = await open(path, 'wx', 0o600);
    created = true;
    await output.writeFile(body);
    await output.close();
    output = undefined;
    const verified = await verifyRegularFile({ path, expectedSha256: record.sha256 });
    return { record, path, sha256: verified.sha256, bytes: body.byteLength };
  } catch (error) {
    await output?.close().catch(() => {});
    if (created) await unlink(path).catch(() => {});
    throw error;
  }
}

function commandStdout(result) {
  if (isPlainRecord(result) && Object.hasOwn(result, 'stdout')) return result.stdout;
  return result;
}

function byteLength(output) {
  return typeof output === 'string' ? Buffer.byteLength(output) : output.byteLength;
}

async function runTar(runCommand, args, maxBuffer, overflowMessage) {
  try {
    const result = await runCommand('tar', args, { encoding: null, maxBuffer });
    return commandStdout(result);
  } catch (error) {
    if (
      error?.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER' ||
      /maxBuffer length exceeded/u.test(error?.message ?? '')
    ) {
      throw new Error(overflowMessage, { cause: error });
    }
    throw error;
  }
}

export async function inspectPackageArchive({ artifact, runCommand = execFilePromise }) {
  if (!isPlainRecord(artifact?.record)) throw new Error('artifact record must be present');
  if (artifact.sha256 !== artifact.record.sha256) throw new Error('artifact checksum mismatch');
  await verifyRegularFile({ path: artifact.path, expectedSha256: artifact.record.sha256 });

  const listed = await runTar(
    runCommand,
    ['-tzf', artifact.path],
    MAX_MEMBER_LIST_BYTES,
    'archive member listing exceeds 8 MiB',
  );
  const members = Buffer.from(listed).toString('utf8').split('\n').filter(Boolean);
  if (members.filter((member) => member === PACKAGE_MANIFEST).length !== 1) {
    throw new Error(`artifact archive must contain exactly one ${PACKAGE_MANIFEST}`);
  }

  const extracted = await runTar(
    runCommand,
    ['-xOzf', artifact.path, '--', PACKAGE_MANIFEST],
    MAX_MANIFEST_BYTES,
    'archive package manifest exceeds 1 MiB',
  );
  if (byteLength(extracted) > MAX_MANIFEST_BYTES) {
    throw new Error('archive package manifest exceeds 1 MiB');
  }

  let manifest;
  try {
    manifest = JSON.parse(Buffer.from(extracted).toString('utf8'));
  } catch (error) {
    throw new Error('archive package manifest must be valid JSON', { cause: error });
  }
  if (!isPlainRecord(manifest)) {
    throw new Error('archive package manifest must be a plain JSON object');
  }

  for (const [field, expected] of [
    ['name', artifact.record.name],
    ['version', artifact.record.version],
    ['license', artifact.record.license],
  ]) {
    if (manifest[field] !== expected) throw new Error(`package ${field} mismatch`);
  }
  const licenseErrors = validateSpdxExpression(manifest.license);
  if (licenseErrors.length > 0) {
    throw new Error(`package SPDX license is invalid: ${licenseErrors.join('; ')}`);
  }

  const lifecycleScripts = isPlainRecord(manifest.scripts)
    ? FORBIDDEN_LIFECYCLE_SCRIPTS.filter((key) => Object.hasOwn(manifest.scripts, key))
    : [];
  if (lifecycleScripts.length > 0) {
    throw new Error(
      `artifact package manifest contains forbidden lifecycle scripts: ${lifecycleScripts.join(', ')}`,
    );
  }

  const verified = await verifyRegularFile({
    path: artifact.path,
    expectedSha256: artifact.record.sha256,
  });

  return {
    ...artifact,
    bytes: Number(verified.size),
    packageName: manifest.name,
    packageVersion: manifest.version,
    license: manifest.license,
    lifecycleScripts,
    sha256: verified.sha256,
  };
}
