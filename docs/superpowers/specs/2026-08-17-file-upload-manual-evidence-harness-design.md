# FileUpload Manual Evidence Harness Design

**Date:** 2026-08-17  
**Status:** approved design, pending implementation plan  
**Related work:** `docs/superpowers/plans/2026-08-16-file-upload-controlled-lifecycle.md`, Task 10; `docs/superpowers/specs/2026-08-15-data-files-family-design.md`, §15.2

## 2026-08-26 amendment: FileUpload evidence simplification

The approved
[`2026-08-26 FileUpload Evidence Simplification Design`](2026-08-26-file-upload-evidence-simplification-design.md)
supersedes this harness's active evidence protocol.

```text
Manual: DF-FU-M01 and DF-FU-M02, actual AT environments, local media, reviewer approval.
Automated: DF-FU-17 and DF-FU-18, exact immutable deployment revision, workflow ZIP.
Completion: one PASS for each ID, one revision, one immutable deployment, successful ingestion.
```

The recorder offers only `DF-FU-M01` and `DF-FU-M02`, accepts local media, and
exports a local evidence ZIP. The passing workflow publishes `DF-FU-17` and
`DF-FU-18` in `file-upload-automation-<revision-prefix>.zip`; repository
ingestion is `pnpm evidence:file-upload:ingest --automation <path> --bundle <path> [--bundle <path>]`.
The two manual ZIPs and automation ZIP must name the same exact immutable
deployment revision before ingestion can succeed.

> **Superseded historical context:** The remaining 2026-08-17 design below is
> retained for traceability only. Its `DF-FU-M03`/`DF-FU-M04`, Galaxy, four-
> scenario, JSON-export, and artifact-link instructions are not active work,
> release conditions, or evidence of any M03/M04 execution.

## Purpose

Provide one temporary, public, revision-pinned harness that lets a tester execute the FileUpload manual accessibility workflows on real Windows, macOS, keyboard, and touch environments without publishing unfinished evidence to the production documentation.

The harness supports evidence collection; it does not replace a real environment, assistive technology, physical input, recording, or accessibility-reviewer approval. A harness result cannot create or imply a Task 10 PASS by itself.

## Decisions

- Publish an unlisted Cloudflare Pages preview, never the production `main` deployment.
- Serve the preview from a fixed branch alias for convenience and retain the immutable deployment URL for evidence.
- Embed the exact Git revision into the build and display it in every scenario and exported record.
- Publish equivalent Brazilian Portuguese and English routes, with Brazilian Portuguese as the primary shared URL.
- Use one React controlled lifecycle for DF-FU-M01 through DF-FU-M03.
- Provide independent native-form and delayed-Alpine fixtures for DF-FU-M04.
- Use a same-origin Pages Function only to receive test uploads and return deterministic outcomes. It does not persist request content or metadata.
- Keep the evidence page out of navigation, search indexes, component metadata, and generated API documentation.
- Keep recordings and reviewer approval external. The harness exports structured observations and artifact links, not media.

## Non-goals

- Do not replace NVDA, VoiceOver, Safari, a real coarse pointer, or a 320 CSS pixel viewport with emulation.
- Do not automate screen-reader assertions or infer speech output from the accessibility tree.
- Do not publish incomplete rows to `docs/superpowers/evidence/2026-08-16-file-upload-manual.md`.
- Do not add a general upload service, storage, authentication system, analytics, or permanent public API.
- Do not add the harness to the public documentation navigation or component examples.
- Do not weaken Task 10's requirement for actual environment metadata, artifacts, and accessibility-reviewer approval.

## Architecture

### Evidence build

Build the harness as an isolated Vite multi-page application under `tools/file-upload-evidence`, not as a Next route. It emits authored static documents at `/pt-BR/file-upload-evidence/` and `/en/file-upload-evidence/`; each document has the correct `<html lang>`, a `robots` value of `noindex, nofollow`, and usable native-form markup before JavaScript. Cloudflare's preview `X-Robots-Tag: noindex` remains a second boundary, not the only boundary.

