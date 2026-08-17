# FileUpload Manual Evidence Harness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build, verify, and publish an unlisted bilingual preview instrument that lets real reviewers collect the missing FileUpload M01–M04 evidence without adding the harness or an upload service to production documentation.

**Architecture:** An isolated Vite multi-page workspace emits authored English and Brazilian Portuguese documents with correct pre-JavaScript language and native form semantics. A React root drives the public controlled FileUpload contract, while a separate authored Alpine subtree supports delayed enhancement without React ownership. A bounded, preview-only Cloudflare Pages Function receives uploads without persistence. The existing deployment workflow gains a guarded `evidence/` preview job that merges the isolated output into the already-built Docs export and deploys it under a fixed non-production branch alias.

**Tech Stack:** TypeScript 5.9, React 19, Alpine 3, Vite 8, Vitest 4 Browser Mode, Playwright 1.62 Chromium/Firefox/WebKit, Node test runner, Cloudflare Pages Functions/Wrangler 4, GitHub Actions, pnpm 11.

## Global Constraints

- Follow [the approved harness design](../specs/2026-08-17-file-upload-manual-evidence-harness-design.md) exactly. Reopen design instead of silently changing an approved boundary.
- Every shell command starts with `rtk`; use `rtk proxy` only when unfiltered output is required.
- Use `superpowers:test-driven-development` for every behavior change: add one discriminating failing test, observe its expected failure, implement the smallest production slice, and rerun the focused test.
- Use `superpowers:systematic-debugging` and `no-workarounds` for every unexpected failure. Do not add sleeps, retries, browser skips, weakened assertions, warning suppression, or budget increases.
- Use `react` for React state/effect work. Keep mutable `File`, `XMLHttpRequest`, and attempt identity in refs or controller objects; render only controlled immutable item state.
- Use `impeccable` once after the complete harness UI exists, then address material findings through normal TDD. Do not run its detector repeatedly to chase cosmetic output.
- The harness is a private tool, not a package release. Do not add a Changeset, public package export, Docs navigation item, component example, analytics, authentication, storage, or permanent public endpoint.
- Do not define a generic `build` script in the new workspace package: root recursive builds and production deploys must never produce the harness. Use only explicit `build:preview`, `test:browser`, and validation scripts.
- An ordinary `pnpm --filter @lyra-ds/docs run build` must contain no harness HTML or assets. Only the guarded preview job may copy isolated harness output into `apps/docs/out`.
- The endpoint accepts at most 10 MiB, delays at most 15 seconds, never logs or stores file bytes/names/results, and returns `Cache-Control: no-store` plus the exact compiled Git revision.
- Automated Browser Mode proves only that the instrument works. It never marks DF-FU-M01 through M04 as passed or substitutes accessibility-tree assertions for actual NVDA/VoiceOver output.
- M03 requires a truthful `window.innerWidth === 320`, a real coarse pointer, recorded touch and keyboard input, and no horizontal overflow. CSS transforms, screenshot resizing, and device emulation do not qualify as manual evidence.
- Do not commit `dist`, `apps/docs/out`, Wrangler staging directories, browser artifacts, selected files, exported draft observations, preview URLs containing secrets, or incomplete manual evidence.
- Each task ends with a small commit and independent review before the next externally visible step. Never rewrite already-reviewed history.

---

## File Map

### Isolated workspace

- Create `tools/file-upload-evidence/package.json` — private workspace scripts and explicit local dependencies.
- Create `tools/file-upload-evidence/tsconfig.json` — DOM/Worker-compatible strict TypeScript configuration.
- Create `tools/file-upload-evidence/vite.config.ts` — gated two-entry preview build with exact revision injection.
- Create `tools/file-upload-evidence/vitest.config.ts` — Node unit-test project.
- Create `tools/file-upload-evidence/vitest.browser.config.ts` — pinned three-engine Browser Mode project.
- Create `tools/file-upload-evidence/en/file-upload-evidence/index.html` — authored English pre-JavaScript document.
- Create `tools/file-upload-evidence/pt-BR/file-upload-evidence/index.html` — authored Brazilian Portuguese pre-JavaScript document.
- Create `tools/file-upload-evidence/src/contracts.ts` and `contracts.test.ts` — scenarios, observation schema, validation, and locale invariants.
- Create `tools/file-upload-evidence/src/messages.ts` and `messages.test.ts` — complete paired English/PT-BR copy.
- Create `tools/file-upload-evidence/src/telemetry.ts` and `telemetry.test.ts` — truthful environment capture and M03 eligibility.
- Create `tools/file-upload-evidence/src/endpoint.ts` and `endpoint.test.ts` — pure request handler used by the preview Function.
- Create `tools/file-upload-evidence/src/upload-machine.ts` and `upload-machine.test.ts` — controlled React lifecycle reducer and attempt guards.
- Create `tools/file-upload-evidence/src/react-file-upload.tsx` — public FileUpload consumer and real XHR transport.
- Create `tools/file-upload-evidence/src/react-file-upload.browser.test.tsx` — public React lifecycle browser coverage.
- Create `tools/file-upload-evidence/src/alpine-controller.ts` — parent-owned controlled Alpine state and exact event handling.
- Create `tools/file-upload-evidence/src/alpine-bootstrap.ts` — bounded delayed one-time Alpine enhancement.
- Create `tools/file-upload-evidence/src/alpine-bootstrap.browser.test.ts` — pre-init selection and one-time enhancement coverage.
- Create `tools/file-upload-evidence/src/harness-app.tsx` and `main.tsx` — operator UI, telemetry, guided scenarios, and local JSON export.
- Create `tools/file-upload-evidence/src/harness.css` — minimal harness layout using Lyra tokens and component CSS.
- Create `tools/file-upload-evidence/src/harness-app.browser.test.tsx` — observation editor and export coverage.
- Create `tools/file-upload-evidence/src/harness.browser.test.tsx` — instrument fitness in Chromium, Firefox, and WebKit.
- Create `tools/file-upload-evidence/src/static-output.test.mjs` — authored HTML and production-absence assertions.

