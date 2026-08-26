import { appendFile, readFile } from 'node:fs/promises';
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

const revisionPattern = /^[a-f0-9]{40}$/u;
const deploymentIdPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/u;
const immutableDeploymentHostPattern = /^[a-z0-9-]{8,}\.lyra-ds-docs\.pages\.dev$/u;
const branchAliasHost = 'file-upload-evidence.lyra-ds-docs.pages.dev';
const playwrightContainer = {
  image:
    'mcr.microsoft.com/playwright:v1.62.1-noble@sha256:dcc5531e97840b9b5e794f2814476b21571c5124a3fca2267d73041f56e7580e',
  options: '--init --ipc=host',
};

const previewStepNames = [
  'Checkout selected evidence ref',
  'Set up pnpm',
  'Set up Node',
  'Install frozen dependencies',
  'Validate Styles',
  'Build React',
  'Build Alpine',
  'Build ordinary Docs',
  'Test evidence harness',
  'Build isolated evidence harness',
  'Stage Function and publish evidence preview',
  'Resolve immutable evidence deployment',
  'Define FileUpload automation evidence',
  'Smoke immutable evidence deployment',
  'Run revision-bound FileUpload automation',
  'Upload FileUpload automation evidence',
  'Summarize evidence preview',
  'Enforce FileUpload automation result',
];

const cloudflareStepEnvironment = {
  CLOUDFLARE_API_TOKEN: '${{ secrets.CLOUDFLARE_API_TOKEN }}',
  CLOUDFLARE_ACCOUNT_ID: '${{ secrets.CLOUDFLARE_ACCOUNT_ID }}',
  WRANGLER_OUTPUT_FILE_PATH: '${{ runner.temp }}/file-upload-evidence-wrangler-output.jsonl',
};

const deployCommand = `node tools/file-upload-evidence/scripts/stage-preview.mjs \\
  --workspace-root="$GITHUB_WORKSPACE" \\
  --docs-output="$GITHUB_WORKSPACE/apps/docs/out" \\
  --harness-dist="$GITHUB_WORKSPACE/tools/file-upload-evidence/dist" \\
  --revision="$GITHUB_SHA" \\
  -- pnpm exec wrangler pages deploy "$GITHUB_WORKSPACE/apps/docs/out" \\
    --project-name=lyra-ds-docs \\
    --branch=file-upload-evidence \\
    --commit-hash="$GITHUB_SHA" \\
    --commit-dirty=true
`;

const resolveCommand = `pnpm exec wrangler pages deployment list \\
  --project-name=lyra-ds-docs \\
  --environment=preview \\
  --json > "$RUNNER_TEMP/file-upload-evidence-deployments.json"
node tools/file-upload-evidence/scripts/deploy-policy.mjs resolve-preview \\
  --wrangler-output="$WRANGLER_OUTPUT_FILE_PATH" \\
  --deployment-list="$RUNNER_TEMP/file-upload-evidence-deployments.json" \\
  --revision="$GITHUB_SHA" \\
  --github-output="$GITHUB_OUTPUT"
`;

const evidenceMetadataCommand = `revision_prefix="\${GITHUB_SHA:0:12}"
archive="$RUNNER_TEMP/file-upload-automation-$revision_prefix.zip"
{
  echo "revision-prefix=$revision_prefix"
  echo "archive=$archive"
} >> "$GITHUB_OUTPUT"
`;

const automationCommand =
  'pnpm run evidence:file-upload:automation --url="${{ steps.deployment.outputs.url }}" --revision="$GITHUB_SHA" --output="${{ steps.evidence.outputs.archive }}"';

const summaryCommand = `{
  echo "## FileUpload evidence preview"
  echo "- Immutable URL: \${{ steps.deployment.outputs.url }}"
  echo "- Branch alias: https://file-upload-evidence.lyra-ds-docs.pages.dev"
  echo "- Revision: $GITHUB_SHA"
  echo "- DF-FU-17: \${{ steps.automation.outcome }}"
  echo "- DF-FU-18: \${{ steps.automation.outcome }}"
  echo "- Artifact: file-upload-automation-\${{ steps.evidence.outputs.revision-prefix }}.zip"
} >> "$GITHUB_STEP_SUMMARY"
`;

