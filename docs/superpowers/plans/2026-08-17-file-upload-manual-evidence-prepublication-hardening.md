# FileUpload Manual Evidence Pre-Publication Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the three material pre-publication review findings so incomplete records, moving deployment aliases, and unreachable deployed scenario surfaces cannot pass the evidence gates.

**Architecture:** Keep the observation validator as the single ingestion/export authority, with one closed scenario-to-check-ID map shared by the recorder and M03 eligibility. Enforce the immutable Pages route at the schema boundary and derive the displayed URL without query or fragment data. Extend the existing real-browser smoke so its success result is derived from observed localized React surfaces rather than constants.

**Tech Stack:** TypeScript 5.9, React 19, Vitest 4 Browser Mode, Playwright, Node.js ESM, Vite, pnpm 11.

## Global Constraints

- Work in `/home/franciscpd/Projects/lyra-ds/lyra-next-evidence-cycle` from reviewed head `af97cf04e541d49f63307b4bdb94957281170531` plus design commit `1a8ab4fc2352f7f51de021e207132a80f869c85e`.
- Prefix every shell command with `rtk` as required by `/home/franciscpd/.codex/RTK.md`.
- Read `docs/superpowers/specs/2026-08-17-file-upload-manual-evidence-harness-design.md` before editing.
- Use strict TDD: add a discriminating test, observe the intended RED, implement the minimum root-cause fix, then run the identical test GREEN.
- Do not change FileUpload package behavior, evidence thresholds, performance profiles, workflow deployment policy, endpoint size/delay/origin boundaries, or Cloudflare configuration.
- Do not create `docs/superpowers/evidence/2026-08-16-file-upload-manual.md`.
- Do not push, dispatch, deploy, call Cloudflare, publish a preview, or create a manual evidence record.
- Preserve all historical performance peers and the accepted pointer unless a product change in this plan makes the existing peer check fail; such a failure is `NEEDS_CONTEXT`, not authority to recollect.
- Keep every new visible string and validation error structurally paired in English and Brazilian Portuguese.
- A `FAIL` record uses the same exact attestation key set as `PASS` but may retain `false`; a `PASS` record requires every applicable attestation to be `true`.
- The branch alias `file-upload-evidence.lyra-ds-docs.pages.dev` is never an acceptable evidence-record deployment URL.
- Automated scenario traversal proves instrument fitness only; it never produces or marks M01–M04 manual evidence.

---

### Task 1: Make scenario completion part of the evidence contract

**Files:**

- Modify: `tools/file-upload-evidence/src/contracts.ts`
- Modify: `tools/file-upload-evidence/src/contracts.test.ts`
- Modify: `tools/file-upload-evidence/src/messages.ts`
- Modify: `tools/file-upload-evidence/src/messages.test.ts`
- Modify: `tools/file-upload-evidence/src/telemetry.ts`
- Modify: `tools/file-upload-evidence/src/telemetry.test.ts`
- Modify: `tools/file-upload-evidence/src/harness-app.tsx`
- Modify: `tools/file-upload-evidence/src/harness-app.browser.test.tsx`
- Modify: `.superpowers/sdd/2026-08-16-file-upload-controlled-lifecycle/task-10-report.md` (ignored report only)

**Interfaces:**

- Produces `SCENARIO_CHECK_IDS: Record<ManualScenario, readonly ScenarioCheckId[]>` as the only authoritative scenario/check topology.
- Adds `checkAttestations: Record<string, boolean>` to `FileUploadManualObservation`.
- `validateObservation(value)` requires the exact applicable keys, rejects extra/cross-scenario keys, preserves all booleans, and rejects `PASS` when any value is false.
- `m03Eligibility(telemetry, inputMethods, completedChecks)` consumes the six M03 IDs from `SCENARIO_CHECK_IDS['DF-FU-M03']`; it does not own a second ID list.
- The recorder stores attestations inside each scenario draft. Locale changes and first selection of a scenario create a fresh exact false-valued record.

- [ ] **Step 1: Add closed contract RED tests**

Extend the valid fixture with exact M03 attestations and add table-driven cases for every scenario:

