import { readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

function text(value) {
  return typeof value === 'string' ? value : '';
}

function hasBrowserMatrix(value) {
  const content = text(value);
  return ['Chromium', 'Firefox', 'WebKit'].every((browser) => content.includes(browser));
}

function hasChromiumOnlyClaim(value) {
  return /Chromium(?:\s|-)*only|(?:only|apenas|somente)\s+(?:uses?\s+)?Chromium|usa\s+(?:apenas|somente)\s+Chromium/iu.test(
    text(value),
  );
}

function automatedCoreCommandHasManualBundle(value) {
  return text(value)
    .split('\n')
    .some((line) => line.includes('--profile automated-core') && line.includes('--bundle'));
}

function hasApprovedDesignLink(value) {
  return text(value).includes('2026-08-27-lyra-v1-core-beta-release-design.md');
}

function hasAutomatedCoreAmendment(value) {
  const content = text(value);
  return (
    content.includes('#automated-core-release-profile') &&
    hasApprovedDesignLink(content) &&
    content.includes('Automated Core') &&
    content.includes('deferred-by-release-profile') &&
    content.includes('Full')
  );
}

function hasActiveAutomatedCorePath(value) {
  const content = text(value);
  return (
    content.includes('1. Produce a passing revision-bound automation archive.') &&
    content.includes(
      'pnpm evidence:file-upload:ingest --profile automated-core --automation "$automation_archive"',
    ) &&
    content.includes(
      '3. Review the explicit manual deferral, run every automated release gate, and commit the generated evidence.',
    ) &&
    content.includes('Optional Full profile') &&
    !automatedCoreCommandHasManualBundle(content)
  );
}

function hasPassingAutomatedScenario(report, scenario) {
  return new RegExp(
    `^\\|\\s*\`${scenario}\`\\s*\\|\\s*Automated\\s*\\|[^\\n|]*\\|[^\\n|]*\\|\\s*\\*\\*PASS\\*\\*\\s*\\|\\s*$`,
    'mu',
  ).test(report);
}

function hasExactAutomatedCoreEvidence(value) {
  const evidence = value ?? {};
  const revision = text(evidence.revision);
  const report = text(evidence.report);
  return (
    /^[0-9a-f]{40}$/u.test(revision) &&
    report.includes(`- Revision: \`${revision}\``) &&
    report.includes('- Release profile: **Automated Core**') &&
    report.includes('- Overall automated result: **PASS**') &&
    report.includes('- Manual assistive-technology evidence: `deferred-by-release-profile`') &&
    hasPassingAutomatedScenario(report, 'DF-FU-17') &&
    hasPassingAutomatedScenario(report, 'DF-FU-18')
  );
}

export function validateV1CorePolicy(inputs) {
  const ci = text(inputs?.ci);
  const design = text(inputs?.design);
  const documents = inputs?.documents ?? {};
  const errors = [];

  if (!ci.includes('pnpm v1-core:check')) {
    errors.push('CI must run `pnpm v1-core:check` in an existing job.');
  }
  if (!ci.includes('pnpm run test:browsers')) {
    errors.push('CI must retain the `pnpm run test:browsers` step.');
  }

  for (const guide of ['supportEn', 'supportPt']) {
    const content = text(documents[guide]);
    if (!hasBrowserMatrix(content) || hasChromiumOnlyClaim(content)) {
      errors.push(`${guide} must describe the current Chromium, Firefox, and WebKit CI matrix.`);
    } else if (!content.includes('deferred-by-release-profile')) {
      errors.push(`${guide} must label missing manual evidence \`deferred-by-release-profile\`.`);
    }
  }

  const phase0 = text(documents.phase0);
  if (!hasBrowserMatrix(phase0) || !phase0.includes('Automated Core')) {
    errors.push(
      'Phase 0 must describe the implemented Chromium, Firefox, and WebKit matrix under Automated Core.',
    );
  }

  if (!design.includes('Automated Core')) {
    errors.push('The canonical V1 specification must define Automated Core.');
  }
  if (!text(documents.family).includes('Automated Core')) {
    errors.push(
      'The Data and Files family specification must include its Automated Core amendment.',
    );
  }

  const resume = text(documents.resume);
  if (
    !resume.includes('--profile automated-core --automation') ||
    automatedCoreCommandHasManualBundle(resume)
  ) {
    errors.push(
      'The active Automated Core resume command must use automation evidence without a manual bundle.',
    );
  }

  const validatesRepositoryPolicy = typeof documents.lifecycle === 'string';
  if (validatesRepositoryPolicy) {
    const canonicalRule =
      'Missing manual evidence MUST be labeled `deferred-by-release-profile` and MUST NOT be represented as a pass. The Full profile retains the original manual requirements.';
    if (
      !design.includes('## Automated Core release profile') ||
      !hasApprovedDesignLink(design) ||
      !design.includes(canonicalRule)
    ) {
      errors.push(
        'The canonical V1 specification must retain the approved Automated Core rule and design link.',
      );
    }

    for (const [key, label] of [
      ['interaction', 'Interaction and accessibility'],
      ['architecture', 'Component architecture'],
      ['quality', 'Quality and performance'],
      ['phase1', 'Phase 1 accessibility'],
    ]) {
      if (!hasAutomatedCoreAmendment(documents[key])) {
        errors.push(`${label} must link the approved V1 Core beta release design.`);
      }
    }

    const family = text(documents.family);
    const approved = /^\*\*Status:\*\* Approved$/mu.test(family);
    const implemented =
      /^\*\*Status:\*\* Implemented under Automated Core — FileUpload wave$/mu.test(family);
    if (!approved && !implemented) {
      errors.push(
        'The Data and Files family status must remain `Approved` until exact evidence ingestion.',
      );
    } else if (implemented && !hasExactAutomatedCoreEvidence(documents.familyEvidence)) {
      errors.push(
        'The promoted Data and Files family status requires exact passing Automated Core evidence.',
      );
    }
    if (!hasApprovedDesignLink(family) || !family.includes('deferred-by-release-profile')) {
      errors.push(
        'The Data and Files family specification must link the approved design and disclose the Automated Core deferral.',
      );
    }

    if (!hasActiveAutomatedCorePath(documents.lifecycle)) {
      errors.push(
        'Task 10 must use the automation-only Automated Core path and retain an Optional Full profile.',
      );
    }

    if (
      !text(documents.supportEn).includes('Component stability') ||
      !text(documents.supportEn).includes('FileUpload is Stable') ||
      !/[Ee]very other catalog entry remains Beta/u.test(text(documents.supportEn))
    ) {
      errors.push('The English support guide must retain its component-stability policy.');
    }
    if (
      !text(documents.supportPt).includes('Estabilidade dos componentes') ||
      !text(documents.supportPt).includes('FileUpload é Estável') ||
      !text(documents.supportPt).includes('outras entradas do catálogo permanecem Beta')
    ) {
      errors.push(
        'The Brazilian Portuguese support guide must retain its component-stability policy.',
      );
    }
  }

  return errors;
}

async function readRepositoryFile(path) {
  return readFile(resolve(repositoryRoot, path), 'utf8');
}

async function readAutomatedCoreEvidence() {
  const directory = resolve(
    repositoryRoot,
    'docs/superpowers/baselines/lyra-v1/comparisons/file-upload',
  );
  const names = await readdir(directory);
  for (const name of names.sort()) {
    const match = /^([0-9a-f]{40})-accessibility\.md$/u.exec(name);
    if (!match) continue;
    const report = await readFile(resolve(directory, name), 'utf8');
    const evidence = { revision: match[1], report };
    if (hasExactAutomatedCoreEvidence(evidence)) return evidence;
  }
  return { revision: '', report: '' };
}

async function main() {
  const [
    ci,
    design,
    supportEn,
    supportPt,
    phase0,
    family,
    resume,
    interaction,
    architecture,
    quality,
    phase1,
    lifecycle,
  ] = await Promise.all([
    readRepositoryFile('.github/workflows/ci.yml'),
    readRepositoryFile('docs/superpowers/specs/lyra-v1/README.md'),
    readRepositoryFile('apps/docs/content/docs/en/guides/support.mdx'),
    readRepositoryFile('apps/docs/content/docs/pt-BR/guides/support.mdx'),
    readRepositoryFile('docs/superpowers/baselines/lyra-v1/README.md'),
    readRepositoryFile('docs/superpowers/specs/2026-08-15-data-files-family-design.md'),
    readRepositoryFile('docs/superpowers/plans/2026-08-18-file-upload-evidence-resume.md'),
    readRepositoryFile('docs/superpowers/specs/lyra-v1/03-interaction-accessibility.md'),
    readRepositoryFile('docs/superpowers/specs/lyra-v1/04-component-architecture.md'),
    readRepositoryFile('docs/superpowers/specs/lyra-v1/05-quality-performance.md'),
    readRepositoryFile(
      'docs/superpowers/specs/2026-08-13-lyra-v1-phase-1-system-accessibility-design.md',
    ),
    readRepositoryFile('docs/superpowers/plans/2026-08-16-file-upload-controlled-lifecycle.md'),
  ]);
  const familyEvidence = await readAutomatedCoreEvidence();
  const errors = validateV1CorePolicy({
    ci,
    design,
    documents: {
      architecture,
      family,
      familyEvidence,
      interaction,
      lifecycle,
      phase0,
      phase1,
      quality,
      resume,
      supportEn,
      supportPt,
    },
  });

  if (errors.length === 0) {
    console.log('Lyra V1 Core policy is internally consistent.');
    return;
  }

  console.error('Lyra V1 Core policy is inconsistent:');
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main();
}
