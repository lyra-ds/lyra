# Packed P1 React compatibility verification

Base8203b10 plus the five exact source hashes retained in MAIN raw p1-final-artifact-binding.json. The separate authorized Node types prerequisite is commit8203b10; no further dependency or lock changes occur here.

## Implemented proof
The existing packed compatibility producer now requires named P1SSR and P1browser phases for React18.3.1 and19.2.8. Each phase must supply exactly one passed case for each of Dialog, Drawer, BottomSheet, Popover, Dropdown, Tooltip, CommandPalette, WorkspaceSwitcher, CreateWorkspaceDialog, Tabs and DataTable. Missing/duplicate/unknown phases or component records, skipped/failed cases, malformed or unsuccessful reports and inconsistent test totals are rejected. Existing FileUpload fixtures remain byte-identical and their five phases remain required.

SSR cases exercise real packed inline contracts and server-safe portal compositions. The Node SSR phase produces matching HTML in its own consumer; browser cases read that HTML through the existing Vitest server command, hydrate the same tree using the same installed React version and perform trusted userEvent input. Modal open/close/focus, Popover focus, Dropdown selection, Tooltip visibility/dismissal, command search/result, workspace identity, correlated creation request/result/closure, Tabs content/ARIA and DataTable sort/roworder are asserted. Hydration recoverable errors and console error/warn during hydration/interactions must be absent. React act ownership is scoped to actual updates.

## Results
| Consumer | Existing types/build/SSR/hydration/browser | Named P1 SSR | Named P1 hydration/native |
| --- | --- | ---: | ---: |
| React18.3.1 | PASS |11PASS|11PASS|
| React19.2.8 | PASS |11PASS|11PASS|

The full producer used frozen installs, identical React/Styles tarballs across both versions, byte-stable fixture locks and all successful subprocess exits. Complete reports, command outputs, installed versions and tarball hashes are retained. All450React emitted files match the prior reference; this test-tooling task adds no web assets. Owned consumers, stores and artifact directories were removed by the producer; the separate diagnostic fixture was archived and removed by controller.

Controller unit suite23PASS; scoped format/diff PASS. Actual failed-global-report regression ran RED before the parser correction and PASS afterwards. A real Vitest run with Dialog skipped returned exit0,10passed/1pending; the runner's verifier rejected it. A real consumer callback returning the wrong operationId prevented CreateWorkspaceDialog closing and failed its native assertion; restoring it passed. These mutations occurred only in an owned disposable consumer, with source restored and ACTIVE unchanged.

## Routing and diagnosis
CodexTerra high initial407.07s and one high retry492.82s; then critical/controller completion after actual failures. The initial missingBufferEncoding issue was resolved through the explicit test-only dependency authorization. The high retry passed NodeSSR but everybrowser case failed console assertions: an exact Dialog reproduction found14server-layout warnings from browser-side renderToString plus12unwrappedact updates. Controller moved HTML production to Node and scoped native updates; no warnings were filtered or tests relaxed. Initial diagnostic tarball binding error and subsequent Vite reload were corrected and retained as failed diagnostics, not counted as proof.

GLM independent three-lens review100.75s,3DONE, unchanged tracked/new-file/status guards and verifierPASS. Four low observations were adjudicated: named assertion coverage is authoritative rather than aggregate describe-suite count; unhandled errors remain process failures; staleHTML from manual standalone reruns is outside the fresh canonical producer; console capture does not extend into afterEach teardown. Ordinary console warnings during teardown are not claimed to fail Vitest automatically. Exact findings and dispositions are retained in raw p1-final.review.md and p1-review-disposition.md.

## Qualification boundary
This supplies the explicitly executed React18/19, SSR, hydration and native behavior slice. It does not qualify forcedcolors, reducedmotion, RTL, coarsepointer, axe, the complete253-cell ledger, historical scenario/baseline acceptance, Blade or V1 release. Existing canonical browser/build evidence remains separate.

Raw MAIN .batuta/runs/v1-focus-closure/p1-compat-attempt3/, p1-final-matrix-proof.json, p1-final-artifact-binding.json, p1-critical-negative-proof.json, p1-critical-unit.log and p1-final-review.*. Earlier failures remain immutable in their attempt directories.
