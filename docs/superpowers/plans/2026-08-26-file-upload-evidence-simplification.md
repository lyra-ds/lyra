# FileUpload Evidence Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the four-scenario manual FileUpload evidence flow with revision-bound
automation for `DF-FU-17` and `DF-FU-18`, a two-scenario assistive-technology recorder
that exports browser-local ZIP bundles, and a deterministic repository ingestion command.

**Architecture:** Keep the existing isolated Vite/Cloudflare Pages harness and metadata-only
upload Function. Narrow its manual schema and UI to M01/M02, share the TypeScript runtime
validators with Node 24, create ZIPs locally with pinned `fflate`, run the new remote scenarios
with the repository's pinned Playwright matrix, and accept only hash-verified, same-revision
manual and automation archives in the ingestion CLI.

**Tech stack:** TypeScript 5.9, React 19, Vite 8, Vitest Browser Mode, Playwright 1.62,
Node 24 type stripping, `fflate` 0.8.3, GitHub Actions, Cloudflare Pages/Functions.

**Approved specification:**
`docs/superpowers/specs/2026-08-26-file-upload-evidence-simplification-design.md`

---

## Global constraints

- Work from the isolated branch/worktree created for this change. Do not modify `main` or
  overwrite unrelated working-tree changes.
- Follow strict TDD within each implementation task: add the smallest failing proof, observe
  the expected failure, implement only enough to pass it, then run the local regression set.
- Preserve the FileUpload package APIs and behavior. This plan changes the private evidence
  package, evidence workflow, and governing documentation only.
- Keep the Pages Function metadata-only. Do not add R2, D1, KV, auth, evidence POST storage,
  or a production documentation route.
- Manual evidence bytes must stay in the tester's browser until the tester explicitly downloads
  the ZIP. No selected media may be sent through the test-upload Function.
- Treat every ingested ZIP as hostile: bounded compressed and expanded sizes, canonical paths,
  no traversal, no absolute paths, no symlinks, no duplicate normalized names, no unknown files,
  and SHA-256 verification before repository writes.
- Use the full 40-character lowercase revision for trust decisions. A 12-character prefix is
  allowed only in filenames and headings.
- Keep generated archives and browser recordings out of Git. Only the ingestion CLI may copy
  accepted artifacts into the deterministic repository evidence directory.
- Prefix repository commands with `rtk`. For any full install/build/gate whose temporary size is
  unknown, create a unique directory under `/home/francisross/tmp-builds`, set `TMPDIR` only on
  that command, and remove only that run directory afterward.
- Stop at the approved scope: two manual scenarios, two automated scenarios, local archives,
  workflow publication, ingestion, and required documentation. Do not add dashboards, history,
  accounts, persistence, or generalized test-management abstractions.

## Canonical archive contract

Both archive kinds contain `manifest.json`. JSON is UTF-8, pretty printed with two spaces, ends
with one newline, and uses schema version `1`.

Manual ZIP:

```text
manifest.json
manual/DF-FU-M01.json
manual/DF-FU-M02.json
artifacts/DF-FU-M01/<sanitized-file-name>
artifacts/DF-FU-M02/<sanitized-file-name>
```

Automation ZIP:

```text
manifest.json
automation/DF-FU-17.json
automation/DF-FU-18.json
artifacts/DF-FU-17/<engine>/<artifact-name>
artifacts/DF-FU-18/chromium/<artifact-name>
```

`manifest.json` is not listed in its own `entries`. Every other file is listed exactly once,
sorted by path, with `path`, `bytes`, `mediaType`, and lowercase 64-character `sha256`. Archive
members are written in lexical path order with ZIP mtime fixed at `1980-01-01T00:00:00.000Z`.
This makes equal input bytes produce equal ZIP bytes.

The deterministic ingestion destination is:

```text
docs/superpowers/baselines/lyra-v1/comparisons/file-upload/<revision>-accessibility.md
docs/superpowers/baselines/lyra-v1/comparisons/file-upload/<revision>-accessibility/
```

The directory contains the four normalized JSON results and their verified artifacts, retaining
the archive-relative paths below `manual/`, `automation/`, and `artifacts/`.

### Task 1: Amend the governing specifications and handoff

**Files:**

- Modify: `docs/superpowers/specs/2026-08-15-data-files-family-design.md`
- Modify: `docs/superpowers/specs/2026-08-17-file-upload-manual-evidence-harness-design.md`
- Modify: `docs/superpowers/plans/2026-08-16-file-upload-controlled-lifecycle.md`
- Modify: `docs/superpowers/plans/2026-08-18-file-upload-evidence-resume.md`
- Reference: `docs/superpowers/specs/2026-08-26-file-upload-evidence-simplification-design.md`

**Step 1: Record the pre-change contradiction**

Run:

```bash
rtk rg -n "DF-FU-M03|DF-FU-M04|M01 through DF-FU-M04|M01.*M04|Galaxy" \
  docs/superpowers/specs/2026-08-15-data-files-family-design.md \
  docs/superpowers/specs/2026-08-17-file-upload-manual-evidence-harness-design.md \
  docs/superpowers/plans/2026-08-16-file-upload-controlled-lifecycle.md \
  docs/superpowers/plans/2026-08-18-file-upload-evidence-resume.md
```

Expected: matches show M03/M04 as manual release blockers and the resume handoff instructs a
Galaxy run.

**Step 2: Apply the approved change protocol**

Update the four documents so they agree on these exact gates:

```text
Manual: DF-FU-M01 and DF-FU-M02, actual AT environments, local media, reviewer approval.
Automated: DF-FU-17 and DF-FU-18, exact immutable deployment revision, workflow ZIP.
Completion: one PASS for each ID, one revision, one immutable deployment, successful ingestion.
```

In the older harness design and controlled-lifecycle plan, add a dated amendment that points to
the approved 2026-08-26 design. Update the active requirements and Task 10 checklist; do not
rewrite historical execution notes as though M03/M04 had run. Replace the resume runbook with:

```text
1. Dispatch the evidence preview workflow for the reviewed evidence ref.
2. Download file-upload-automation-<revision-prefix>.zip from that passing run.
3. Open the immutable URL on Windows/NVDA and macOS/VoiceOver Safari.
4. Download one local evidence ZIP from each machine.
5. Run the ingestion command with the automation ZIP and both manual bundles.
6. Review the generated diff, run Task 10 gates, obtain M01/M02 approval, and commit.
```

**Step 3: Prove the active documents no longer assign manual M03/M04 work**

