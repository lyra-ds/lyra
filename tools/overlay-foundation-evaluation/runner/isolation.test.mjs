import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { promisify } from 'node:util';
import { test } from 'node:test';

import {
  cleanupOwnedRunRoot,
  createOwnedRunRoot,
  installExternalCandidate,
  readPartialInstallationEvidence,
  validateAuditReport,
} from './isolation.mjs';

const execFilePromise = promisify(execFile);
const ownerFile = '.lyra-overlay-evaluation-owner.json';
const missingLicense = Symbol('missing license');
const requiredNodeVersion = '24.18.0';
const requiredPnpmVersion = '11.13.1';
const cleanAudit = {
  metadata: {
    vulnerabilities: {
      info: 0,
      low: 0,
      moderate: 0,
      high: 0,
      critical: 0,
    },
  },
};

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

async function sha256File(path) {
  return createHash('sha256')
    .update(await readFile(path))
    .digest('hex');
}

async function testDirectory(t, prefix = 'lyra-overlay-isolation-') {
  const directory = await mkdtemp(join(tmpdir(), prefix));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}

async function runBytes(command, args, options = {}) {
  const { allowExitCode, ...execOptions } = options;
  try {
    return await execFilePromise(command, args, { ...execOptions, encoding: null });
  } catch (error) {
    if (error?.code === allowExitCode) return error;
    if (Buffer.isBuffer(error?.stdout)) {
      error.message += `\nstdout:\n${error.stdout.toString('utf8')}`;
    }
    throw error;
  }
}

async function createRepository(t, root, overrides = {}) {
  const repositoryRoot = join(root, 'repository');
  await mkdir(repositoryRoot);
  await writeFile(join(repositoryRoot, '.nvmrc'), `${overrides.node ?? requiredNodeVersion}\n`);
  await writeFile(
    join(repositoryRoot, 'package.json'),
    JSON.stringify({
      name: 'synthetic-repository',
      private: true,
      packageManager: `pnpm@${overrides.pnpm ?? requiredPnpmVersion}`,
    }),
  );
  await writeFile(join(repositoryRoot, 'pnpm-lock.yaml'), 'lockfileVersion: "9.0"\n');
  await writeFile(join(repositoryRoot, 'tracked.txt'), 'original\n');
  await runBytes('git', ['init', '--initial-branch=main'], { cwd: repositoryRoot });
  await runBytes('git', ['config', 'user.name', 'Overlay Test'], { cwd: repositoryRoot });
  await runBytes('git', ['config', 'user.email', 'overlay@example.invalid'], {
    cwd: repositoryRoot,
  });
  await runBytes('git', ['add', '.'], { cwd: repositoryRoot });
  await runBytes('git', ['commit', '-m', 'synthetic baseline'], { cwd: repositoryRoot });
  t.after(() => rm(repositoryRoot, { recursive: true, force: true }));
  return repositoryRoot;
}

async function createPackageArchive(root, filename, manifest, files = {}) {
  const sourceRoot = join(root, `${filename}-source`);
  const packageRoot = join(sourceRoot, 'package');
  const archivePath = join(root, `${filename}.tgz`);
  await mkdir(packageRoot, { recursive: true });
  await writeFile(join(packageRoot, 'package.json'), JSON.stringify(manifest));
  for (const [name, contents] of Object.entries(files)) {
    await writeFile(join(packageRoot, name), contents);
  }
  await runBytes('tar', ['-czf', archivePath, '-C', sourceRoot, 'package']);
  return archivePath;
}

async function createSyntheticCandidate(root, transitiveLicense = 'Apache-2.0') {
  const markerPath = join(root, 'hostile-postinstall-marker');
  const transitiveName = 'lyra-transitive-license';
  const transitiveVersion = '2.0.0';
  const transitiveManifest = { name: transitiveName, version: transitiveVersion };
  if (transitiveLicense !== missingLicense) transitiveManifest.license = transitiveLicense;
  const transitivePath = await createPackageArchive(root, 'transitive-package', transitiveManifest);

  const packageName = 'lyra-hostile-candidate';
  const packageVersion = '1.0.0';
  const license = 'MIT';
  const artifactPath = await createPackageArchive(
    root,
    'hostile-package',
    {
      name: packageName,
      version: packageVersion,
      license,
      dependencies: { [transitiveName]: `file:${transitivePath}` },
      scripts: { postinstall: 'node postinstall.mjs' },
    },
    {
      'postinstall.mjs': `import { writeFileSync } from 'node:fs';\nwriteFileSync(${JSON.stringify(
        markerPath,
      )}, 'executed');\n`,
    },
  );
  const artifactSha256 = await sha256File(artifactPath);
  const artifactBytes = (await stat(artifactPath)).size;

  return {
    candidate: { id: 'radix' },
    artifacts: [
      {
        record: {
          name: packageName,
          version: packageVersion,
          license,
          sha256: artifactSha256,
        },
        path: artifactPath,
        sha256: artifactSha256,
        bytes: artifactBytes,
        packageName,
        packageVersion,
        license,
        lifecycleScripts: ['postinstall'],
      },
    ],
    markerPath,
    packageName,
    transitiveName,
    transitiveVersion,
  };
}

