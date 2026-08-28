import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import * as compatibility from './file-upload.mjs';

const { findPackedArtifacts, REACT_COMPATIBILITY_MATRIX, runCommand, runFileUploadCompatibility } =
  compatibility;

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));

async function withArtifactDirectory(entries, callback) {
  const directory = await mkdtemp(join(tmpdir(), 'lyra-react-compat-artifact-test-'));
  try {
    await Promise.all(entries.map((entry) => writeFile(join(directory, entry), 'artifact')));
    await callback(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

async function withTemporaryDirectory(prefix, callback) {
  const directory = await mkdtemp(join(tmpdir(), prefix));
  try {
    await callback(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

async function createPackageTarball(directory, filename, packageName) {
  const source = join(directory, `${filename}-source`, 'package');
  await mkdir(source, { recursive: true });
  await writeFile(join(source, 'package.json'), `${JSON.stringify({ name: packageName })}\n`);
  const tarball = join(directory, filename);
  runCommand('tar', ['-czf', tarball, '-C', join(source, '..'), 'package'], { cwd: directory });
  return tarball;
}

function installPackedArtifacts(...args) {
  assert.equal(
    typeof compatibility.installPackedArtifacts,
    'function',
    'the harness must expose direct packed-artifact installation',
  );
  return compatibility.installPackedArtifacts(...args);
}

function optionValue(args, option) {
  const optionIndex = args.indexOf(option);
  assert.notEqual(optionIndex, -1, `missing ${option}`);
  return args[optionIndex + 1];
}

function collectStringValues(value, values = []) {
  if (typeof value === 'string') {
    values.push(value);
  } else if (Array.isArray(value)) {
    for (const entry of value) collectStringValues(entry, values);
  } else if (value !== null && typeof value === 'object') {
    for (const [key, entry] of Object.entries(value)) {
      values.push(key);
      collectStringValues(entry, values);
    }
  }
  return values;
}

function hasLocalProtocol(values) {
  for (const value of values) {
    for (const protocol of ['workspace:', 'link:', 'file:']) {
      if (value.startsWith(protocol)) return true;
    }
  }
  return false;
}

test('local lock protocol detection rejects unrelated file tarballs', () => {
  assert.equal(hasLocalProtocol(['file:/tmp/unrelated.tgz']), true);
});

test('compatibility matrix names React 18 and 19 and every required layer', () => {
  assert.deepEqual(
    REACT_COMPATIBILITY_MATRIX.map(({ react, checks }) => ({ react, checks })),
    [
      { react: '18.3.1', checks: ['types', 'build', 'ssr', 'hydration', 'browser'] },
      { react: '19.2.8', checks: ['types', 'build', 'ssr', 'hydration', 'browser'] },
    ],
  );
});

test('packs once, resolves each frozen external graph once, then directly installs exact tarballs', async () => {
  const events = [];
  let tempSequence = 0;
  const runtime = {
    repoRoot,
    makeTemp(prefix) {
      const path = `/tmp/${prefix}${++tempSequence}`;
      events.push(['temp', path]);
      return path;
    },
    copyFixture(candidate, destination) {
      events.push(['copy', candidate.directory, destination]);
    },
    writeScaffolding(destination) {
      events.push(['scaffold', destination]);
    },
    findTarballs() {
      return { react: '/tmp/react.tgz', styles: '/tmp/styles.tgz' };
    },
    installPackedArtifacts(destination, tarballs) {
      events.push(['install-packed', destination, tarballs]);
    },
    run(command, args, options) {
      if (args[0] === 'add') throw new Error('ERR_PNPM_NO_OFFLINE_META');
      events.push(['run', command, args, options]);
      return { stdout: '', stderr: '' };
    },
    remove(path) {
      events.push(['remove', path]);
    },
  };

  await runFileUploadCompatibility({ runtime: runtime });

  const commands = events.filter(([event]) => event === 'run');
  assert.equal(
    commands.filter(([, , args]) => args.includes('pack')).length,
    2,
    'each package must be packed once for the whole matrix',
  );
  assert.equal(
    commands.filter(([, , args]) => args.includes('build')).length,
    3,
    'the package build runs once and each consumer production build runs once',
  );

  const candidateCopies = events.filter(([event]) => event === 'copy');
  assert.equal(candidateCopies.length, 2);
  const stores = events
    .filter(([event, path]) => event === 'temp' && path.includes('store'))
    .map(([, path]) => path);
  assert.equal(stores.length, 2);
  assert.equal(new Set(stores).size, 2);

  for (const [candidateIndex, [, directory, destination]] of candidateCopies.entries()) {
    const candidateCommands = commands.filter(([, , , options]) => options.cwd === destination);
    const frozenCommands = candidateCommands.filter(([, , args]) =>
      args.includes('--frozen-lockfile'),
    );
    assert.equal(frozenCommands.length, 1, `${directory} must resolve its external graph once`);
    const frozenArgs = frozenCommands[0][2];
    assert.equal(frozenArgs[0], 'install');
    assert.ok(frozenArgs.includes('--ignore-workspace'));
    const candidateStore = optionValue(frozenArgs, '--store-dir');
    assert.equal(candidateStore, stores[candidateIndex]);
    assert.equal(
      candidateCommands.some(([, , args]) => args[0] === 'add'),
      false,
    );
    assert.equal(
      candidateCommands.some(([, , args]) => args.some((argument) => argument.endsWith('.tgz'))),
      false,
    );

    const frozenEventIndex = events.findIndex(
      ([event, , args, options]) =>
        event === 'run' && options.cwd === destination && args.includes('--frozen-lockfile'),
    );
    const directInstallIndex = events.findIndex(
      ([event, candidateRoot]) => event === 'install-packed' && candidateRoot === destination,
    );
    assert.ok(
      directInstallIndex > frozenEventIndex,
      `${directory} must directly install packed Lyra artifacts after external dependencies`,
    );
    assert.deepEqual(events[directInstallIndex], [
      'install-packed',
      destination,
      { react: '/tmp/react.tgz', styles: '/tmp/styles.tgz' },
    ]);
    assert.deepEqual(
      candidateCommands.filter(([, , args]) => args[0] === 'exec').map(([, , args]) => args[1]),
      ['tsc', 'vite', 'vitest', 'vitest', 'vitest'],
    );
  }
});

test('direct installation extracts exact scoped packages without mutating the frozen lockfile', async () => {
  await withTemporaryDirectory('lyra-react-compat-install-test-', async (directory) => {
    const fixture = join(directory, 'fixture');
    await mkdir(fixture, { recursive: true });
    const lockfile = join(fixture, 'pnpm-lock.yaml');
    await writeFile(lockfile, 'frozen-lockfile\n');
    const tarballs = {
      react: await createPackageTarball(directory, 'lyra-ds-react-0.4.2.tgz', '@lyra-ds/react'),
      styles: await createPackageTarball(directory, 'lyra-ds-styles-0.4.2.tgz', '@lyra-ds/styles'),
    };

    installPackedArtifacts(fixture, tarballs);

    assert.equal(
      JSON.parse(await readFile(join(fixture, 'node_modules/@lyra-ds/react/package.json'))).name,
      '@lyra-ds/react',
    );
    assert.equal(
      JSON.parse(await readFile(join(fixture, 'node_modules/@lyra-ds/styles/package.json'))).name,
      '@lyra-ds/styles',
    );
    assert.equal(await readFile(lockfile, 'utf8'), 'frozen-lockfile\n');
  });
});

test('direct installation rejects a tarball whose contained package name is wrong', async () => {
  await withTemporaryDirectory('lyra-react-compat-name-test-', async (directory) => {
    const fixture = join(directory, 'fixture');
    await mkdir(fixture, { recursive: true });
    const tarballs = {
      react: await createPackageTarball(directory, 'lyra-ds-react-0.4.2.tgz', '@lyra-ds/not-react'),
      styles: await createPackageTarball(directory, 'lyra-ds-styles-0.4.2.tgz', '@lyra-ds/styles'),
    };

    assert.throws(
      () => installPackedArtifacts(fixture, tarballs),
      /react tarball contains @lyra-ds\/not-react, expected @lyra-ds\/react/,
    );
  });
});

test('failed child commands report command, cwd, stdout, and stderr', () => {
  assert.throws(
    () =>
      runCommand('pnpm', ['exec', 'failing-check'], {
        cwd: '/tmp/react-compat-fixture',
        spawn() {
          return { status: 7, stdout: 'consumer stdout', stderr: 'consumer stderr' };
        },
      }),
    (error) => {
      assert.match(error.message, /pnpm exec failing-check/);
      assert.match(error.message, /\/tmp\/react-compat-fixture/);
      assert.match(error.message, /consumer stdout/);
      assert.match(error.message, /consumer stderr/);
      return true;
    },
  );
});

test('child process errors retain partial stdout and stderr diagnostics', () => {
  assert.throws(
    () =>
      runCommand('pnpm', ['exec', 'overflowing-check'], {
        cwd: '/tmp/react-compat-overflow',
        spawn() {
          return {
            error: new Error('spawnSync pnpm ENOBUFS'),
            status: null,
            stdout: 'partial stdout',
            stderr: 'partial stderr',
          };
        },
      }),
    (error) => {
      assert.match(error.message, /pnpm exec overflowing-check/);
      assert.match(error.message, /\/tmp\/react-compat-overflow/);
      assert.match(error.message, /partial stdout/);
      assert.match(error.message, /partial stderr/);
      assert.match(error.message, /ENOBUFS/);
      return true;
    },
  );
});

test('packed artifact discovery requires the exact manifest-derived tarball set', async (context) => {
  const reactManifest = JSON.parse(
    await readFile(join(repoRoot, 'packages/react/package.json'), 'utf8'),
  );
  const stylesManifest = JSON.parse(
    await readFile(join(repoRoot, 'packages/styles/package.json'), 'utf8'),
  );
  const expected = [
    `lyra-ds-react-${reactManifest.version}.tgz`,
    `lyra-ds-styles-${stylesManifest.version}.tgz`,
  ];

  await context.test('accepts both expected artifacts', async () => {
    await withArtifactDirectory(expected, async (directory) => {
      const artifacts = findPackedArtifacts(directory, repoRoot);
      assert.deepEqual(
        [basename(artifacts.react), basename(artifacts.styles)].sort(),
        expected.toSorted(),
      );
    });
  });

  await context.test('rejects an extra tarball', async () => {
    await withArtifactDirectory([...expected, 'unexpected-1.0.0.tgz'], async (directory) => {
      assert.throws(
        () => findPackedArtifacts(directory, repoRoot),
        /exactly these packed artifacts/,
      );
    });
  });

  await context.test('rejects a missing tarball', async () => {
    await withArtifactDirectory([expected[0]], async (directory) => {
      assert.throws(
        () => findPackedArtifacts(directory, repoRoot),
        /exactly these packed artifacts/,
      );
    });
  });

  await context.test('rejects a wrong package version', async () => {
    await withArtifactDirectory([expected[0], 'lyra-ds-styles-999.0.0.tgz'], async (directory) => {
      assert.throws(
        () => findPackedArtifacts(directory, repoRoot),
        /exactly these packed artifacts/,
      );
    });
  });
});

test('fixtures freeze the exact external React 18 and React 19 dependency graphs', async (context) => {
  const fixtures = [
    {
      directory: 'react18',
      packageManager: 'pnpm@11.13.1',
      dependencies: {
        'lucide-react': '1.30.0',
        react: '18.3.1',
        'react-dom': '18.3.1',
      },
      devDependencies: {
        '@types/react': '18.3.31',
        '@types/react-dom': '18.3.7',
        '@vitest/browser-playwright': '4.1.10',
        playwright: '1.62.1',
        typescript: '5.9.3',
        vite: '8.2.1',
        vitest: '4.1.10',
      },
    },
    {
      directory: 'react19',
      packageManager: 'pnpm@11.13.1',
      dependencies: {
        'lucide-react': '1.30.0',
        react: '19.2.8',
        'react-dom': '19.2.8',
      },
      devDependencies: {
        '@types/react': '19.2.18',
        '@types/react-dom': '19.2.4',
        '@vitest/browser-playwright': '4.1.10',
        playwright: '1.62.1',
        typescript: '5.9.3',
        vite: '8.2.1',
        vitest: '4.1.10',
      },
    },
  ];

  for (const expected of fixtures) {
    await context.test(expected.directory, async () => {
      const fixtureRoot = join(repoRoot, 'tools/react-compat/fixtures', expected.directory);
      const manifest = JSON.parse(await readFile(join(fixtureRoot, 'package.json'), 'utf8'));
      const lockfile = parse(await readFile(join(fixtureRoot, 'pnpm-lock.yaml'), 'utf8'));
      assert.equal(manifest.packageManager, expected.packageManager);
      assert.deepEqual(manifest.dependencies, expected.dependencies);
      assert.deepEqual(manifest.devDependencies, expected.devDependencies);

      const importer = lockfile.importers['.'];
      for (const [name, version] of Object.entries({
        ...expected.dependencies,
        ...expected.devDependencies,
      })) {
        const dependency = importer.dependencies?.[name] ?? importer.devDependencies?.[name];
        assert.equal(dependency?.specifier, version, `${expected.directory} lockfile: ${name}`);
      }

      const lockValues = collectStringValues(lockfile);
      assert.equal(hasLocalProtocol(lockValues), false);
    });
  }
});

test('removes candidate roots, stores, and packed artifacts when a check fails', async () => {
  const removed = [];
  let tempSequence = 0;
  const runtime = {
    repoRoot,
    makeTemp(prefix) {
      return `/tmp/${prefix}${++tempSequence}`;
    },
    copyFixture() {},
    writeScaffolding() {},
    findTarballs() {
      return { react: '/tmp/react.tgz', styles: '/tmp/styles.tgz' };
    },
    installPackedArtifacts() {},
    run(_command, args) {
      if (args.includes('tsc')) throw new Error('typecheck failed');
      return { stdout: '', stderr: '' };
    },
    remove(path) {
      removed.push(path);
    },
  };

  await assert.rejects(() => runFileUploadCompatibility({ runtime }), /typecheck failed/);
  assert.deepEqual(removed, [
    '/tmp/lyra-react-compat-store-3',
    '/tmp/lyra-react-compat-react18-2',
    '/tmp/lyra-react-compat-artifacts-1',
  ]);
});

test('removes candidate roots, stores, and packed artifacts when direct extraction fails', async () => {
  const removed = [];
  let tempSequence = 0;
  const runtime = {
    repoRoot,
    makeTemp(prefix) {
      return `/tmp/${prefix}${++tempSequence}`;
    },
    copyFixture() {},
    writeScaffolding() {},
    findTarballs() {
      return { react: '/tmp/react.tgz', styles: '/tmp/styles.tgz' };
    },
    installPackedArtifacts() {
      throw new Error('react tarball contains @lyra-ds/not-react, expected @lyra-ds/react');
    },
    run() {
      return { stdout: '', stderr: '' };
    },
    remove(path) {
      removed.push(path);
    },
  };

  await assert.rejects(
    () => runFileUploadCompatibility({ runtime }),
    /react tarball contains @lyra-ds\/not-react, expected @lyra-ds\/react/,
  );
  assert.deepEqual(removed, [
    '/tmp/lyra-react-compat-store-3',
    '/tmp/lyra-react-compat-react18-2',
    '/tmp/lyra-react-compat-artifacts-1',
  ]);
});

test('removes the candidate root when allocating its isolated store fails', async () => {
  const removed = [];
  let tempSequence = 0;
  const runtime = {
    repoRoot,
    makeTemp(prefix) {
      tempSequence += 1;
      if (tempSequence === 3) throw new Error('store allocation failed');
      return `/tmp/${prefix}${tempSequence}`;
    },
    copyFixture() {},
    writeScaffolding() {},
    findTarballs() {
      return { react: '/tmp/react.tgz', styles: '/tmp/styles.tgz' };
    },
    installPackedArtifacts() {},
    run() {
      return { stdout: '', stderr: '' };
    },
    remove(path) {
      removed.push(path);
    },
  };

  await assert.rejects(() => runFileUploadCompatibility({ runtime }), /store allocation failed/);
  assert.deepEqual(removed, [
    '/tmp/lyra-react-compat-react18-2',
    '/tmp/lyra-react-compat-artifacts-1',
  ]);
});

test('CI preserves frozen job names and actionlint while running compatibility after browsers', async () => {
  const workflow = parse(await readFile(`${repoRoot}/.github/workflows/ci.yml`, 'utf8'));
  assert.deepEqual(Object.keys(workflow.jobs), ['lint', 'typecheck', 'test', 'build']);
  assert.deepEqual(workflow.permissions, { contents: 'read' });
  const actionlint = workflow.jobs.lint.steps.find(({ name }) => name?.startsWith('actionlint'));
  assert.ok(actionlint, 'the checksum-verified actionlint step must remain in lint');
  assert.match(actionlint.run, /releases\/download\/v1\.7\.12\/actionlint_1\.7\.12_linux_amd64/);
  assert.match(actionlint.run, /8aca8db96f1b94770f1b0d72b6dddcb1ebb8123cb3712530b08cc387b349a3d8/);
  assert.match(actionlint.run, /sha256sum -c -/);
  assert.match(actionlint.run, /\.\/actionlint -color/);

  const testCommands = workflow.jobs.test.steps.flatMap(({ run }) => (run ? [run] : []));
  const browserIndex = testCommands.indexOf('pnpm run test:browsers');
  const compatibilityIndex = testCommands.indexOf('pnpm run test:react-compat');
  assert.ok(browserIndex >= 0);
  assert.ok(compatibilityIndex > browserIndex);
});