```ts
const checkAttestations = Object.fromEntries(
  SCENARIO_CHECK_IDS['DF-FU-M03'].map((id) => [id, true]),
);

function observationFor(
  scenario: ManualScenario,
  checkAttestations: Record<string, boolean>,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    ...valid,
    scenario,
    checkAttestations,
    assistiveTechnology:
      scenario === 'DF-FU-M01' || scenario === 'DF-FU-M02'
        ? { name: 'NVDA', version: '2026.2' }
        : null,
    ...overrides,
  };
}

it.each(Object.entries(SCENARIO_CHECK_IDS))(
  'requires the exact %s attestation keys for PASS',
  (scenario, requiredIds) => {
    const complete = Object.fromEntries(requiredIds.map((id) => [id, true]));
    const missing = Object.fromEntries(requiredIds.slice(1).map((id) => [id, true]));
    const falseValue = { ...complete, [requiredIds[0]]: false };
    const extra = { ...complete, 'DF-FU-M99-foreign-check': true };

    expect(validateObservation(observationFor(scenario, complete))).toMatchObject({ ok: true });
    expect(validateObservation(observationFor(scenario, missing))).toMatchObject({
      ok: false,
      errors: [{ field: 'checkAttestations' }],
    });
    expect(validateObservation(observationFor(scenario, falseValue))).toMatchObject({
      ok: false,
      errors: [{ field: 'checkAttestations' }],
    });
    expect(validateObservation(observationFor(scenario, extra))).toMatchObject({
      ok: false,
      errors: [{ field: 'checkAttestations' }],
    });
  },
);

it('preserves false attestations in a FAIL record', () => {
  const checkAttestations = Object.fromEntries(
    SCENARIO_CHECK_IDS['DF-FU-M04'].map((id, index) => [id, index !== 1]),
  );
  const result = validateObservation(
    observationFor('DF-FU-M04', checkAttestations, {
      result: 'FAIL',
      reviewer: { name: 'Evidence Reviewer', approval: 'changes-requested' },
    }),
  );
  expect(result).toMatchObject({ ok: true, value: { checkAttestations } });
});
```

- [ ] **Step 2: Run the contract tests and record the RED**

Run:

```text
rtk pnpm --filter @lyra-ds/file-upload-evidence exec vitest run src/contracts.test.ts src/messages.test.ts src/telemetry.test.ts
```

Expected: FAIL because `SCENARIO_CHECK_IDS` and `checkAttestations` do not exist and the validator currently accepts PASS without workflow completion.

- [ ] **Step 3: Define the stable scenario/check topology**

Add one readonly constant to `contracts.ts` with these exact values:

```ts
export const SCENARIO_CHECK_IDS = {
  'DF-FU-M01': [
    'DF-FU-M01-selection-and-indeterminate-announcements',
    'DF-FU-M01-determinate-progress-milestones',
    'DF-FU-M01-lifecycle-recovery-and-stale-result',
  ],
  'DF-FU-M02': [
    'DF-FU-M02-selection-and-indeterminate-announcements',
    'DF-FU-M02-determinate-progress-milestones',
    'DF-FU-M02-lifecycle-recovery-and-stale-result',
  ],
  'DF-FU-M03': [
    'DF-FU-M03-no-horizontal-overflow',
    'DF-FU-M03-long-file-identity-retained',
    'DF-FU-M03-actions-reachable',
    'DF-FU-M03-active-replacement-rejected-and-announced',
    'DF-FU-M03-cancel-retry-remove-completed',
    'DF-FU-M03-focus-recovered',
  ],
  'DF-FU-M04': [
    'DF-FU-M04-native-js-disabled-form-submitted',
    'DF-FU-M04-delayed-alpine-node-filelist-preserved',
    'DF-FU-M04-single-enhancement-path-removal-focus',
  ],
} as const satisfies Record<ManualScenario, readonly string[]>;

export type ScenarioCheckId = (typeof SCENARIO_CHECK_IDS)[ManualScenario][number];
```

Add the `checkAttestations` field to the exported observation interface. Add localized `validation.checkAttestations` messages whose English meaning is “Complete the exact guided checklist for this scenario” and whose PT-BR meaning is “Conclua o checklist guiado exato deste cenário.” Keep message key-path parity green.

- [ ] **Step 4: Implement exact attestation normalization**