Run:

```bash
rtk rg -n "DF-FU-17|DF-FU-18|local evidence ZIP|evidence:file-upload:ingest" \
  docs/superpowers/specs/2026-08-15-data-files-family-design.md \
  docs/superpowers/specs/2026-08-17-file-upload-manual-evidence-harness-design.md \
  docs/superpowers/plans/2026-08-16-file-upload-controlled-lifecycle.md \
  docs/superpowers/plans/2026-08-18-file-upload-evidence-resume.md
rtk pnpm exec prettier --check \
  docs/superpowers/specs/2026-08-15-data-files-family-design.md \
  docs/superpowers/specs/2026-08-17-file-upload-manual-evidence-harness-design.md \
  docs/superpowers/plans/2026-08-16-file-upload-controlled-lifecycle.md \
  docs/superpowers/plans/2026-08-18-file-upload-evidence-resume.md
```

Expected: all four documents name DF-FU-17/18 and the local ZIP/ingestion workflow; Prettier
passes. Remaining M03/M04 text is clearly labelled superseded historical context, not an active
instruction or release condition.

**Step 4: Commit**

```bash
rtk git add docs/superpowers/specs/2026-08-15-data-files-family-design.md \
  docs/superpowers/specs/2026-08-17-file-upload-manual-evidence-harness-design.md \
  docs/superpowers/plans/2026-08-16-file-upload-controlled-lifecycle.md \
  docs/superpowers/plans/2026-08-18-file-upload-evidence-resume.md
rtk git commit -m "docs: automate file upload evidence checks"
```

### Task 2: Narrow and share the evidence contracts

**Files:**

- Modify: `tools/file-upload-evidence/src/contracts.test.ts`
- Modify: `tools/file-upload-evidence/src/contracts.ts`
- Modify: `tools/file-upload-evidence/src/messages.test.ts`
- Modify: `tools/file-upload-evidence/src/messages.ts`
- Modify: `tools/file-upload-evidence/src/telemetry.test.ts`
- Modify: `tools/file-upload-evidence/src/telemetry.ts`
- Modify: `tools/file-upload-evidence/tsconfig.json`

**Step 1: Write failing contract tests**

Replace four-scenario parameterization with M01/M02 and add rejection tests for the retired
manual IDs. Add manifest and automation-result test fixtures with these public shapes:

```ts
export type ManualScenario = 'DF-FU-M01' | 'DF-FU-M02';
export type AutomatedScenario = 'DF-FU-17' | 'DF-FU-18';

export interface EvidenceEntry {
  path: string;
  bytes: number;
  mediaType: string;
  sha256: string;
}

export interface EvidenceManifest {
  schemaVersion: 1;
  kind: 'manual' | 'automation';
  revision: string;
  deploymentUrl: string;
  createdAt: string;
  entries: EvidenceEntry[];
}

export interface FileUploadAutomatedResult {
  scenario: AutomatedScenario;
  locale: Locale;
  revision: string;
  deploymentUrl: string;
  executedAt: string;
  runs: Array<{
    engine: 'chromium' | 'firefox' | 'webkit';
    viewport: { width: number; height: number; devicePixelRatio: number };
    mediaQueries: Record<string, boolean>;
    checks: Record<string, boolean>;
    artifactPaths: string[];
  }>;
  result: 'PASS' | 'FAIL';
}
```

Change `FileUploadManualObservation.artifactUrls` to `artifactPaths`, require the captured
`userAgent`, and add `artifactMetadata: Array<{ path: string; originalName: string }>` with an
exact one-to-one path match. A valid manual record must contain one to four archive-relative
artifact paths under its own scenario directory. `originalName` preserves the selected file's
NFC leaf name as untrusted reviewer metadata; consumers must escape it rather than use it as an
archive path. Add these assertions:

```ts
expect(validateObservation({ ...validM01, scenario: 'DF-FU-M03' })).toMatchObject({ ok: false });
expect(validateObservation({ ...validM01, scenario: 'DF-FU-M04' })).toMatchObject({ ok: false });
expect(validateObservation(validM01)).toMatchObject({
  ok: true,
  value: {
    scenario: 'DF-FU-M01',
    userAgent: 'Mozilla/5.0 Evidence Browser/1.0',
    artifactPaths: ['artifacts/DF-FU-M01/nvda.webm'],
    artifactMetadata: [
      { path: 'artifacts/DF-FU-M01/nvda.webm', originalName: 'NVDA session.webm' },
    ],
  },
});
expect(validateManifest(validManualManifest)).toMatchObject({ ok: true });
expect(validateAutomatedResult(validDfFu17)).toMatchObject({ ok: true });
expect(validateAutomatedResult({ ...validDfFu17, result: 'PASS', runs: failedRuns })).toMatchObject(
  {
    ok: false,
  },
);
```

Delete M03 eligibility assertions from telemetry tests; retain environment capture tests.

**Step 2: Run the focused tests and observe RED**

Run:

```bash
rtk pnpm --filter @lyra-ds/file-upload-evidence exec vitest run \
  src/contracts.test.ts src/messages.test.ts src/telemetry.test.ts
```

Expected: failures because M03/M04 are still accepted, `artifactPaths` and automated validators
do not exist, and M03 eligibility is still exported.

**Step 3: Implement the shared runtime contract**

In `contracts.ts`:

- keep only M01/M02 in `SCENARIO_CHECK_IDS` and `isManualScenario`;
- add `AUTOMATED_SCENARIO_CHECK_IDS` with the exact checks from sections 6.1 and 6.2 of the
  approved design;
- add the interfaces above plus `validateManifest` and `validateAutomatedResult`;
- derive PASS validity from every required check being present and `true`;
- require DF-FU-17 runs for Chromium, Firefox, and WebKit, with Chromium coarse-pointer/touch
  evidence and all lanes at width 320;
- require DF-FU-18's no-JS and delayed-Alpine check set in a Chromium run;
- reject extra/missing checks, duplicate engines/paths, noncanonical paths, nonpositive sizes,
  unsupported media types, invalid SHA-256, mutable URLs, and revision mismatches;
- change the import to `from './messages.ts'` and set
  `"allowImportingTsExtensions": true` in the package tsconfig so Node 24 and Vite use the same
  runtime validator;
- remove `m03Eligibility` from `telemetry.ts`, leaving `captureTelemetry` intact.

Use these constants from `contracts.ts` in later tasks:

```ts
export const EVIDENCE_SCHEMA_VERSION = 1 as const;
export const MAX_MANUAL_FILES = 4;
export const MAX_MANUAL_FILE_BYTES = 50 * 1024 * 1024;
export const MAX_MANUAL_SCENARIO_BYTES = 100 * 1024 * 1024;
export const MAX_ARCHIVE_EXPANDED_BYTES = 220 * 1024 * 1024;
export const MANUAL_MEDIA_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'video/webm',
  'video/mp4',
  'video/quicktime',
]);
export const EVIDENCE_ENTRY_MEDIA_TYPES = new Set([
  'application/json',
  'application/zip',
  ...MANUAL_MEDIA_TYPES,
]);
```

`validateManifest` also enforces path-specific types: result/log JSON is `application/json`,
screenshots are `image/png`, traces are `application/zip`, recordings are `video/webm`, and manual
artifacts use one of `MANUAL_MEDIA_TYPES`. This prevents a permissive global allow-list from
accepting the right media type at the wrong archive path.

Update bilingual messages to describe local attachments and remove manual M03/M04 copy.

**Step 4: Run GREEN and prove Node can import the same validator**

Run:

```bash
rtk pnpm --filter @lyra-ds/file-upload-evidence exec vitest run \
  src/contracts.test.ts src/messages.test.ts src/telemetry.test.ts
rtk node --input-type=module -e \
  "import('./tools/file-upload-evidence/src/contracts.ts').then(m => { if (!m.validateObservation) process.exit(1) })"
rtk pnpm --filter @lyra-ds/file-upload-evidence run typecheck
```

Expected: all tests pass, Node exits 0 after importing `contracts.ts`, and typecheck passes.

**Step 5: Commit**

```bash
rtk git add tools/file-upload-evidence/src/contracts.ts \
  tools/file-upload-evidence/src/contracts.test.ts \
  tools/file-upload-evidence/src/messages.ts \
  tools/file-upload-evidence/src/messages.test.ts \
  tools/file-upload-evidence/src/telemetry.ts \
  tools/file-upload-evidence/src/telemetry.test.ts \
  tools/file-upload-evidence/tsconfig.json
rtk git commit -m "refactor: narrow file upload evidence contracts"
```

### Task 3: Build deterministic local ZIP creation and hostile ZIP reading

**Files:**

- Create: `tools/file-upload-evidence/src/evidence-bundle.ts`
- Create: `tools/file-upload-evidence/src/evidence-bundle.test.ts`
- Create: `tools/file-upload-evidence/scripts/archive.mjs`
- Create: `tools/file-upload-evidence/scripts/archive.test.mjs`
- Modify: `tools/file-upload-evidence/package.json`
- Modify: `pnpm-lock.yaml`

**Step 1: Write failing browser-side bundle tests**

Test `sanitizeEvidenceFileName` and `createManualEvidenceBundle`. Use real `File` objects and
`unzipSync` only inside the test to inspect output. Cover:

```ts
expect(sanitizeEvidenceFileName('../../NVDA sessão 01.webm')).toBe('NVDA-sessao-01.webm');
expect(sanitizeEvidenceFileName('CON.mp4')).toBe('_CON.mp4');
expect(await createManualEvidenceBundle([validRecord], attachments)).toMatchObject({
  fileName: `lyra-file-upload-evidence-${REVISION.slice(0, 12)}.zip`,
  mediaType: 'application/zip',
});
```

Inspect the archive and assert lexical members, fixed manifest fields, correct SHA-256 values,
one-record and two-record output, equal bytes for equal inputs, and rejection of empty files,
unsupported/empty MIME types, fifth files, a file over 50 MiB, a scenario over 100 MiB,
sanitized-name collisions, and records whose artifact paths do not match selected files.

**Step 2: Write failing hostile-archive tests**

The Node reader API is:

```js
export async function readEvidenceArchive(filePath, {
  expectedKind,
  maxCompressedBytes = 120 * 1024 * 1024,
  maxExpandedBytes = 220 * 1024 * 1024,
} = {})
```

It returns `{ manifest, entries: Map<string, Uint8Array> }`. Add fixtures assembled in memory for
valid ZIPs and corrupt ZIPs. Assert rejection of:

- `../escape`, `/absolute`, backslash paths, NUL, empty segments, and non-NFC paths;
- case-folded or Unicode-normalized duplicate paths;
- directory entries, symlink Unix mode in the central directory, encrypted entries, data
  descriptors with unknown bounds, and compression methods other than store/deflate;
- a compressed file over the compressed cap or declared/actual expanded bytes over the cap;
- unknown members, missing members, entry-size mismatch, digest mismatch, and manifest kind,
  revision, or deployment mismatch.

**Step 3: Run the tests and observe RED**

Run:

```bash
rtk pnpm --filter @lyra-ds/file-upload-evidence exec vitest run src/evidence-bundle.test.ts
rtk node --test tools/file-upload-evidence/scripts/archive.test.mjs
```

Expected: module-not-found failures for both new implementations.

**Step 4: Implement deterministic creation**

Add pinned `"fflate": "0.8.3"` to the private package dependencies. Implement browser hashing
with `crypto.subtle.digest('SHA-256', bytes)` and archive creation with sorted inputs:

```ts
const ZIP_EPOCH = new Date('1980-01-01T00:00:00.000Z');
const zipped = Object.fromEntries(
  [...members.entries()]
    .sort(([left], [right]) => left.localeCompare(right, 'en'))
    .map(([path, bytes]) => [path, [bytes, { mtime: ZIP_EPOCH }]]),
);
return {
  bytes: zipSync(zipped, { level: 6, mtime: ZIP_EPOCH }),
  fileName: `lyra-file-upload-evidence-${revision.slice(0, 12)}.zip`,
  mediaType: 'application/zip',
};
```

The manifest `createdAt` comes from the caller so archive creation remains deterministic in tests.
Normalize names to NFC, strip diacritics for portable filenames, replace every character outside
`[A-Za-z0-9._-]` with `-`, collapse repeated separators, guard Windows device names, and suffix
same-source duplicates deterministically. Reject a collision between distinct selected files.

**Step 5: Implement bounded hostile reading**

In `archive.mjs`, inspect the End of Central Directory and every central-directory entry before
calling `unzipSync`. Read the creator OS and external attributes and reject a Unix file type of
`0o120000` (symlink). Reject flags with the encrypted bit or data-descriptor bit, validate local
header names against central names, sum declared expanded lengths before extraction, and then
compare actual lengths and manifest SHA-256 digests. Validate the parsed manifest with the shared
`validateManifest` imported from `../src/contracts.ts`.