### Preview preparation and deployment

- Create `tools/file-upload-evidence/scripts/stage-preview.mjs` and `stage-preview.test.mjs` — guarded copy into Docs output and generated temporary Function tree.
- Create `tools/file-upload-evidence/scripts/deploy-policy.mjs` and `deploy-policy.test.mjs` — semantic validation of the workflow guard and deploy boundary.
- Create `tools/file-upload-evidence/scripts/smoke.mjs` and `smoke.test.mjs` — immutable preview revision, route, Function, and real XHR progress smoke checks.
- Modify `package.json` — explicit manual-evidence commands only.
- Modify `pnpm-lock.yaml` — frozen workspace importer for the private tool.
- Modify `.github/workflows/deploy.yml` — preserve production deploy and add the guarded evidence preview job.

---

### Task 1: Establish the private workspace, localization, telemetry, and observation contract

**Files:**

- Create: `tools/file-upload-evidence/package.json`
- Create: `tools/file-upload-evidence/tsconfig.json`
- Create: `tools/file-upload-evidence/vitest.config.ts`
- Create: `tools/file-upload-evidence/src/contracts.ts`
- Create: `tools/file-upload-evidence/src/contracts.test.ts`
- Create: `tools/file-upload-evidence/src/messages.ts`
- Create: `tools/file-upload-evidence/src/messages.test.ts`
- Create: `tools/file-upload-evidence/src/telemetry.ts`
- Create: `tools/file-upload-evidence/src/telemetry.test.ts`
- Modify: `pnpm-lock.yaml`

**Interfaces:**

- Produces `Locale`, `ManualScenario`, `UploadMode`, `EnvironmentTelemetry`, and `FileUploadManualObservation` exactly matching the design.
- Produces `validateObservation(value): ObservationValidation`, where success returns a normalized observation and failure returns stable localized field errors without mutating input.
- Produces `captureTelemetry(windowLike, navigatorLike)` and `m03Eligibility(telemetry, inputMethods, checks)` as pure functions.
- Produces one `MESSAGES` object whose `en` and `pt-BR` leaves have identical keys.

- [ ] **Step 1: Add the private package manifest and strict test configuration**

Use the workspace packages rather than source-relative imports:

```json
{
  "name": "@lyra-ds/file-upload-evidence",
  "private": true,
  "type": "module",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "vitest run --config vitest.config.ts",
    "test:browser": "vitest run --config vitest.browser.config.ts",
    "build:preview": "vite build"
  },
  "dependencies": {
    "@lyra-ds/alpine": "workspace:*",
    "@lyra-ds/react": "workspace:*",
    "@lyra-ds/styles": "workspace:*",
    "alpinejs": "3.15.12",
    "react": "19.2.8",
    "react-dom": "19.2.8"
  }
}
```

List Vite, Vitest, browser provider, React types, and TypeScript as explicit dev dependencies using the repository's pinned versions. Do not add a `build` script.

- [ ] **Step 2: Write RED tests for schema contradictions and M03 truthfulness**

Cover all four scenario IDs, both locales, ISO timestamps, full 40-character lowercase SHA, absolute HTTPS deployment URL, non-empty version/build fields, required artifacts, and reviewer rules. Include these discriminating cases:

```ts
expect(validateObservation({ ...valid, result: 'PASS', reviewer: changesRequested }).ok).toBe(
  false,
);
expect(validateObservation({ ...valid, scenario: 'DF-FU-M01', assistiveTechnology: null }).ok).toBe(
  false,
);
expect(
  m03Eligibility(
    { ...telemetry, viewport: { ...telemetry.viewport, width: 321 }, coarsePointer: true },
    ['touch', 'keyboard'],
    completeM03Checks,
  ),
).toEqual({ eligible: false, reasons: ['viewport-width'] });
```

Run:

```text
rtk pnpm install --lockfile-only
rtk pnpm --filter @lyra-ds/file-upload-evidence run test
```

Expected: FAIL because the contract modules do not exist.

- [ ] **Step 3: Implement immutable validation, telemetry, and paired messages**

Use discriminated results instead of throwing for user-entered observation data:

```ts
export type ObservationValidation =
  | { ok: true; value: FileUploadManualObservation }
  | { ok: false; errors: readonly ObservationError[] };
```

`captureTelemetry` reads actual viewport/DPR/timezone/media-query results and stores user agent only as supporting text. `m03Eligibility` must require exact width 320, real coarse-pointer match, both input methods, and every manual M03 check; it must not accept an override parameter for viewport or pointer.

In `messages.test.ts`, recursively compare locale key paths and reject blank values or language mixing in scenario labels, endpoint messages, validation errors, instructions, status labels, and expected announcements.

- [ ] **Step 4: Run focused and package checks**