The harness build refuses to run unless `FILE_UPLOAD_EVIDENCE=1` and a full Git revision are provided. It writes to its own temporary `dist` directory. Only the preview workflow copies that output into `apps/docs/out`; the ordinary Docs production build never invokes or copies the harness, so neither route nor its JavaScript assets exist in a production export. Automated build evidence MUST prove both the enabled preview output and the absence of harness paths after an ordinary Docs build.

Each authored HTML entry owns its document language, title, explanatory copy, native form, build revision, and no-JavaScript instructions. A React root mounted beside the native form owns lifecycle controls, environment telemetry, observations, and JSON export. A separate Alpine root exists in the authored HTML and is initialized only by the delayed Alpine bootstrap; React never owns or reconciles that subtree.

The page displays:

- compiled Git revision;
- build timestamp in UTC;
- `navigator.userAgent` as supporting data, never as authoritative feature detection;
- `window.innerWidth`, `window.innerHeight`, and `window.devicePixelRatio`;
- evaluated media queries for `pointer`, `any-pointer`, `hover`, and `any-hover`;
- JavaScript state and requested Alpine delay;
- current scenario, item ID, attempt ID, lifecycle state, and focus target in a visual-only diagnostic panel;
- a structured observation form and downloadable/copyable JSON record.

The diagnostic panel MUST NOT be an ARIA live region and MUST NOT change the component's accessible name, description, focus order, or announcements.

### Localization

Brazilian Portuguese is the default URL shared with the project owner. English is available for reviewers whose assistive-technology environment is configured in English. The two routes use the same state machine, endpoint, telemetry, and evidence schema.

Every new visible string, accessible name, status, validation message, guided instruction, expected announcement, native response, error, and export-validation message MUST exist in both `pt-BR` and `en`. Each route sets the correct document language and passes its locale explicitly to the evidence Function. Runtime browser-language inference MUST NOT change the chosen route or mix languages within a scenario.

The evidence record stores the route locale. A scenario is executed entirely in one locale; switching locale starts a new observation rather than translating an existing result.

### React controlled lifecycle

The React harness consumes the public `FileUpload` API exactly as an application does. A reducer owns `items`; maps own selected `File` objects, active `XMLHttpRequest` instances, and attempt identity. Consumer callbacks echo Lyra proposals before starting transport.

The harness exposes clearly labelled operator controls outside the FileUpload component for these deterministic server modes:

- `success`: accept the request and return success after a bounded response delay;
- `error`: return a retryable `503` response;
- `delay`: keep the response pending long enough for the tester to request cancellation;
- `indeterminate`: keep the controlled item indeterminate until the operator advances it;
- `stale`: retain a completed older attempt result and let the operator deliver it after a retry, proving that the current state and announcement do not change.

Network upload progress comes from `XMLHttpRequest.upload`. The harness records progress events and maps computable positive totals to a clamped 0–100 determinate value. Before a computable event, and in the explicit indeterminate scenario, the controlled item remains indeterminate. The operator panel may select a scenario or deliver an already-captured stale result; it MUST NOT directly mutate DOM owned by FileUpload or synthesize component events.

The preview smoke gate MUST observe a real computable `XMLHttpRequest.upload` progress event before the harness is accepted for M01 or M02. If the deployed edge path produces no usable upload progress, that is a harness failure; operator controls and synthetic progress do not substitute for the missing signal. In the same real browser session, smoke loads both localized routes, waits for the React recorder, observes the exact four scenario options, selects DF-FU-M01 through DF-FU-M04, and verifies a scenario-specific localized checklist marker plus the observation editor for each selection. Static route metadata or a constant scenario list cannot substitute for observing the deployed UI.

The complete guided sequence is:

1. Select a valid file and verify the selection announcement.
2. Observe an indeterminate upload state.
3. Exercise determinate progress and record announcements at 25, 50, 75, and 100 percent when crossed.
4. Start a delayed request, request cancellation, observe `canceling`, abort the exact request, and confirm `canceled` from the abort result.
5. Retry with the proposed new attempt identity.
6. Deliver a retained older-attempt result and verify that state and announcements do not change.
7. Exercise retryable transport error, retry, and explicit success.
8. Confirm removal and verify focus recovery to the next action, previous action, or native input according to the public contract.