function fail(message) {
  throw new Error(message);
}

function immutableDeploymentUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    fail('structured deploy output does not match the pinned Wrangler schema.');
  }
  if (
    url.protocol !== 'https:' ||
    url.username !== '' ||
    url.password !== '' ||
    url.pathname !== '/' ||
    url.search !== '' ||
    url.hash !== '' ||
    url.hostname === branchAliasHost ||
    !immutableDeploymentHostPattern.test(url.hostname)
  ) {
    fail('structured deploy output does not match the pinned Wrangler schema.');
  }
  return url.origin;
}

function parseJson(value, message) {
  try {
    return JSON.parse(value);
  } catch {
    fail(message);
  }
}

export function resolvePreviewDeployment({ deploymentList, revision, wranglerOutput }) {
  if (!revisionPattern.test(revision)) {
    fail('revision must be a full 40-character lowercase Git SHA.');
  }

  const outputEntries = wranglerOutput
    .split(/\r?\n/u)
    .filter((line) => line.trim() !== '')
    .map((line) => parseJson(line, 'structured deploy output is not valid JSON Lines.'));
  const detailedEntries = outputEntries.filter((entry) => entry?.type === 'pages-deploy-detailed');
  if (detailedEntries.length !== 1) {
    fail('structured deploy output must contain exactly one detailed Pages deployment.');
  }

  const deployment = detailedEntries[0];
  const url = immutableDeploymentUrl(deployment.url);
  if (
    deployment.version !== 1 ||
    deployment.pages_project !== 'lyra-ds-docs' ||
    !deploymentIdPattern.test(deployment.deployment_id) ||
    deployment.environment !== 'preview' ||
    deployment.alias !== `https://${branchAliasHost}` ||
    deployment.production_branch !== 'main' ||
    deployment.deployment_trigger?.metadata?.commit_hash !== revision
  ) {
    fail('structured deploy output does not match the pinned Wrangler schema.');
  }

  const listed = parseJson(deploymentList, 'deployment list output is not valid JSON.');
  if (!Array.isArray(listed)) fail('deployment list output must be an array.');
  const matches = listed.filter((entry) => entry?.Id === deployment.deployment_id);
  if (matches.length !== 1) {
    fail('expected exactly one deployment list row for the structured deployment ID.');
  }

  const match = matches[0];
  if (
    match.Environment !== 'Preview' ||
    match.Branch !== 'file-upload-evidence' ||
    match.Source !== revision.slice(0, 7) ||
    match.Deployment !== url
  ) {
    fail('deployment list metadata does not match the structured deployment.');
  }

  return { deploymentId: deployment.deployment_id, url };
}