```text
rtk pnpm --filter @lyra-ds/file-upload-evidence run test
rtk pnpm --filter @lyra-ds/file-upload-evidence run typecheck
rtk pnpm exec prettier --check tools/file-upload-evidence pnpm-lock.yaml
rtk git diff --check
```

Expected: all unit tests and strict TypeScript pass; the lockfile contains one private workspace importer and no new external version drift.

- [ ] **Step 5: Commit the pure contract**

```text
rtk git add tools/file-upload-evidence/package.json tools/file-upload-evidence/tsconfig.json
rtk git add tools/file-upload-evidence/vitest.config.ts tools/file-upload-evidence/src
rtk git add pnpm-lock.yaml
rtk git commit -m "test: define manual file upload evidence contract"
```

---

### Task 2: Implement the bounded preview-only upload endpoint

**Files:**

- Create: `tools/file-upload-evidence/src/endpoint.ts`
- Create: `tools/file-upload-evidence/src/endpoint.test.ts`

**Interfaces:**

- Produces `handleEvidenceRequest(request, environment): Promise<Response>` with injected `revision`, `sleep`, and `randomUUID` dependencies.
- Accepts only same-origin `POST` requests, `success|error|delay`, `en|pt-BR`, and bodies no larger than 10 MiB.
- Returns JSON only when `X-Lyra-Evidence-Client: xhr` is present; otherwise returns localized accessible HTML.

- [ ] **Step 1: Write the endpoint contract tests before the handler**

Cover `405 + Allow: POST`, cross-origin rejection, invalid/missing mode, invalid locale, malformed multipart, declared oversize, streamed oversize, success JSON, retryable `503`, bounded delay, localized native HTML, request ID, revision header, and mandatory security/cache headers. Use an injected fake `sleep` that records the requested duration without waiting.

For an inaccurate/missing `Content-Length`, feed a `ReadableStream<Uint8Array>` that crosses 10 MiB and assert the reader is canceled and the response is `413`.

Run:

```text
rtk pnpm --filter @lyra-ds/file-upload-evidence exec vitest run src/endpoint.test.ts
```

Expected: FAIL because `handleEvidenceRequest` is absent.

- [ ] **Step 2: Add a streaming body limiter and explicit request classification**

Implement these pure boundaries:

```ts
const MAX_BODY_BYTES = 10 * 1024 * 1024;
const MAX_DELAY_MS = 15_000;

export interface EvidenceEndpointEnvironment {
  revision: string;
  randomUUID(): string;
  sleep(milliseconds: number): Promise<void>;
}
```

Reject a numeric `Content-Length` above the limit before reading. Otherwise read through `request.body.getReader()`, count bytes, cancel on overflow, and only then parse a reconstructed multipart request. Never log request metadata or body data.

Require `Origin` to match `new URL(request.url).origin`; reject absent or mismatched origins. Return no permissive CORS header.

- [ ] **Step 3: Render safe JSON and native HTML responses**

Escape all dynamic HTML fields. Return only request ID, file name, media type, byte length, and revision in the native response; never echo bytes. Include on every response:

```text
Cache-Control: no-store
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
X-Lyra-Evidence-Revision: <full SHA>
```

Clamp the requested delay into `0..15000`. The explicit `error` mode returns `503`; successful XHR returns `200` JSON. Native errors remain localized HTML with the applicable status.

- [ ] **Step 4: Verify endpoint boundaries and commit**

```text
rtk pnpm --filter @lyra-ds/file-upload-evidence exec vitest run src/endpoint.test.ts
rtk pnpm --filter @lyra-ds/file-upload-evidence run typecheck
rtk pnpm exec prettier --check tools/file-upload-evidence/src/endpoint.ts tools/file-upload-evidence/src/endpoint.test.ts
rtk git diff --check
rtk git add tools/file-upload-evidence/src/endpoint.ts tools/file-upload-evidence/src/endpoint.test.ts
rtk git commit -m "feat: add bounded file upload evidence endpoint"
```

---

### Task 3: Build the controlled React lifecycle instrument

**Files:**

- Create: `tools/file-upload-evidence/src/upload-machine.ts`
- Create: `tools/file-upload-evidence/src/upload-machine.test.ts`
- Create: `tools/file-upload-evidence/src/react-file-upload.tsx`
- Create: `tools/file-upload-evidence/src/react-file-upload.browser.test.tsx`

**Interfaces:**

- Consumes only `@lyra-ds/react/file-upload` public exports.
- Produces reducer transitions for selection, upload start, native progress, canceling, canceled, retryable error, retry, success, stale completion rejection, removal, and reset.
- Owns `Map<itemId, File>` and `Map<attemptId, XMLHttpRequest>` outside rendered state; every async result is guarded by both item and attempt identity.

- [ ] **Step 1: Write RED reducer tests for exact attempt ownership**

Start from proposals shaped by the public API. Prove:

- `selection` echoes `proposedItem` before transport starts;
- determinate progress is finite and clamped only when `lengthComputable && total > 0`;
- cancel changes only the matching uploading attempt;
- retry accepts the component's `proposedAttemptId` and never reuses the prior identity;
- stale progress/load/error/abort from an older attempt returns the same state object;
- removal deletes only the selected ID.

Run:

```text
rtk pnpm --filter @lyra-ds/file-upload-evidence exec vitest run src/upload-machine.test.ts
```

Expected: FAIL because the reducer is absent.

- [ ] **Step 2: Implement the reducer and transport adapter without DOM shortcuts**