The reader must not write extracted files. It returns verified bytes only after the whole archive
passes.

**Step 6: Run GREEN and dependency checks**

Run:

```bash
rtk pnpm install --lockfile-only
rtk pnpm --filter @lyra-ds/file-upload-evidence exec vitest run \
  src/evidence-bundle.test.ts src/contracts.test.ts
rtk node --test tools/file-upload-evidence/scripts/archive.test.mjs
rtk pnpm --filter @lyra-ds/file-upload-evidence run typecheck
```

Expected: all tests and typecheck pass; the lockfile records `fflate@0.8.3` as a direct dependency
of `@lyra-ds/file-upload-evidence` without upgrading unrelated packages.

**Step 7: Commit**

```bash
rtk git add tools/file-upload-evidence/src/evidence-bundle.ts \
  tools/file-upload-evidence/src/evidence-bundle.test.ts \
  tools/file-upload-evidence/scripts/archive.mjs \
  tools/file-upload-evidence/scripts/archive.test.mjs \
  tools/file-upload-evidence/package.json pnpm-lock.yaml
rtk git commit -m "feat: package local file upload evidence"
```

### Task 4: Replace the recorder with the two-scenario local-attachment flow

**Files:**

- Modify: `tools/file-upload-evidence/src/harness-app.tsx`
- Modify: `tools/file-upload-evidence/src/harness-app.browser.test.tsx`
- Modify: `tools/file-upload-evidence/src/harness.browser.test.tsx`
- Modify: `tools/file-upload-evidence/src/harness.css`
- Modify: `tools/file-upload-evidence/scripts/smoke.mjs`
- Modify: `tools/file-upload-evidence/scripts/smoke.test.mjs`

**Step 1: Rewrite the browser expectations first**

Add tests proving:

- the scenario select exposes exactly M01 and M02 in English and Portuguese;
- M03/M04 never appear as selectable options;
- the prefilled immutable revision/environment fields remain read-only;
- no artifact-URL input, `Copy JSON`, or `Download JSON` action exists;
- a multiple file input accepts only the six approved MIME types and exposes the 4-file/50-MiB/
  100-MiB guidance;
- invalid/oversized attachments announce a localized error and keep ZIP export disabled;
- one completed scenario downloads a one-record ZIP; two completed drafts download a two-record
  ZIP; switching scenarios preserves each draft's local `File` objects;
- no selected media produces a request to `/api/file-upload-evidence` during export;
- a human FAIL record can export for diagnosis, while PASS still requires all three attestations
  and an approved reviewer.

Use an injected exporter/download boundary instead of spying on browser globals:

```ts
export interface HarnessAppProps {
  readonly createBundle?: typeof createManualEvidenceBundle;
  readonly downloadBundle?: (bundle: ManualEvidenceBundle) => void;
}
```

The focused RED command is:

```bash
rtk pnpm --filter @lyra-ds/file-upload-evidence exec vitest run \
  --config vitest.browser.config.ts src/harness-app.browser.test.tsx src/harness.browser.test.tsx
```

Expected: failures because four scenarios and JSON/URL controls remain.

**Step 2: Implement the minimal recorder sequence**

Keep one draft and attachment list per M01/M02. The visible sequence is:

```text
Revision/environment summary
Manual scenario choice
Existing deterministic React upload exercise
Three AT attestations and concise actual-observation field
Local evidence files
Result/reviewer/finding URLs
Download evidence ZIP
```

Remove the duplicate editable `expected` field from the UI and derive its stable localized value
from the selected scenario. Keep it in the serialized contract. Remove no-AT confirmation and M03
eligibility UI. Keep OS, browser, AT versions, actual observation, result, reviewer, and optional
HTTPS finding URLs.

On download, include the selected valid draft plus any other valid completed draft for the same
revision/deployment. Do not block a valid selected draft because the other scenario is empty or
partially filled; exclude the incomplete other draft and show which scenarios the ZIP contains.
Call `URL.createObjectURL`, click a temporary `<a download>`, revoke the URL immediately after the
click, and clear neither draft nor attachment state.

Use a native `<input type="file" multiple>` with an explicit label, help text, localized error
summary, and a removable filename list. Do not render media or execute attachment content.

**Step 3: Narrow remote smoke without weakening its existing checks**

Change `smoke.mjs` expectations and tests so both localized routes expose exactly M01/M02 and the
local-attachment/ZIP action. Keep all existing assertions for:

```text
immutable host and full revision parity
noindex route and Function behavior
both locales
native multipart response without payload reflection
real computable XMLHttpRequest.upload progress
mounted React recorder and scenario-specific checklist marker
```

The smoke must not execute or mark DF-FU-17/18; those belong to the dedicated automation runner.

**Step 4: Apply the interface quality pass**

Run the `impeccable` detector against `harness-app.tsx` and `harness.css`, then fix only findings
that affect this approved recorder flow: clear hierarchy, compact form grouping, keyboard-visible
attachment removal, error association, narrow-viewport reflow, and bilingual text fit. Do not
redesign the FileUpload product component or add decorative UI.

**Step 5: Run GREEN**

Run:

```bash
rtk pnpm --filter @lyra-ds/file-upload-evidence exec vitest run \
  --config vitest.browser.config.ts src/harness-app.browser.test.tsx src/harness.browser.test.tsx
rtk node --test tools/file-upload-evidence/scripts/smoke.test.mjs
rtk pnpm --filter @lyra-ds/file-upload-evidence run test
rtk pnpm --filter @lyra-ds/file-upload-evidence run typecheck
```

Expected: recorder browser tests pass across configured engines, smoke unit tests pass, package
tests pass, and typecheck passes.

**Step 6: Commit**

```bash
rtk git add tools/file-upload-evidence/src/harness-app.tsx \
  tools/file-upload-evidence/src/harness-app.browser.test.tsx \
  tools/file-upload-evidence/src/harness.browser.test.tsx \
  tools/file-upload-evidence/src/harness.css \
  tools/file-upload-evidence/scripts/smoke.mjs \
  tools/file-upload-evidence/scripts/smoke.test.mjs
rtk git commit -m "feat: simplify file upload evidence recorder"
```

### Task 5: Automate DF-FU-17 across the browser matrix

**Files:**

