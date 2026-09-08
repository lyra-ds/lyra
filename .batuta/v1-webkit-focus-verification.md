# WebKit focus diagnosis and prepared-opener fixture verification

Date: 2026-09-08. Base 574faa1. Result: fixture correction approved;
**unprepared WebKit pointer restoration remains an unresolved V1 behavior gap**.
This does not qualify either component or the release.

## Cause established with real input

Controller exercised the current Drawer and Dialog with current CSS in local
Chromium 151.0.7922.34 and WebKit 26.5, Node24.18.0, existing Playwright1.62.1.
Twelve fresh-page cases compared mouse, focused-before-mouse and Enter opening.
Captured mouse/key events are trusted. No browser page errors occurred.

- Chromium: all three opening modes capture/restore the trigger for both components.
- WebKit: mouse and pre-focused mouse lose trigger focus at mousedown, before click. The click handler sees body active; modal entry captures body; close returns to body. Pre-focusing before the click does not solve this.
- WebKit Enter opening keeps the trigger focused and restores it correctly for both components.

Production owners: Dialog capture at dialog.tsx:120–127, restore at267–274;
Drawer capture at drawer.tsx:75–81, restore at166–170. The open effect reads
activeElement, not the invoking control. Thus the underlying mouse composition
has no usable opener, while the focused-opener restoration path works.

The retained original fixture has NO activation-time focus preparation. Its
`.batuta/runs/v1-webkit-focus/result.json` is still evidence of the unresolved
mouse behavior. It was not overwritten to depict the prepared test composition.
The normative no-body and successor requirements in overlay-family-design.md:
231–238 remain required. A declared opener/successor or equivalent composition
contract needs separate design; no new API is selected by this test correction.

## Narrow fixture correction

Only DrawerHarness and DialogHarness opening handlers focus their own trigger
synchronously during activation, immediately before setOpen(true). Actual
userEvent.click calls and exact focus-restoration assertions are retained.
The stale focus-before-click call in Dialog openHarness is removed. There is
no focus repair after close, browser conditional, skip, assertion relaxation,
keyboard-only substitution, global setup change or runtime patch.

This verifies the prepared invoking composition; it cannot stand in for coverage
or a fix of unprepared consumers. The distinction remains explicit in backlog.

## Controller verification

- Existing unchanged-source WebKit baseline: six failing restoration assertions,
  32 passing tests, retained in v1-drawer-repair/green-webkit.log. Source/test bytes
  match 574faa1 before this fixture patch (no intervening product change).
- Current full Drawer/Dialog WebKit: **38/38 PASS**, exit0, green-webkit.log.
- Current full Drawer/Dialog Chromium plus SSR: **43/43 PASS**, exit0,
  green-chromium-ssr.log, after mutation restoration.
- Fault injection disabled only the two runtime restoration calls temporarily.
  Both selected existing restoration tests FAIL with strict activeElement
  mismatch, exit1. The other36 cases were excluded by CLI name filter, not
  skipped in source. Finally restored exact production bytes; hashes verified.
  This proves the prepared fixtures still catch broken product restoration.
- Scoped ESLint, React package tsc --noEmit, Prettier and git diff --check PASS.
- Exactly two test files changed; all production/API/CSS/dependency/ledger/CI
  files and historical evidence are unchanged. Temporary dependency links removed.
  Owned browser/server processes closed. No Colima/Docker/install/remote command.

## Batuta verdict and traceability

Diagnosis: critical/self with read-only GLM5.3Flash scout, exit0, unchanged guard.
Scout preserved verbatim at .batuta/scout/2026-09-08-v1-webkit-focus.md; cited owners
and mechanism checked against source and trusted trace. Its general statements
about Firefox or new-API necessity are not treated as measured results or a
selected design. Firefox and pinned Linux release matrix remain unverified.

Implementation: low/frontend, OpenCode opencode/glm-5.3-flash, exit0, one round,
no retry/escalation. Controller reviewed the diff and independently ran all
checks above. Criterion1 approved by full browser suites plus mutation failures;
criterion2 approved by exact scope and unchanged product hashes. Low-lane review
is the controller's verification, not a claimed additional reviewer dispatch.

Raw brief, executor report, logs, runner/fixture, result, mutation guard and tested
hashes are retained under .batuta/runs/v1-webkit-focus/. No full-release PASS.
