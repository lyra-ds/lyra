import assert from 'node:assert/strict';
import { test } from 'node:test';

import { validateV1CorePolicy } from './check.mjs';

function validInputs() {
  return {
    ci: '- run: pnpm v1-core:check\n- run: pnpm run test:browsers\n',
    design: 'Automated Core',
    documents: {
      supportEn:
        'CI runs Chromium, Firefox, and WebKit. Manual evidence: deferred-by-release-profile.',
      supportPt:
        'O CI executa Chromium, Firefox e WebKit. Evidência manual: deferred-by-release-profile.',
      phase0: 'CI runs Chromium, Firefox, and WebKit under Automated Core.',
      family: 'Implemented under Automated Core',
      resume: '--profile automated-core --automation',
    },
  };
}

function repositoryPolicyInputs() {
  const inputs = validInputs();
  inputs.design = `
## Automated Core release profile
[Approved design](../2026-08-27-lyra-v1-core-beta-release-design.md)
A release explicitly using Automated Core requires every applicable automated layer and treats manual assistive-technology evidence as non-blocking post-release evidence. Missing manual evidence MUST be labeled \`deferred-by-release-profile\` and MUST NOT be represented as a pass. The Full profile retains the original manual requirements.
`;
  inputs.documents.supportEn +=
    ' Component stability: FileUpload is Stable under Automated Core; every other catalog entry remains Beta.';
  inputs.documents.supportPt +=
    ' Estabilidade dos componentes: FileUpload é Estável sob Automated Core; outras entradas do catálogo permanecem Beta.';
  const amendment = `
[Canonical](./README.md#automated-core-release-profile)
[Approved design](../2026-08-27-lyra-v1-core-beta-release-design.md)
Automated Core labels missing manual evidence deferred-by-release-profile and retains the Full profile.
`;
  inputs.documents.interaction = amendment;
  inputs.documents.architecture = amendment;
  inputs.documents.quality = amendment;
  inputs.documents.phase1 = amendment;
  inputs.documents.family = `
**Status:** Approved
[Approved design](2026-08-27-lyra-v1-core-beta-release-design.md)
Automated Core amendment; deferred-by-release-profile; Optional Full profile.
`;
  inputs.documents.lifecycle = `
1. Produce a passing revision-bound automation archive.
2. Run \`pnpm evidence:file-upload:ingest --profile automated-core --automation "$automation_archive"\`, where \`automation_archive\` is the exact validated workflow download.
3. Review the explicit manual deferral, run every automated release gate, and commit the generated evidence.
#### Optional Full profile
`;
  inputs.documents.resume = `${inputs.documents.lifecycle}
rtk pnpm evidence:file-upload:ingest --automation <path> --bundle <path>
`;
  return inputs;
}

test('accepts an internally consistent Automated Core policy', () => {
  assert.deepEqual(validateV1CorePolicy(validInputs()), []);
});

test('reports a missing V1 Core checker step', () => {
  const inputs = validInputs();
  inputs.ci = '- run: pnpm run test:browsers\n';

  assert.deepEqual(validateV1CorePolicy(inputs), [
    'CI must run `pnpm v1-core:check` in an existing job.',
  ]);
});

test('reports a missing browser matrix step', () => {
  const inputs = validInputs();
  inputs.ci = '- run: pnpm v1-core:check\n';

  assert.deepEqual(validateV1CorePolicy(inputs), [
    'CI must retain the `pnpm run test:browsers` step.',
  ]);
});

for (const [guide, chromiumOnlyClaim] of [
  ['supportEn', 'Current CI is Chromium-only. Manual evidence: deferred-by-release-profile.'],
  ['supportPt', 'O CI atual usa apenas Chromium. Evidência manual: deferred-by-release-profile.'],
]) {
  test(`rejects a Chromium-only claim in ${guide}`, () => {
    const inputs = validInputs();
    inputs.documents[guide] = chromiumOnlyClaim;

    assert.deepEqual(validateV1CorePolicy(inputs), [
      `${guide} must describe the current Chromium, Firefox, and WebKit CI matrix.`,
    ]);
  });
}

for (const guide of ['supportEn', 'supportPt']) {
  test(`requires the Automated Core manual deferral disclosure in ${guide}`, () => {
    const inputs = validInputs();
    inputs.documents[guide] = inputs.documents[guide].replace(
      'deferred-by-release-profile',
      'pending',
    );

    assert.deepEqual(validateV1CorePolicy(inputs), [
      `${guide} must label missing manual evidence \`deferred-by-release-profile\`.`,
    ]);
  });
}

test('requires Phase 0 to describe the implemented browser matrix', () => {
  const inputs = validInputs();
  inputs.documents.phase0 = 'CI runs Chromium under Automated Core.';

  assert.deepEqual(validateV1CorePolicy(inputs), [
    'Phase 0 must describe the implemented Chromium, Firefox, and WebKit matrix under Automated Core.',
  ]);
});

test('requires the family specification Automated Core amendment', () => {
  const inputs = validInputs();
  inputs.documents.family = 'Status: Approved';

  assert.deepEqual(validateV1CorePolicy(inputs), [
    'The Data and Files family specification must include its Automated Core amendment.',
  ]);
});

test('rejects a manual bundle in the Automated Core resume command', () => {
  const inputs = validInputs();
  inputs.documents.resume =
    '--profile automated-core --automation "$automation_archive" --bundle "$manual_bundle"';

  assert.deepEqual(validateV1CorePolicy(inputs), [
    'The active Automated Core resume command must use automation evidence without a manual bundle.',
  ]);
});

test('accepts the complete repository policy relationships', () => {
  assert.deepEqual(validateV1CorePolicy(repositoryPolicyInputs()), []);
});

test('requires every normative amendment to link the approved design', () => {
  const inputs = repositoryPolicyInputs();
  inputs.documents.interaction = inputs.documents.interaction.replace(
    '../2026-08-27-lyra-v1-core-beta-release-design.md',
    '../unapproved-design.md',
  );

  assert.deepEqual(validateV1CorePolicy(inputs), [
    'Interaction and accessibility must link the approved V1 Core beta release design.',
  ]);
});

test('keeps the Data and Files family status Approved before evidence ingestion', () => {
  const inputs = repositoryPolicyInputs();
  inputs.documents.family = inputs.documents.family.replace(
    '**Status:** Approved',
    '**Status:** Implemented under Automated Core',
  );

  assert.deepEqual(validateV1CorePolicy(inputs), [
    'The Data and Files family status must remain `Approved` until exact evidence ingestion.',
  ]);
});

test('guards the active Task 10 Automated Core path', () => {
  const inputs = repositoryPolicyInputs();
  inputs.documents.lifecycle = inputs.documents.lifecycle.replace(
    '--automation "$automation_archive"',
    '--automation "$automation_archive" --bundle "$manual_bundle"',
  );

  assert.deepEqual(validateV1CorePolicy(inputs), [
    'Task 10 must use the automation-only Automated Core path and retain an Optional Full profile.',
  ]);
});