- Create: `tools/file-upload-evidence/scripts/automation.mjs`
- Create: `tools/file-upload-evidence/scripts/automation.test.mjs`
- Modify: `tools/file-upload-evidence/src/react-file-upload.tsx`
- Modify: `tools/file-upload-evidence/src/react-file-upload.browser.test.tsx`
- Modify: `tools/file-upload-evidence/package.json`
- Modify: `package.json`

**Step 1: Add failing runner-policy tests**

Export pure helpers from `automation.mjs` and test CLI parsing, immutable URL/revision validation,
required engine lanes, result derivation, artifact-path normalization, and archive creation. The
CLI contract is:

```text
node tools/file-upload-evidence/scripts/automation.mjs \
  --url=<immutable-route> \
  --revision=<40-char-sha> \
  --output=<absolute-zip-path>
```

Add tests that a PASS is impossible when any check is absent/false or an expected screenshot,
video, trace, or log is absent. Add one browser test that proves any new private `data-evidence-id`
hooks preserve the existing accessible name, role, state, and public FileUpload output.

Run:

```bash
rtk node --test tools/file-upload-evidence/scripts/automation.test.mjs
rtk pnpm --filter @lyra-ds/file-upload-evidence exec vitest run \
  --config vitest.browser.config.ts src/react-file-upload.browser.test.tsx
```

Expected: runner module missing or helper exports absent.

**Step 2: Add private stable automation hooks**

Add `data-evidence-id` only in `ReactFileUploadEvidence`, the private adapter around the public
component. Required values are:

```text
react-file-input
react-file-list
react-live-region
react-diagnostics
```

Use roles and accessible names for actions. The data attributes locate only evidence fixture
boundaries and must not be added to `packages/react` or `packages/alpine`.

**Step 3: Implement the DF-FU-17 runner**

Use `chromium`, `firefox`, and `webkit` from pinned Playwright. For every lane create its own
context with `{ viewport: { width: 320, height: 720 }, deviceScaleFactor: 2, recordVideo }`, start
tracing, and navigate to the immutable English route. Chromium additionally uses `hasTouch: true`
and a CDP media override for coarse pointer; record the observed `matchMedia` values rather than
assuming emulation succeeded.

Exercise the actual preview controls with a long Unicode filename. Derive and record these exact
checks:

```js
const DF_FU_17_CHECKS = [
  'DF-FU-17-no-horizontal-overflow',
  'DF-FU-17-long-file-identity-retained',
  'DF-FU-17-actions-reachable-at-reflow',
  'DF-FU-17-active-replacement-rejected-and-announced',
  'DF-FU-17-cancel-retry-complete-remove',
  'DF-FU-17-focus-recovered',
  'DF-FU-17-keyboard-activation-equivalent',
];
```

Measure overflow with both document and private component `scrollWidth <= clientWidth`. Verify
long-name association through the rendered item name and action accessible name. Drive one path
by keyboard in every engine and the touch path in Chromium. Use the existing evidence operator
modes to prove active replacement rejection, cancel, retry, success, removal, and focus fallback.

Always save `final.png`, `run.webm`, `trace.zip`, and `events.json` for each engine. Catch each
lane failure, write its failed checks and error into `events.json`, finish the archive, then set a
nonzero process exit code. This ensures a failed workflow still has diagnosable evidence but can
never ingest as PASS.

**Step 4: Package the automation result**

Reuse the manifest/digest helpers established in Task 3. The result lives at
`automation/DF-FU-17.json`; artifacts live under `artifacts/DF-FU-17/<engine>/`. The runner will
add DF-FU-18 in Task 6, so until then its focused `--scenario=DF-FU-17` test mode is permitted only
for local development and tests. The normal CLI must continue to fail until both results exist.

Add scripts:

```json
{
  "evidence:file-upload:automation": "node tools/file-upload-evidence/scripts/automation.mjs"
}
```

**Step 5: Run GREEN against the local contract and browser fixtures**

Keep process orchestration injectable through `runAutomation(options, playwrightApi)` so the Node
test supplies deterministic fake engines and proves success/failure cleanup without network access.
The existing Vitest Browser Mode fixtures provide the real three-engine lifecycle proof locally;
Task 7/9 provides the first revision-bound remote integration. Use a per-run build temp directory
because Playwright video/trace size is unknown:

```bash
build_tmp=$(mktemp -d -p /home/francisross/tmp-builds file-upload-17.XXXXXX)
TMPDIR="$build_tmp" FILE_UPLOAD_EVIDENCE=1 \
  LYRA_EVIDENCE_REVISION=1234567890abcdef1234567890abcdef12345678 \
  LYRA_EVIDENCE_BUILD_TIME=2026-08-26T12:00:00.000Z \
  rtk pnpm --filter @lyra-ds/file-upload-evidence run build:preview
TMPDIR="$build_tmp" rtk node --test tools/file-upload-evidence/scripts/automation.test.mjs
TMPDIR="$build_tmp" rtk pnpm --filter @lyra-ds/file-upload-evidence exec vitest run \
  --config vitest.browser.config.ts src/react-file-upload.browser.test.tsx
rtk pnpm --filter @lyra-ds/file-upload-evidence run typecheck
rm -rf "$build_tmp"
```

Expected: the injected runner tests prove all three lane/archive policies, the real browser matrix
proves the lifecycle interactions, and the focused result validates. Only remove the exact
`build_tmp` created by this step after inspecting any failure artifacts.

**Step 6: Commit**

```bash
rtk git add tools/file-upload-evidence/scripts/automation.mjs \
  tools/file-upload-evidence/scripts/automation.test.mjs \
  tools/file-upload-evidence/src/react-file-upload.tsx \
  tools/file-upload-evidence/src/react-file-upload.browser.test.tsx \
  tools/file-upload-evidence/package.json package.json
rtk git commit -m "test: automate responsive file upload evidence"
```

### Task 6: Automate DF-FU-18 no-JavaScript and delayed Alpine behavior

**Files:**

- Modify: `tools/file-upload-evidence/scripts/automation.mjs`
- Modify: `tools/file-upload-evidence/scripts/automation.test.mjs`
- Modify: `tools/file-upload-evidence/src/alpine-bootstrap.ts`
- Modify: `tools/file-upload-evidence/src/alpine-bootstrap.browser.test.ts`
- Modify: `tools/file-upload-evidence/src/alpine-controller.ts`
- Modify: `tools/file-upload-evidence/src/harness.browser.test.tsx`
- Modify: `tools/file-upload-evidence/src/main.tsx`
- Modify: `tools/file-upload-evidence/en/file-upload-evidence/index.html`
- Modify: `tools/file-upload-evidence/pt-BR/file-upload-evidence/index.html`

