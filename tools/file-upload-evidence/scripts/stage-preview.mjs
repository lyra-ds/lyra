import { spawn } from 'node:child_process';
import {
  constants,
  copyFile,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rm,
  writeFile,
} from 'node:fs/promises';
import { homedir } from 'node:os';
import { basename, join, parse, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const revisionPattern = /^[a-f0-9]{40}$/u;
const stagingPrefix = '.wrangler-file-upload-evidence-';
const packageName = '@lyra-ds/file-upload-evidence';

function isInside(parent, child) {
  const path = relative(parent, child);
  return path !== '' && path !== '..' && !path.startsWith(`..${sep}`);
}

async function requiredRealPath(path, label) {
  try {
    const resolvedPath = await realpath(resolve(path));
    if (!(await lstat(resolvedPath)).isDirectory()) throw new Error();
    return resolvedPath;
  } catch {
    throw new Error(`${label} must exist and resolve to a directory.`);
  }
}

async function regularFiles(root) {
  const files = [];

  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      const details = await lstat(path);
      if (details.isSymbolicLink()) {
        throw new Error(`staging inputs must not contain symbolic links: ${path}`);
      }
      if (details.isDirectory()) await visit(path);
      else if (details.isFile()) files.push(path);
      else throw new Error(`staging inputs must contain only regular files: ${path}`);
    }
  }

  await visit(root);
  return files;
}

async function assertHarnessManifest(workspaceRoot) {
  const manifestPath = join(workspaceRoot, 'tools/file-upload-evidence/package.json');
  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  } catch {
    throw new Error('harness package manifest is missing or invalid.');
  }
  if (manifest.name !== packageName || manifest.private !== true) {
    throw new Error('harness package manifest does not identify the private evidence tool.');
  }
}

async function validateOptions(options) {
  if (!revisionPattern.test(options.revision)) {
    throw new Error('revision must be a full 40-character lowercase Git SHA.');
  }

  const workspaceRoot = await requiredRealPath(options.workspaceRoot, 'workspaceRoot');
  if (workspaceRoot === parse(workspaceRoot).root || workspaceRoot === resolve(homedir())) {
    throw new Error('workspaceRoot must not be the filesystem root or home directory.');
  }

  const docsOutputRoot = await requiredRealPath(options.docsOutputRoot, 'docsOutputRoot');
  const expectedDocsOutputRoot = resolve(workspaceRoot, 'apps/docs/out');
  if (docsOutputRoot !== expectedDocsOutputRoot || !isInside(workspaceRoot, docsOutputRoot)) {
    throw new Error('docsOutputRoot must resolve to apps/docs/out inside workspaceRoot.');
  }

  const harnessDistRoot = await requiredRealPath(options.harnessDistRoot, 'harnessDistRoot');
  const expectedHarnessDistRoot = resolve(workspaceRoot, 'tools/file-upload-evidence/dist');
  if (harnessDistRoot !== expectedHarnessDistRoot || !isInside(workspaceRoot, harnessDistRoot)) {
    throw new Error('harnessDistRoot must resolve to tools/file-upload-evidence/dist.');
  }

  await assertHarnessManifest(workspaceRoot);
  for (const route of [
    'en/file-upload-evidence/index.html',
    'pt-BR/file-upload-evidence/index.html',
  ]) {
    const path = resolve(harnessDistRoot, route);
    if (!isInside(harnessDistRoot, path)) throw new Error('invalid harness route path.');
    try {
      const details = await lstat(path);
      if (!details.isFile() || details.isSymbolicLink()) throw new Error();
    } catch {
      throw new Error(`harness output is missing ${route}.`);
    }
  }

  return { docsOutputRoot, harnessDistRoot, workspaceRoot };
}

function adapterSource(revision) {
  return `import { handleEvidenceRequest } from '../_shared/file-upload-evidence-endpoint.js';

export const onRequest = (context: { request: Request }): Promise<Response> =>
  handleEvidenceRequest(context.request, {
    revision: '${revision}',
    randomUUID: () => crypto.randomUUID(),
    sleep: (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
  });
`;
}