In `validateObservation`, after resolving `scenario`, normalize `source.checkAttestations` only when it is a non-array object whose sorted keys equal the sorted `SCENARIO_CHECK_IDS[scenario]` keys and every value is boolean. Reject the field when the topology is wrong. If `result === 'PASS'`, reject the field when any applicable value is not `true`. Clone the normalized record into the successful value so later caller mutation cannot alter validated evidence.

Use a helper with this boundary:

```ts
function normalizedCheckAttestations(
  value: unknown,
  scenario: ManualScenario | undefined,
): Record<string, boolean> | undefined;
```

- [ ] **Step 5: Run the contract tests GREEN**

Run the identical command from Step 2.

Expected: all focused contract/message/telemetry tests pass; the validator preserves a false-valued FAIL record and rejects every incomplete PASS mutation.

- [ ] **Step 6: Write recorder RED tests for every rendered checklist**

In `harness-app.browser.test.tsx`, change valid deployment fixtures to `https://a1b2c3d4.lyra-ds-docs.pages.dev/<locale>/file-upload-evidence/`. Add helpers that select a scenario and tick its localized rows. Add a table-driven test that completes all non-checklist fields, leaves one rendered check false, and proves both Copy and Download remain disabled for M01, M02, M03, and M04. Then check the missing row, export, and assert JSON contains the exact applicable `checkAttestations` keys with all values true.

Add a separate FAIL case that leaves one M04 check false, chooses `FAIL` plus `changes-requested`, exports, and asserts the false value is retained.

- [ ] **Step 7: Run the recorder test and record the RED**

Run:

```text
rtk pnpm --filter @lyra-ds/react run build
rtk pnpm --filter @lyra-ds/alpine run build
rtk pnpm --filter @lyra-ds/file-upload-evidence exec vitest run --config vitest.browser.config.ts --project chromium src/harness-app.browser.test.tsx
```

Expected: FAIL because M01/M02/M04 checkbox state is not part of drafts/JSON and incomplete PASS remains exportable.

- [ ] **Step 8: Replace transient checklist state with draft attestations**

In `harness-app.tsx`:

- initialize `checkAttestations` from `SCENARIO_CHECK_IDS[scenario]`, every value false;
- remove the separate `guidedChecks` and `ManualM03State` sources of truth;
- type localized check labels as `Record<ScenarioCheckId, string>` and render rows by the authoritative ID array;
- update a row by immutably updating `draft.checkAttestations[id]`;
- derive completed M03 IDs from true draft values and pass them to `m03Eligibility`;
- include the exact record in `observationValue` and exported JSON;
- let `validateObservation` disable incomplete PASS exports for every scenario;
- preserve false values for FAIL exports.

In `telemetry.ts`, import `SCENARIO_CHECK_IDS` and replace `MANUAL_M03_CHECKS` with that authoritative array. Update the focused telemetry expectation from four aggregated checks to all six M03 IDs.

- [ ] **Step 9: Run recorder and package regression tests GREEN**

Run:

```text
rtk pnpm --filter @lyra-ds/file-upload-evidence exec vitest run --config vitest.browser.config.ts --project chromium src/harness-app.browser.test.tsx
rtk pnpm run evidence:file-upload:manual:test
rtk pnpm --filter @lyra-ds/file-upload-evidence run typecheck
```

Expected: focused Chromium and all package Node tests pass. The copied/downloaded JSON contains exact stable attestations and no obsolete `manualChecks` field.

- [ ] **Step 10: Update the operational report and commit Task 1**

Record RED/GREEN output, exact IDs, PASS/FAIL semantics, and changed files in the ignored Task 10 report. Then run:

```text
rtk pnpm exec prettier --check tools/file-upload-evidence/src
rtk git diff --check
rtk git add tools/file-upload-evidence/src/contracts.ts tools/file-upload-evidence/src/contracts.test.ts
rtk git add tools/file-upload-evidence/src/messages.ts tools/file-upload-evidence/src/messages.test.ts
rtk git add tools/file-upload-evidence/src/telemetry.ts tools/file-upload-evidence/src/telemetry.test.ts
rtk git add tools/file-upload-evidence/src/harness-app.tsx tools/file-upload-evidence/src/harness-app.browser.test.tsx
rtk git commit -m "fix: require manual scenario attestations"
```

