# FileUpload Evidence Simplification Design

**Status:** Approved
**Date:** 2026-08-26
**Decision owner:** Lyra maintainer
**Affected work:** FileUpload Task 10 and the temporary manual-evidence preview

## 1. Problem

The current FileUpload evidence flow asks a maintainer to execute four manual
scenarios, host screenshots or recordings elsewhere, paste artifact URLs into a
large recorder, export one JSON record per scenario, and later assemble the
repository evidence by hand. That process protects evidence integrity, but its
operational cost is disproportionate to the two facts that truly require human
observation: NVDA behavior on Windows and VoiceOver behavior on macOS Safari.

The responsive, keyboard, no-JavaScript, delayed-Alpine, revision-parity, upload,
and state-transition obligations already have deterministic browser or remote
interfaces. Keeping them manual duplicates automation and makes completion less
likely without improving the accessibility claim.

## 2. Decision

Retain only two manual critical workflows:

- `DF-FU-M01`: Windows with current NVDA and current Firefox or Chromium;
- `DF-FU-M02`: macOS with current VoiceOver and current Safari.

Replace the former manual M03 and M04 obligations with revision-bound automated
scenarios:

- `DF-FU-17`: 320 CSS pixel responsive, coarse-pointer, keyboard, focus, long-name,
  replacement, cancel, retry, remove, and overflow behavior;
- `DF-FU-18`: native no-JavaScript submission plus delayed Alpine initialization,
  file-list preservation, single enhancement, cleanup, and focus recovery.

The hosted recorder becomes a short assistive-technology recorder for M01 and
M02. It accepts local evidence files and exports one local ZIP bundle containing
the validated observations, selected media, and a manifest. It never uploads or
persists evidence.

## 3. Goals

- Reduce human execution to the behavior that browser automation cannot attest:
  what NVDA and VoiceOver announce and whether their complete workflows remain
  understandable and operable.
- Make one workflow run produce all automated M03/M04 replacement evidence for
  the exact deployed revision.
- Let a tester attach local screenshots or recordings without first publishing
  them to another service.
- Produce one portable bundle that a repository command can validate and turn
  into the final Markdown evidence record.
- Preserve the immutable preview URL, exact revision, locale, environment, and
  reviewer integrity rules.

## 4. Non-goals

- No Cloudflare R2, D1, KV, authentication, account system, or media retention.
- No evidence upload endpoint and no general-purpose file-storage service.
- No claim that automation reproduces NVDA or VoiceOver output.
- No change to the approved consumer-controlled FileUpload product contract.
- No production documentation route, navigation entry, analytics, or permanent
  public evidence API.
- No attempt to automate accessibility-reviewer approval.

## 5. Evidence model

### 5.1 Automated result

The workflow emits one machine-readable result for each of `DF-FU-17` and
`DF-FU-18`. Each result contains:

- scenario ID, full Git revision, immutable deployment URL, locale, and time;
- browser engine, viewport, DPR, pointer and motion media-query state;
- every required check with an observed boolean result;
- paths and hashes for screenshots, video, trace, and structured logs;
- overall `PASS` or `FAIL` derived from the checks rather than typed by an
  operator.

An automated result is valid only when every artifact and page/Function response
names the same full revision. A missing artifact, mismatched revision, skipped
check, or failed check is a failure, never an incomplete pass.

The workflow publishes these results and their media as the GitHub Actions
artifact `file-upload-automation-<revision-prefix>.zip`. This artifact is the
only automated input accepted by repository ingestion; console output or a
workflow badge is not evidence.

### 5.2 Manual result

M01 and M02 keep the current environment, revision, locale, expected/actual,
result, reviewer, and finding fields. Their required human attestations are
limited to:

1. selection, validation, and indeterminate announcements are coherent;
2. determinate milestones and completion/error announcements are coherent;
3. cancel, retry, stale-result rejection, removal, and focus recovery remain
   understandable and operable with the named assistive technology.

