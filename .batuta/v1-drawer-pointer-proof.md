# Drawer pointer-origin proof — 2026-09-08

Result: **bug reproduced**, not repaired. Source commit `75e536b` on
`feat/v1-incumbent-stabilization`; current production files unchanged.

## Execution

Command from the active checkout:
`/Volumes/Home/francisross/.local/share/mise/installs/node/24.18.0/bin/node .batuta/runs/v1-drawer-pointer/run.mjs`

Exit 0 means the diagnostic confirmed the observed defect and its controls;
it does **not** mean Drawer satisfies the acceptance contract. Node 24.18.0,
macOS, existing Playwright 1.62.1 / Chromium 151.0.7922.34, React 19.2.8.
Vite serves the real current Drawer, Dialog and stylesheet; existing dependencies
are resolved from the sibling main checkout. No install, package build or Colima
command. This is local Chromium evidence, not the pinned Linux release matrix.

The controlled fixture increments a close-request counter and closes only when
the actual component calls onClose. The runner uses Playwright mouse down/move/up
with real hit testing, not dispatchEvent. All captured mouse events have
isTrusted=true. CSS geometry is checked: real fixed overlay, backdrop hit outside
the panel. Each scenario gets a fresh page; no browser page errors occurred.

| Component | Gesture                           | onClose calls | Contract result |
| --------- | --------------------------------- | ------------- | --------------- |
| Drawer    | Direct backdrop click             | 1             | Expected        |
| Drawer    | Inside click                      | 0             | Expected        |
| Drawer    | Press inside, release on backdrop | 1             | **Defect**      |
| Dialog    | Direct backdrop click             | 1             | Expected        |
| Dialog    | Inside click                      | 0             | Expected        |
| Dialog    | Press inside, release on backdrop | 0             | Expected        |

## Root cause

For the cross-boundary gesture the browser emits mousedown on the panel body,
mouseup on the overlay, and click on the overlay (their common ancestor).
Drawer's handler at `packages/react/src/drawer/drawer.tsx:97–101` tests only
click target equality, so it calls onClose even though the press started inside.
Dialog's existing `downOnOverlay` guard at `dialog.tsx:133–168` records press
origin and rejects that gesture. Its existing WR-02 test at
`dialog.browser.test.tsx:352` describes the same case using synthetic events;
this diagnostic establishes it with trusted input.

## Evidence and limits

Raw event traces, geometry, versions and before/after source hashes:
`.batuta/runs/v1-drawer-pointer/result.json`. The retained runner and fixture
make the diagnostic reproducible with the existing local dependencies.
All tracked product files, dependencies, workflow, ledger and historical evidence
remain unchanged. The owned browser and local server closed in finally.
No keyboard, touch, nested layer, reopen-focus, Firefox/WebKit, accessibility,
SSR, packed-artifact or complete V1 qualification claim follows from this proof.

Next task: the separately bounded `.batuta/v1-drawer-pointer-repair-brief.md`.
Independent GLM review approved both criteria (2/2 DONE, unchanged-tree guard,
Batuta verifier PASS); see v1-drawer-pointer-review.md. Production repair has not begun.
