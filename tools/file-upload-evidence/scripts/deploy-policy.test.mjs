import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { validateDeployPolicy } from './deploy-policy.mjs';

const repositoryRoot = resolve(import.meta.dirname, '../../..');
const workflowPath = resolve(repositoryRoot, '.github/workflows/deploy.yml');

async function workflowSource() {
  return readFile(workflowPath, 'utf8');
}

describe('validateDeployPolicy', () => {
  it('accepts the guarded production and evidence preview jobs', async () => {
    await expect(validateDeployPolicy(await workflowSource())).resolves.toMatchObject({
      previewJob: 'evidence-preview',
      productionJob: 'deploy',
    });
  });

  it.each([
    {
      name: 'the preview branch is changed to main',
      mutate: (source) =>
        source.replace('--branch=file-upload-evidence \\\n', '--branch=main \\\n'),
      error: 'preview deploy must target only branch file-upload-evidence',
    },
    {
      name: 'the evidence ref guard is removed',
      mutate: (source) =>
        source.replace(
          "github.event_name == 'workflow_dispatch' && startsWith(github.ref_name, 'evidence/')",
          "github.event_name == 'workflow_dispatch'",
        ),
      error: 'preview job must be restricted to manual evidence refs',
    },
    {
      name: 'the Styles and React builds are swapped',
      mutate: (source) =>
        source.replace(
          'pnpm --filter @lyra-ds/styles run lint:css\n      - run: pnpm --filter @lyra-ds/react run build',
          'pnpm --filter @lyra-ds/react run build\n      - run: pnpm --filter @lyra-ds/styles run lint:css',
        ),
      error: 'preview validation and build steps are out of order',
    },
    {
      name: 'a landing deploy is inserted',
      mutate: (source) =>
        source.replace(
          'node tools/file-upload-evidence/scripts/stage-preview.mjs \\',
          'pnpm exec wrangler pages deploy apps/site/out --project-name=lyra-ds-site --branch=file-upload-evidence\n          node tools/file-upload-evidence/scripts/stage-preview.mjs \\',
        ),
      error: 'preview job must never deploy the landing site',
    },
  ])('rejects when $name', async ({ error, mutate }) => {
    const source = await workflowSource();
    const changed = mutate(source);
    expect(changed).not.toBe(source);
    await expect(validateDeployPolicy(changed)).rejects.toThrow(error);
  });

  it('rejects production deploy semantic drift', async () => {
    const source = await workflowSource();
    const changed = source.replace(
      'pnpm --filter @lyra-ds/site run build',
      'pnpm --filter @lyra-ds/site run test',
    );

    await expect(validateDeployPolicy(changed)).rejects.toThrow(
      'production deploy semantics differ from the approved snapshot',
    );
  });
});