Use a discriminated action union and an exact attempt predicate:

```ts
function hasAttempt(item: FileUploadItem, id: string, attemptId: string) {
  return item.id === id && 'attemptId' in item && item.attemptId === attemptId;
}
```

The component must send the file to `/api/file-upload-evidence` through `XMLHttpRequest`, set `X-Lyra-Evidence-Client: xhr`, listen to `request.upload.progress`, and retain a completed stale result as data that an operator may deliver later. The stale operator action dispatches the captured old result through the reducer; it never mutates FileUpload DOM or fabricates FileUpload events.

Map operator-only modes onto the Function's closed protocol explicitly: `indeterminate` uses a delayed request but withholds recorded native progress from controlled state until the operator advances it; `stale` retains a completed older-attempt action and redelivers that action only after a real retry. The wire-level `mode` field remains only `success`, `error`, or `delay`.

- [ ] **Step 3: Write RED Browser Mode tests through the public component**

Mount `ReactFileUploadEvidence` and exercise real user interactions. Assert public outcomes rather than implementation calls:

- selection enters indeterminate uploading and preserves the exact `File`;
- cancel targets the active request and reaches `canceling` before `canceled`;
- retry uses a new attempt ID;
- an older retained result changes neither item state nor live-region text;
- retryable error, retry, success, and confirmed removal work;
- removal restores focus to next action, previous action, or native input according to the component contract.

Inject a controllable XHR factory into the harness adapter for tests; do not replace FileUpload internals.

Run the focused Chromium project and observe RED before completing the component.

- [ ] **Step 4: Complete the React consumer and make focused Browser Mode green**

Use `useReducer`, stable refs, and one unmount cleanup that aborts every active request. Remove requests from the map only when the map still holds the same object for that attempt. Echo controlled proposals synchronously, then start accepted uploads.

Run:

```text
rtk pnpm --filter @lyra-ds/react run build
rtk pnpm --filter @lyra-ds/file-upload-evidence exec vitest run --config vitest.browser.config.ts --browser.name chromium src/react-file-upload.browser.test.tsx
rtk pnpm --filter @lyra-ds/file-upload-evidence run typecheck
```

Expected: focused React lifecycle passes without timers, synthetic progress, or stale updates.

- [ ] **Step 5: Commit the controlled React instrument**

```text
rtk git add tools/file-upload-evidence/src/upload-machine.ts
rtk git add tools/file-upload-evidence/src/upload-machine.test.ts
rtk git add tools/file-upload-evidence/src/react-file-upload.tsx
rtk git add tools/file-upload-evidence/src/react-file-upload.browser.test.tsx
rtk git commit -m "feat: add controlled file upload evidence lifecycle"
```

---

### Task 4: Author pre-JavaScript documents and delayed Alpine enhancement

**Files:**

- Create: `tools/file-upload-evidence/en/file-upload-evidence/index.html`
- Create: `tools/file-upload-evidence/pt-BR/file-upload-evidence/index.html`
- Create: `tools/file-upload-evidence/src/alpine-controller.ts`
- Create: `tools/file-upload-evidence/src/alpine-bootstrap.ts`
- Create: `tools/file-upload-evidence/src/alpine-bootstrap.browser.test.ts`
- Create: `tools/file-upload-evidence/src/static-output.test.mjs`

**Interfaces:**

- Both raw HTML files contain correct `lang`, title, `noindex,nofollow`, localized native multipart form, revision/build placeholders, React mount root, and separate Alpine root.
- Produces `parseAlpineDelay(search): number` with `0..15000` inclusive and default `5000`.
- Initializes Alpine and the Lyra plugin once, calls `Alpine.initTree(root)` once, and never replaces the selected input node.

- [ ] **Step 1: Write static RED tests against the two authored entries**

Parse raw source HTML and require:

- exact `<html lang="en">` / `<html lang="pt-BR">` before JavaScript;
- `robots=noindex,nofollow`;
- a labelled native `<input type="file" name="file">` inside `method="post" enctype="multipart/form-data"` targeting `/api/file-upload-evidence`;
- hidden explicit locale and mode values;
- no retry/cancel/remove enhancement actions inside the native form;
- separate React and Alpine roots;
- identical semantic IDs but localized visible/accessibility copy.

Run the Node test and observe failure because entries do not exist.

- [ ] **Step 2: Author the complete English and Portuguese static documents**

Keep the native form fully usable with scripts disabled. Use only build-time placeholders owned by the Vite transform for full SHA and UTC build time. The delayed Alpine subtree must already contain its real input and form association in raw HTML; do not create or replace that input during bootstrap.

- [ ] **Step 3: Write RED delayed-initialization browser tests**

Before importing bootstrap, select a real `File`, save `const originalInput = input`, then advance the injected scheduler. Assert after initialization:

```ts
expect(root.querySelector('input[type=file]')).toBe(originalInput);
expect(input.files?.[0]).toBe(file);
expect(new FormData(form).get('file')).toBe(file);
expect(counters.initializations).toBe(1);
expect(counters.selectionIntents).toBe(0);
```

Make one later real selection and assert exactly one event path and one controlled echo. Remove the item and assert public focus recovery. Add reconnect and repeated-bootstrap tests that remain one-time.

- [ ] **Step 4: Implement bounded delayed bootstrap and parent-owned Alpine control**

