import { execFile as execFileCallback } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { strToU8, zipSync } from 'fflate';
import { afterEach, describe, expect, it } from 'vitest';
import { parse, stringify } from 'yaml';

import { parseAutomationArgs } from './automation.mjs';
import * as deployPolicy from './deploy-policy.mjs';

const { resolvePreviewDeployment, validateDeployPolicy } = deployPolicy;

const repositoryRoot = resolve(import.meta.dirname, '../../..');
const workflowPath = resolve(repositoryRoot, '.github/workflows/deploy.yml');
const revision = '1234567890abcdef1234567890abcdef12345678';
const deploymentId = '11111111-2222-3333-4444-555555555555';
const deploymentUrl = 'https://a1b2c3d4.lyra-ds-docs.pages.dev';
const evidenceDeploymentUrl = `${deploymentUrl}/en/file-upload-evidence/`;
const execFile = promisify(execFileCallback);
const temporaryRoots = [];
const automatedChecks = {
  'DF-FU-17': [
    'DF-FU-17-no-horizontal-overflow',
    'DF-FU-17-long-file-identity-retained',
    'DF-FU-17-actions-reachable-at-reflow',
    'DF-FU-17-active-replacement-rejected-and-announced',
    'DF-FU-17-cancel-retry-complete-remove',
    'DF-FU-17-focus-recovered',
    'DF-FU-17-keyboard-activation-equivalent',
  ],
  'DF-FU-18': [
    'DF-FU-18-native-js-disabled-form-submitted',
    'DF-FU-18-response-locale-metadata-revision',
    'DF-FU-18-delayed-alpine-filelist-preserved',
    'DF-FU-18-single-enhancement-no-replay',
    'DF-FU-18-removal-focus-recovered',
    'DF-FU-18-reconnect-teardown-clean',
  ],
};

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function artifactPaths(scenario, engine) {
  return ['final.png', 'run.webm', 'trace.zip', 'events.json'].map(
    (name) => `artifacts/${scenario}/${engine}/${name}`,
  );
}

function automatedRun(scenario, engine, result) {
  const checks = Object.fromEntries(automatedChecks[scenario].map((check) => [check, true]));
  if (result === 'FAIL') checks[automatedChecks[scenario][0]] = false;
  return {
    engine,
    viewport: { width: 320, height: 720, devicePixelRatio: 2 },
    mediaQueries:
      engine === 'chromium'
        ? { '(pointer: coarse)': true, '(any-pointer: coarse)': true }
        : { '(pointer: coarse)': false, '(any-pointer: coarse)': false },
    checks,
    artifactPaths: artifactPaths(scenario, engine),
  };
}

function automatedRecord(scenario, result, archiveRevision, archiveDeploymentUrl) {
  const engines = scenario === 'DF-FU-17' ? ['chromium', 'firefox', 'webkit'] : ['chromium'];
  return {
    scenario,
    locale: 'en',
    revision: archiveRevision,
    deploymentUrl: archiveDeploymentUrl,
    executedAt: '2026-08-26T12:00:00.000Z',
    runs: engines.map((engine) => automatedRun(scenario, engine, result)),
    result,
  };
}

function artifactMediaType(path) {
  if (path.endsWith('.png')) return 'image/png';
  if (path.endsWith('.webm')) return 'video/webm';
  if (path.endsWith('.zip')) return 'application/zip';
  return 'application/json';
}