The page pre-fills the immutable URL, revision, locale, timestamp, timezone,
viewport, DPR, media queries, and user-agent evidence. The tester enters only the
OS/browser/assistive-technology versions, actual observations, the three
attestations, result, reviewer decision, and optional finding URLs.

### 5.3 Local artifacts

The recorder accepts local image and video files as evidence attachments. Files
remain browser-local. The recorder does not preview arbitrary active content and
does not transmit file bytes to the Pages Function.

Each manual record accepts at most four files, 50 MiB per file, and 100 MiB in
total. Accepted media types are PNG, JPEG, WebP, WebM, MP4, and QuickTime video.
An empty or different media type is rejected rather than guessed from the file
extension.

Export produces one ZIP named
`lyra-file-upload-evidence-<revision-prefix>.zip` containing:

```text
manifest.json
manual/DF-FU-M01.json
manual/DF-FU-M02.json
artifacts/DF-FU-M01/<sanitized-file-name>
artifacts/DF-FU-M02/<sanitized-file-name>
```

A ZIP may contain one or both manual records. This permits M01 and M02 to be
collected on different machines without weakening the same-revision merge rule.

The manifest records the schema version, full revision, immutable deployment
URL, creation time, each entry path, byte length, media type, and SHA-256 digest.
Duplicate normalized paths, path traversal, empty files, unsupported media types,
and a bundle above the documented local size ceiling are rejected before export.

The private evidence package may add `fflate` as a direct pinned dependency for
ZIP creation; the repository already resolves it transitively. The bundle format
and validator own interoperability, so no ZIP API enters a public Lyra package.

## 6. Automated scenarios

### 6.1 `DF-FU-17` responsive and input behavior

Playwright runs the scenario at exactly 320 CSS pixels with touch enabled and a
coarse-pointer media query. It exercises the same public FileUpload consumer
path used by the preview and proves:

- no document or component horizontal overflow;
- long file identity remains visible and associated;
- every action is reachable at 200% zoom-equivalent reflow;
- active single-file replacement is rejected and announced;
- cancel, retry, completion, removal, and post-removal focus recovery;
- keyboard activation remains equivalent to the touch path.

Chromium supplies the touch/coarse-pointer path. Chromium, Firefox, and WebKit
all exercise 320 pixel reflow, keyboard, focus, and overflow. Emulation is now
accepted automated conformance evidence for this scenario; physical Android
execution is optional exploratory evidence and no longer blocks Task 10.

### 6.2 `DF-FU-18` no-JavaScript and delayed Alpine behavior

Playwright creates one context with JavaScript disabled and submits the authored
multipart form to the revision-bound Pages Function. A separate context loads
the delayed-Alpine fixture with the maximum supported delay. The scenario proves:

- native file selection and multipart submission work without JavaScript;
- response language, metadata, and revision are correct;
- a file selected before Alpine initialization remains selected;
- enhancement occurs exactly once without duplicate nodes or replayed messages;
- removal and focus recovery work after enhancement;
- reconnect and teardown leave no duplicated listener or stale operation.

The remote smoke keeps its existing real computable XHR progress requirement and
both-locale traversal. It runs before either automated scenario may be accepted.

## 7. Recorder experience

The preview remains an unlisted, revision-pinned Cloudflare Pages deployment.
The ordinary production Docs build remains unable to emit the evidence route.

The recorder presents this sequence:

1. revision and environment summary;
2. one choice between M01 and M02;
3. the existing deterministic upload exercise;
4. three human confirmation groups with a concise observations field;
5. local artifact selection;
6. reviewer result;
7. one `Download evidence ZIP` action.

M03 and M04 do not appear as selectable manual scenarios. The page may show a
read-only summary that their replacements are automated, but it never asks the
tester to repeat or approve those checks.

Export remains disabled until the selected manual record is internally valid.
M01 and M02 may be collected on different machines and exported separately. The
repository ingestion command deterministically merges bundles for the same
revision; the UI does not require one browser to hold both records.

