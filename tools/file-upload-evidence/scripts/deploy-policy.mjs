import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const productionSteps = [
  { uses: 'actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1' },
  { uses: 'pnpm/action-setup@0977fd99725f1db4007ccb2928dbb4e90d06cc86' },
  {
    uses: 'actions/setup-node@820762786026740c76f36085b0efc47a31fe5020',
    with: { 'node-version-file': '.nvmrc', cache: 'pnpm' },
  },
  { run: 'pnpm install --frozen-lockfile' },
  { run: 'pnpm --filter @lyra-ds/react run build' },
  { run: 'pnpm --filter @lyra-ds/site run build' },
  { run: 'pnpm --filter @lyra-ds/docs run build' },
  {
    name: 'Publish landing to Cloudflare Pages',
    env: {
      CLOUDFLARE_API_TOKEN: '${{ secrets.CLOUDFLARE_API_TOKEN }}',
      CLOUDFLARE_ACCOUNT_ID: '${{ secrets.CLOUDFLARE_ACCOUNT_ID }}',
    },
    run: 'pnpm exec wrangler pages deploy apps/site/out --project-name=lyra-ds-site --branch=main --commit-dirty=true',
  },
  {
    name: 'Publish docs to Cloudflare Pages',
    env: {
      CLOUDFLARE_API_TOKEN: '${{ secrets.CLOUDFLARE_API_TOKEN }}',
      CLOUDFLARE_ACCOUNT_ID: '${{ secrets.CLOUDFLARE_ACCOUNT_ID }}',
    },
    run: 'pnpm exec wrangler pages deploy apps/docs/out --project-name=lyra-ds-docs --branch=main --commit-dirty=true',
  },
];

const productionEnvironment = {
  NODE_OPTIONS: '--max-old-space-size=8192',
  NEXT_PUBLIC_OPENPANEL_URL: '${{ vars.NEXT_PUBLIC_OPENPANEL_URL }}',
  NEXT_PUBLIC_OPENPANEL_CLIENT_ID: '${{ vars.NEXT_PUBLIC_OPENPANEL_CLIENT_ID }}',
};

const previewOrder = [
  'pnpm install --frozen-lockfile',
  'pnpm --filter @lyra-ds/styles run lint:css',
  'pnpm --filter @lyra-ds/react run build',
  'pnpm --filter @lyra-ds/alpine run build',
  'pnpm --filter @lyra-ds/docs run build',
  'pnpm run evidence:file-upload:manual:test',
  'pnpm run evidence:file-upload:manual:build',
  'node tools/file-upload-evidence/scripts/stage-preview.mjs',
  'pnpm exec wrangler pages deploy',
  'pnpm exec wrangler pages deployment list',
  'pnpm run evidence:file-upload:manual:smoke',
];

function fail(message) {
  throw new Error(message);
}

