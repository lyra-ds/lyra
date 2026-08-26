import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse, stringify } from 'yaml';

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

function mutateWorkflow(source, mutate) {
  const workflow = parse(source);
  mutate(workflow);
  return stringify(workflow);
}

function mutatePreviewJob(source, mutate) {
  return mutateWorkflow(source, (workflow) => {
    const job = workflow.jobs?.['evidence-preview'];
    expect(job, 'missing evidence-preview job').toBeDefined();
    mutate(job);
  });
}

function previewStep(job, name) {
  const step = job.steps?.find((candidate) => candidate.name === name);
  expect(step, `missing ${name} step`).toBeDefined();
  return step;
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
      name: 'the Playwright image loses its immutable digest',
      mutate: (job) => {
        expect(job.container).toBeDefined();
        job.container.image = 'mcr.microsoft.com/playwright:v1.62.1-noble';
      },
      error: 'preview job must use the pinned Playwright browser container',
    },
    {
      name: 'the Playwright container loses host IPC',
      mutate: (job) => {
        expect(job.container).toBeDefined();
        job.container.options = '--init';
      },
      error: 'preview job must use the pinned Playwright browser container',
    },
    {
      name: 'Firefox loses its container home',
      mutate: (job) => {
        expect(job.env?.HOME).toBe('/root');
        delete job.env.HOME;
      },
      error: 'preview job environment differs from the approved boundary',
    },
  ])('rejects when $name', async ({ error, mutate }) => {
    const source = await workflowSource();
    const changed = mutatePreviewJob(source, mutate);

    await expect(validateDeployPolicy(changed)).rejects.toThrow(error);
  });

  it.each([
    {
      name: 'manual dispatch is removed',
      mutate: (workflow) => delete workflow.on.workflow_dispatch,
      error: 'deploy workflow triggers must preserve main pushes and manual dispatch',
    },
    {
      name: 'preview contents permission becomes writable',
      mutate: (workflow) => {
        workflow.jobs['evidence-preview'].permissions.contents = 'write';
      },
      error: 'preview job must have read-only contents permission',
    },
  ])('rejects when $name', async ({ error, mutate }) => {
    const changed = mutateWorkflow(await workflowSource(), mutate);

    await expect(validateDeployPolicy(changed)).rejects.toThrow(error);
  });

  it.each([
    {
      name: 'the evidence prefix is truncated to seven characters',
      mutate: (step) => {
        step.run = step.run.replace('${GITHUB_SHA:0:12}', '${GITHUB_SHA:0:7}');
      },
      error: 'automation evidence metadata must derive the exact archive path',
    },
    {
      name: 'the evidence archive is written outside runner temp',
      mutate: (step) => {
        step.run = step.run.replace('$RUNNER_TEMP/', '$GITHUB_WORKSPACE/');
      },
      error: 'automation evidence metadata must derive the exact archive path',
    },
  ])('rejects when $name', async ({ error, mutate }) => {
    const source = await workflowSource();
    const changed = mutatePreviewJob(source, (job) => {
      const step = previewStep(job, 'Define FileUpload automation evidence');
      const original = step.run;
      mutate(step);
      expect(step.run).not.toBe(original);
    });

    await expect(validateDeployPolicy(changed)).rejects.toThrow(error);
  });

  it.each([
    {
      name: 'automation no longer continues to diagnostics',
      mutate: (step) => {
        step['continue-on-error'] = false;
      },
    },
    {
      name: 'automation uses the mutable branch alias',
      mutate: (step) => {
        step.run = step.run.replace(
          '${{ steps.deployment.outputs.url }}',
          'https://file-upload-evidence.lyra-ds-docs.pages.dev',
        );
      },
    },
    {
      name: 'automation uses a shortened revision',
      mutate: (step) => {
        step.run = step.run.replace('$GITHUB_SHA', '${GITHUB_SHA:0:12}');
      },
    },
    {
      name: 'automation writes a directory instead of the declared ZIP',
      mutate: (step) => {
        step.run = step.run.replace('${{ steps.evidence.outputs.archive }}', '$RUNNER_TEMP');
      },
    },
  ])('rejects when $name', async ({ mutate }) => {
    const source = await workflowSource();
    const changed = mutatePreviewJob(source, (job) => {
      const step = previewStep(job, 'Run revision-bound FileUpload automation');
      mutate(step);
    });

    await expect(validateDeployPolicy(changed)).rejects.toThrow(
      'automation command must use the immutable URL, full revision, and declared ZIP',
    );
  });

  it.each([
    {
      name: 'the artifact action loses its immutable SHA',
      mutate: (step) => {
        step.uses = 'actions/upload-artifact@v4';
      },
    },
    {
      name: 'artifact diagnostics stop running after automation failure',
      mutate: (step) => {
        step.if = 'success()';
      },
    },
    {
      name: 'artifact upload includes an evidence directory',
      mutate: (step) => {
        step.with.path = '${{ runner.temp }}/';
      },
    },
    {
      name: 'artifact upload includes more than the generated ZIP',
      mutate: (step) => {
        step.with.path = '${{ steps.evidence.outputs.archive }}\n${{ runner.temp }}/*.zip';
      },
    },
    {
      name: 'the artifact name loses the revision prefix',
      mutate: (step) => {
        step.with.name = 'file-upload-automation.zip';
      },
    },
    {
      name: 'a missing evidence ZIP is ignored',
      mutate: (step) => {
        step.with['if-no-files-found'] = 'ignore';
      },
    },
    {
      name: 'artifact retention changes from fourteen days',
      mutate: (step) => {
        step.with['retention-days'] = 7;
      },
    },
  ])('rejects when $name', async ({ mutate }) => {
    const source = await workflowSource();
    const changed = mutatePreviewJob(source, (job) => {
      const step = previewStep(job, 'Upload FileUpload automation evidence');
      mutate(step);
    });

    await expect(validateDeployPolicy(changed)).rejects.toThrow(
      'automation artifact upload must publish only the declared ZIP',
    );
  });

  it.each([
    {
      name: 'automation failure is not re-enforced',
      mutate: (step) => {
        step.if = "steps.automation.outcome == 'success'";
      },
    },
    {
      name: 'the enforcement step exits successfully',
      mutate: (step) => {
        step.run = 'exit 0';
      },
    },
  ])('rejects when $name', async ({ mutate }) => {
    const source = await workflowSource();
    const changed = mutatePreviewJob(source, (job) => {
      const step = previewStep(job, 'Enforce FileUpload automation result');
      mutate(step);
    });

    await expect(validateDeployPolicy(changed)).rejects.toThrow(
      'automation failure must fail the job after diagnostics upload',
    );
  });

  it.each([
    ['the immutable URL', '- Immutable URL: ${{ steps.deployment.outputs.url }}'],
    ['the full revision', '- Revision: $GITHUB_SHA'],
    ['DF-FU-17 outcome', '- DF-FU-17: ${{ steps.automation.outcome }}'],
    ['DF-FU-18 outcome', '- DF-FU-18: ${{ steps.automation.outcome }}'],
    [
      'the exact artifact name',
      '- Artifact: file-upload-automation-${{ steps.evidence.outputs.revision-prefix }}.zip',
    ],
  ])('rejects when the summary omits %s', async (_name, line) => {
    const source = await workflowSource();
    const changed = mutatePreviewJob(source, (job) => {
      const step = previewStep(job, 'Summarize evidence preview');
      expect(step.run).toContain(line);
      step.run = step.run.replace(`  echo "${line}"\n`, '');
    });

    await expect(validateDeployPolicy(changed)).rejects.toThrow(
      'preview summary must report revision-bound automation diagnostics',
    );
  });

  it('rejects a summary that could print a secret', async () => {
    const source = await workflowSource();
    const changed = mutatePreviewJob(source, (job) => {
      const step = previewStep(job, 'Summarize evidence preview');
      step.run += 'echo "${{ secrets.CLOUDFLARE_API_TOKEN }}"\n';
    });

    await expect(validateDeployPolicy(changed)).rejects.toThrow(
      'preview summary must report revision-bound automation diagnostics',
    );
  });

  it.each([
    ['publishing before immutable URL resolution', 'Stage Function and publish evidence preview'],
    ['resolving after the remote smoke', 'Resolve immutable evidence deployment'],
    ['automating before the remote smoke', 'Run revision-bound FileUpload automation'],
  ])('rejects reordered evidence execution: %s', async (_name, movedStepName) => {
    const source = await workflowSource();
    const changed = mutatePreviewJob(source, (job) => {
      const movedIndex = job.steps.findIndex((step) => step.name === movedStepName);
      const smokeIndex = job.steps.findIndex(
        (step) => step.name === 'Smoke immutable evidence deployment',
      );
      expect(movedIndex).toBeGreaterThanOrEqual(0);
      expect(smokeIndex).toBeGreaterThanOrEqual(0);
      const [moved] = job.steps.splice(movedIndex, 1);
      const currentSmokeIndex = job.steps.findIndex(
        (step) => step.name === 'Smoke immutable evidence deployment',
      );
      job.steps.splice(
        movedStepName === 'Run revision-bound FileUpload automation'
          ? currentSmokeIndex
          : currentSmokeIndex + 1,
        0,
        moved,
      );
    });

    await expect(validateDeployPolicy(changed)).rejects.toThrow(
      'preview validation and evidence steps are out of order',
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
      error: 'preview validation and evidence steps are out of order',
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

  it('rejects reordering the production --branch=main option', async () => {
    const source = await workflowSource();
    const changed = source.replace(
      '--branch=main --commit-dirty=true',
      '--commit-dirty=true --branch=main',
    );

    expect(changed).not.toBe(source);
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