`parseAlpineDelay` accepts only a base-10 integer string from 0 through 15000. Bootstrap dynamically imports `alpinejs` and `@lyra-ds/alpine`, registers the plugin once, installs the parent `uploadItems` controller, and invokes `Alpine.initTree(root)` once after the injected delay. Use the public `lyra:file-upload:select`, `lyra:file-upload:retry`, `lyra:file-upload:cancel`, and `lyra:file-upload:remove` events and `x-modelable="items"`; never call adapter-private methods.

- [ ] **Step 5: Verify and commit the pre-JavaScript/Alpine slice**

```text
rtk pnpm --filter @lyra-ds/alpine run build
rtk pnpm --filter @lyra-ds/file-upload-evidence exec vitest run src/static-output.test.mjs
rtk pnpm --filter @lyra-ds/file-upload-evidence exec vitest run --config vitest.browser.config.ts --browser.name chromium src/alpine-bootstrap.browser.test.ts
rtk pnpm --filter @lyra-ds/file-upload-evidence run typecheck
rtk git diff --check
rtk git add tools/file-upload-evidence/en tools/file-upload-evidence/pt-BR
rtk git add tools/file-upload-evidence/src/alpine-controller.ts tools/file-upload-evidence/src/alpine-bootstrap.ts
rtk git add tools/file-upload-evidence/src/alpine-bootstrap.browser.test.ts tools/file-upload-evidence/src/static-output.test.mjs
rtk git commit -m "feat: add delayed Alpine evidence fixture"
```

---

### Task 5: Build the bilingual operator UI and local evidence export

**Files:**

- Create: `tools/file-upload-evidence/src/harness-app.tsx`
- Create: `tools/file-upload-evidence/src/main.tsx`
- Create: `tools/file-upload-evidence/src/harness.css`
- Create: `tools/file-upload-evidence/src/harness-app.browser.test.tsx`

**Interfaces:**

- Renders revision/build metadata, truthful environment telemetry, visual-only lifecycle diagnostics, guided M01–M04 checklists, React instrument, and observation editor.
- Keeps the diagnostic panel out of live regions and component naming/description relationships.
- Exports validated JSON locally through copy and download actions; never sends observations to the endpoint.
- Blocks M03 PASS unless the pure exact-width/coarse-pointer/input/check gate passes.

- [ ] **Step 1: Write RED browser tests for export and accessibility boundaries**

Test both locales. Require prefilled locale/revision/deployment URL/timezone/viewport/media queries, explicit OS/browser/AT/reviewer fields, disabled export while incomplete, contradictory reviewer/result rejection, local JSON serialization, and a new blank observation when locale changes.

Assert the diagnostic panel has no `aria-live`, is not referenced by `aria-describedby`, and cannot alter FileUpload's accessible name. For M01/M02 require AT metadata; for M03 permit `assistiveTechnology: null` only after explicit no-AT confirmation.

- [ ] **Step 2: Implement the operator UI from localized message data**

Render operator mode controls outside FileUpload. Their callbacks may choose `success`, `error`, `delay`, `indeterminate`, or deliver a captured stale result, but may act only through the consumer reducer/transport interface.

Use one observation draft per chosen scenario and locale. `Copy JSON` calls the clipboard only after `validateObservation` succeeds. `Download JSON` creates an object URL, clicks a localized filename such as `DF-FU-M03-pt-BR-<revision>.json`, then revokes the URL.

- [ ] **Step 3: Add the long-name and exact M03 checklist**

Include a real long localized file-name fixture and record these explicit booleans: touch used, physical keyboard used, no horizontal overflow, file identity retained, actions reachable, active replacement rejected/announced, cancel/retry/remove completed, and focus recovered. Compute viewport and pointer eligibility at export time, not only at initial render.

- [ ] **Step 4: Apply harness-only layout and run the UI design review**

Import `@lyra-ds/styles/styles.css`; use Lyra tokens and component classes. Keep harness CSS scoped under `.lyra-evidence`, mobile-first, logical-property based, reflow-safe at 320 CSS px, and usable in light/dark/RTL/forced-colors/reduced-motion.

Run the `impeccable` detector exactly once after the complete UI is present. Convert any material finding into a failing focused test before adjusting CSS or markup.

- [ ] **Step 5: Verify and commit the operator UI**

```text
rtk pnpm --filter @lyra-ds/file-upload-evidence exec vitest run --config vitest.browser.config.ts --browser.name chromium src/harness-app.browser.test.tsx
rtk pnpm --filter @lyra-ds/file-upload-evidence run typecheck
rtk pnpm exec prettier --check tools/file-upload-evidence/src
rtk git diff --check
rtk git add tools/file-upload-evidence/src/harness-app.tsx tools/file-upload-evidence/src/main.tsx
rtk git add tools/file-upload-evidence/src/harness.css tools/file-upload-evidence/src/harness-app.browser.test.tsx
rtk git commit -m "feat: add bilingual file upload evidence recorder"
```

---

### Task 6: Gate the isolated build and the three-engine instrument

**Files:**

- Create: `tools/file-upload-evidence/vite.config.ts`
- Create: `tools/file-upload-evidence/vitest.browser.config.ts`
- Create: `tools/file-upload-evidence/src/harness.browser.test.tsx`
- Modify: `tools/file-upload-evidence/src/static-output.test.mjs`
- Modify: `package.json`

**Interfaces:**