## 8. Repository ingestion

Add one explicit command:

```text
pnpm evidence:file-upload:ingest --automation <path> --bundle <path> [--bundle <path>]
```

The command:

1. treats ZIP contents as untrusted input and rejects traversal, duplicates,
   symlinks, unknown entries, expansion beyond the ceiling, and digest mismatch;
2. validates every manual record through the shared schema;
3. requires exactly one approved M01 and one approved M02 for the same revision
   and immutable deployment;
4. validates the workflow-produced automation ZIP and loads its DF-FU-17 and
   DF-FU-18 results for that revision;
5. refuses generation unless all four results pass and their artifacts exist;
6. writes the final manual/automated evidence Markdown and repository-owned
   artifact copies at deterministic paths.

The command never commits, pushes, deploys, or publishes. The maintainer reviews
the generated diff and runs the final gates before committing it.

## 9. Failure handling

- Product failure routes back to the smallest owning FileUpload TDD task.
- Automated fixture, workflow, packaging, or revision failure routes to the
  evidence harness and blocks ingestion.
- Missing Windows/NVDA or macOS/VoiceOver access remains incomplete evidence.
- A human `FAIL` record is exportable for diagnosis but cannot satisfy ingestion.
- Invalid or oversized local media is reported before ZIP creation and never
  silently omitted.
- One valid manual record can be retained while the other environment remains
  pending, provided both eventually target the same immutable revision.

## 10. Security and privacy

- The existing Pages Function continues to accept bounded test uploads and
  return metadata only; it stores neither test files nor evidence artifacts.
- Evidence media never leaves the browser through Lyra code.
- File names are sanitized for archive paths but preserved as metadata for the
  reviewer.
- ZIP ingestion uses bounded streaming reads and cryptographic digests before
  materializing repository artifacts.
- The preview remains `noindex`, isolated from production deploys, and removable
  after evidence approval.

## 11. Required specification changes

Implementation must update these approved artifacts through their documented
change protocol:

- the Data and Files family specification: replace manual M03/M04 with automated
  DF-FU-17/18 and retain M01/M02 reviewer approval;
- the manual evidence harness design: reduce the recorder and define local ZIP
  export plus multi-machine merging;
- the FileUpload implementation plan Task 10: replace the four-manual-scenario
  gate with two manual plus two automated results;
- the resume handoff: remove the Galaxy completion instructions and record the
  new single-bundle workflow.

No existing historical artifact is rewritten. No completed M03/M04 manual record
exists, so the ID transition loses no accepted evidence.

## 12. Verification

The change is complete only when:

- schema tests reject M03/M04 manual records and accept only M01/M02;
- recorder Browser Mode tests prove the two-scenario UI, minimal fields, local
  attachment handling, disabled invalid export, and deterministic ZIP contents;
- archive tests prove hashes, normalization, size/media limits, duplicate and
  traversal rejection, and reproducible manifests;
- DF-FU-17 passes its required engine/input matrix with recorded artifacts;
- DF-FU-18 passes no-JavaScript and delayed-Alpine remote behavior;
- the immutable deployment smoke passes real progress, locale, route, scenario,
  and revision checks;
- ingestion rejects partial, mismatched, failed, corrupt, or unreviewed evidence
  and deterministically generates the final record from complete input;
- the existing production-deploy isolation, package, browser, SSR, hydration,
  parity, bundle, performance, documentation, packaging, and consumer gates
  remain green;
- an accessibility reviewer approves M01 and M02 for the exact implementation
  revision.

## 13. Stop condition

Stop when one reviewed revision has passing DF-FU-17 and DF-FU-18 automation,
approved M01 and M02 local bundles, a successfully ingested final evidence
record, and the unchanged Task 10 release gates are green. Do not add evidence
storage, dashboards, accounts, history views, or generalized test management.