**Step 1: Add failing DF-FU-18 tests**

Add runner tests requiring these exact checks:

```js
const DF_FU_18_CHECKS = [
  'DF-FU-18-native-js-disabled-form-submitted',
  'DF-FU-18-response-locale-metadata-revision',
  'DF-FU-18-delayed-alpine-filelist-preserved',
  'DF-FU-18-single-enhancement-no-replay',
  'DF-FU-18-removal-focus-recovered',
  'DF-FU-18-reconnect-teardown-clean',
];
```

Extend fixture browser tests to expose deterministic diagnostics for initialization, selection
intent, controlled echo, connect, and disconnect without changing package output.
The remote runner must fail if the selected native file disappears before Alpine starts or any
counter shows duplicate enhancement/replay.

Run:

```bash
rtk node --test tools/file-upload-evidence/scripts/automation.test.mjs
rtk pnpm --filter @lyra-ds/file-upload-evidence exec vitest run \
  --config vitest.browser.config.ts \
  src/alpine-bootstrap.browser.test.ts src/harness.browser.test.tsx
```

Expected: DF-FU-18 is missing and the fixture has insufficient reconnect/teardown diagnostics.

**Step 2: Add private fixture diagnostics**

Extend only the authored evidence HTML and private Alpine controller diagnostics. Add stable IDs
for `connects` and `disconnects` beside the existing initialization/intent/echo counters. Implement
the Alpine `destroy()` lifecycle so disconnects are observable. Keep the native form useful before
JavaScript and keep both locale documents structurally identical apart from translated text and
`lang`/locale values.

Cache the dynamically imported Alpine runtime per root in `alpine-bootstrap.ts` and expose only
these private harness helpers:

```ts
export async function teardownAlpineFixture(root: HTMLElement): Promise<void> {
  const Alpine = await alpineRuntimeFor(root);
  Alpine.destroyTree(root);
  initializedRoots.delete(root);
}

export async function reconnectAlpineFixture(root: HTMLElement): Promise<void> {
  await teardownAlpineFixture(root);
  await bootstrapAlpine(root, { schedule: (start) => start(), search: '?alpineDelay=0' });
}
```

`teardownAlpineFixture` calls Alpine's tree-destruction path and clears the initialized-root entry;
`reconnectAlpineFixture` tears down and initializes that same authored root once. Browser tests must
prove repeated bootstrap remains idempotent outside this explicit test boundary.

**Step 3: Implement the two remote contexts**

For the no-JS lane, create Chromium with `javaScriptEnabled: false`, navigate to the immutable
route, select a known 64 KiB file in `#native-file`, and submit `#native-upload-form`. Assert the
localized HTML response contains filename, media type, byte length, and the exact revision, while
not containing the payload marker.

For delayed Alpine, use normal Chromium and navigate with `?alpineDelay=15000`. Select a file in
`#alpine-file` before 15 seconds elapse. Assert the native `FileList` still contains the exact
name/size/type after `#alpine-initializations` becomes `1`; assert selection intents and controlled
echoes are each `1`, connects is `1`, disconnects is `0`, and the rendered tree contains one item.
Remove through its accessible action and assert focus returns to `#alpine-file`.

Use the fixture's exported reconnect test boundary to disconnect/reconnect once, then teardown:

```ts
window.__LYRA_FILE_UPLOAD_EVIDENCE__ = {
  reconnectAlpineFixture,
  teardownAlpineFixture,
};
```

After reconnect, select one new file and assert the selection-intent counter advances by exactly
one; this is the listener-duplication proof. After teardown, dispatch the same event and assert it
does not advance. Also assert connects/disconnects reflect the transitions, there is no second
rendered item, and no live message replays. Define the matching `Window` type augmentation in
`main.tsx`; the boundary exists only when `FILE_UPLOAD_EVIDENCE=1` and invokes private fixture
functions, not package internals.

**Step 4: Emit the complete automation ZIP**

Write `automation/DF-FU-18.json` plus `artifacts/DF-FU-18/chromium/final.png`, `run.webm`,
`trace.zip`, and `events.json`. The normal CLI now validates and emits exactly DF-FU-17 and
DF-FU-18. It exits 0 only when every required lane/check/artifact validates and both results are
PASS; otherwise it still closes a diagnostic ZIP and exits nonzero.

**Step 5: Run GREEN**

```bash
build_tmp=$(mktemp -d -p /home/francisross/tmp-builds file-upload-18.XXXXXX)
TMPDIR="$build_tmp" rtk node --test tools/file-upload-evidence/scripts/automation.test.mjs
TMPDIR="$build_tmp" rtk pnpm --filter @lyra-ds/file-upload-evidence run test:browser
rtk pnpm --filter @lyra-ds/file-upload-evidence run typecheck
rm -rf "$build_tmp"
```

Expected: DF-FU-18 tests pass, the full archive contains both validated results, and existing
Alpine delayed-init tests remain green.

**Step 6: Commit**

```bash
rtk git add tools/file-upload-evidence/scripts/automation.mjs \
  tools/file-upload-evidence/scripts/automation.test.mjs \
  tools/file-upload-evidence/src/alpine-bootstrap.ts \
  tools/file-upload-evidence/src/alpine-bootstrap.browser.test.ts \
  tools/file-upload-evidence/src/alpine-controller.ts \
  tools/file-upload-evidence/src/harness.browser.test.tsx \
  tools/file-upload-evidence/src/main.tsx \
  tools/file-upload-evidence/en/file-upload-evidence/index.html \
  tools/file-upload-evidence/pt-BR/file-upload-evidence/index.html
rtk git commit -m "test: automate progressive enhancement evidence"
```

### Task 7: Publish the automation ZIP from the isolated preview workflow

**Files:**

- Modify: `.github/workflows/deploy.yml`
- Modify: `tools/file-upload-evidence/scripts/deploy-policy.mjs`
- Modify: `tools/file-upload-evidence/scripts/deploy-policy.test.mjs`

**Step 1: Add failing deployment-policy tests**

Require `evidence-preview` to:

- run in the existing pinned Playwright 1.62.1 image with `--ipc=host` and `HOME: /root`;
- retain its `workflow_dispatch` plus `evidence/` branch guard and read-only contents permission;
- deploy and resolve the immutable URL before smoke and automation;
- pass the resolved URL and full `GITHUB_SHA` to automation;
- upload only the generated automation ZIP with pinned
  `actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02`;
