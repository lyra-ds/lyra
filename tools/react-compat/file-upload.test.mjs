import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import {
  REACT_COMPATIBILITY_MATRIX,
  runCommand,
  runFileUploadCompatibility,
} from './file-upload.mjs';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));

test('compatibility matrix names React 18 and 19 and every required layer', () => {
  assert.deepEqual(
    REACT_COMPATIBILITY_MATRIX.map(({ react, checks }) => ({ react, checks })),
    [
      { react: '18.3.1', checks: ['types', 'build', 'ssr', 'hydration', 'browser'] },
      { react: '19.2.8', checks: ['types', 'build', 'ssr', 'hydration', 'browser'] },
    ],
  );
});

test('packs once, installs each frozen external graph before exact tarballs, and uses unique stores', async () => {
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
    run(command, args, options) {
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

  for (const [, directory, destination] of candidateCopies) {
    const candidateCommands = commands.filter(([, , , options]) => options.cwd === destination);
    const frozenIndex = candidateCommands.findIndex(([, , args]) =>
      args.includes('--frozen-lockfile'),
    );
    const tarballIndex = candidateCommands.findIndex(([, , args]) =>
      args.some((argument) => argument.endsWith('.tgz')),
    );
    assert.notEqual(frozenIndex, -1, `${directory} must install its frozen external graph`);
    assert.ok(
      tarballIndex > frozenIndex,
      `${directory} must install packed Lyra artifacts only after external dependencies`,
    );
    const tarballArgs = candidateCommands[tarballIndex][2];
    assert.ok(tarballArgs.includes('--ignore-workspace'));
    assert.ok(tarballArgs.includes('--save-exact'));
    assert.deepEqual(
      candidateCommands.filter(([, , args]) => args[0] === 'exec').map(([, , args]) => args[1]),
      ['tsc', 'vite', 'vitest', 'vitest', 'vitest'],
    );
  }
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
  assert.ok(
    workflow.jobs.lint.steps.some(({ name }) => name?.startsWith('actionlint')),
    'the checksum-verified actionlint step must remain in lint',
  );

  const testCommands = workflow.jobs.test.steps.flatMap(({ run }) => (run ? [run] : []));
  const browserIndex = testCommands.indexOf('pnpm run test:browsers');
  const compatibilityIndex = testCommands.indexOf('pnpm run test:react-compat');
  assert.ok(browserIndex >= 0);
  assert.ok(compatibilityIndex > browserIndex);
});