function commandRecorder({
  audit = cleanAudit,
  failRepositoryStatusAfterInstall = false,
  mutateCandidateCopyAfterFirstInstall = false,
  mutateRepository,
  pnpmVersionOutput,
} = {}) {
  const calls = [];
  let repositoryStatusCalls = 0;
  let listBytes;
  const auditBytes =
    typeof audit === 'string' ? Buffer.from(audit) : Buffer.from(JSON.stringify(audit));
  return {
    calls,
    auditBytes,
    get listBytes() {
      return listBytes;
    },
    async runCommand(command, args, options = {}) {
      calls.push({ command, args: [...args], options: { ...options } });
      if (command === 'git' && args[0] === 'status') {
        repositoryStatusCalls += 1;
        if (failRepositoryStatusAfterInstall && repositoryStatusCalls === 2) {
          throw new Error('injected repository status failure');
        }
      }
      if (command === 'pnpm' && args[0] === '--version' && pnpmVersionOutput !== undefined) {
        return { stdout: Buffer.from(pnpmVersionOutput), stderr: Buffer.alloc(0) };
      }
      if (command === 'pnpm' && args[0] === 'audit') {
        return { stdout: auditBytes, stderr: Buffer.alloc(0) };
      }
      const result = await runBytes(
        command,
        args,
        command === 'pnpm' && args[0] === 'install'
          ? {
              ...options,
              env: {
                ...process.env,
                PNPM_CONFIG_DANGEROUSLY_ALLOW_ALL_BUILDS: 'true',
              },
            }
          : options,
      );
      if (command === 'pnpm' && args[0] === 'list') {
        listBytes = Buffer.from(result.stdout);
      }
      if (
        mutateCandidateCopyAfterFirstInstall &&
        command === 'pnpm' &&
        args[0] === 'install' &&
        !args.includes('--frozen-lockfile')
      ) {
        const fixtureManifest = JSON.parse(
          await readFile(join(options.cwd, 'package.json'), 'utf8'),
        );
        const [dependency] = Object.values(fixtureManifest.dependencies);
        await writeFile(dependency.slice('file:'.length), 'replaced after first install');
      }
      if (
        mutateRepository &&
        command === 'pnpm' &&
        args[0] === 'install' &&
        args.includes('--frozen-lockfile')
      ) {
        await mutateRepository();
      }
      return result;
    },
  };
}

async function installFixture(
  t,
  { audit = cleanAudit, failRepositoryStatusAfterInstall = false, transitiveLicense, mutate } = {},
) {
  const root = await testDirectory(t);
  const repositoryRoot = await createRepository(t, root);
  const repositoryLockBefore = await sha256File(join(repositoryRoot, 'pnpm-lock.yaml'));
  const fixture = await createSyntheticCandidate(root, transitiveLicense);
  const owned = await createOwnedRunRoot({ tmpdir: root, runId: 'core-install' });
  const recorder = commandRecorder({
    audit,
    failRepositoryStatusAfterInstall,
    mutateRepository: mutate
      ? () => writeFile(join(repositoryRoot, 'tracked.txt'), 'foreign edit\n')
      : undefined,
  });
  const install = () =>
    installExternalCandidate({
      candidate: fixture.candidate,
      artifacts: fixture.artifacts,
      runRoot: owned.runRoot,
      repositoryRoot,
      runCommand: recorder.runCommand,
    });
  return { root, repositoryRoot, repositoryLockBefore, fixture, owned, recorder, install };
}