function sameValue(actual, expected) {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

function expression(value) {
  return typeof value === 'string'
    ? value
        .replace(/^\s*\$\{\{\s*/u, '')
        .replace(/\s*\}\}\s*$/u, '')
        .trim()
    : '';
}

function workflowRuns(job) {
  return job.steps.flatMap((step) => (typeof step.run === 'string' ? [step.run] : []));
}

function checkWorkflowBoundary(workflow) {
  if (!sameValue(workflow.on?.push?.branches, ['main']) || !('workflow_dispatch' in workflow.on)) {
    fail('deploy workflow triggers must preserve main pushes and manual dispatch.');
  }
  if (!sameValue(workflow.permissions, { contents: 'read' })) {
    fail('deploy workflow permissions must remain read-only.');
  }
  if (!sameValue(workflow.concurrency, { group: 'deploy', 'cancel-in-progress': false })) {
    fail('production deploy semantics differ from the approved snapshot.');
  }
}

function checkProductionJob(job) {
  if (expression(job.if) !== "github.ref_name == 'main'") {
    fail('production deploy must run only for main refs.');
  }
  if (
    job['runs-on'] !== 'ubuntu-latest' ||
    !sameValue(job.env, productionEnvironment) ||
    !sameValue(job.steps, productionSteps)
  ) {
    fail('production deploy semantics differ from the approved snapshot.');
  }
}

function checkPreviewGuard(job) {
  if (
    expression(job.if) !==
    "github.event_name == 'workflow_dispatch' && startsWith(github.ref_name, 'evidence/')"
  ) {
    fail('preview job must be restricted to manual evidence refs.');
  }
  if (!sameValue(job.permissions, { contents: 'read' })) {
    fail('preview job must have read-only contents permission.');
  }
}

function checkPinnedSetup(job) {
  const setup = job.steps.slice(0, 3);
  if (
    setup[0]?.uses !== productionSteps[0].uses ||
    setup[1]?.uses !== productionSteps[1].uses ||
    setup[2]?.uses !== productionSteps[2].uses ||
    !sameValue(setup[2]?.with, productionSteps[2].with) ||
    setup[0].ref !== undefined
  ) {
    fail('preview job must use the pinned repository checkout, pnpm, and Node setup.');
  }
  for (const step of job.steps) {
    if (step.uses !== undefined && !/@[a-f0-9]{40}$/u.test(step.uses)) {
      fail('preview job contains a floating action reference.');
    }
  }
}

function checkPreviewOrder(job, source) {
  let cursor = -1;
  for (const command of previewOrder) {
    const next = source.indexOf(command, cursor + 1);
    if (next === -1 || next <= cursor) {
      fail('preview validation and build steps are out of order.');
    }
    cursor = next;
  }

  const installCount = workflowRuns(job).filter((run) => run.includes('pnpm install')).length;
  if (installCount !== 1 || !source.includes('pnpm install --frozen-lockfile')) {
    fail('preview job must use exactly one frozen pnpm install.');
  }
}

function checkPreviewDeployment(job, source) {
  if (source.includes('apps/site/out') || source.includes('--project-name=lyra-ds-site')) {
    fail('preview job must never deploy the landing site.');
  }
  if (
    !source.includes('--project-name=lyra-ds-docs') ||
    !source.includes('--branch=file-upload-evidence') ||
    source.includes('--branch=main')
  ) {
    fail('preview deploy must target only branch file-upload-evidence.');
  }
  if (
    !source.includes('--commit-hash="$GITHUB_SHA"') ||
    !source.includes('--commit-dirty=true') ||
    !source.includes('--environment=preview') ||
    !source.includes('--json')
  ) {
    fail('preview deployment must be revision-pinned and resolved from JSON.');
  }
  if (/pages\s+project\s+(?:update|create)/u.test(source)) {
    fail('preview job must not mutate Pages project configuration.');
  }
}

function checkRevisionFlow(job, source) {
  const buildStep = job.steps.find((step) => step.name === 'Build isolated evidence harness');
  if (
    buildStep?.env?.FILE_UPLOAD_EVIDENCE !== '1' ||
    buildStep.env.LYRA_EVIDENCE_REVISION !== '${{ github.sha }}' ||
    !buildStep.run.includes('LYRA_EVIDENCE_BUILD_TIME=') ||
    !buildStep.run.includes('export LYRA_EVIDENCE_BUILD_TIME')
  ) {
    fail('isolated build must receive the exact revision and an exported UTC build time.');
  }
  for (const value of [
    '--revision="$GITHUB_SHA"',
    '--commit-hash="$GITHUB_SHA"',
    '--revision="$GITHUB_SHA"',
    'deployment.deployment_trigger?.metadata?.commit_hash === process.env.GITHUB_SHA',
    'Revision: $GITHUB_SHA',
  ]) {
    if (!source.includes(value))
      fail('exact revision must flow through build, Function, smoke, and summary.');
  }
  if (!source.includes('matches.length !== 1') || !source.includes('GITHUB_STEP_SUMMARY')) {
    fail('preview job must select one immutable deployment and summarize it.');
  }
}

function checkForbiddenPreviewBehavior(source) {
  if (/playwright\s+install|apt(?:-get)?\s+install|npx\s+wrangler/iu.test(source)) {
    fail('preview job contains a browser or floating CLI install workaround.');
  }
  if (/echo[^\n]*(?:CLOUDFLARE_API_TOKEN|CLOUDFLARE_ACCOUNT_ID)/iu.test(source)) {
    fail('preview job must not print Cloudflare credentials.');
  }
}

export async function validateDeployPolicy(source) {
  const workflow = parse(source);
  if (workflow === null || typeof workflow !== 'object' || workflow.jobs === undefined) {
    fail('deploy workflow must parse to a jobs object.');
  }
  checkWorkflowBoundary(workflow);
  checkProductionJob(workflow.jobs.deploy);

  const previewJob = workflow.jobs['evidence-preview'];
  if (previewJob === undefined || !Array.isArray(previewJob.steps)) {
    fail('deploy workflow must define a separate evidence-preview job.');
  }
  const previewSource = workflowRuns(previewJob).join('\n');
  checkPreviewGuard(previewJob);
  checkPinnedSetup(previewJob);
  checkPreviewOrder(previewJob, previewSource);
  checkPreviewDeployment(previewJob, previewSource);
  checkRevisionFlow(previewJob, previewSource);
  checkForbiddenPreviewBehavior(previewSource);
  return { previewJob: 'evidence-preview', productionJob: 'deploy' };
}

const isCli =
  process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const workflowPath = process.argv[2];
  if (workflowPath === undefined) fail('usage: deploy-policy.mjs <workflow.yml>');
  await validateDeployPolicy(await readFile(resolve(workflowPath), 'utf8'));
}
