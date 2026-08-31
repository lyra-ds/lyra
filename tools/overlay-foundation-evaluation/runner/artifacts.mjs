import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { open, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';

import { isPlainRecord } from '../contracts/protocol.mjs';

const execFilePromise = promisify(execFile);
const PACKAGE_MANIFEST = 'package/package.json';
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

function safeArtifactName(name) {
  return name
    .replace(/^@/u, '')
    .replaceAll('/', '-')
    .replaceAll(/[^0-9A-Za-z._-]/gu, '_');
}

export async function acquireExternalArtifact({
  record,
  destinationRoot,
  fetchImpl = fetch,
  maxBytes = 50_000_000,
}) {
  const path = join(destinationRoot, `${safeArtifactName(record.name)}-${record.version}.tgz`);
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
    return { record, path, sha256: actual, bytes };
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

async function runTar(runCommand, args, maxBuffer) {
  try {
    const result = await runCommand('tar', args, { encoding: null, maxBuffer });
    return commandStdout(result);
  } catch (error) {
    if (
      error?.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER' ||
      /maxBuffer length exceeded/u.test(error?.message ?? '')
    ) {
      throw new Error('archive package manifest exceeds 1 MiB', { cause: error });
    }
    throw error;
  }
}

export async function inspectPackageArchive({ artifact, runCommand = execFilePromise }) {
  const listed = await runTar(runCommand, ['-tzf', artifact.path], MAX_MANIFEST_BYTES);
  const members = Buffer.from(listed).toString('utf8').split('\n').filter(Boolean);
  if (members.filter((member) => member === PACKAGE_MANIFEST).length !== 1) {
    throw new Error(`artifact archive must contain exactly one ${PACKAGE_MANIFEST}`);
  }

  const extracted = await runTar(
    runCommand,
    ['-xOzf', artifact.path, '--', PACKAGE_MANIFEST],
    MAX_MANIFEST_BYTES,
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

  const lifecycleScripts = isPlainRecord(manifest.scripts)
    ? FORBIDDEN_LIFECYCLE_SCRIPTS.filter((key) => Object.hasOwn(manifest.scripts, key))
    : [];
  if (lifecycleScripts.length > 0) {
    throw new Error(
      `artifact package manifest contains forbidden lifecycle scripts: ${lifecycleScripts.join(', ')}`,
    );
  }

  return {
    ...artifact,
    packageName: manifest.name,
    packageVersion: manifest.version,
    license: manifest.license,
    lifecycleScripts,
  };
}