test('creates a unique owned child of TMPDIR and removes only that child', async (t) => {
  const root = await testDirectory(t);
  const foreignPath = join(root, 'foreign.txt');
  await writeFile(foreignPath, 'foreign');
  const first = await createOwnedRunRoot({ tmpdir: root, runId: 'core-test-001' });
  const second = await createOwnedRunRoot({ tmpdir: root, runId: 'core-test-001' });
  assert.equal(dirname(first.runRoot), resolve(root));
  assert.notEqual(first.runRoot, second.runRoot);
  await writeFile(join(first.runRoot, 'owned.txt'), 'owned');
  await cleanupOwnedRunRoot({ tmpdir: root, ...first });
  await assert.rejects(stat(first.runRoot), { code: 'ENOENT' });
  assert.equal(await readFile(foreignPath, 'utf8'), 'foreign');
  assert.equal((await stat(second.runRoot)).isDirectory(), true);
});

test('rejects a relative TMPDIR before creating an owned directory', async (t) => {
  const root = await testDirectory(t);
  const contentsBefore = await readdir(root);
  await assert.rejects(
    createOwnedRunRoot({
      tmpdir: relative(process.cwd(), root),
      runId: 'relative-create-root',
    }),
    /TMPDIR must be absolute/u,
  );
  assert.deepEqual(await readdir(root), contentsBefore);
});

test('preserves a replacement when owner-marker creation fails', async (t) => {
  const root = await testDirectory(t);
  const markerFailure = new Error('synthetic owner-marker failure');
  const replacementBytes = Buffer.from('foreign replacement bytes\n');
  let replacementRoot;
  let caught;
  try {
    await createOwnedRunRoot(
      { tmpdir: root, runId: 'marker-failure-replacement' },
      {
        async writeOwnerMarker(markerPath) {
          replacementRoot = dirname(markerPath);
          await rename(replacementRoot, `${replacementRoot}.original`);
          await mkdir(replacementRoot);
          await writeFile(join(replacementRoot, 'foreign.txt'), replacementBytes);
          throw markerFailure;
        },
      },
    );
  } catch (error) {
    caught = error;
  }

  assert.equal(caught, markerFailure);
  assert.deepEqual(await readFile(join(replacementRoot, 'foreign.txt')), replacementBytes);
  assert.deepEqual(await readdir(replacementRoot), ['foreign.txt']);
});

test('rejects a no-op owner-marker writer and removes the original root', async (t) => {
  const root = await testDirectory(t);
  let createdRunRoot;
  let caught;
  try {
    await createOwnedRunRoot(
      { tmpdir: root, runId: 'marker-writer-no-op' },
      {
        async writeOwnerMarker(markerPath) {
          createdRunRoot = dirname(markerPath);
        },
      },
    );
  } catch (error) {
    caught = error;
  }

  assert.equal(caught?.code, 'ENOENT');
  assert.equal(await exists(createdRunRoot), false);
});

test('rejects a successful owner-marker writer that replaces the root', async (t) => {
  const root = await testDirectory(t);
  const replacementBytes = Buffer.from('foreign replacement after successful writer\n');
  let replacementRoot;
  let markerBytes;
  let caught;
  try {
    await createOwnedRunRoot(
      { tmpdir: root, runId: 'marker-success-replacement' },
      {
        async writeOwnerMarker(markerPath, marker, options) {
          replacementRoot = dirname(markerPath);
          markerBytes = Buffer.from(marker);
          await rename(replacementRoot, `${replacementRoot}.original`);
          await mkdir(replacementRoot);
          await writeFile(markerPath, marker, options);
          await writeFile(join(replacementRoot, 'foreign.txt'), replacementBytes);
        },
      },
    );
  } catch (error) {
    caught = error;
  }

  assert.match(caught?.message ?? '', /identity mismatch after owner-marker creation/u);
  assert.deepEqual(await readFile(join(replacementRoot, 'foreign.txt')), replacementBytes);
  assert.deepEqual(await readFile(join(replacementRoot, ownerFile)), markerBytes);
  assert.deepEqual((await readdir(replacementRoot)).sort(), [ownerFile, 'foreign.txt'].sort());
});

test('refuses cleanup after the owned directory is replaced', async (t) => {
  const root = await testDirectory(t);
  const owned = await createOwnedRunRoot({ tmpdir: root, runId: 'core-test-002' });
  await rename(owned.runRoot, `${owned.runRoot}.original`);
  await mkdir(owned.runRoot);
  await writeFile(join(owned.runRoot, ownerFile), JSON.stringify({ ownerToken: 'foreign' }));
  await assert.rejects(cleanupOwnedRunRoot({ tmpdir: root, ...owned }), /ownership mismatch/u);
  assert.equal((await stat(owned.runRoot)).isDirectory(), true);
});