async function bundleEndpoint(workspaceRoot, stagingRoot) {
  const endpointEntry = join(workspaceRoot, 'tools/file-upload-evidence/src/endpoint.ts');
  const outputRoot = join(stagingRoot, 'functions/_shared');
  await mkdir(outputRoot, { recursive: true });
  await build({
    configFile: false,
    logLevel: 'silent',
    build: {
      emptyOutDir: false,
      lib: {
        entry: endpointEntry,
        fileName: 'file-upload-evidence-endpoint',
        formats: ['es'],
      },
      outDir: outputRoot,
      rollupOptions: {
        output: { entryFileNames: 'file-upload-evidence-endpoint.js' },
      },
    },
  });
}

async function copyHarness(harnessDistRoot, docsOutputRoot) {
  const sourceFiles = await regularFiles(harnessDistRoot);
  const copies = [];
  for (const source of sourceFiles) {
    const path = relative(harnessDistRoot, source);
    const destination = resolve(docsOutputRoot, path);
    if (!isInside(docsOutputRoot, destination)) {
      throw new Error(`harness output escaped the Docs output root: ${path}`);
    }
    try {
      await lstat(destination);
      throw new Error(`refusing to overwrite existing Docs output: ${path}`);
    } catch (error) {
      if (error instanceof Error && !('code' in error && error.code === 'ENOENT')) throw error;
    }
    copies.push({ destination, source });
  }

  for (const { destination, source } of copies) {
    await mkdir(resolve(destination, '..'), { recursive: true });
    await copyFile(source, destination, constants.COPYFILE_EXCL);
  }
}

export async function stagePreview(options, operation) {
  const roots = await validateOptions(options);
  const createTemporaryDirectory =
    options.createTemporaryDirectory ?? ((prefix) => mkdtemp(prefix));
  const requestedPrefix = join(roots.workspaceRoot, stagingPrefix);
  const stagingRoot = resolve(await createTemporaryDirectory(requestedPrefix));
  const validStagingRoot =
    isInside(roots.workspaceRoot, stagingRoot) &&
    basename(stagingRoot).startsWith(stagingPrefix) &&
    (await readdir(stagingRoot)).length === 0;
  if (!validStagingRoot) {
    throw new Error('staging directory must be empty and created by this invocation.');
  }

  try {
    await bundleEndpoint(roots.workspaceRoot, stagingRoot);
    const adapterPath = join(stagingRoot, 'functions/api/file-upload-evidence.ts');
    await mkdir(resolve(adapterPath, '..'), { recursive: true });
    await writeFile(adapterPath, adapterSource(options.revision), { flag: 'wx' });
    await copyHarness(roots.harnessDistRoot, roots.docsOutputRoot);
    return await operation({ docsOutputRoot: roots.docsOutputRoot, wranglerCwd: stagingRoot });
  } finally {
    await rm(stagingRoot, { force: true, recursive: true });
  }
}

function parseCliArguments(arguments_) {
  const separator = arguments_.indexOf('--');
  if (separator === -1 || separator === arguments_.length - 1) {
    throw new Error('stage-preview requires a command after --.');
  }

  const values = new Map();
  for (const argument of arguments_.slice(0, separator)) {
    const match = /^--([a-z-]+)=(.+)$/u.exec(argument);
    if (match === null) throw new Error(`invalid stage-preview argument: ${argument}`);
    values.set(match[1], match[2]);
  }

  const workspaceRoot = values.get('workspace-root');
  const docsOutputRoot = values.get('docs-output');
  const harnessDistRoot = values.get('harness-dist');
  const revision = values.get('revision');
  if (
    [workspaceRoot, docsOutputRoot, harnessDistRoot, revision].some((value) => value === undefined)
  ) {
    throw new Error(
      'stage-preview requires workspace-root, docs-output, harness-dist, and revision.',
    );
  }
  return {
    command: arguments_.slice(separator + 1),
    options: { docsOutputRoot, harnessDistRoot, revision, workspaceRoot },
  };
}

async function runCommand(command, cwd) {
  await new Promise((resolvePromise, reject) => {
    const child = spawn(command[0], command.slice(1), { cwd, stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`staged command failed (${signal ?? `exit ${code}`}).`));
    });
  });
}

const isCli =
  process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const { command, options } = parseCliArguments(process.argv.slice(2));
  await stagePreview(options, ({ wranglerCwd }) => runCommand(command, wranglerCwd));
}
