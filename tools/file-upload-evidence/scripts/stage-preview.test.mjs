import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { join, parse, relative, resolve, sep } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { stagePreview } from './stage-preview.mjs';

const revision = '1234567890abcdef1234567890abcdef12345678';
const temporaryRoots = [];
const repositoryRoot = resolve(import.meta.dirname, '../../..');
const wranglerExecutable = resolve(repositoryRoot, 'node_modules/.bin/wrangler');

async function fixture() {
  const workspaceRoot = await mkdtemp(join(tmpdir(), 'lyra-stage-preview-test-'));
  temporaryRoots.push(workspaceRoot);

  const docsOutputRoot = join(workspaceRoot, 'apps/docs/out');
  const packageRoot = join(workspaceRoot, 'tools/file-upload-evidence');
  const harnessDistRoot = join(packageRoot, 'dist');
  await mkdir(join(docsOutputRoot, 'existing'), { recursive: true });
  await mkdir(join(harnessDistRoot, 'en/file-upload-evidence'), { recursive: true });
  await mkdir(join(harnessDistRoot, 'pt-BR/file-upload-evidence'), { recursive: true });
  await mkdir(join(harnessDistRoot, 'assets'), { recursive: true });
  await mkdir(join(packageRoot, 'src'), { recursive: true });
  await writeFile(join(docsOutputRoot, 'existing/sentinel.txt'), 'keep me');
  await writeFile(
    join(packageRoot, 'package.json'),
    JSON.stringify({ name: '@lyra-ds/file-upload-evidence', private: true, type: 'module' }),
  );
  await writeFile(
    join(packageRoot, 'src/endpoint.ts'),
    'export async function handleEvidenceRequest(request: Request, environment: { revision: string }): Promise<Response> { return new Response(`${request.method}:${environment.revision}`); }\n',
  );
  await writeFile(join(harnessDistRoot, 'en/file-upload-evidence/index.html'), '<html lang="en">');
  await writeFile(
    join(harnessDistRoot, 'pt-BR/file-upload-evidence/index.html'),
    '<html lang="pt-BR">',
  );
  await writeFile(join(harnessDistRoot, 'assets/evidence-app-12345678.js'), 'export {};');

  return { docsOutputRoot, harnessDistRoot, workspaceRoot };
}

async function filesUnder(root) {
  const files = [];
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await visit(path);
      else files.push(relative(root, path).split(sep).join('/'));
    }
  }
  await visit(root);
  return files.sort();
}

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map(async (root) => {
      expect(root.startsWith(`${resolve(tmpdir())}${sep}`)).toBe(true);
      await rm(root, { force: true, recursive: true });
    }),
  );
});