test('refuses cleanup when a replacement copies the original ownership marker', async (t) => {
  const root = await testDirectory(t);
  const owned = await createOwnedRunRoot({ tmpdir: root, runId: 'core-test-003' });
  const marker = await readFile(join(owned.runRoot, ownerFile));
  await rename(owned.runRoot, `${owned.runRoot}.original`);
  await mkdir(owned.runRoot);
  await writeFile(join(owned.runRoot, ownerFile), marker);
  await assert.rejects(cleanupOwnedRunRoot({ tmpdir: root, ...owned }), /identity mismatch/u);
  assert.equal((await stat(owned.runRoot)).isDirectory(), true);
});

test('restores the original run root when post-rename quarantine verification fails', async (t) => {
  const root = await testDirectory(t);
  const owned = await createOwnedRunRoot({ tmpdir: root, runId: 'cleanup-restore' });
  const verificationError = new Error('synthetic quarantine verification failure');
  let quarantinePath;

  await assert.rejects(
    cleanupOwnedRunRoot(
      { tmpdir: root, ...owned },
      {
        async readQuarantinedRoot(path) {
          quarantinePath = path;
          throw verificationError;
        },
      },
    ),
    (error) => {
      assert.equal(error.cause, verificationError);
      assert.match(error.message, new RegExp(owned.runRoot.replaceAll('/', '\\/'), 'u'));
      assert.match(error.message, /quarantine/u);
      assert.match(error.message, /restored/u);
      return true;
    },
  );

  assert.equal((await stat(owned.runRoot)).isDirectory(), true);
  await assert.rejects(stat(quarantinePath), { code: 'ENOENT' });
});

test('preserves uncertain quarantine and foreign original bytes when restoration is unsafe', async (t) => {
  const root = await testDirectory(t);
  const owned = await createOwnedRunRoot({ tmpdir: root, runId: 'cleanup-restore-unsafe' });
  const foreignBytes = Buffer.from('foreign path occupant\n');
  let quarantinePath;

  await assert.rejects(
    cleanupOwnedRunRoot(
      { tmpdir: root, ...owned },
      {
        async readQuarantinedRoot(path) {
          quarantinePath = path;
          await mkdir(owned.runRoot);
          await writeFile(join(owned.runRoot, 'foreign.txt'), foreignBytes);
          throw new Error('synthetic quarantine verification failure');
        },
      },
    ),
    (error) => {
      assert.equal(error instanceof AggregateError, true);
      assert.match(error.message, /restoration failed/u);
      assert.match(error.message, new RegExp(owned.runRoot.replaceAll('/', '\\/'), 'u'));
      assert.match(error.message, new RegExp(quarantinePath.replaceAll('/', '\\/'), 'u'));
      assert.match(error.errors[1].message, /original path.*exists/u);
      return true;
    },
  );

  assert.deepEqual(await readFile(join(owned.runRoot, 'foreign.txt')), foreignBytes);
  assert.equal((await stat(quarantinePath)).isDirectory(), true);
});

test('refuses cleanup outside the exact TMPDIR parent', async (t) => {
  const firstRoot = await testDirectory(t, 'lyra-overlay-parent-a-');
  const secondRoot = await testDirectory(t, 'lyra-overlay-parent-b-');
  const owned = await createOwnedRunRoot({ tmpdir: firstRoot, runId: 'core-test-004' });
  await assert.rejects(
    cleanupOwnedRunRoot({ tmpdir: secondRoot, ...owned }),
    /direct child of TMPDIR/u,
  );
  assert.equal((await stat(owned.runRoot)).isDirectory(), true);
});

for (const field of ['tmpdir', 'runRoot']) {
  test(`rejects a relative cleanup ${field} without removing the owned root`, async (t) => {
    const root = await testDirectory(t);
    const owned = await createOwnedRunRoot({ tmpdir: root, runId: `relative-${field}` });
    const markerBefore = await readFile(join(owned.runRoot, ownerFile));
    const input = {
      tmpdir: root,
      ...owned,
      [field]: relative(process.cwd(), field === 'tmpdir' ? root : owned.runRoot),
    };
    await assert.rejects(cleanupOwnedRunRoot(input), new RegExp(`${field} must be absolute`, 'u'));
    assert.deepEqual(await readFile(join(owned.runRoot, ownerFile)), markerBefore);
  });
}