---

### Task 2: Enforce immutable deployment routes in exported records

**Files:**

- Modify: `tools/file-upload-evidence/src/contracts.ts`
- Modify: `tools/file-upload-evidence/src/contracts.test.ts`
- Modify: `tools/file-upload-evidence/src/main.tsx`
- Modify: `tools/file-upload-evidence/src/harness-app.browser.test.tsx`
- Modify: `.superpowers/sdd/2026-08-16-file-upload-controlled-lifecycle/task-10-report.md` (ignored report only)

**Interfaces:**

- Produces `deploymentUrlFromLocation(location): string`, which returns normalized `origin + pathname` and excludes search/hash data.
- Produces `isImmutableDeploymentRoute(value, locale): boolean`, used by `validateObservation`.
- Valid routes are HTTPS, have no credentials or explicit port, match `<deployment>.lyra-ds-docs.pages.dev`, are not the `file-upload-evidence` alias, and use exactly `/<locale>/file-upload-evidence/` with no query or fragment.
- The read-only UI may display an invalid alias/local URL, but validation and both export actions remain blocked with localized `deploymentUrl` feedback.

- [ ] **Step 1: Write immutable-route RED tests**

In `contracts.test.ts`, use `https://a1b2c3d4.lyra-ds-docs.pages.dev/pt-BR/file-upload-evidence/` as the valid PT-BR fixture. Add mutations for:

```ts
const rejectedDeploymentUrls = [
  'https://file-upload-evidence.lyra-ds-docs.pages.dev/pt-BR/file-upload-evidence/',
  'https://a1b2c3d4.example.test/pt-BR/file-upload-evidence/',
  'https://user:password@a1b2c3d4.lyra-ds-docs.pages.dev/pt-BR/file-upload-evidence/',
  'https://a1b2c3d4.lyra-ds-docs.pages.dev:8443/pt-BR/file-upload-evidence/',
  'https://a1b2c3d4.lyra-ds-docs.pages.dev/en/file-upload-evidence/',
  'https://a1b2c3d4.lyra-ds-docs.pages.dev/pt-BR/file-upload-evidence/?alpineDelay=5000',
  'https://a1b2c3d4.lyra-ds-docs.pages.dev/pt-BR/file-upload-evidence/#record',
];
```

Each must return a localized `deploymentUrl` validation error. Add a pure test proving `deploymentUrlFromLocation` turns a location with `?alpineDelay=5000#record` into the immutable locale route without query/fragment.

- [ ] **Step 2: Run the contract test and record the RED**

Run:

```text
rtk pnpm --filter @lyra-ds/file-upload-evidence exec vitest run src/contracts.test.ts
```

Expected: FAIL because the current validator accepts any HTTPS URL and `deploymentUrlFromLocation` is absent.

- [ ] **Step 3: Implement immutable route validation and normalization**

Add these exact public boundaries in `contracts.ts`:

```ts
const immutableDeploymentHostPattern = /^[a-z0-9-]{8,}\.lyra-ds-docs\.pages\.dev$/u;
const movingBranchAlias = 'file-upload-evidence.lyra-ds-docs.pages.dev';

export function deploymentUrlFromLocation(location: Pick<Location, 'origin' | 'pathname'>): string {
  return new URL(location.pathname, location.origin).href;
}

export function isImmutableDeploymentRoute(value: string, locale: Locale): boolean;
```

The predicate parses once and requires protocol `https:`, empty username/password/port/search/hash, non-alias host matching the immutable pattern, and pathname exactly `/${locale}/file-upload-evidence/`. Replace `isHttpsUrl(deploymentUrl)` with this predicate; artifact and finding URLs remain general HTTPS URLs.

In `main.tsx`, replace `window.location.href` with `deploymentUrlFromLocation(window.location)` so the M04 Alpine delay query never enters the evidence record.

- [ ] **Step 4: Run contract and type tests GREEN**

Run:

```text
rtk pnpm --filter @lyra-ds/file-upload-evidence exec vitest run src/contracts.test.ts
rtk pnpm --filter @lyra-ds/file-upload-evidence run typecheck
```

Expected: immutable EN/PT-BR routes pass; every alias, host, credential, port, locale, query, and fragment mutation fails.