function sameValue(actual, expected) {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

function hasOnlyKeys(value, expected) {
  return (
    value !== null &&
    typeof value === 'object' &&
    sameValue(Object.keys(value).sort(), [...expected].sort())
  );
}

function expression(value) {
  return typeof value === 'string'
    ? value
        .replace(/^\s*\$\{\{\s*/u, '')
        .replace(/\s*\}\}\s*$/u, '')
        .trim()
    : '';
}

function checkWorkflowBoundary(workflow) {
  if (
    !hasOnlyKeys(workflow, ['name', 'on', 'permissions', 'concurrency', 'jobs']) ||
    workflow.name !== 'Deploy' ||
    !hasOnlyKeys(workflow.on, ['push', 'workflow_dispatch']) ||
    !sameValue(workflow.on?.push, { branches: ['main'] }) ||
    !sameValue(workflow.on?.workflow_dispatch, null) ||
    !hasOnlyKeys(workflow.jobs, ['deploy', 'evidence-preview'])
  ) {
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
    !hasOnlyKeys(job, ['if', 'runs-on', 'env', 'steps']) ||
    job['runs-on'] !== 'ubuntu-latest' ||
    !sameValue(job.env, productionEnvironment) ||
    !sameValue(job.steps, productionSteps)
  ) {
    fail('production deploy semantics differ from the approved snapshot.');
  }
}

function checkPreviewGuard(job) {
  if (!sameValue(job.container, playwrightContainer)) {
    fail('preview job must use the pinned Playwright browser container.');
  }
  if (
    !hasOnlyKeys(job, ['if', 'runs-on', 'permissions', 'env', 'container', 'steps']) ||
    job['runs-on'] !== 'ubuntu-latest' ||
    expression(job.if) !==
      "github.event_name == 'workflow_dispatch' && startsWith(github.ref_name, 'evidence/')"
  ) {
    fail('preview job must be restricted to manual evidence refs.');
  }
  if (!sameValue(job.permissions, { contents: 'read' })) {
    fail('preview job must have read-only contents permission.');
  }
}

function previewStep(job, name) {
  const matches = job.steps.filter((step) => step.name === name);
  if (matches.length !== 1) fail(`preview job must contain exactly one ${name} step.`);
  return matches[0];
}

function checkPreviewSteps(job) {
  if (
    !sameValue(
      job.steps.map((step) => step.name),
      previewStepNames,
    )
  ) {
    fail('preview validation and evidence steps are out of order.');
  }

  if (
    !sameValue(previewStep(job, 'Checkout selected evidence ref'), {
      name: 'Checkout selected evidence ref',
      uses: productionSteps[0].uses,
      with: { ref: '${{ github.ref }}' },
    })
  ) {
    fail('preview checkout must use the selected workflow ref.');
  }
  if (
    !sameValue(previewStep(job, 'Set up pnpm'), {
      name: 'Set up pnpm',
      uses: productionSteps[1].uses,
    }) ||
    !sameValue(previewStep(job, 'Set up Node'), {
      name: 'Set up Node',
      uses: productionSteps[2].uses,
      with: productionSteps[2].with,
    })
  ) {
    fail('preview job must use the pinned pnpm and Node setup.');
  }

  for (const [name, run] of [
    ['Install frozen dependencies', 'pnpm install --frozen-lockfile'],
    ['Validate Styles', 'pnpm --filter @lyra-ds/styles run lint:css'],
    ['Build React', 'pnpm --filter @lyra-ds/react run build'],
    ['Build Alpine', 'pnpm --filter @lyra-ds/alpine run build'],
    ['Build ordinary Docs', 'pnpm --filter @lyra-ds/docs run build'],
    ['Test evidence harness', 'pnpm run evidence:file-upload:manual:test'],
  ]) {
    if (!sameValue(previewStep(job, name), { name, run })) {
      fail(`${name} step does not match the approved command.`);
    }
  }

  if (
    !sameValue(previewStep(job, 'Build isolated evidence harness'), {
      name: 'Build isolated evidence harness',
      env: {
        FILE_UPLOAD_EVIDENCE: '1',
        LYRA_EVIDENCE_REVISION: '${{ github.sha }}',
      },
      run: `LYRA_EVIDENCE_BUILD_TIME=$(date -u +'%Y-%m-%dT%H:%M:%S.000Z')
export LYRA_EVIDENCE_BUILD_TIME
pnpm run evidence:file-upload:manual:build
`,
    })
  ) {
    fail('isolated build must receive the exact revision and an exported UTC build time.');
  }

  if (
    !sameValue(previewStep(job, 'Stage Function and publish evidence preview'), {
      name: 'Stage Function and publish evidence preview',
      env: cloudflareStepEnvironment,
      run: deployCommand,
    })
  ) {
    fail('preview deploy command does not match the approved boundary.');
  }

  if (
    !sameValue(previewStep(job, 'Resolve immutable evidence deployment'), {
      name: 'Resolve immutable evidence deployment',
      id: 'deployment',
      env: cloudflareStepEnvironment,
      run: resolveCommand,
    })
  ) {
    fail('preview deployment resolution must use pinned structured Wrangler output.');
  }

  if (
    !sameValue(previewStep(job, 'Define FileUpload automation evidence'), {
      name: 'Define FileUpload automation evidence',
      id: 'evidence',
      run: evidenceMetadataCommand,
    })
  ) {
    fail('automation evidence metadata must derive the exact archive path.');
  }

  if (
    !sameValue(previewStep(job, 'Smoke immutable evidence deployment'), {
      name: 'Smoke immutable evidence deployment',
      run: 'pnpm run evidence:file-upload:manual:smoke --url="${{ steps.deployment.outputs.url }}" --revision="$GITHUB_SHA"',
    })
  ) {
    fail('preview smoke command must use the resolved URL and exact workflow revision.');
  }

  if (
    !sameValue(previewStep(job, 'Run revision-bound FileUpload automation'), {
      name: 'Run revision-bound FileUpload automation',
      id: 'automation',
      'continue-on-error': true,
      run: automationCommand,
    })
  ) {
    fail('automation command must use the immutable URL, full revision, and declared ZIP.');
  }

  if (
    !sameValue(previewStep(job, 'Upload FileUpload automation evidence'), {
      name: 'Upload FileUpload automation evidence',
      if: 'always()',
      uses: 'actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02',
      with: {
        name: 'file-upload-automation-${{ steps.evidence.outputs.revision-prefix }}.zip',
        path: '${{ steps.evidence.outputs.archive }}',
        'if-no-files-found': 'error',
        'retention-days': 14,
      },
    })
  ) {
    fail('automation artifact upload must publish only the declared ZIP.');
  }

  if (
    !sameValue(previewStep(job, 'Summarize evidence preview'), {
      name: 'Summarize evidence preview',
      if: 'always()',
      run: summaryCommand,
    })
  ) {
    fail('preview summary must report revision-bound automation diagnostics.');
  }

  if (
    !sameValue(previewStep(job, 'Enforce FileUpload automation result'), {
      name: 'Enforce FileUpload automation result',
      if: "steps.automation.outcome != 'success'",
      run: 'exit 1',
    })
  ) {
    fail('automation failure must fail the job after diagnostics upload.');
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
  checkPreviewGuard(previewJob);
  if (
    !sameValue(previewJob.env, {
      NODE_OPTIONS: '--max-old-space-size=8192',
      HOME: '/root',
    })
  ) {
    fail('preview job environment differs from the approved boundary.');
  }
  checkPreviewSteps(previewJob);
  return { previewJob: 'evidence-preview', productionJob: 'deploy' };
}

const isCli =
  process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  if (process.argv[2] === 'resolve-preview') {
    const values = new Map();
    for (const argument of process.argv.slice(3)) {
      const match = /^--(wrangler-output|deployment-list|revision|github-output)=(.+)$/u.exec(
        argument,
      );
      if (match === null || values.has(match[1]))
        fail(`invalid resolve-preview argument: ${argument}`);
      values.set(match[1], match[2]);
    }
    const wranglerOutputPath = values.get('wrangler-output');
    const deploymentListPath = values.get('deployment-list');
    const revision = values.get('revision');
    const githubOutputPath = values.get('github-output');
    if (
      wranglerOutputPath === undefined ||
      deploymentListPath === undefined ||
      revision === undefined ||
      githubOutputPath === undefined
    ) {
      fail(
        'resolve-preview requires wrangler-output, deployment-list, revision, and github-output.',
      );
    }
    const result = resolvePreviewDeployment({
      deploymentList: await readFile(resolve(deploymentListPath), 'utf8'),
      revision,
      wranglerOutput: await readFile(resolve(wranglerOutputPath), 'utf8'),
    });
    await appendFile(
      resolve(githubOutputPath),
      `deployment_id=${result.deploymentId}\nurl=${result.url}\n`,
    );
  } else {
    const workflowPath = process.argv[2];
    if (workflowPath === undefined) fail('usage: deploy-policy.mjs <workflow.yml>');
    await validateDeployPolicy(await readFile(resolve(workflowPath), 'utf8'));
  }
}