for (const field of ['runRoot', 'repositoryRoot']) {
  test(`rejects a relative install ${field} before filesystem or command effects`, async (t) => {
    const root = await testDirectory(t);
    const repositoryRoot = await createRepository(t, root);
    const fixture = await createSyntheticCandidate(root);
    const owned = await createOwnedRunRoot({ tmpdir: root, runId: `relative-install-${field}` });
    const runRootBefore = await readdir(owned.runRoot);
    let commandCalls = 0;
    const input = {
      candidate: fixture.candidate,
      artifacts: fixture.artifacts,
      runRoot: owned.runRoot,
      repositoryRoot,
      runCommand: async () => {
        commandCalls += 1;
        throw new Error('command must not run');
      },
      [field]: relative(process.cwd(), field === 'runRoot' ? owned.runRoot : repositoryRoot),
    };
    await assert.rejects(
      installExternalCandidate(input),
      new RegExp(`${field} must be absolute`, 'u'),
    );
    assert.equal(commandCalls, 0);
    assert.deepEqual(await readdir(owned.runRoot), runRootBefore);
  });
}

test('installs exact local tarballs frozen and offline without running lifecycle scripts', async (t) => {
  const setup = await installFixture(t);
  const result = await setup.install();
  const { repositoryRoot, repositoryLockBefore, fixture, recorder } = setup;
  const fixtureRoot = dirname(result.fixtureManifestPath);
  const candidateRoot = dirname(fixtureRoot);
  const storeRoot = join(candidateRoot, 'pnpm-store');

  assert.equal(process.versions.node, requiredNodeVersion);
  assert.equal(
    (await readFile(join(repositoryRoot, '.nvmrc'), 'utf8')).trim(),
    requiredNodeVersion,
  );
  assert.equal(
    JSON.parse(await readFile(join(repositoryRoot, 'package.json'), 'utf8')).packageManager,
    `pnpm@${requiredPnpmVersion}`,
  );

  assert.equal(await exists(fixture.markerPath), false);
  assert.equal(await exists(join(repositoryRoot, 'node_modules', fixture.packageName)), false);
  assert.equal(await sha256File(join(repositoryRoot, 'pnpm-lock.yaml')), repositoryLockBefore);
  assert.equal(
    Buffer.from(
      (
        await runBytes('git', ['status', '--porcelain=v1', '--untracked-files=all'], {
          cwd: repositoryRoot,
        })
      ).stdout,
    ).toString('utf8'),
    '',
  );

  for (const [pathKey, shaKey] of [
    ['fixtureManifestPath', 'fixtureManifestSha256'],
    ['lockfilePath', 'lockfileSha256'],
    ['resolvedGraphPath', 'resolvedGraphSha256'],
    ['auditPath', 'auditSha256'],
    ['licenseInventoryPath', 'licenseInventorySha256'],
  ]) {
    assert.equal(await exists(result[pathKey]), true);
    assert.match(result[shaKey], /^[a-f0-9]{64}$/u);
    assert.equal(await sha256File(result[pathKey]), result[shaKey]);
  }

  const fixtureManifest = JSON.parse(await readFile(result.fixtureManifestPath, 'utf8'));
  assert.equal(fixtureManifest.packageManager, `pnpm@${requiredPnpmVersion}`);
  assert.deepEqual(fixtureManifest.dependencies, {
    [fixture.packageName]: `file:${join(
      candidateRoot,
      'artifacts',
      `${fixture.artifacts[0].sha256}.tgz`,
    )}`,
  });
  const expectedInventory = [
    { name: fixture.packageName, version: '1.0.0', license: 'MIT' },
    { name: fixture.transitiveName, version: fixture.transitiveVersion, license: 'Apache-2.0' },
  ];
  assert.equal(
    await readFile(result.licenseInventoryPath, 'utf8'),
    JSON.stringify(expectedInventory),
  );
  assert.deepEqual(await readFile(result.resolvedGraphPath), recorder.listBytes);
  assert.deepEqual(await readFile(result.auditPath), recorder.auditBytes);

  const pnpmCalls = recorder.calls.filter(({ command }) => command === 'pnpm');
  assert.deepEqual(
    pnpmCalls.map(({ args }) => args),
    [
      ['--version'],
      ['install', '--ignore-workspace', '--ignore-scripts', '--store-dir', storeRoot],
      [
        'install',
        '--frozen-lockfile',
        '--offline',
        '--ignore-workspace',
        '--ignore-scripts',
        '--store-dir',
        storeRoot,
      ],
      ['list', '--json', '--depth', 'Infinity', '--ignore-workspace'],
      ['audit', '--json'],
    ],
  );
  assert.deepEqual(
    pnpmCalls.map(({ options }) => options),
    [
      { cwd: repositoryRoot },
      { cwd: fixtureRoot },
      { cwd: fixtureRoot },
      { cwd: fixtureRoot },
      { cwd: fixtureRoot, allowExitCode: 1 },
    ],
  );

  const gitCalls = recorder.calls.filter(({ command }) => command === 'git');
  assert.equal(gitCalls.length, 2);
  for (const call of gitCalls) {
    assert.deepEqual(call.args, ['status', '--porcelain=v1', '--untracked-files=all']);
    assert.deepEqual(call.options, { cwd: repositoryRoot });
  }
});