- `build:preview` rejects absent/incorrect `FILE_UPLOAD_EVIDENCE`, non-full SHA, or invalid build timestamp.
- Vite emits only `dist/en/file-upload-evidence/index.html`, `dist/pt-BR/file-upload-evidence/index.html`, and their hashed private assets.
- The root exposes explicit `evidence:file-upload:manual:*` commands without joining production `build`.

- [ ] **Step 1: Write RED tests for build gating and production absence**

Spawn the preview build in temporary fixture roots and prove it fails closed without `FILE_UPLOAD_EVIDENCE=1`, without a 40-character SHA, or without a valid UTC timestamp. With valid values, require correct route language/noindex/revision and no unexpanded build tokens.

Run an ordinary Docs build into `apps/docs/out`, then assert no path or asset containing `file-upload-evidence` exists before preview copy. The test must inspect filesystem output, not source guards.

- [ ] **Step 2: Implement the multi-page Vite build and root commands**

Use explicit Rollup inputs for the two HTML entries and `base: '/'`. A `transformIndexHtml` hook replaces the authored HTML revision/build tokens, while `define` injects the same serialized public constants into JavaScript:

```ts
define: {
  __LYRA_EVIDENCE_REVISION__: JSON.stringify(revision),
  __LYRA_EVIDENCE_BUILD_TIME__: JSON.stringify(buildTime),
}
```

Add root scripts:

```json
"evidence:file-upload:manual:test": "pnpm --filter @lyra-ds/file-upload-evidence run test",
"evidence:file-upload:manual:browser": "pnpm --filter @lyra-ds/file-upload-evidence run test:browser",
"evidence:file-upload:manual:build": "pnpm --filter @lyra-ds/file-upload-evidence run build:preview"
```

Do not add the preview build to root `build`, Docs `build`, or the production deploy job.

- [ ] **Step 3: Add full instrument Browser Mode acceptance**

Reuse `PLAYWRIGHT_BROWSER_INSTANCES` and `createBrowserEvidenceConfig` from `tools/phase1/browser-matrix.mjs`. Cover route locale isolation, lifecycle guidance, endpoint-client request construction, delayed Alpine, evidence validation/export, accessibility with axe, RTL, long content, 320px reflow, forced colors, and reduced motion. Automated viewport/pointer emulation validates UI behavior only and must be named so it cannot be mistaken for M03 evidence.

- [ ] **Step 4: Run fresh local and official-image gates**

```text
rtk pnpm --filter @lyra-ds/styles run lint:css
rtk pnpm --filter @lyra-ds/react run build
rtk pnpm --filter @lyra-ds/alpine run build
rtk pnpm run evidence:file-upload:manual:test
rtk env FILE_UPLOAD_EVIDENCE=1 LYRA_EVIDENCE_REVISION=$(rtk git rev-parse HEAD) LYRA_EVIDENCE_BUILD_TIME=2026-08-17T12:00:00.000Z pnpm run evidence:file-upload:manual:build
rtk pnpm run evidence:file-upload:manual:browser
rtk pnpm --filter @lyra-ds/docs run build
```

Run the three-engine browser command again in the exact pinned Playwright image from `tools/phase1/browser-matrix.mjs`, with `--init`, `--ipc=host`, `CI=true`, and frozen dependencies. Expected: one execution, all focused tests green in Chromium, Firefox, and WebKit.

- [ ] **Step 5: Run deslop, remove generated output, and commit**

Use `deslop` over the branch diff. Remove only explicitly resolved generated `tools/file-upload-evidence/dist`, `apps/docs/out`, browser artifacts, and temporary stores; verify paths before deletion.

```text
rtk pnpm exec prettier --check package.json tools/file-upload-evidence
rtk git diff --check
rtk git status --short
rtk git add package.json tools/file-upload-evidence/vite.config.ts tools/file-upload-evidence/vitest.browser.config.ts
rtk git add tools/file-upload-evidence/src/harness.browser.test.tsx tools/file-upload-evidence/src/static-output.test.mjs
rtk git commit -m "test: gate the manual file upload evidence harness"
```

---

### Task 7: Stage the preview Function and harden the existing deploy workflow

**Files:**

- Create: `tools/file-upload-evidence/scripts/stage-preview.mjs`
- Create: `tools/file-upload-evidence/scripts/stage-preview.test.mjs`
- Create: `tools/file-upload-evidence/scripts/deploy-policy.mjs`
- Create: `tools/file-upload-evidence/scripts/deploy-policy.test.mjs`
- Create: `tools/file-upload-evidence/scripts/smoke.mjs`
- Create: `tools/file-upload-evidence/scripts/smoke.test.mjs`
- Modify: `.github/workflows/deploy.yml`
- Modify: `package.json`

**Interfaces:**

- `stage-preview` validates all roots and full SHA, copies the isolated dist beneath Docs output without deleting existing files, and creates a temporary Wrangler cwd with a generated Function adapter containing that exact SHA.
- `validateDeployPolicy(workflow)` parses YAML and rejects any preview job that can run for push/main/non-`evidence/` refs, uses `--branch=main`, deploys the landing site, omits frozen install/tests/build order, or mutates production job semantics.
- `smoke --url --revision` checks the immutable deployment, both locales, Function revision parity, native response, and a real computable XHR upload progress event.

- [ ] **Step 1: Write RED staging tests with guarded temporary fixtures**

