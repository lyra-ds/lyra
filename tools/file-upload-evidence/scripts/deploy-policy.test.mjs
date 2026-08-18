import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { resolvePreviewDeployment, validateDeployPolicy } from './deploy-policy.mjs';

const repositoryRoot = resolve(import.meta.dirname, '../../..');
const workflowPath = resolve(repositoryRoot, '.github/workflows/deploy.yml');
const revision = '1234567890abcdef1234567890abcdef12345678';
const deploymentId = '11111111-2222-3333-4444-555555555555';
const deploymentUrl = 'https://a1b2c3d4.lyra-ds-docs.pages.dev';

function wranglerOutput(overrides = {}) {
  const detailed = {
    type: 'pages-deploy-detailed',
    version: 1,
    pages_project: 'lyra-ds-docs',
    deployment_id: deploymentId,
    url: deploymentUrl,
    alias: 'https://file-upload-evidence.lyra-ds-docs.pages.dev',
    environment: 'preview',
    production_branch: 'main',
    deployment_trigger: { metadata: { commit_hash: revision } },
    ...overrides,
  };
  return [
    JSON.stringify({ type: 'wrangler-session', version: 1, wrangler_version: '4.120.0' }),
    JSON.stringify(detailed),
  ].join('\n');
}

function deploymentList(overrides = {}) {
  return [
    {
      Id: deploymentId,
      Environment: 'Preview',
      Branch: 'file-upload-evidence',
      Source: revision.slice(0, 7),
      Deployment: deploymentUrl,
      Status: 'Aug 17, 2026 15:00:00',
      Build: `https://dash.cloudflare.com/account/pages/view/lyra-ds-docs/${deploymentId}`,
      ...overrides,
    },
  ];
}

function mutatePreview(source, mutate) {
  const marker = '  evidence-preview:';
  const index = source.indexOf(marker);
  expect(index).toBeGreaterThan(-1);
  return source.slice(0, index) + mutate(source.slice(index));
}

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

  it('requires smoke flags without a separator forwarded to Node', async () => {
    const source = await workflowSource();
    const regressed = source.replace(
      'pnpm run evidence:file-upload:manual:smoke\n' +
        '          --url="${{ steps.deployment.outputs.url }}"\n' +
        '          --revision="$GITHUB_SHA"',
      'pnpm run evidence:file-upload:manual:smoke --\n' +
        '          --url="${{ steps.deployment.outputs.url }}"\n' +
        '          --revision="$GITHUB_SHA"',
    );

    await expect(validateDeployPolicy(source)).resolves.toMatchObject({
      previewJob: 'evidence-preview',
    });
    expect(regressed).not.toBe(source);
    await expect(validateDeployPolicy(regressed)).rejects.toThrow(
      'preview smoke command must use the resolved URL and exact workflow revision',
    );
  });

  it.each([
    {
      name: 'the preview branch is changed to main',
      mutate: (source) =>
        source.replace('--branch=file-upload-evidence \\\n', '--branch=main \\\n'),
      error: 'preview deploy command does not match the approved boundary',
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
          '      - name: Validate Styles\n        run: pnpm --filter @lyra-ds/styles run lint:css\n      - name: Build React\n        run: pnpm --filter @lyra-ds/react run build',
          '      - name: Build React\n        run: pnpm --filter @lyra-ds/react run build\n      - name: Validate Styles\n        run: pnpm --filter @lyra-ds/styles run lint:css',
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
      error: 'preview deploy command does not match the approved boundary',
    },
    {
      name: 'checkout is redirected to main',
      mutate: (source) =>
        mutatePreview(source, (preview) => preview.replace('ref: ${{ github.ref }}', 'ref: main')),
      error: 'preview checkout must use the selected workflow ref',
    },
    {
      name: 'the project is removed only from the deploy command',
      mutate: (source) =>
        mutatePreview(source, (preview) =>
          preview.replace('              --project-name=lyra-ds-docs \\\n', ''),
        ),
      error: 'preview deploy command does not match the approved boundary',
    },
    {
      name: 'the smoke revision is changed',
      mutate: (source) =>
        mutatePreview(source, (preview) =>
          preview.replace(
            '--url="${{ steps.deployment.outputs.url }}"\n          --revision="$GITHUB_SHA"',
            '--url="${{ steps.deployment.outputs.url }}"\n          --revision="0000000000000000000000000000000000000000"',
          ),
        ),
      error: 'preview smoke command must use the resolved URL and exact workflow revision',
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

describe('resolvePreviewDeployment', () => {
  it('correlates Wrangler structured deploy output with the pinned list schema', () => {
    expect(
      resolvePreviewDeployment({
        deploymentList: JSON.stringify(deploymentList()),
        revision,
        wranglerOutput: wranglerOutput(),
      }),
    ).toEqual({ deploymentId, url: deploymentUrl });
  });

  it.each([
    ['no matching list rows', [], 'exactly one deployment list row'],
    [
      'multiple matching list rows',
      [...deploymentList(), ...deploymentList()],
      'exactly one deployment list row',
    ],
    [
      'a mismatched truncated source',
      deploymentList({ Source: 'fffffff' }),
      'deployment list metadata does not match',
    ],
    [
      'a mismatched deployment URL',
      deploymentList({ Deployment: 'https://ffffffff.lyra-ds-docs.pages.dev' }),
      'deployment list metadata does not match',
    ],
  ])('rejects %s', (_name, list, error) => {
    expect(() =>
      resolvePreviewDeployment({
        deploymentList: JSON.stringify(list),
        revision,
        wranglerOutput: wranglerOutput(),
      }),
    ).toThrow(error);
  });

  it.each([
    [
      'a mismatched full commit',
      { deployment_trigger: { metadata: { commit_hash: 'f'.repeat(40) } } },
    ],
    [
      'the branch alias as deployment URL',
      { url: 'https://file-upload-evidence.lyra-ds-docs.pages.dev' },
    ],
    ['a production deployment', { environment: 'production' }],
    ['the wrong Pages project', { pages_project: 'lyra-ds-site' }],
    ['a mismatched branch alias', { alias: 'https://other.lyra-ds-docs.pages.dev' }],
    ['a mismatched production branch', { production_branch: 'trunk' }],
  ])('rejects %s from structured deploy output', (_name, mutation) => {
    expect(() =>
      resolvePreviewDeployment({
        deploymentList: JSON.stringify(deploymentList()),
        revision,
        wranglerOutput: wranglerOutput(mutation),
      }),
    ).toThrow('structured deploy output does not match');
  });
});