describe('stagePreview', () => {
  it('preserves Docs output, copies both routes, and stages only the adapter and endpoint bundle', async () => {
    const options = await fixture();
    let stagingRoot;

    await stagePreview({ ...options, revision }, async ({ wranglerCwd }) => {
      stagingRoot = wranglerCwd;
      expect(await filesUnder(wranglerCwd)).toEqual([
        'functions/_shared/file-upload-evidence-endpoint.js',
        'functions/api/file-upload-evidence.ts',
      ]);

      const adapter = await readFile(
        join(wranglerCwd, 'functions/api/file-upload-evidence.ts'),
        'utf8',
      );
      const endpoint = await readFile(
        join(wranglerCwd, 'functions/_shared/file-upload-evidence-endpoint.js'),
        'utf8',
      );
      expect(adapter).toContain(`revision: '${revision}'`);
      expect(adapter).toContain('handleEvidenceRequest(context.request');
      expect(adapter).toContain('randomUUID: () => crypto.randomUUID()');
      expect(adapter).toContain('new Promise((resolve) => setTimeout(resolve, milliseconds))');
      expect(`${adapter}\n${endpoint}`).not.toMatch(
        /secret|\bKV\b|\bR2\b|\bD1\b|console\.|Access-Control-Allow-Origin/iu,
      );

      const compilation = spawnSync(
        wranglerExecutable,
        ['pages', 'functions', 'build', 'functions', '--outdir=compiled'],
        { cwd: wranglerCwd, encoding: 'utf8' },
      );
      expect(compilation.status, `${compilation.stdout}\n${compilation.stderr}`).toBe(0);
    });

    expect(await readFile(join(options.docsOutputRoot, 'existing/sentinel.txt'), 'utf8')).toBe(
      'keep me',
    );
    expect(
      await readFile(join(options.docsOutputRoot, 'en/file-upload-evidence/index.html'), 'utf8'),
    ).toContain('lang="en"');
    expect(
      await readFile(join(options.docsOutputRoot, 'pt-BR/file-upload-evidence/index.html'), 'utf8'),
    ).toContain('lang="pt-BR"');
    await expect(readdir(stagingRoot)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('refuses a destination outside the workspace Docs output', async () => {
    const options = await fixture();
    const outside = await mkdtemp(join(tmpdir(), 'lyra-stage-preview-outside-'));
    temporaryRoots.push(outside);

    await expect(
      stagePreview({ ...options, docsOutputRoot: outside, revision }, async () => undefined),
    ).rejects.toThrow('docsOutputRoot must resolve to apps/docs/out inside workspaceRoot');
    expect(await readFile(join(options.docsOutputRoot, 'existing/sentinel.txt'), 'utf8')).toBe(
      'keep me',
    );
  });

  it('refuses an incomplete revision before changing Docs output', async () => {
    const options = await fixture();

    await expect(
      stagePreview({ ...options, revision: revision.slice(1) }, async () => undefined),
    ).rejects.toThrow('revision must be a full 40-character lowercase Git SHA');
    expect(await filesUnder(options.docsOutputRoot)).toEqual(['existing/sentinel.txt']);
  });

  it.each([
    ['the filesystem root', parse(resolve(tmpdir())).root],
    ['the home directory', resolve(homedir())],
  ])('refuses %s as the workspace root', async (_name, workspaceRoot) => {
    await expect(
      stagePreview(
        {
          docsOutputRoot: workspaceRoot,
          harnessDistRoot: workspaceRoot,
          revision,
          workspaceRoot,
        },
        async () => undefined,
      ),
    ).rejects.toThrow('workspaceRoot must not be the filesystem root or home directory');
  });

  it('refuses a missing Docs output root', async () => {
    const options = await fixture();
    await rm(options.docsOutputRoot, { recursive: true });

    await expect(stagePreview({ ...options, revision }, async () => undefined)).rejects.toThrow(
      'docsOutputRoot must exist and resolve to a directory',
    );
  });

  it('refuses a Docs output path that is not a directory', async () => {
    const options = await fixture();
    await rm(options.docsOutputRoot, { recursive: true });
    await writeFile(options.docsOutputRoot, 'not a directory');

    await expect(stagePreview({ ...options, revision }, async () => undefined)).rejects.toThrow(
      'docsOutputRoot must exist and resolve to a directory',
    );
  });

  it('refuses missing manifests and non-empty staging roots without deleting them', async () => {
    const missingManifest = await fixture();
    await rm(join(missingManifest.workspaceRoot, 'tools/file-upload-evidence/package.json'));
    await expect(
      stagePreview({ ...missingManifest, revision }, async () => undefined),
    ).rejects.toThrow('harness package manifest');

    const nonEmpty = await fixture();
    const stagingRoot = join(nonEmpty.workspaceRoot, '.wrangler-file-upload-evidence-owned');
    await mkdir(stagingRoot);
    await writeFile(join(stagingRoot, 'foreign.txt'), 'do not delete');
    await expect(
      stagePreview(
        {
          ...nonEmpty,
          createTemporaryDirectory: async () => stagingRoot,
          revision,
        },
        async () => undefined,
      ),
    ).rejects.toThrow('staging directory must be empty and created by this invocation');
    expect(await readFile(join(stagingRoot, 'foreign.txt'), 'utf8')).toBe('do not delete');
  });
});
import { spawnSync } from 'node:child_process';