test('rejects source artifact bytes replaced after inspection and before candidate copy', async (t) => {
  const setup = await installFixture(t);
  await writeFile(setup.fixture.artifacts[0].path, 'replacement bytes');
  await assert.rejects(setup.install(), /artifact checksum mismatch/u);
});

test('rejects candidate-owned artifact bytes replaced between the two installs', async (t) => {
  const root = await testDirectory(t);
  const repositoryRoot = await createRepository(t, root);
  const fixture = await createSyntheticCandidate(root);
  const owned = await createOwnedRunRoot({ tmpdir: root, runId: 'copy-replacement' });
  const recorder = commandRecorder({ mutateCandidateCopyAfterFirstInstall: true });

  await assert.rejects(
    installExternalCandidate({
      candidate: fixture.candidate,
      artifacts: fixture.artifacts,
      runRoot: owned.runRoot,
      repositoryRoot,
      runCommand: recorder.runCommand,
    }),
    /artifact checksum mismatch/u,
  );
  assert.equal(
    recorder.calls.some(
      ({ command, args }) =>
        command === 'pnpm' && args[0] === 'install' && args.includes('--frozen-lockfile'),
    ),
    false,
  );
});

test('uses distinct candidate-owned stores and artifact copies for overlapping package names', async (t) => {
  const setup = await installFixture(t);
  const first = await setup.install();
  const second = await installExternalCandidate({
    candidate: { id: 'zag' },
    artifacts: setup.fixture.artifacts,
    runRoot: setup.owned.runRoot,
    repositoryRoot: setup.repositoryRoot,
    runCommand: setup.recorder.runCommand,
  });
  const installCalls = setup.recorder.calls.filter(
    ({ command, args }) => command === 'pnpm' && args[0] === 'install',
  );
  const stores = installCalls.map(({ args }) => args[args.indexOf('--store-dir') + 1]);
  assert.equal(new Set(stores).size, 2);

  const firstManifest = JSON.parse(await readFile(first.fixtureManifestPath, 'utf8'));
  const secondManifest = JSON.parse(await readFile(second.fixtureManifestPath, 'utf8'));
  const firstArtifact = Object.values(firstManifest.dependencies)[0].slice('file:'.length);
  const secondArtifact = Object.values(secondManifest.dependencies)[0].slice('file:'.length);
  assert.notEqual(firstArtifact, secondArtifact);
  assert.match(firstArtifact, new RegExp(setup.fixture.artifacts[0].sha256, 'u'));
  assert.match(secondArtifact, new RegExp(setup.fixture.artifacts[0].sha256, 'u'));
});

for (const [label, license, expected] of [
  ['missing', missingLicense, /non-empty SPDX license string/u],
  ['empty', '', /non-empty SPDX license string/u],
  ['invalid SPDX', 'Definitely-Not-SPDX', /valid SPDX license string/u],
]) {
  test(`fails closed when a transitive package has a ${label} license`, async (t) => {
    const setup = await installFixture(t, { transitiveLicense: license });
    await assert.rejects(setup.install(), expected);
  });
}

test('rejects a direct artifact whose inspected license no longer matches its record', async (t) => {
  const root = await testDirectory(t);
  const repositoryRoot = await createRepository(t, root);
  const fixture = await createSyntheticCandidate(root);
  const owned = await createOwnedRunRoot({ tmpdir: root, runId: 'license-mismatch' });
  fixture.artifacts[0].license = 'Apache-2.0';
  await assert.rejects(
    installExternalCandidate({
      candidate: fixture.candidate,
      artifacts: fixture.artifacts,
      runRoot: owned.runRoot,
      repositoryRoot,
      runCommand: commandRecorder().runCommand,
    }),
    /direct artifact license mismatch/u,
  );
});