Use `mkdtemp` roots containing sentinel Docs files. Prove staging preserves the sentinel, copies both harness routes, refuses a destination outside the provided Docs root, refuses an incomplete SHA, and generates exactly one `functions/api/file-upload-evidence.ts` adapter plus the endpoint module. The generated adapter passes the serialized revision into `handleEvidenceRequest`; it contains no secret, storage binding, logger, or permissive CORS header.

- [ ] **Step 2: Implement staging without broad or unresolved destructive paths**

Resolve and validate every input path before copying. Refuse workspace root, filesystem root, home directory, missing `apps/docs/out`, missing harness manifest, or a non-empty staging target not created by this invocation. Clean only the exact `mkdtemp` directory in `finally`.

The generated Function exports the Pages `onRequest` adapter and injects:

```ts
handleEvidenceRequest(context.request, {
  revision: '<validated full SHA>',
  randomUUID: () => crypto.randomUUID(),
  sleep: (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
});
```

- [ ] **Step 3: Write RED semantic workflow-policy tests**

Parse `.github/workflows/deploy.yml` with `yaml`. Snapshot the existing production job's build order, landing/docs deploy commands, branch `main`, and concurrency. Require that it remains eligible for `main` pushes and manual `main` dispatches but cannot run for a non-main ref. Require a separate preview job with:

- `github.event_name == 'workflow_dispatch'` and `startsWith(github.ref_name, 'evidence/')`;
- read-only contents permission;
- checkout of the selected ref and frozen pnpm install;
- Styles, React, Alpine, ordinary Docs, focused harness tests, isolated build, staging, and deploy in that order;
- `--project-name=lyra-ds-docs --branch=file-upload-evidence` and no site deploy;
- exact revision passed to build, staging, Function, smoke, and workflow summary;
- no `--branch=main`, production-branch update, secret print, floating action, or browser install workaround.

Mutation-test the validator by changing the preview branch to `main`, removing the ref guard, swapping build order, and inserting a landing deploy; each mutation must fail for its own reason.

- [ ] **Step 4: Extend the existing workflow without changing production behavior**

Keep `push: main` and manual `main` production execution unchanged by guarding the existing job with `github.ref_name == 'main'`. Add the preview job only for manually selected `evidence/` refs. Use the repository-pinned Node/pnpm setup and existing Cloudflare secrets. Build ordinary Docs first, stage into its output, then invoke Wrangler from the generated temporary cwd with `--commit-hash=$GITHUB_SHA`, `--branch=file-upload-evidence`, and `--commit-dirty=true`.

After upload, call `wrangler pages deployment list --project-name=lyra-ds-docs --environment=preview --json`; select exactly the deployment whose branch and commit hash match this run, fail on zero or multiple matches, and write its immutable URL, the alias, and SHA to `$GITHUB_STEP_SUMMARY`. Do not scrape human-formatted deploy output.

Do not deploy the landing site or use `--branch=main` in the preview job.

- [ ] **Step 5: Add the remote smoke CLI through testable collaborators**

Unit-test URL/revision parsing, page/Function mismatch, localized route metadata, native multipart response, and the progress-event gate. The browser smoke must attach `xhr.upload.onprogress`, upload a generated in-memory payload large enough to traverse the real edge path, and require at least one event with `lengthComputable === true && total > 0`. A synthetic `ProgressEvent` or operator-driven progress must fail the smoke.

- [ ] **Step 6: Verify policy and commit without deploying**

```text
rtk pnpm --filter @lyra-ds/file-upload-evidence exec vitest run scripts/stage-preview.test.mjs scripts/deploy-policy.test.mjs scripts/smoke.test.mjs
rtk pnpm exec prettier --check .github/workflows/deploy.yml package.json tools/file-upload-evidence/scripts
rtk git diff --check
rtk git add .github/workflows/deploy.yml package.json tools/file-upload-evidence/scripts
rtk git commit -m "ci: add guarded file upload evidence preview"
```

Run the repository's checksum-verified actionlint 1.7.12 procedure from `.github/workflows/ci.yml` against the workflow before committing. Expected: workflow/policy/actionlint checks pass; no Cloudflare request, Git push, preview deployment, or evidence record occurs yet.

---

### Task 8: Verify, review, publish the preview, and hand off real-device evidence

**Files:**

- Modify: `.superpowers/sdd/2026-08-16-file-upload-controlled-lifecycle/task-10-report.md` — ignored operational report only.
- Do not create yet: `docs/superpowers/evidence/2026-08-16-file-upload-manual.md`

**Interfaces:**

- Produces one reviewed harness revision, one immutable preview URL, one fixed branch alias, and a localized execution checklist.
- Does not claim Task 10 completion until M01–M04 records and artifacts are real, reviewed, and committed.

- [ ] **Step 1: Run the complete pre-publication verification from a clean tree**

Use `superpowers:verification-before-completion`. Run fresh, in order:

```text
rtk pnpm install --frozen-lockfile
rtk pnpm --filter @lyra-ds/styles run lint:css
rtk pnpm --filter @lyra-ds/react run lint
rtk pnpm --filter @lyra-ds/react run typecheck
rtk pnpm --filter @lyra-ds/alpine run typecheck
rtk pnpm --filter @lyra-ds/file-upload-evidence run typecheck
rtk pnpm run evidence:file-upload:manual:test
rtk pnpm --filter @lyra-ds/docs run build
rtk pnpm test
rtk pnpm run test:browsers
rtk pnpm run parity
rtk pnpm run baseline:bundles --check
rtk pnpm run performance:file-upload --check
rtk pnpm run lint
rtk git diff --check
rtk git status --short
```

