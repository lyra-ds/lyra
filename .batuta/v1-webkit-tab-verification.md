# Native modal Tab containment verification

Base6e166ec; implementation f9cb9d2. Verdict approved.
Route: critical/controller root-cause diagnosis; Codex gpt-5.6-terra/high
implementation, one high-lane retry, then critical/controller fixture and
immutable-declaration completion. Independent OpenCode GLM5.3Flash review approved (3/3 DONE).

## Cause and bounded repair

Native WebKit26.5 on this host skips ordinary button/radio Tab stops, while
explicit tabindex0 controls participate. Chromium151.0.7922.34 visits ordinary
buttons/radios. Plain HTML probes without Lyra reproduce both behaviors. The old
shared hook wrapped only at theoretical first/last candidates, letting native Tab
leave the panel when the browser skipped those candidates. Both directions fail
in single and React-portal-nested Dialogs. Background source: WebKit issue199671,
https://bugs.webkit.org/show_bug.cgi?id=199671. No preference was changed.

The existing shared hook now owns two local, visually hidden boundary spans,
aria-hidden and tabindex-1 while inactive. Only the boundary for the panel's
current Tab direction becomes a native stop; focus transfer consumes/deactivates
it and returns to the current eligible edge. Key release/focus exit deactivate
it; effect cleanup removes nodes/listeners. Ordinary intermediate navigation
remains native. Descendant-native preventDefault is honored before ownership.
The existing CSS utility is reused. No global listener/registry, observer, API,
caller implementation, focus-restoration change or dependency was added.

## Final controller proof

- Native main matrix: baseline4/8 (all4 WebKit cases fail), current8/8.
  Two engines × single/nested Dialog × forward/reverse; six trusted moves per
  case stay inside the panel. Final focus never rests on BODY or an internal node.
- Native edge matrix: initial implementation0/8, final8/8. Real descendant-native
  cancellation keeps the last control focused; incoming trusted Tab from a
  legitimate outside control does not stop on a hidden boundary. Baseline shows
  cancellation was already ignored and incoming hidden stops were introduced by
  the first implementation. No assertions were weakened to erase those failures.
- Final Chromium/SSR115/115 across hook, Dialog, Drawer, BottomSheet and
  CommandPalette. Final focused WebKit hook7/7. Broader WebKit100/102: exactly the
  same two pre-existing BottomSheet return-focus failures described below.
- Seven hook regressions cover native intermediate order, forward/reverse,
  nested portals, cancellation, dynamic insertion/removal/hidden/disabled,
  incoming Tab, StrictMode activation/deactivation and final unmount cleanup.
  Native intermediate order is measured with the same hook inactive, then compared
  by exact element identity when active. No UA branch or manual all-Tab walk.
- Final TypeScript, scoped ESLint/Prettier and git diff --check pass. Current
  hook SHA256: 8d8a585d62d7e938060056f8917b2a07ecfd7081154677a4f62989b2059b5b53. Both final native JSON hashes match this exact source.
  No tests skipped, no only markers, no new product test branches or browser mocks.

Actual commands/exit codes: .batuta/runs/v1-webkit-tab/final-checks.json plus
matching final-*.log. Other raw artifacts: plain/intermediates.json, red/green.json,
edge-red/initial-edge-green/edge-green.json, baseline.ts, initial/retry source/test
snapshots, native runner/fixture and initial/retry checks/logs. Node24.18.0 and
already-installed tooling were used; no pnpm/install or browser downloads.

## Failures and disposition

The first controller fixture had a missing StrictMode closing tag; setup-failure
logs were retained, fixture syntax corrected, and baseline then reproduced without
page errors. That setup failure was not evidence about product behavior.

First high implementation: main native8/8, Chromium/SSR111, types/lint/format pass;
WebKit96/98 has the two baseline BottomSheet failures. Additional native edge proof
found permanent invisible button stops and ignored native cancellation; missing
intermediate/dynamic/lifecycle proofs also required the single retry.

Retry: both native matrices pass; Chromium/SSR115 and types/format pass. WebKit
98/102 includes the two known failures plus two fixture assumptions: requiring
WebKit to visit a native radio and a plain external button. ESLint also reports
two prefer-const errors. Critical/controller completion first reproduces skipped
radio behavior in plain HTML, then measures the inactive native path for exact
active-path comparison and makes the external lifecycle fixture's buttons explicit
keyboard stops. This is keyboard setup, not a mouse-opener workaround or platform
preference change. The only hook edit at critical completion makes the two resource
bindings const and removes their unnecessary optional access. The boundary mechanism
from the retry is retained; all final proof is rerun on final bytes.

## Existing BottomSheet limitation

The broader WebKit gate is NOT fully green. Both original hook and final hook
fail bottom-sheet.browser.test.tsx:160 and251: pointer-opened sheets do not restore
focus to their opener after Escape/close-button dismissal. Original hook rerun:
10/12, same two failures; original bytes were temporarily substituted only after
executor completion and restored in finally with hash verification. Existing
BottomSheet tests/implementation are untouched. These are outside the Tab slice,
remain required/unqualified, and are the next bounded return-focus investigation.
No warning, strict assertion or failed gate was hidden to claim full qualification.

## Scope and boundaries

Only shared hook, its new browser tests and a React patch changeset are product
changes. WORK/.batuta are controller-managed task records. Global sibling-modal
ordering, initial-focus policy, nested/inert coordination, remaining P1 contracts
and full packed Firefox/Linux release qualification stay open. No ledger entry
or acceptance cell is promoted; no new foundational experiment, dependency,
lockfile, Colima/Docker/configuration/resource action, remote action, versioning
or publication. Build/docgen were not required for the unchanged internal API;
this proof does not qualify packed artifacts or release sizes.

## Independent review and cleanup

Independent OpenCode/opencode/glm-5.3-flash completed the technical review with
three DONE criteria, no findings and unchanged status/diff/scoped-file hash guard.
Its first report omitted the required findings markers, so that report-format
round was invalid. A formatting-only retry reissued the exact same report with
the required markers, no tool use or judgment changes; exact-content comparison
and the second unchanged guard pass. Batuta verifier PASS, 3/3 DONE. Verbatim
findings file: .batuta/runs/2026-09-09-webkit-tab.review.md (`none`).

Controller adjudication: approved for the bounded Tab slice. The review's first
paragraph overstates the release limitation with “only”: the two BottomSheet
failures are the remaining failures in this scoped suite, not the only V1 blockers.
The incumbent backlog, logical modal/inert contracts and full release matrix remain
open. Reviewer uncertainties about direct boundary-focus telemetry, the zero-content
armed window and hypothetical reparenting do not identify a concrete failure in the
accepted static-body portal scope; outcome-level proof and cleanup checks pass.

Raw review/format prompts, reports, unchanged guards and verifier JSON remain in
main checkout .batuta/runs/2026-09-09-webkit-tab-review/. All owned browser/server
runs exited. The two controller-owned dependency symlinks were removed after
verification/review; raw evidence is retained. No foreign files/services were removed.