- [ ] **Step 5: Write and run recorder alias RED/GREEN coverage**

Add one Browser Mode test that renders a fully complete approved record at the branch alias, verifies localized deployment URL validation, and proves Copy/Download stay disabled. Rerender with the immutable route and prove export becomes enabled without mutating the read-only field.

Run:

```text
rtk pnpm --filter @lyra-ds/file-upload-evidence exec vitest run --config vitest.browser.config.ts --project chromium src/harness-app.browser.test.tsx
```

Expected before the contract fix: alias export is incorrectly enabled. Expected after the implementation: the alias case is blocked and immutable route case passes.

- [ ] **Step 6: Update the operational report and commit Task 2**

Record the URL boundary and RED/GREEN output. Then run:

```text
rtk pnpm exec prettier --check tools/file-upload-evidence/src/contracts.ts tools/file-upload-evidence/src/contracts.test.ts tools/file-upload-evidence/src/main.tsx tools/file-upload-evidence/src/harness-app.browser.test.tsx
rtk git diff --check
rtk git add tools/file-upload-evidence/src/contracts.ts tools/file-upload-evidence/src/contracts.test.ts
rtk git add tools/file-upload-evidence/src/main.tsx tools/file-upload-evidence/src/harness-app.browser.test.tsx
rtk git commit -m "fix: require immutable evidence deployment routes"
```

---

### Task 3: Prove all deployed localized scenarios in remote smoke

**Files:**

- Modify: `tools/file-upload-evidence/scripts/smoke.mjs`
- Modify: `tools/file-upload-evidence/scripts/smoke.test.mjs`
- Modify: `.superpowers/sdd/2026-08-16-file-upload-controlled-lifecycle/task-10-report.md` (ignored report only)

**Interfaces:**

- `uploadWithBrowser({ payloadMarker, revision, url })` observes both localized recorder routes before performing the existing trusted XHR upload.
- The browser result includes `scenarioSurfaces`, derived from DOM observations rather than static constants.
- `validateScenarioSurfaces(value)` requires route locale, the exact ordered four scenario IDs/labels, a selected scenario-specific localized checklist marker, and a visible observation editor for every scenario.
- `runSmoke` returns the observed locale list only after scenario-surface validation, native metadata validation, revision parity, payload non-echo, and real computable upload progress all pass.

- [ ] **Step 1: Write smoke surface RED tests**

Define a passing collaborator result containing two observed route records. Add mutations that remove M04, return the wrong PT-BR label, mark the React recorder as unmounted, or omit one scenario marker. Each mutation must reject for a scenario-reachability reason before smoke reports success.

Use this result shape; every `visited` entry is created from the selected DOM option, the visible localized checklist text, and the visible observation input:

```js
scenarioSurfaces: [
  {
    locale: 'en',
    recorderMounted: true,
    options: [
      { id: 'DF-FU-M01', label: 'DF-FU-M01 — Windows, NVDA, and a current browser' },
      { id: 'DF-FU-M02', label: 'DF-FU-M02 — macOS, VoiceOver, and Safari' },
      { id: 'DF-FU-M03', label: 'DF-FU-M03 — keyboard, touch, and a 320 CSS pixel viewport' },
      { id: 'DF-FU-M04', label: 'DF-FU-M04 — native form and delayed Alpine initialization' },
    ],
    visited: [
      {
        id: 'DF-FU-M01',
        checklistMarker: 'Verify selection and indeterminate upload announcements with NVDA.',
        observationEditorVisible: true,
      },
      {
        id: 'DF-FU-M02',
        checklistMarker: 'Verify selection and indeterminate upload announcements with VoiceOver and Safari.',
        observationEditorVisible: true,
      },
      {
        id: 'DF-FU-M03',
        checklistMarker: 'No horizontal overflow observed',
        observationEditorVisible: true,
      },
      {
        id: 'DF-FU-M04',
        checklistMarker: 'Submit the authored native form with JavaScript disabled and retain the response evidence.',
        observationEditorVisible: true,
      },
    ],
  },
  {
    locale: 'pt-BR',
    recorderMounted: true,
    options: [
      { id: 'DF-FU-M01', label: 'DF-FU-M01 — Windows, NVDA e navegador atual' },
      { id: 'DF-FU-M02', label: 'DF-FU-M02 — macOS, VoiceOver e Safari' },
      { id: 'DF-FU-M03', label: 'DF-FU-M03 — teclado, toque e viewport de 320 pixels CSS' },
      { id: 'DF-FU-M04', label: 'DF-FU-M04 — formulário nativo e inicialização Alpine atrasada' },
    ],
    visited: [
      {
        id: 'DF-FU-M01',
        checklistMarker: 'Verifique os anúncios de seleção e envio indeterminado com NVDA.',
        observationEditorVisible: true,
      },
      {
        id: 'DF-FU-M02',
        checklistMarker: 'Verifique os anúncios de seleção e envio indeterminado com VoiceOver e Safari.',
        observationEditorVisible: true,
      },
      {
        id: 'DF-FU-M03',
        checklistMarker: 'Nenhum overflow horizontal observado',
        observationEditorVisible: true,
      },
      {
        id: 'DF-FU-M04',
        checklistMarker: 'Envie o formulário nativo autorado com JavaScript desativado e guarde a evidência da resposta.',
        observationEditorVisible: true,
      },
    ],
  },
],
```