Run the harness focused browser gate in the pinned official Playwright image as a distinct recorded command, and run the repository's checksum-verified actionlint 1.7.12 procedure from `.github/workflows/ci.yml`. Any product, harness, workflow, bundle, or environment failure blocks publication; diagnose it rather than rerunning until green.

- [ ] **Step 2: Request independent code and evidence-instrument review**

Use `superpowers:requesting-code-review`. Give the reviewer the approved design, this plan, exact base/head SHAs, full real diff, test evidence, and explicit review questions:

- Can production deploy or ordinary Docs export expose the harness?
- Can the Function persist, log, over-read, over-delay, accept cross-origin input, or report another revision?
- Can operator controls forge component progress/announcements or accept stale attempts?
- Can M03 export PASS without real 320 CSS px, coarse pointer, touch, and keyboard?
- Can incomplete/contradictory observations export or masquerade as manual evidence?
- Does pre-JavaScript PT-BR retain correct document language, native form, and selected `File` through delayed Alpine?

Address every material finding through `superpowers:receiving-code-review`, one RED/GREEN slice and separate corrective commit. Repeat independent review only for changed risk boundaries.

- [ ] **Step 3: Obtain explicit publication authorization**

Present the clean reviewed SHA, commands/counts, expected Cloudflare project, fixed preview branch, and planned temporary Git ref. Ask the user to authorize the external push and workflow dispatch. Do not infer publication authority from approval of this plan.

- [ ] **Step 4: Create and push only the temporary evidence ref**

After authorization, verify the current branch is clean and the target SHA is reviewed. Create `evidence/file-upload-manual` at that exact SHA and push it without force. Resolve the remote/ref read-only before pushing; do not update `main` or another branch.

- [ ] **Step 5: Dispatch and monitor the existing Deploy workflow**

Dispatch `.github/workflows/deploy.yml` against `evidence/file-upload-manual`. Monitor until terminal. Require the preview job to report the immutable URL, `file-upload-evidence` alias, and exact SHA. A production deploy job running for this ref is a release blocker.

- [ ] **Step 6: Run one immutable-URL smoke and record the result**

```text
rtk pnpm --filter @lyra-ds/file-upload-evidence exec node scripts/smoke.mjs --url "$IMMUTABLE_PREVIEW_URL" --revision "$REVIEWED_SHA"
```

Expected: both locales return correct language/noindex/SHA; Function headers match; native multipart response is localized and metadata-only; real XHR produces a computable positive-total upload progress event; all four guided scenario sections are reachable. Do not rerun a failing smoke before root-cause diagnosis.

- [ ] **Step 7: Hand off the real-device checklist without pre-filling results**

Provide:

- Samsung Galaxy S25 Ultra/current Chrome M03 instructions, including how to verify the page reports exactly 320 CSS px and how to attach a physical keyboard;
- Windows/NVDA M01 and macOS/Safari/VoiceOver M02 instructions using the English or PT-BR URL that matches the AT language;
- M04 instructions for JavaScript disabled native form and a separate delayed-Alpine run;
- required screen recording/network artifact naming, exact environment versions, reviewer identity/approval, and JSON copy/download steps.

Do not create or commit the tracked manual-evidence Markdown while any scenario is unexecuted, unreviewed, or missing artifacts.

- [ ] **Step 8: Complete Task 10 only after real evidence arrives**

Validate each exported JSON with the same schema, inspect linked artifacts, and require independent accessibility-reviewer approval. Then create `docs/superpowers/evidence/2026-08-16-file-upload-manual.md` at the exact tested revision, run the complete final automated gate again, request final review, and commit the evidence in its own commit.

If a record is `FAIL`, route a product finding back to its owning TDD task or a harness finding back to this plan. Environment mismatch and incomplete evidence remain blocked; never convert them to PASS.

- [ ] **Step 9: Clean up temporary publication state after evidence approval**

With explicit confirmation that artifacts are durable, delete only the remote/local `evidence/file-upload-manual` ref and the `file-upload-evidence` preview alias/deployment when Cloudflare permits. Record exact cleanup commands/results in the ignored Task 10 report. Retain the guarded workflow and committed historical evidence.

---

## Completion Criteria

- [ ] The isolated harness has no generic production build path and ordinary Docs output contains no harness route or asset.
- [ ] English and PT-BR authored documents have correct pre-JavaScript language, complete copy, native form semantics, and noindex boundaries.
- [ ] React uses the public controlled FileUpload API with real XHR upload progress, exact cancel/retry/stale identities, and contract focus recovery.
- [ ] Delayed Alpine preserves the exact pre-init input node, `FileList`, form participation, and one event/init path.
- [ ] The endpoint enforces method, origin, mode, locale, streaming size, delay, security headers, localization, no storage/logging, and exact revision parity.
- [ ] Evidence export rejects missing or contradictory records and cannot mark M03 PASS without real 320 CSS px/coarse pointer/touch/keyboard checks.
- [ ] Focused instrument tests pass once in Chromium, Firefox, and WebKit in the pinned official image; repository gates remain green.
- [ ] Independent review reports no material finding before external publication.
- [ ] The preview deploy is unlisted, non-production, immutable-SHA verified, and remote smoke passes without synthetic progress.
- [ ] Task 10 remains open until M01–M04 have real metadata, artifacts, and accessibility-reviewer approval.