test('rejects a relative direct artifact path before installation', async (t) => {
  const root = await testDirectory(t);
  const repositoryRoot = await createRepository(t, root);
  const fixture = await createSyntheticCandidate(root);
  const owned = await createOwnedRunRoot({ tmpdir: root, runId: 'relative-artifact' });
  fixture.artifacts[0].path = 'relative-package.tgz';
  const recorder = commandRecorder();
  await assert.rejects(
    installExternalCandidate({
      candidate: fixture.candidate,
      artifacts: fixture.artifacts,
      runRoot: owned.runRoot,
      repositoryRoot,
      runCommand: recorder.runCommand,
    }),
    /artifact path must be absolute/u,
  );
  assert.equal(recorder.calls.length, 0);
});

test('rejects and records malformed audit output', async (t) => {
  const setup = await installFixture(t, { audit: 'not-json' });
  await assert.rejects(setup.install(), /audit output must be valid JSON/u);
  assert.deepEqual(
    await readFile(join(setup.owned.runRoot, 'candidate-radix', 'fixture', 'audit.json')),
    setup.recorder.auditBytes,
  );
});

test('rejects an installed graph whose audit has a high advisory', async (t) => {
  const audit = structuredClone(cleanAudit);
  audit.metadata.vulnerabilities.high = 1;
  const setup = await installFixture(t, { audit });
  await assert.rejects(setup.install(), /high/u);
});

test('exposes only verified installation evidence completed before an audit rejection', async (t) => {
  const audit = structuredClone(cleanAudit);
  audit.metadata.vulnerabilities.high = 1;
  const setup = await installFixture(t, { audit });
  let failure;
  try {
    await setup.install();
  } catch (error) {
    failure = error;
  }

  assert.equal(failure instanceof Error, true);
  assert.match(failure.message, /high/u);
  const partial = readPartialInstallationEvidence(failure);
  assert.deepEqual(Object.keys(partial).sort(), [
    'auditPath',
    'auditSha256',
    'fixtureManifestPath',
    'fixtureManifestSha256',
    'lockfilePath',
    'lockfileSha256',
    'resolvedGraphPath',
    'resolvedGraphSha256',
  ]);
  for (const prefix of ['fixtureManifest', 'lockfile', 'resolvedGraph', 'audit']) {
    assert.equal(await sha256File(partial[`${prefix}Path`]), partial[`${prefix}Sha256`]);
  }
  assert.equal(Object.hasOwn(partial, 'licenseInventoryPath'), false);
  assert.equal(Object.hasOwn(partial, 'licenseInventorySha256'), false);
  assert.equal(readPartialInstallationEvidence(new Error('unrelated')), undefined);
});

test('preserves partial installation evidence on a repository-mutation wrapper', async (t) => {
  const audit = structuredClone(cleanAudit);
  audit.metadata.vulnerabilities.high = 1;
  const setup = await installFixture(t, { audit, mutate: true });
  let failure;
  try {
    await setup.install();
  } catch (error) {
    failure = error;
  }

  assert.equal(failure instanceof Error, true);
  assert.match(failure.message, /repository worktree changed during candidate installation/u);
  assert.match(failure.cause?.message ?? '', /high/u);
  const partial = readPartialInstallationEvidence(failure);
  assert.deepEqual(Object.keys(partial).sort(), [
    'auditPath',
    'auditSha256',
    'fixtureManifestPath',
    'fixtureManifestSha256',
    'lockfilePath',
    'lockfileSha256',
    'resolvedGraphPath',
    'resolvedGraphSha256',
  ]);
});

test('preserves partial installation evidence on a status-verification wrapper', async (t) => {
  const audit = structuredClone(cleanAudit);
  audit.metadata.vulnerabilities.high = 1;
  const setup = await installFixture(t, { audit, failRepositoryStatusAfterInstall: true });
  let failure;
  try {
    await setup.install();
  } catch (error) {
    failure = error;
  }

  assert.equal(failure instanceof Error, true);
  assert.match(failure.message, /status could not be verified after installation/u);
  assert.ok(failure.cause instanceof AggregateError);
  assert.match(failure.cause.errors[0].message, /high/u);
  assert.match(failure.cause.errors[1].message, /injected repository status failure/u);
  assert.deepEqual(Object.keys(readPartialInstallationEvidence(failure)).sort(), [
    'auditPath',
    'auditSha256',
    'fixtureManifestPath',
    'fixtureManifestSha256',
    'lockfilePath',
    'lockfileSha256',
    'resolvedGraphPath',
    'resolvedGraphSha256',
  ]);
});

