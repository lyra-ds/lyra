import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { parse } from 'yaml';

const requiredHeadings = [
  'Status and owners',
  'Accepted contract',
  'Candidates',
  'Rejected alternatives',
  'Public API isolation',
  'Browser and assistive-technology evidence',
  'SSR and hydration evidence',
  'Standalone bundle comparison',
  'Scenario bundle comparison',
  'CSS and runtime impact',
  'Removed code and dependencies',
  'Migration impact',
  'Decision and consequences',
  'Approvals',
];

const requiredSubheadings = [
  'Shared measurement context and immutable artifacts',
  'CSS payload evidence',
  'Runtime responsiveness evidence',
];

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, '../..');
const templatePath = resolve(
  repositoryRoot,
  'docs/superpowers/templates/overlay-foundation-adr.md',
);
const templateLabel = 'docs/superpowers/templates/overlay-foundation-adr.md';
const baselinePath = resolve(repositoryRoot, 'docs/superpowers/baselines/lyra-v1/bundles.json');
const nodeVersionPath = resolve(repositoryRoot, '.nvmrc');
const workflowLabels = [
  '.github/workflows/ci.yml',
  '.github/workflows/deploy.yml',
  '.github/workflows/release.yml',
  '.github/workflows/sponsors.yml',
];

export function validateNodeToolchain({
  baseline,
  nodeVersion,
  workflows,
  labels = workflows.map((_, index) => (index === 0 ? 'ci.yml' : `workflow-${index + 1}.yml`)),
}) {
  const errors = [];

  if (!/^\d+\.\d+\.\d+$/.test(nodeVersion)) {
    errors.push(`.nvmrc must pin an exact Node version; found "${nodeVersion}".`);
  }
  if (`v${nodeVersion}` !== baseline.environment.node) {
    errors.push(
      `.nvmrc ${nodeVersion} does not match bundle baseline Node ${baseline.environment.node}.`,
    );
  }

  for (const [index, workflow] of workflows.entries()) {
    const document = parse(workflow);
    const jobs = Object.values(document?.jobs ?? {});
    const steps = jobs.flatMap((job) => (Array.isArray(job?.steps) ? job.steps : []));
    for (const step of steps) {
      if (typeof step?.uses !== 'string' || !step.uses.startsWith('actions/setup-node@')) continue;
      const versionFile = step.with?.['node-version-file'];
      if (versionFile !== '.nvmrc') {
        errors.push(
          `${labels[index]} must configure every setup-node step from .nvmrc; found node-version-file="${String(versionFile)}".`,
        );
      }
    }
  }

  return errors;
}

let template;

try {
  template = await readFile(templatePath, 'utf8');
} catch (error) {
  if (error.code === 'ENOENT') {
    console.error(`Missing required template: ${templateLabel}`);
    process.exitCode = 1;
  } else {
    throw error;
  }
}

if (template !== undefined) {
  const requiredStructure = [
    ...requiredHeadings.map((heading) => ({ level: 2, heading })),
    ...requiredSubheadings.map((heading) => ({ level: 3, heading })),
  ];
  const errors = requiredStructure.flatMap(({ level, heading }) => {
    const matches = template.match(new RegExp(`^${'#'.repeat(level)} ${heading}$`, 'gm')) ?? [];

    return matches.length === 1
      ? []
      : [`Expected exactly one level-${level} heading "${heading}"; found ${matches.length}.`];
  });

  if (errors.length > 0) {
    console.error(`${templateLabel} is structurally incomplete:`);
    console.error(errors.join('\n'));
    process.exitCode = 1;
  }
}

const [baselineText, nodeVersionText, ...workflowTexts] = await Promise.all([
  readFile(baselinePath, 'utf8'),
  readFile(nodeVersionPath, 'utf8'),
  ...workflowLabels.map((label) => readFile(resolve(repositoryRoot, label), 'utf8')),
]);
const baseline = JSON.parse(baselineText);
const nodeVersion = nodeVersionText.trim();
const toolchainErrors = validateNodeToolchain({
  baseline,
  nodeVersion,
  workflows: workflowTexts,
  labels: workflowLabels,
});

if (toolchainErrors.length > 0) {
  console.error('Phase 0 Node toolchain is not reproducible:');
  console.error(toolchainErrors.join('\n'));
  process.exitCode = 1;
}