- use `retention-days: 14`, `if-no-files-found: error`, and `if: always()` for diagnostics;
- convert an automation-step failure back into a failed job after artifact upload;
- leave the production job's `--branch=main` ordering untouched.

Run:

```bash
rtk node --test tools/file-upload-evidence/scripts/deploy-policy.test.mjs
```

Expected: failures because the job has no browser container, automation step, or artifact upload.

**Step 2: Update the workflow**

Add a metadata step that writes a 12-character revision prefix and archive path to
`GITHUB_OUTPUT`. After the existing remote smoke, run automation with `continue-on-error: true`:

```yaml
- name: Run revision-bound FileUpload automation
  id: automation
  continue-on-error: true
  run: >-
    pnpm run evidence:file-upload:automation
    --url="${{ steps.deployment.outputs.url }}"
    --revision="$GITHUB_SHA"
    --output="${{ steps.evidence.outputs.archive }}"
- name: Upload FileUpload automation evidence
  if: always()
  uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4.6.2
  with:
    name: file-upload-automation-${{ steps.evidence.outputs.revision-prefix }}.zip
    path: ${{ steps.evidence.outputs.archive }}
    if-no-files-found: error
    retention-days: 14
- name: Enforce FileUpload automation result
  if: steps.automation.outcome != 'success'
  run: exit 1
```

Add the immutable URL, full revision, two automated scenario outcomes, and exact artifact name to
`GITHUB_STEP_SUMMARY`. Do not print secrets or change Cloudflare configuration.

**Step 3: Run GREEN and policy regression**

Run:

```bash
rtk node --test \
  tools/file-upload-evidence/scripts/deploy-policy.test.mjs \
  tools/file-upload-evidence/scripts/stage-preview.test.mjs \
  tools/file-upload-evidence/scripts/smoke.test.mjs
rtk pnpm run evidence:file-upload:manual:policy
```

Expected: workflow structure and production isolation validations pass.

**Step 4: Commit**

```bash
rtk git add .github/workflows/deploy.yml \
  tools/file-upload-evidence/scripts/deploy-policy.mjs \
  tools/file-upload-evidence/scripts/deploy-policy.test.mjs
rtk git commit -m "ci: publish file upload automation evidence"
```

### Task 8: Add deterministic repository ingestion

**Files:**

- Create: `tools/file-upload-evidence/scripts/ingest.mjs`
- Create: `tools/file-upload-evidence/scripts/ingest.test.mjs`
- Modify: `tools/file-upload-evidence/package.json`
- Modify: `package.json`
- Generated only after real evidence exists:
  `docs/superpowers/baselines/lyra-v1/comparisons/file-upload/<revision>-accessibility.md`
- Generated only after real evidence exists:
  `docs/superpowers/baselines/lyra-v1/comparisons/file-upload/<revision>-accessibility/`

**Step 1: Write failing CLI tests**

Use temporary directories from `mkdtemp` and synthetic small archives. Never write fixtures into
the repository. Test argument parsing and all acceptance boundaries:

```text
accept: one automation ZIP + one combined M01/M02 ZIP
accept: one automation ZIP + separate M01 and M02 ZIPs in either order
reject: missing or duplicate M01/M02
reject: M01/M02 without approved reviewer or with FAIL
reject: missing/failed/partial DF-FU-17 or DF-FU-18
reject: any revision, immutable deployment, or locale-route mismatch
reject: corrupt digest, missing artifact, unknown archive entry, traversal, symlink, or oversize
reject: existing destination with different bytes
idempotent: existing destination with identical bytes
deterministic: argument order produces byte-identical Markdown and copied output
```

Assert the generated Markdown includes the immutable URL and revision, one table row per scenario,
manual environment/reviewer/attestations, automated lane/check matrices, finding links, and relative
links to every copied artifact.

Run:

```bash
rtk node --test tools/file-upload-evidence/scripts/ingest.test.mjs
```

Expected: module not found.

**Step 2: Implement parse/validate before write**

CLI syntax:

```text
pnpm evidence:file-upload:ingest --automation <path> --bundle <path> [--bundle <path>]
```

Import `readEvidenceArchive` from `archive.mjs` and `validateObservation`,
`validateAutomatedResult`, and `validateManifest` from `../src/contracts.ts`. Read and validate all
archives before creating the destination. Merge manual records by scenario, not argument order.
Require:

```js
const REQUIRED_MANUAL = ['DF-FU-M01', 'DF-FU-M02'];
const REQUIRED_AUTOMATED = ['DF-FU-17', 'DF-FU-18'];
```

Each manual result must be PASS with reviewer approval. Each automated result must validate as
derived PASS. All four results and all input manifests must share the exact full revision and
immutable deployment origin. Every record path must match its declared `/en/` or `/pt-BR/` locale;
locale paths may differ, but the immutable deployment host may not.

**Step 3: Implement an atomic deterministic write**

Render Markdown in memory and build a complete map of output relative paths and bytes. Sort every
scenario, check, lane, finding, and artifact. Copy original verified media bytes without
transcoding. Write to a sibling staging directory named with `process.pid`; only rename it to the
final revision directory after every write succeeds. Write the Markdown last through a temporary
file and rename it atomically.

If final paths already exist, compare every expected byte. Exit 0 for an exact idempotent rerun;
otherwise exit nonzero without overwriting. On any failure, remove only the CLI-created staging
directory and leave repository files unchanged. The command never runs Git or Cloudflare commands.

Add package scripts:

```json
{
  "evidence:file-upload:ingest": "node tools/file-upload-evidence/scripts/ingest.mjs"
}
```

**Step 4: Run GREEN**

```bash
rtk node --test \
  tools/file-upload-evidence/scripts/archive.test.mjs \
  tools/file-upload-evidence/scripts/ingest.test.mjs
rtk pnpm --filter @lyra-ds/file-upload-evidence run test
rtk pnpm --filter @lyra-ds/file-upload-evidence run typecheck
```

Expected: hostile input tests, merge tests, determinism tests, and package regressions pass.

**Step 5: Commit implementation only**

```bash
rtk git add tools/file-upload-evidence/scripts/ingest.mjs \
  tools/file-upload-evidence/scripts/ingest.test.mjs \
  tools/file-upload-evidence/package.json package.json
rtk git commit -m "feat: ingest file upload evidence bundles"
```