Each visited scenario must additionally be produced only after the browser observes its unique localized checklist marker and the visible `os.name` observation input.

- [ ] **Step 2: Run smoke tests and record the RED**

Run:

```text
rtk pnpm --filter @lyra-ds/file-upload-evidence exec vitest run scripts/smoke.test.mjs
```

Expected: FAIL because the current browser collaborator returns no scenario surfaces and `runSmoke` derives locales from a constant.

- [ ] **Step 3: Implement DOM-derived scenario traversal**

In the real Playwright path, for each `en` and `pt-BR` route:

1. navigate to the immutable route and wait for `select[name="scenario"]` to be visible;
2. read the actual option values and text from the DOM;
3. require the exact ordered four localized options;
4. select each scenario ID;
5. wait for its unique localized checklist label and `input[name="os.name"]` to be visible;
6. append the ID to `visited` only after both observations succeed;
7. record `document.documentElement.lang` as the observed locale.

Use explicit EN/PT-BR expectation data in `smoke.mjs`; do not import test fixtures or construct the observed result from those expectations. Keep the existing 8 MiB XHR upload in the English page after both route traversals.

- [ ] **Step 4: Validate observed surfaces before returning smoke success**

Add and export:

```js
export function validateScenarioSurfaces(value) {
  // Throws unless both observed routes have the exact localized options,
  // all four DOM-visited scenario IDs, and a mounted recorder.
}
```

Call it before validating XHR metadata/progress. Return `locales` from validated observed route objects, not from the static expectation constant.

- [ ] **Step 5: Run smoke and policy regressions GREEN**

Run:

```text
rtk pnpm --filter @lyra-ds/file-upload-evidence exec vitest run scripts/smoke.test.mjs scripts/deploy-policy.test.mjs
rtk pnpm run evidence:file-upload:manual:test
```

Expected: smoke mutations fail for their own cause; all package tests pass; policy behavior remains unchanged.

- [ ] **Step 6: Update the operational report and commit Task 3**

Record RED/GREEN details and that no remote smoke was executed. Then run:

```text
rtk pnpm exec prettier --check tools/file-upload-evidence/scripts/smoke.mjs tools/file-upload-evidence/scripts/smoke.test.mjs
rtk git diff --check
rtk git add tools/file-upload-evidence/scripts/smoke.mjs tools/file-upload-evidence/scripts/smoke.test.mjs
rtk git commit -m "fix: verify deployed evidence scenario surfaces"
```

---

### Task 4: Re-run changed-boundary gates and independent review

**Files:**

- Modify: `.superpowers/sdd/2026-08-16-file-upload-controlled-lifecycle/task-10-report.md` (ignored report only)
- Do not create: `docs/superpowers/evidence/2026-08-16-file-upload-manual.md`

**Interfaces:**

- Produces one clean reviewed SHA and a gate report for publication authorization.
- Does not create a Git ref, push, dispatch, deploy, call Cloudflare, run remote smoke, or claim Task 10 completion.

- [ ] **Step 1: Run fresh local gates from a clean tree**