test('rejects a repository mutation and preserves the foreign edit for diagnosis', async (t) => {
  const setup = await installFixture(t, { mutate: true });
  await assert.rejects(
    setup.install(),
    /repository worktree changed during candidate installation/u,
  );
  assert.equal(await readFile(join(setup.repositoryRoot, 'tracked.txt'), 'utf8'), 'foreign edit\n');
  assert.match(
    Buffer.from(
      (
        await runBytes('git', ['status', '--porcelain=v1', '--untracked-files=all'], {
          cwd: setup.repositoryRoot,
        })
      ).stdout,
    ).toString('utf8'),
    /tracked\.txt/u,
  );
});

for (const severity of ['high', 'critical']) {
  test(`rejects a ${severity} audit advisory`, () => {
    const audit = structuredClone(cleanAudit);
    audit.metadata.vulnerabilities[severity] = 1;
    assert.match(validateAuditReport(audit).join('\n'), new RegExp(severity, 'u'));
  });
}

test('rejects missing vulnerability totals and malformed audit output', () => {
  assert.notDeepEqual(validateAuditReport({}), []);
  assert.notDeepEqual(validateAuditReport('not-json'), []);
  assert.notDeepEqual(
    validateAuditReport({
      metadata: {
        vulnerabilities: { info: 0, low: 0, moderate: 0, high: -1, critical: 0 },
      },
    }),
    [],
  );
  assert.deepEqual(validateAuditReport(cleanAudit), []);
});

for (const [testName, label, repositoryOverrides, reportedPnpm, expected] of [
  [
    'rejects an edited Node pin against the literal required version before pnpm',
    'Node',
    { node: '24.18.1' },
    requiredPnpmVersion,
    /repository Node pin must equal 24\.18\.0/u,
  ],
  [
    'rejects an edited pnpm pin even when the fake executable reports that wrong pin',
    'pnpm',
    { pnpm: '12.0.0' },
    '12.0.0',
    /repository pnpm pin must equal 11\.13\.1/u,
  ],
]) {
  test(testName, async (t) => {
    const root = await testDirectory(t);
    const repositoryRoot = await createRepository(t, root, repositoryOverrides);
    const fixture = await createSyntheticCandidate(root);
    const owned = await createOwnedRunRoot({ tmpdir: root, runId: `edited-${label}-pin` });
    const calls = [];
    await assert.rejects(
      installExternalCandidate({
        candidate: fixture.candidate,
        artifacts: fixture.artifacts,
        runRoot: owned.runRoot,
        repositoryRoot,
        runCommand: async (command, args) => {
          calls.push({ command, args: [...args] });
          if (command === 'git') return { stdout: Buffer.alloc(0) };
          if (command === 'pnpm' && args[0] === '--version') {
            return { stdout: Buffer.from(`${reportedPnpm}\n`) };
          }
          throw new Error('installation must not continue past an edited toolchain pin');
        },
      }),
      expected,
    );
    assert.equal(
      calls.some(({ command }) => command === 'pnpm'),
      false,
    );
  });
}

for (const [label, repositoryOverrides, recorderOptions, expected] of [
  ['Node', { node: '0.0.0' }, {}, /repository Node pin must equal 24\.18\.0/u],
  ['pnpm', {}, { pnpmVersionOutput: '0.0.0\n' }, /pnpm version mismatch: expected 11\.13\.1/u],
]) {
  test(`rejects an inexact ${label} toolchain before installation`, async (t) => {
    const root = await testDirectory(t);
    const repositoryRoot = await createRepository(t, root, repositoryOverrides);
    const fixture = await createSyntheticCandidate(root);
    const owned = await createOwnedRunRoot({ tmpdir: root, runId: `wrong-${label}` });
    const recorder = commandRecorder(recorderOptions);
    await assert.rejects(
      installExternalCandidate({
        candidate: fixture.candidate,
        artifacts: fixture.artifacts,
        runRoot: owned.runRoot,
        repositoryRoot,
        runCommand: recorder.runCommand,
      }),
      expected,
    );
    assert.equal(
      recorder.calls.some(({ command, args }) => command === 'pnpm' && args[0] === 'install'),
      false,
    );
  });
}