Do not generate or commit a real `<revision>-accessibility` record in this task. That requires the
actual workflow artifact plus the approved Windows/NVDA and macOS/VoiceOver bundles.

### Task 9: Verify, publish the new preview, and complete real Task 10 evidence

**Files:**

- Modify after real run: `docs/superpowers/plans/2026-08-18-file-upload-evidence-resume.md`
- Generate after real run:
  `docs/superpowers/baselines/lyra-v1/comparisons/file-upload/<revision>-accessibility.md`
- Generate after real run:
  `docs/superpowers/baselines/lyra-v1/comparisons/file-upload/<revision>-accessibility/`

**Step 1: Run focused local verification**

```bash
build_tmp=$(mktemp -d -p /home/francisross/tmp-builds file-upload-final.XXXXXX)
TMPDIR="$build_tmp" rtk pnpm --filter @lyra-ds/file-upload-evidence run test
TMPDIR="$build_tmp" rtk pnpm --filter @lyra-ds/file-upload-evidence run test:browser
rtk pnpm --filter @lyra-ds/file-upload-evidence run typecheck
rtk node --test \
  tools/file-upload-evidence/scripts/archive.test.mjs \
  tools/file-upload-evidence/scripts/automation.test.mjs \
  tools/file-upload-evidence/scripts/ingest.test.mjs \
  tools/file-upload-evidence/scripts/deploy-policy.test.mjs \
  tools/file-upload-evidence/scripts/stage-preview.test.mjs \
  tools/file-upload-evidence/scripts/smoke.test.mjs
rm -rf "$build_tmp"
```

Expected: all focused tests pass. Keep the temp directory until failures are diagnosed; remove only
the exact directory created here.

**Step 2: Run the unchanged release gates**

Use a fresh per-run temp directory because total build/test output size is unknown:

```bash
build_tmp=$(mktemp -d -p /home/francisross/tmp-builds lyra-v1-gates.XXXXXX)
TMPDIR="$build_tmp" rtk pnpm run lint
TMPDIR="$build_tmp" rtk pnpm run typecheck
TMPDIR="$build_tmp" rtk pnpm run test
TMPDIR="$build_tmp" rtk pnpm run test:browsers
TMPDIR="$build_tmp" rtk pnpm run test:react-compat
TMPDIR="$build_tmp" rtk pnpm run parity
TMPDIR="$build_tmp" rtk pnpm run build
TMPDIR="$build_tmp" rtk pnpm run pack-smoke
TMPDIR="$build_tmp" rtk pnpm run smoke
TMPDIR="$build_tmp" rtk pnpm run performance:file-upload
rm -rf "$build_tmp"
```

Expected: all existing package, browser, SSR/hydration, parity, build, packaging, consumer smoke,
and performance gates pass. Do not declare completion from partial output.

**Step 3: Review before external publication**

Use `superpowers:requesting-code-review` on the complete diff. Resolve only evidence-backed review
findings, rerun affected focused tests, then repeat the relevant final gate. Confirm:

```bash
rtk git status --short
rtk git diff --check origin/evidence/file-upload-manual...HEAD
rtk git log --oneline origin/evidence/file-upload-manual..HEAD
```

Expected: only intended tracked changes, no generated local archives/browser artifacts, clean diff,
and review approval.

**Step 4: Push the evidence ref and dispatch the guarded preview workflow**

Push only after explicit maintainer confirmation because this changes the shared remote branch.
Dispatch `deploy.yml` on an `evidence/` ref. Confirm the job:

1. builds the isolated route;
2. deploys only the `file-upload-evidence` Pages preview branch;
3. resolves an immutable URL whose page and Function return the exact SHA;
4. passes remote smoke including real computable XHR progress;
5. passes DF-FU-17 and DF-FU-18;
6. publishes `file-upload-automation-<revision-prefix>.zip`.

If any item fails, keep Task 10 incomplete, download diagnostics, fix the smallest owning layer,
and repeat from the focused RED/GREEN test.

**Step 5: Collect the two human records**

At the exact immutable URL from Step 4:

- run M01 on Windows with current NVDA and current Firefox or Chromium;
- run M02 on macOS with current VoiceOver and current Safari;
- attach local image/video evidence in each recorder;
- record actual observations and the accessibility reviewer decision;
- download one ZIP from each machine.

Do not use the moving branch alias for accepted evidence. A FAIL bundle is useful for remediation
but cannot complete Task 10.

**Step 6: Ingest and review the real evidence**

```bash
rtk pnpm evidence:file-upload:ingest \
  --automation /absolute/path/file-upload-automation-<revision-prefix>.zip \
  --bundle /absolute/path/lyra-file-upload-evidence-<revision-prefix>-m01.zip \
  --bundle /absolute/path/lyra-file-upload-evidence-<revision-prefix>-m02.zip
rtk git diff --check
rtk git status --short
```

Replace the shown absolute input paths with the three downloaded files. Expected: the CLI creates
exactly one `<revision>-accessibility.md` plus one artifact directory, and the reviewed report
links to four PASS results and every verified artifact.

**Step 7: Close the handoff and run the final evidence gate**

Update the resume handoff with the workflow run URL, immutable preview URL, full SHA, automation
artifact name, generated evidence path, M01/M02 reviewer decision, gate results, and remaining
cleanup. Rerun the full gates affected by the generated documentation and artifacts.

**Step 8: Commit the accepted evidence**

```bash
rtk git add \
  docs/superpowers/baselines/lyra-v1/comparisons/file-upload/<revision>-accessibility.md \
  docs/superpowers/baselines/lyra-v1/comparisons/file-upload/<revision>-accessibility/ \
  docs/superpowers/plans/2026-08-18-file-upload-evidence-resume.md
rtk git commit -m "docs: record file upload accessibility evidence"
```

Task 10 is complete only after this commit contains the ingested four-result record for one exact
revision and the unchanged release gates are green. Preview cleanup and branch integration follow
the existing finishing-a-development-branch process; they are not evidence-ingestion side effects.

## Plan self-review checklist

- Approved design sections 5-13 map to Tasks 2-9.
- Every implementation task starts with an observable failing test or contradiction and ends with
  focused verification plus a scoped commit.
- Browser and Node consume the same runtime validation source; no schema is duplicated.
- Manual media stays local, automation stays revision-bound, and ingestion is the sole repository
  materialization boundary.
- Production deployment order and public FileUpload APIs remain out of scope and protected by
  regression tests.
- The plan contains no placeholder implementation, open product decision, or authorization to
  publish before maintainer confirmation.
