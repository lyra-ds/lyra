import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

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
