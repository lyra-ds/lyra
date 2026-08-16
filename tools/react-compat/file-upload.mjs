#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import {
  cpSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REQUIRED_CHECKS = Object.freeze(['types', 'build', 'ssr', 'hydration', 'browser']);

export const REACT_COMPATIBILITY_MATRIX = Object.freeze([
  Object.freeze({ directory: 'react18', react: '18.3.1', checks: REQUIRED_CHECKS }),
  Object.freeze({ directory: 'react19', react: '19.2.8', checks: REQUIRED_CHECKS }),
]);

const defaultRepoRoot = fileURLToPath(new URL('../..', import.meta.url));

function formatCommand(command, args) {
  return [command, ...args].join(' ');
}

function formatCommandFailure(command, args, cwd, result, summary) {
  return (
    `${summary}: ${formatCommand(command, args)}\n` +
    `cwd: ${cwd}\nstdout:\n${result.stdout ?? ''}\nstderr:\n${result.stderr ?? ''}`
  );
}

export function runCommand(command, args, { cwd, env = process.env, spawn = spawnSync }) {
  const result = spawn(command, args, { cwd, env, encoding: 'utf8' });
  if (result.error) {
    throw new Error(
      formatCommandFailure(
        command,
        args,
        cwd,
        result,
        `Command failed to start (${result.error.message})`,
      ),
    );
  }
  if (result.status !== 0) {
    throw new Error(
      formatCommandFailure(command, args, cwd, result, `Command failed (${result.status})`),
    );
  }
  return { stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

function copyDirectoryContents(source, destination) {
  mkdirSync(destination, { recursive: true });
  for (const entry of readdirSync(source)) {
    cpSync(join(source, entry), join(destination, entry), { recursive: true });
  }
}

function writeScaffolding(destination) {
  writeFileSync(
    join(destination, 'tsconfig.json'),
    `${JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          useDefineForClassFields: true,
          lib: ['ES2022', 'DOM', 'DOM.Iterable'],
          allowJs: false,
          skipLibCheck: false,
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          strict: true,
          forceConsistentCasingInFileNames: true,
          module: 'ESNext',
          moduleResolution: 'Bundler',
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: 'react-jsx',
        },
        include: ['src'],
      },
      null,
      2,
    )}\n`,
  );
  writeFileSync(
    join(destination, 'index.html'),
    '<!doctype html><html><body><div id="root"></div><script type="module" src="/src/entry.tsx"></script></body></html>\n',
  );
  writeFileSync(
    join(destination, 'vitest.config.mjs'),
    `import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    browser: {
      provider: playwright(),
      headless: true,
      instances: [{ browser: 'chromium' }],
    },
  },
});
`,
  );
}

function expectedTarball(repoRoot, packageDirectory) {
  const manifest = JSON.parse(
    readFileSync(join(repoRoot, 'packages', packageDirectory, 'package.json'), 'utf8'),
  );
  const packageName = manifest.name.replace(/^@/, '').replaceAll('/', '-');
  return `${packageName}-${manifest.version}.tgz`;
}

export function findPackedArtifacts(packDirectory, repoRoot = defaultRepoRoot) {
  const expected = {
    react: expectedTarball(repoRoot, 'react'),
    styles: expectedTarball(repoRoot, 'styles'),
  };
  const expectedEntries = Object.values(expected).toSorted();
  const actualEntries = readdirSync(packDirectory)
    .filter((entry) => entry.endsWith('.tgz'))
    .toSorted();
  if (
    actualEntries.length !== expectedEntries.length ||
    !actualEntries.every((entry, index) => entry === expectedEntries[index])
  ) {
    throw new Error(
      `Expected exactly these packed artifacts in ${packDirectory}: ${expectedEntries.join(', ')}; ` +
        `received: ${actualEntries.join(', ') || '(none)'}`,
    );
  }
  return {
    react: join(packDirectory, expected.react),
    styles: join(packDirectory, expected.styles),
  };
}

function createRuntime(repoRoot = defaultRepoRoot) {
  const fixtureRoot = join(repoRoot, 'tools', 'react-compat', 'fixtures');
  return {
    repoRoot,
    makeTemp(prefix) {
      return mkdtempSync(join(tmpdir(), prefix));
    },
    copyFixture(candidate, destination) {
      copyDirectoryContents(join(fixtureRoot, candidate.directory), destination);
      copyDirectoryContents(join(fixtureRoot, 'shared'), join(destination, 'src'));
    },
    writeScaffolding,
    findTarballs(packDirectory) {
      return findPackedArtifacts(packDirectory, repoRoot);
    },
    run: runCommand,
    remove(path) {
      rmSync(path, { recursive: true, force: true });
    },
  };
}

const CHECK_COMMANDS = {
  types: ['exec', 'tsc', '--noEmit', '--pretty', 'false'],
  build: ['exec', 'vite', 'build'],
  ssr: ['exec', 'vitest', 'run', 'src/file-upload.ssr.test.tsx', '--environment=node'],
  hydration: [
    'exec',
    'vitest',
    'run',
    'src/file-upload.browser.test.tsx',
    '--browser.enabled',
    '--testNamePattern=hydrates',
  ],
  browser: [
    'exec',
    'vitest',
    'run',
    'src/file-upload.browser.test.tsx',
    '--browser.enabled',
    '--testNamePattern=emits a cancel intent',
  ],
};

function runCandidate(candidate, tarballs, runtime) {
  const candidateRoot = runtime.makeTemp(`lyra-react-compat-${candidate.directory}-`);
  let storeRoot;
  try {
    storeRoot = runtime.makeTemp('lyra-react-compat-store-');
    runtime.copyFixture(candidate, candidateRoot);
    runtime.writeScaffolding(candidateRoot);
    const commandOptions = { cwd: candidateRoot };
    runtime.run(
      'pnpm',
      ['install', '--frozen-lockfile', '--ignore-workspace', '--store-dir', storeRoot],
      commandOptions,
    );
    runtime.run(
      'pnpm',
      [
        'add',
        '--offline',
        '--ignore-workspace',
        '--save-exact',
        '--store-dir',
        storeRoot,
        tarballs.react,
        tarballs.styles,
      ],
      commandOptions,
    );

    for (const check of candidate.checks) {
      const args = CHECK_COMMANDS[check];
      if (args === undefined) throw new Error(`Unknown React compatibility check: ${check}`);
      runtime.run('pnpm', args, commandOptions);
      console.log(`React ${candidate.react}: ${check} passed`);
    }
  } finally {
    if (storeRoot !== undefined) runtime.remove(storeRoot);
    runtime.remove(candidateRoot);
  }
}

export async function runFileUploadCompatibility({
  matrix = REACT_COMPATIBILITY_MATRIX,
  runtime = createRuntime(),
} = {}) {
  const artifactRoot = runtime.makeTemp('lyra-react-compat-artifacts-');
  try {
    runtime.run('pnpm', ['--filter', '@lyra-ds/react', 'run', 'build'], { cwd: runtime.repoRoot });
    runtime.run(
      'pnpm',
      [
        '--dir',
        join(runtime.repoRoot, 'packages', 'react'),
        'pack',
        '--pack-destination',
        artifactRoot,
      ],
      { cwd: runtime.repoRoot },
    );
    runtime.run(
      'pnpm',
      [
        '--dir',
        join(runtime.repoRoot, 'packages', 'styles'),
        'pack',
        '--pack-destination',
        artifactRoot,
      ],
      { cwd: runtime.repoRoot },
    );
    const tarballs = runtime.findTarballs(artifactRoot);

    for (const candidate of matrix) runCandidate(candidate, tarballs, runtime);
  } finally {
    runtime.remove(artifactRoot);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runFileUploadCompatibility().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
