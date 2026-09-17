# CommandPalette return-focus verification

Implementation `4545ddc`; base8d23c3d. Controller verdict: approved. Independent GLM review3/3 DONE, no findings,
unchanged status/diff/file guard; Batuta verifier PASS.
High/Codex gpt-5.6-terra, one retry, then self/critical completion of a test
readiness race and the missing diagnostic sentence. Product runtime/shared
owner were not changed during critical completion.

- Native baseline:20/24 pass; four WebKit unprepared mouse cases return to body
  (Escape, backdrop, command selection, hotkey close). Explicit/successor RED:
 20/48 pass against the saved original source;28 fail as expected.
- Final native GREEN48/48: Chromium/WebKit × mouse/keyboard/hotkey opening ×
  Escape/backdrop/selection/hotkey closing × stable trigger/removed-trigger
  successor. StrictMode enabled. Keyboard/hotkey stable-trigger cases omit the
  resolver and prove captured-opener compatibility. Pointer cases use the prop
  with no pre-focus; exact destination checked after panel removal.
- Initial broader unchanged-owner/Dialog/Drawer/CommandPalette suites pass95
  Chromium/SSR and84 WebKit. Final changed-component suites pass30 Chromium/SSR
  (26 browser+4 SSR) and26 WebKit. No .skip/.only added or equality weakened.
- Current runtime native source hash matches final source exactly. Build and
  use-client owner commands pass; generated props/llms add only CommandPalette's
  optional prop; docgen --check passes. React and scoped docs/header/example
  types/lint pass. Both exact MDX snippets compile against current built public
  declarations. Six actual imported trigger-example close paths pass against
  built package in Chromium/WebKit. No mocked router qualification is claimed.
- Final critical lint/format/scoped docs types and git diff --check pass.

Logs in this worktree .batuta/runs/v1-command-palette-focus/: checks.json
(initial), retry-checks.json, final-checks.json and matching logs. Actual example
proof: example/result.json. Native baseline/red/green/readiness evidence is in
main checkout .batuta/runs/v1-command-palette-focus/; scout is in main checkout
.batuta/scout/2026-09-09-command-palette-focus/ (unchanged guard, exit0).

## Failures and disposition

First fixture launch failed because existing worktree dependency links were not
present (lucide-react resolution); no product inference. Existing root, React
and docs node_modules links to main were temporarily provided; no installation.
Original failure logs are retained externally as setup-failure.*.

First implementation was incomplete: missing lifecycle integration tests,
incomplete successor snippets, missing panelRef effect dependency (lint warning,
exit0), and formatting failures. One delegated retry completed those.
Second verification: Chromium30, native48, all types/lint/build/docgen/example/
format passed; WebKit25/26 due an Escape sent after panel mount but before input
focus. A managed readiness probe delayed animation-frame callbacks only in its
fixture: trusted Escape targeted BODY and did not close; after releasing the
normal focus callback it targeted INPUT, closed and restored the button. The
component deliberately schedules focus in rAF; new tests had waited only for
panel existence. Critical completion awaits the actual focused-combobox
precondition in sibling keyboard fixtures, keeping exact return assertions.
This does not qualify Escape before focus entry or resolve the separate modal
initial-focus policy. No runtime timing or focus workaround was added.
The docs' development diagnostic sentence was also restored after the retry.

All existing no-target warnings are preserved (invalid compositions in presence
fixtures), not suppressed to claim no-body success. Only the inline no-warning
assertion spies on console.warn and explicitly asserts zero calls.

## Boundaries

Optional API reuses the unchanged shared owner. Docs trigger example and header
CommandMenu provide a stable trigger resolver, including header hotkey use.
Header route-navigation runtime is not qualified by the scoped type/lint review.
Permanently inline open toggles are covered; no new mode-switching contract.
No dependencies, Colima/Docker/resource changes, unrelated cleanup, experimental
integration, ledger qualification, push/PR/merge/versioning/publication.
Full packed Firefox/Linux matrix and remaining P1/modal requirements remain open.

## Review evidence transport

First independent GLM review ended without verdict after its external-directory
policy denied reading native JSON in the main checkout; exit0 did not count as
a completed review. Tree guard was unchanged and Batuta verifier correctly
failed (no TASK lines). No product finding or approval was produced.
Byte-identical native JSON and runner/fixture snapshots are now available inside
this worktree at .batuta/runs/v1-command-palette-focus/native/; provenance.json
records original paths and SHA256. Reviewer needs no external-directory access.

## Final review and commit boundary

Independent OpenCode/opencode/glm-5.3-flash second round completed with exit0,
unchanged status/diff/scoped-file SHA256 guard and3/3 DONE. Findings block is
verbatim `none`; it followed the report marker and was preserved without changing
its content. Controller adjudication: no unresolved findings, approved. First
round remains invalid (external-directory denial, no verdict); no gate was waived.
Source implementation commit: `4545ddc`. Final source
SHA256: `ce92a6a9083ed19881e2547fd1ad497ad19a64e93cdb7790e95ee79fff326c1a`.

Owned browsers/servers exited and all three temporary dependency symlinks were
removed after verification/review. Raw evidence remains preserved; no other
services or user files were cleaned up.