function automationArchive({
  archiveDeploymentUrl = evidenceDeploymentUrl,
  archiveRevision = revision,
  outcomes = { 'DF-FU-17': 'PASS', 'DF-FU-18': 'PASS' },
  scenarios = ['DF-FU-17', 'DF-FU-18'],
} = {}) {
  const members = new Map();
  const entries = [];
  for (const scenario of scenarios) {
    const result = automatedRecord(
      scenario,
      outcomes[scenario],
      archiveRevision,
      archiveDeploymentUrl,
    );
    const recordPath = `automation/${scenario}.json`;
    const recordBytes = strToU8(JSON.stringify(result));
    members.set(recordPath, recordBytes);
    entries.push({
      path: recordPath,
      bytes: recordBytes.length,
      mediaType: 'application/json',
      sha256: sha256(recordBytes),
    });
    for (const run of result.runs) {
      for (const path of run.artifactPaths) {
        const bytes = strToU8(`diagnostic:${path}`);
        members.set(path, bytes);
        entries.push({
          path,
          bytes: bytes.length,
          mediaType: artifactMediaType(path),
          sha256: sha256(bytes),
        });
      }
    }
  }
  entries.sort((left, right) => left.path.localeCompare(right.path, 'en'));
  const manifest = strToU8(
    JSON.stringify({
      schemaVersion: 1,
      kind: 'automation',
      revision: archiveRevision,
      deploymentUrl: archiveDeploymentUrl,
      createdAt: '2026-08-26T12:00:00.000Z',
      entries,
    }),
  );
  members.set('manifest.json', manifest);
  return zipSync(
    Object.fromEntries([...members].sort(([left], [right]) => left.localeCompare(right, 'en'))),
  );
}

async function writeArchive(bytes = automationArchive()) {
  const root = await mkdtemp(join(tmpdir(), 'lyra-automation-results-'));
  temporaryRoots.push(root);
  const archive = join(root, 'automation.zip');
  await writeFile(archive, bytes);
  return { archive, root };
}

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

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true })));
});