Run in order and capture exit status/counts:

```text
rtk pnpm install --frozen-lockfile
rtk pnpm --filter @lyra-ds/styles run lint:css
rtk pnpm --filter @lyra-ds/react run lint
rtk pnpm --filter @lyra-ds/react run typecheck
rtk pnpm --filter @lyra-ds/alpine run typecheck
rtk pnpm --filter @lyra-ds/file-upload-evidence run typecheck
rtk pnpm run evidence:file-upload:manual:test
rtk pnpm --filter @lyra-ds/docs run build
rtk pnpm run parity
rtk pnpm run baseline:bundles --check
rtk pnpm run performance:file-upload --check
rtk pnpm run lint
rtk git diff --check
rtk git status --short
```

Any failure blocks publication. Diagnose once; do not rerun until the cause is known.

- [ ] **Step 2: Run the focused three-engine gate in the pinned image**

Use the exact Playwright image/digest from `tools/phase1/browser-matrix.mjs` with `--init`, `--ipc=host`, `CI=true`, pnpm 11.13.1 frozen install, and a detached clean clone. Build `@lyra-ds/react` and `@lyra-ds/alpine` first because their package exports target `dist`. Then run exactly once:

```text
rtk pnpm run evidence:file-upload:manual:browser
```

Expected: changed recorder acceptance passes in Chromium, Firefox, and WebKit. Preserve the host ICU limitation as environmental history; do not install host libraries.

- [ ] **Step 3: Run checksum-verified actionlint**

Use the repository's actionlint 1.7.12 procedure and checksum `8aca8db96f1b94770f1b0d72b6dddcb1ebb8123cb3712530b08cc387b349a3d8` from `.github/workflows/ci.yml` against `.github/workflows/deploy.yml`. Expected: checksum and workflow lint pass with no network deployment action.

- [ ] **Step 4: Request changed-boundary independent review**

Provide the reviewer:

- approved design commit `1a8ab4fc2352f7f51de021e207132a80f869c85e`;
- correction base `af97cf04e541d49f63307b4bdb94957281170531` and final head;
- full real diff and Task 1–3 reports;
- focused RED/GREEN and official C/F/W evidence;
- the three original Important findings verbatim.

Require explicit answers:

1. Does every scenario export the exact attestations, with incomplete PASS impossible and incomplete FAIL preserved?
2. Can alias, unrelated host, credentials, port, locale mismatch, query, or fragment enter an exported record?
3. Does the real smoke derive both locales and all four visited scenarios from deployed DOM observations, including localized guidance and mounted recorder controls?
4. Did any fix weaken M03 truthfulness, trusted upload progress, workflow policy, production isolation, or performance thresholds?

No Critical or Important finding may remain.

- [ ] **Step 5: Close the corrective cycle without publication**

Update the ignored Task 10 report with commits, gates, reviewer verdict, and remaining external boundary. Verify:

```text
rtk git diff --check
rtk git status --short
```

Expected: tracked worktree clean and no evidence Markdown. Present the reviewed SHA, expected Cloudflare project `lyra-ds-docs`, preview branch `file-upload-evidence`, and temporary ref `evidence/file-upload-manual` to the user. Ask for separate explicit push/dispatch authorization; do not infer it from approval of this plan.

---

## Completion Criteria

- [ ] Exact scenario attestation keys are present in every exported record.
- [ ] PASS is impossible with any false/missing/extra/cross-scenario attestation.
- [ ] FAIL can preserve false workflow steps for reviewer diagnosis.
- [ ] M03 still requires exact 320 CSS px, coarse pointer, physical touch, physical keyboard, and all six checklist attestations.
- [ ] Evidence export accepts only the immutable localized `lyra-ds-docs.pages.dev` deployment route.
- [ ] The branch alias and unrelated/local test hosts cannot export evidence.
- [ ] Real browser smoke observes both locales and visits M01–M04 with localized guidance before XHR progress validation.
- [ ] Package, focused C/F/W, parity, baseline, performance, lint, actionlint, formatting, and diff gates are green.
- [ ] Independent changed-boundary review has no Critical or Important finding.
- [ ] No push, dispatch, deploy, Cloudflare request, remote smoke, evidence Markdown, or Task 10 completion claim occurs in this plan.