### Touch and reflow workflow

DF-FU-M03 uses the same React lifecycle on the Samsung Galaxy S25 Ultra with current Chrome and a physical keyboard where required.

The harness blocks its own M03 PASS control unless all of these are true at the time of export:

- `window.innerWidth === 320`;
- `(pointer: coarse)` or `(any-pointer: coarse)` matches;
- the tester records both physical touch and keyboard input;
- no horizontal page overflow is observed;
- the long-name/localized-content fixture retains file identity and every required action;
- active single-file replacement is rejected and announced;
- cancel, retry, removal, and focus recovery were exercised.

Changing Android's native display or page zoom is acceptable only when the resulting browser window truthfully reports 320 CSS pixels. DevTools device emulation, screenshot resizing, CSS transforms, and a harness-forced viewport value are not acceptable evidence.

### Native form workflow

Each authored HTML entry includes a labelled native `<input type="file">` with a non-empty `name`, inside a standard multipart `POST` form targeting the same-origin evidence Function. Enhancement-only actions are absent from this form.

With JavaScript disabled, the tester selects a file, submits, and receives an accessible HTML response containing only:

- request identifier;
- received file name;
- received media type;
- received byte length;
- compiled harness revision;
- a success or explicit validation error.

The response never echoes file bytes. This response and the browser network record prove native participation without relying on client JavaScript.

The native form sends a hidden `locale` value of `pt-BR` or `en`. The Function rejects any other locale and renders the response in the explicitly selected language.

### Delayed Alpine workflow

The delayed-Alpine fixture is present in the authored HTML with its labelled native file input and enhancement container. A query parameter `alpineDelay` accepts an integer from 0 through 15000 milliseconds; absent or invalid values resolve to 5000 milliseconds.

After the delay, the fixture dynamically loads the repository's built Alpine adapter, registers the Lyra plugin once, and calls `Alpine.initTree()` once for its owned root. React does not render inside that root after initialization.

The tester selects a file before initialization. After initialization, the fixture proves:

- the same input DOM node remains connected;
- the native `FileList`, file name, and form participation remain intact;
- no selection intent or announcement is replayed;
- only one enhanced control tree exists;
- only one listener path handles the next real selection;
- subsequent controlled selection, removal, and focus recovery remain operable.

The fixture exposes counters and identities in the visual diagnostic panel, not in a live region.

## Evidence Function

Add a Pages Function at `/api/file-upload-evidence` with these boundaries:

- Accept only `POST`; return `405` with `Allow: POST` otherwise.
- Accept same-origin requests only. Do not emit permissive CORS headers.
- Reject a declared `Content-Length` above 10 MiB before reading the body.
- Enforce a 10 MiB limit while reading when length is absent or inaccurate.
- Bound every response delay to at most 15000 milliseconds.
- Accept only the modes `success`, `error`, and `delay`.
- Return `400` for invalid mode or malformed multipart data, `413` for size overflow, and `503` for the explicit retryable error mode. XHR requests receive JSON; a successful XHR receives `200` with request ID, revision, and received byte length. Native-form requests receive localized accessible HTML with the same metadata and the applicable HTTP status.
- Generate a request identifier with `crypto.randomUUID()`.
- Application code MUST NOT write files, metadata, request bodies, or results to KV, R2, D1, application logs, analytics, or another service. Provider-level request metadata outside application control is not treated as harness storage; file bytes, names, and response bodies MUST never be logged by the application.
- Send `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`, and a restrictive `Referrer-Policy` on every response.

The Function distinguishes XHR and native-form responses using an explicit harness request header rather than user-agent sniffing.

The preview build injects the same full Git SHA into the documentation bundle and the Function bundle. Every Function response includes `X-Lyra-Evidence-Revision`; the deployment smoke test rejects a page/Function revision mismatch.

## Evidence record

The harness exports one JSON object per scenario with this schema:

```ts
interface FileUploadManualObservation {
  scenario: 'DF-FU-M01' | 'DF-FU-M02' | 'DF-FU-M03' | 'DF-FU-M04';
  locale: 'pt-BR' | 'en';
  revision: string;
  deploymentUrl: string;
  executedAt: string;
  timezone: string;
  os: { name: string; version: string; build: string };
  browser: { name: string; version: string };
  assistiveTechnology: { name: string; version: string } | null;
  inputMethods: string[];
  viewport: { width: number; height: number; devicePixelRatio: number };
  mediaQueries: Record<string, boolean>;
  expected: string;
  actual: string;
  checkAttestations: Record<string, boolean>;
  result: 'PASS' | 'FAIL';
  reviewer: { name: string; approval: 'approved' | 'changes-requested' };
  artifactUrls: string[];
  findingUrls: string[];
}
```

`checkAttestations` is scenario-scoped and closed. The validator requires exactly the applicable keys below, rejects missing, additional, or cross-scenario keys, and preserves every boolean in exported JSON:

| Scenario  | Required stable check IDs                                                                                                                                                                                                                 |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DF-FU-M01 | `DF-FU-M01-selection-and-indeterminate-announcements`, `DF-FU-M01-determinate-progress-milestones`, `DF-FU-M01-lifecycle-recovery-and-stale-result`                                                                                       |
| DF-FU-M02 | `DF-FU-M02-selection-and-indeterminate-announcements`, `DF-FU-M02-determinate-progress-milestones`, `DF-FU-M02-lifecycle-recovery-and-stale-result`                                                                                       |
| DF-FU-M03 | `DF-FU-M03-no-horizontal-overflow`, `DF-FU-M03-long-file-identity-retained`, `DF-FU-M03-actions-reachable`, `DF-FU-M03-active-replacement-rejected-and-announced`, `DF-FU-M03-cancel-retry-remove-completed`, `DF-FU-M03-focus-recovered` |
| DF-FU-M04 | `DF-FU-M04-native-js-disabled-form-submitted`, `DF-FU-M04-delayed-alpine-node-filelist-preserved`, `DF-FU-M04-single-enhancement-path-removal-focus`                                                                                      |

A `PASS` record requires every applicable attestation to be `true`. A `FAIL` record retains the same exact key set and may contain `false`, so a reviewer can see which workflow steps were incomplete when the failure occurred. The ingestion step re-runs this same validation; rendered checkboxes alone are not evidence.

The harness pre-fills locale, revision, immutable deployment URL, timestamp, timezone, viewport, DPR, media queries, and user-agent supporting text. The tester must explicitly enter OS/browser/AT versions, input methods, applicable check attestations, actual observations, result, reviewer, and artifact/finding URLs. Export is disabled when a required field is empty. `assistiveTechnology` may be `null` only for a scenario that does not require AT and only after an explicit “no AT active” confirmation.

A `PASS` record requires `reviewer.approval === 'approved'` and every scenario attestation to be `true`. A `changes-requested` review requires `result === 'FAIL'`; the schema validator rejects contradictory combinations.

The recorder normalizes its deployment URL to `origin + pathname`, excluding query and fragment data used to configure a run. Export accepts only HTTPS hosts matching an immutable `<deployment>.lyra-ds-docs.pages.dev` deployment and the exact `/<locale>/file-upload-evidence/` route. It explicitly rejects the moving `file-upload-evidence.lyra-ds-docs.pages.dev` branch alias, unrelated hosts, credentials, ports, and locale/path mismatches. Local development can exercise the recorder but cannot export a manual evidence record unless a test injects a valid immutable URL.

Exported JSON is local to the browser until the tester copies or downloads it. The harness does not submit evidence records to the server.

## Preview deployment

Extend the existing `.github/workflows/deploy.yml`, which already exists on the default branch and already supports `workflow_dispatch`. GitHub requires a manually dispatched workflow file to exist on the default branch, then permits selecting another ref; a brand-new feature-branch-only workflow would not be dispatchable and is therefore not part of this design.

The production path remains unchanged for pushes to `main`. A separate preview job runs only when the event is `workflow_dispatch` and the selected ref name starts with `evidence/`. Any other manually selected non-main ref has no deploy job. Before deployment, create the temporary ref `evidence/file-upload-manual` at the exact reviewed harness revision and dispatch the existing workflow against that ref.

The workflow:

1. checks out the selected `evidence/` revision;
2. installs the repository's pinned pnpm and Node versions with the frozen lockfile;
3. builds Styles, React, Alpine, and the ordinary Docs production export;
4. runs focused harness tests, then builds the isolated harness with `FILE_UPLOAD_EVIDENCE=1` and the exact revision exposed to both entry documents;
5. copies the harness output into the already-built `apps/docs/out` tree without deleting or rewriting Docs output;
6. prepares a temporary Wrangler working directory containing the preview-only Pages Function with the same injected revision;
7. invokes Wrangler from that temporary directory so its `functions` directory is included;
8. deploys `apps/docs/out` to the existing `lyra-ds-docs` Pages project with `--branch=file-upload-evidence`;
9. writes the immutable deployment URL, branch alias, and revision to the workflow summary.

The preview job MUST NOT use `--branch=main`, update the Pages production branch, deploy the landing site, or modify Cloudflare configuration. It MUST use `--branch=file-upload-evidence`. Preview credentials reuse the existing repository secrets without printing them. The existing production job MUST retain its current landing-then-docs ordering and `--branch=main` behavior.

The fixed branch alias is a convenience URL only. Every evidence record uses the immutable deployment URL returned for that deployment. The client-side schema enforces this boundary again rather than trusting a read-only field or workflow summary.

## Failure handling

The UI distinguishes:

- product failure: FileUpload state, announcement, focus, or form behavior contradicts the contract;
- harness failure: endpoint, scenario driver, telemetry, or export behaves incorrectly;
- environment mismatch: required OS, browser, AT, pointer, viewport, or input is absent;
- incomplete evidence: required observation, artifact, or reviewer field is absent.

Only a product failure returns to the owning FileUpload TDD task. Harness failures return to this harness implementation. Environment mismatches and incomplete evidence remain blocked; they are never converted into PASS.

## Automated verification

Implementation uses TDD and adds discriminating coverage for:

- controlled reducer transitions, cancel identity, retry identity, stale-result rejection, and removal focus markers;
- environment telemetry and the exact 320 CSS pixel/coarse-pointer M03 gate;
- evidence schema validation, exact scenario attestation keys, and disabled PASS export for missing or false workflow checks;
- Brazilian Portuguese and English copy completeness, route language, locale isolation, and localized native responses;
- endpoint method, mode, size, timeout, headers, success, retryable error, and native multipart response;
- authored pre-JavaScript native form markup with the correct document language and no enhancement-only controls;
- delayed Alpine initialization, preservation of the exact input node and `FileList`, no replay, one initialization, and one subsequent event path;
- static entry metadata, absence from the ordinary Docs export/navigation/search/component registries, and compiled revision;
- workflow permissions, manual trigger, `evidence/` ref guard, frozen install, build order, Pages project, preview branch, working directory, and absence of a production deploy;
- immutable deployment URL rejection for the branch alias, unrelated hosts, credentials, ports, query/fragment leakage, and locale/path mismatch;
- deployed React reachability in both locales by observing and selecting all four scenario options and their localized guidance in the real smoke browser;
- isolated harness output and an ordinary Docs build with no harness paths;
- Docs typecheck, tests, static build, React/Alpine builds, three-engine focused Browser Mode, formatting, and diff checks.

Automated tests do not claim M01 through M04. They prove only that the evidence instrument is fit for a human run.

## Manual acceptance and cleanup

The harness is ready for use when:

- its automated verification is green;
- an independent code review reports no material finding;
- a preview deployment exists at an immutable URL for the exact reviewed revision;
- a smoke run confirms the Function and all four guided scenarios are reachable;
- no production documentation route or navigation changed.

Task 10 completes only after actual DF-FU-M01 through DF-FU-M04 records, recordings, artifact links, and accessibility-reviewer approval are verified and committed at one exact revision, followed by the complete final automated gate.

Keep the preview available through evidence review and remediation. After approval, delete the temporary `evidence/file-upload-manual` Git ref and remove the preview branch alias or deployment when Cloudflare permits it; retain the safely guarded preview job for future evidence work. Record cleanup in the Task 10 report. Historical evidence must retain its artifact copies and revision even if the temporary preview URL later expires.