describe('validateDeployPolicy', () => {
  it('accepts the guarded production and evidence preview jobs', async () => {
    await expect(validateDeployPolicy(await workflowSource())).resolves.toMatchObject({
      previewJob: 'evidence-preview',
      productionJob: 'deploy',
    });
  });

  it('executes evidence metadata with the container default POSIX shell', async () => {
    const workflow = parse(await workflowSource());
    const step = previewStep(
      workflow.jobs['evidence-preview'],
      'Define FileUpload automation evidence',
    );
    const root = await mkdtemp(join(tmpdir(), 'lyra-evidence-metadata-'));
    temporaryRoots.push(root);
    const githubOutput = join(root, 'github-output');

    await execFile('/bin/sh', ['-eu', '-c', step.run], {
      env: {
        ...process.env,
        GITHUB_OUTPUT: githubOutput,
        GITHUB_SHA: revision,
        RUNNER_TEMP: root,
      },
    });

    await expect(readFile(githubOutput, 'utf8')).resolves.toBe(
      `revision-prefix=1234567890ab\narchive=${root}/file-upload-automation-1234567890ab.zip\n`,
    );
  });

  it('passes the canonical immutable English route accepted by automation', async () => {
    const workflow = parse(await workflowSource());
    const step = previewStep(
      workflow.jobs['evidence-preview'],
      'Run revision-bound FileUpload automation',
    );
    const urlArgument = /--url="([^"]+)"/u.exec(step.run)?.[1];
    expect(urlArgument).toBeDefined();
    const resolvedUrl = urlArgument.replace('${{ steps.deployment.outputs.url }}', deploymentUrl);

    expect(
      parseAutomationArgs([
        `--url=${resolvedUrl}`,
        `--revision=${revision}`,
        '--output=/tmp/file-upload-automation.zip',
      ]),
    ).toMatchObject({ url: evidenceDeploymentUrl });
  });

  it('executes the workflow result extractor and writes both outputs distinctly', async () => {
    const workflow = parse(await workflowSource());
    const step = previewStep(
      workflow.jobs['evidence-preview'],
      'Extract FileUpload automation results',
    );
    const { archive, root } = await writeArchive(
      automationArchive({ outcomes: { 'DF-FU-17': 'PASS', 'DF-FU-18': 'FAIL' } }),
    );
    const githubOutput = join(root, 'github-output');
    const command = step.run
      .replace('${{ steps.evidence.outputs.archive }}', archive)
      .replace('${{ steps.deployment.outputs.url }}', deploymentUrl);

    await execFile('/bin/sh', ['-eu', '-c', command], {
      cwd: repositoryRoot,
      env: { ...process.env, GITHUB_OUTPUT: githubOutput, GITHUB_SHA: revision },
    });

    await expect(readFile(githubOutput, 'utf8')).resolves.toBe('df_fu_17=PASS\ndf_fu_18=FAIL\n');
  });

  it.each([
    {
      name: 'mixed validated results',
      environment: {
        AUTOMATION_RESULTS_OUTCOME: 'success',
        DF_FU_17_RESULT: 'PASS',
        DF_FU_18_RESULT: 'FAIL',
      },
      expected: ['- DF-FU-17: PASS', '- DF-FU-18: FAIL'],
    },
    {
      name: 'failed extraction',
      environment: {
        AUTOMATION_RESULTS_OUTCOME: 'failure',
        DF_FU_17_RESULT: '',
        DF_FU_18_RESULT: '',
      },
      expected: [
        '- DF-FU-17: unavailable (result extraction failed)',
        '- DF-FU-18: unavailable (result extraction failed)',
      ],
    },
  ])('executes the summary for $name', async ({ environment, expected }) => {
    const workflow = parse(await workflowSource());
    const step = previewStep(workflow.jobs['evidence-preview'], 'Summarize evidence preview');
    const root = await mkdtemp(join(tmpdir(), 'lyra-evidence-summary-'));
    temporaryRoots.push(root);
    const summary = join(root, 'summary');
    const command = step.run
      .replace('${{ steps.deployment.outputs.url }}', deploymentUrl)
      .replace('${{ steps.evidence.outputs.revision-prefix }}', revision.slice(0, 12));

    await execFile('/bin/sh', ['-eu', '-c', command], {
      env: {
        ...process.env,
        ...environment,
        GITHUB_SHA: revision,
        GITHUB_STEP_SUMMARY: summary,
      },
    });

    const contents = await readFile(summary, 'utf8');
    for (const line of expected) expect(contents).toContain(line);
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
        step.run = step.run.replace("printf '%.12s'", "printf '%.7s'");
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
          '${{ steps.deployment.outputs.url }}/en/file-upload-evidence/',
          'https://file-upload-evidence.lyra-ds-docs.pages.dev/en/file-upload-evidence/',
        );
      },
    },
    {
      name: 'automation uses only the immutable deployment origin',
      mutate: (step) => {
        step.run = step.run.replace(
          '${{ steps.deployment.outputs.url }}/en/file-upload-evidence/',
          '${{ steps.deployment.outputs.url }}',
        );
      },
    },
    {
      name: 'automation uses the Portuguese evidence route',
      mutate: (step) => {
        step.run = step.run.replace('/en/file-upload-evidence/', '/pt-BR/file-upload-evidence/');
      },
    },
    {
      name: 'automation appends a query to the evidence route',
      mutate: (step) => {
        step.run = step.run.replace('/en/file-upload-evidence/', '/en/file-upload-evidence/?run=1');
      },
    },
    {
      name: 'automation creates a double slash before the evidence route',
      mutate: (step) => {
        step.run = step.run.replace(
          'url }}/en/file-upload-evidence/',
          'url }}//en/file-upload-evidence/',
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
      const original = JSON.stringify(step);
      mutate(step);
      expect(JSON.stringify(step)).not.toBe(original);
    });

    await expect(validateDeployPolicy(changed)).rejects.toThrow(
      'automation command must use the immutable URL, full revision, and declared ZIP',
    );
  });

  it.each([
    {
      name: 'result extraction is skipped after automation failure',
      mutate: (step) => {
        step.if = 'success()';
      },
    },
    {
      name: 'result extraction failure blocks later diagnostics',
      mutate: (step) => {
        step['continue-on-error'] = false;
      },
    },
    {
      name: 'result extraction reads a directory instead of the declared ZIP',
      mutate: (step) => {
        step.run = step.run.replace('${{ steps.evidence.outputs.archive }}', '$RUNNER_TEMP');
      },
    },
    {
      name: 'result extraction uses a shortened revision',
      mutate: (step) => {
        step.run = step.run.replace('$GITHUB_SHA', '${GITHUB_SHA:0:12}');
      },
    },
    {
      name: 'result extraction uses only the deployment origin',
      mutate: (step) => {
        step.run = step.run.replace(
          '${{ steps.deployment.outputs.url }}/en/file-upload-evidence/',
          '${{ steps.deployment.outputs.url }}',
        );
      },
    },
    {
      name: 'result extraction uses the Portuguese evidence route',
      mutate: (step) => {
        step.run = step.run.replace('/en/file-upload-evidence/', '/pt-BR/file-upload-evidence/');
      },
    },
    {
      name: 'result extraction uses the mutable branch alias',
      mutate: (step) => {
        step.run = step.run.replace(
          '${{ steps.deployment.outputs.url }}/en/file-upload-evidence/',
          'https://file-upload-evidence.lyra-ds-docs.pages.dev/en/file-upload-evidence/',
        );
      },
    },
    {
      name: 'result extraction appends a query to the evidence route',
      mutate: (step) => {
        step.run = step.run.replace('/en/file-upload-evidence/', '/en/file-upload-evidence/?run=1');
      },
    },
    {
      name: 'result extraction creates a double slash before the evidence route',
      mutate: (step) => {
        step.run = step.run.replace(
          'url }}/en/file-upload-evidence/',
          'url }}//en/file-upload-evidence/',
        );
      },
    },
    {
      name: 'result extraction writes outside GitHub outputs',
      mutate: (step) => {
        step.run = step.run.replace('$GITHUB_OUTPUT', '$RUNNER_TEMP/results');
      },
    },
  ])('rejects when $name', async ({ mutate }) => {
    const source = await workflowSource();
    const changed = mutatePreviewJob(source, (job) => {
      const step = previewStep(job, 'Extract FileUpload automation results');
      const original = JSON.stringify(step);
      mutate(step);
      expect(JSON.stringify(step)).not.toBe(original);
    });

    await expect(validateDeployPolicy(changed)).rejects.toThrow(
      'automation result extraction must validate the exact revision-bound ZIP',
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
    {
      name: 'extractor failure no longer fails the job',
      mutate: (step) => {
        step.if = step.if.replace("steps.automation_results.outcome != 'success' || ", '');
      },
    },
    {
      name: 'a reported DF-FU-18 failure no longer fails the job',
      mutate: (step) => {
        step.if = step.if.replace(" || steps.automation_results.outputs.df_fu_18 != 'PASS'", '');
      },
    },
  ])('rejects when $name', async ({ mutate }) => {
    const source = await workflowSource();
    const changed = mutatePreviewJob(source, (job) => {
      const step = previewStep(job, 'Enforce FileUpload automation result');
      const original = JSON.stringify(step);
      mutate(step);
      expect(JSON.stringify(step)).not.toBe(original);
    });

    await expect(validateDeployPolicy(changed)).rejects.toThrow(
      'automation failure must fail the job after diagnostics upload',
    );
  });

  it.each([
    ['the immutable URL', '- Immutable URL: ${{ steps.deployment.outputs.url }}'],
    ['the full revision', '- Revision: $GITHUB_SHA'],
    ['DF-FU-17 result', '- DF-FU-17: $df_fu_17'],
    ['DF-FU-18 result', '- DF-FU-18: $df_fu_18'],
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

  it('rejects a summary without explicit unavailable extraction diagnostics', async () => {
    const source = await workflowSource();
    const changed = mutatePreviewJob(source, (job) => {
      const step = previewStep(job, 'Summarize evidence preview');
      expect(step.run).toContain('unavailable (result extraction failed)');
      step.run = step.run.replaceAll('unavailable (result extraction failed)', 'unknown');
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
    [
      'result extraction before automation',
      'Extract FileUpload automation results',
      'Run revision-bound FileUpload automation',
    ],
    [
      'artifact upload before result extraction',
      'Upload FileUpload automation evidence',
      'Extract FileUpload automation results',
    ],
    [
      'failure enforcement before artifact upload',
      'Enforce FileUpload automation result',
      'Upload FileUpload automation evidence',
    ],
  ])('rejects %s', async (_name, movedName, targetName) => {
    const changed = mutatePreviewJob(await workflowSource(), (job) => {
      const movedIndex = job.steps.findIndex((step) => step.name === movedName);
      expect(movedIndex).toBeGreaterThanOrEqual(0);
      const [moved] = job.steps.splice(movedIndex, 1);
      const targetIndex = job.steps.findIndex((step) => step.name === targetName);
      expect(targetIndex).toBeGreaterThanOrEqual(0);
      job.steps.splice(targetIndex, 0, moved);
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

describe('writeAutomationResultOutputs', () => {
  it('writes distinct validated results for a mixed DF-FU-17 and DF-FU-18 archive', async () => {
    expect(deployPolicy.writeAutomationResultOutputs).toBeTypeOf('function');
    const { archive, root } = await writeArchive(
      automationArchive({ outcomes: { 'DF-FU-17': 'PASS', 'DF-FU-18': 'FAIL' } }),
    );
    const githubOutput = join(root, 'github-output');

    await expect(
      deployPolicy.writeAutomationResultOutputs({
        archivePath: archive,
        deploymentUrl: evidenceDeploymentUrl,
        githubOutputPath: githubOutput,
        revision,
      }),
    ).resolves.toEqual({ dfFu17: 'PASS', dfFu18: 'FAIL' });
    await expect(readFile(githubOutput, 'utf8')).resolves.toBe('df_fu_17=PASS\ndf_fu_18=FAIL\n');
  });

  it('rejects missing, malformed, and partial automation archives without writing outputs', async () => {
    expect(deployPolicy.writeAutomationResultOutputs).toBeTypeOf('function');
    const { archive, root } = await writeArchive(strToU8('not a ZIP'));
    const missingArchive = join(root, 'missing.zip');
    const partialArchive = join(root, 'partial.zip');
    const githubOutput = join(root, 'github-output');
    await writeFile(partialArchive, automationArchive({ scenarios: ['DF-FU-17'] }));

    await expect(
      deployPolicy.writeAutomationResultOutputs({
        archivePath: missingArchive,
        deploymentUrl: evidenceDeploymentUrl,
        githubOutputPath: githubOutput,
        revision,
      }),
    ).rejects.toThrow(/ENOENT/u);
    await expect(
      deployPolicy.writeAutomationResultOutputs({
        archivePath: archive,
        deploymentUrl: evidenceDeploymentUrl,
        githubOutputPath: githubOutput,
        revision,
      }),
    ).rejects.toThrow(/Invalid evidence archive/u);
    await expect(
      deployPolicy.writeAutomationResultOutputs({
        archivePath: partialArchive,
        deploymentUrl: evidenceDeploymentUrl,
        githubOutputPath: githubOutput,
        revision,
      }),
    ).rejects.toThrow(/exactly DF-FU-17 and DF-FU-18/u);
    await expect(readFile(githubOutput, 'utf8')).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it.each([
    {
      name: 'revision',
      bytes: () => automationArchive({ archiveRevision: 'f'.repeat(40) }),
    },
    {
      name: 'immutable deployment URL',
      bytes: () =>
        automationArchive({
          archiveDeploymentUrl: 'https://ffffffff.lyra-ds-docs.pages.dev/en/file-upload-evidence/',
        }),
    },
  ])('rejects a mismatched $name without writing outputs', async ({ bytes }) => {
    expect(deployPolicy.writeAutomationResultOutputs).toBeTypeOf('function');
    const { archive, root } = await writeArchive(bytes());
    const githubOutput = join(root, 'github-output');

    await expect(
      deployPolicy.writeAutomationResultOutputs({
        archivePath: archive,
        deploymentUrl: evidenceDeploymentUrl,
        githubOutputPath: githubOutput,
        revision,
      }),
    ).rejects.toThrow(/manifest validation failed/u);
    await expect(readFile(githubOutput, 'utf8')).rejects.toMatchObject({ code: 'ENOENT' });
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
