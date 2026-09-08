# Drawer pointer-origin repair — next bounded task

## Goal

Prevent Drawer dismissal when the pointer press begins inside its panel and ends on the backdrop. Preserve direct backdrop dismissal, inside clicks, Escape and the close button.

## Context

Confirmed against source 75e536b in the real local Chromium diagnostic recorded in .batuta/v1-drawer-pointer-proof.md. Trusted trace: mousedown panel body, mouseup overlay, click overlay; Drawer onClose count 1, Dialog count 0. Current Drawer handler checks only click target identity. Existing Dialog WR-02 guard/test is the repository precedent. Retain incumbent implementation; no replacement dependency or framework.

## Conventions

Approved implementation lane: medium/Codex gpt-5.6-terra; independent GLM 5.3 Flash review. English code/docs, existing React conventions, Node 24.18.0. The controller runs actual browser verification outside the executor. No changes to Colima configuration or restart; use existing available resources only. Implementation authorized on 2026-09-08; executor stages tests first, then repair after controller RED.

- Follow the project's existing state approach (props drilling, context,
  zustand, redux…).
- Components: PascalCase file and export names, one main component per file,
  colocate with the existing folder pattern (check neighbors before creating).
- Hooks: `use` prefix, rules of hooks respected.
- Styling: match the project's existing method (CSS modules, styled-components,
  Tailwind…).
- Derive state where possible; `useEffect` only for real external
  synchronization, with a complete dependency array.
- Tests: follow the project's runner (vitest/jest + testing-library). Query by
  role/label, not by test-id, unless the project already standardizes test-ids.

Never:

- Class components in new code.
- A second state or styling library alongside the project's existing one.
- Conditional hooks.
- `any` in a TypeScript project — type props and returns explicitly.

- Follow the existing code style of the files you touch — naming, formatting,
  import order.
- Change only what the brief asks. Every changed line must trace directly
  back to the brief.
- Clean up only your own mess: remove imports/variables/functions that YOUR
  change made unused. Leave pre-existing dead code alone — mention it in your
  output instead of deleting it.
- Keep functions small and names descriptive; prefer clarity over cleverness.
- Comments only for constraints the code cannot express — never to narrate what
  a line does.
- If the brief references tests, make them deterministic: no real network, no
  time-dependent assertions.

Never:

- Reformat code you were not asked to change.
- Add a dependency the brief does not explicitly allow; no lockfile changes
  except from an allowed dependency.
- Drive-by refactors or "improvements" outside the brief's scope.
- Touch CI config, license, or anything listed under the brief's Boundaries.
- Silence a signal instead of fixing its source (casts, empty catch blocks,
  sleeps, copy-paste to dodge the real fix) — the method line says how to
  mark an unavoidable workaround.

1. Test the behavior, never the mock.
2. A failing test means fix the code, not the test.
3. No test-only flags or branches in production code.

Work test-first from the acceptance criteria. Investigate root cause before fixing a bug; never silence a signal (cast, suppression, empty catch, sleep) instead of fixing its source — if you must, mark `// WORKAROUND: <reason>` and say so in your report.

## Acceptance criteria

1. A regression test fails against the unmodified Drawer for press-inside/release-backdrop and passes after the fix. Real trusted-pointer replay shows zero close requests for that gesture, with direct backdrop count 1 and inside click count 0; assert callback counts rather than a locator's truthiness.
2. Existing Drawer browser/SSR tests and Dialog WR-02 controls pass for available environments; focused checks preserve Escape, close button and presence behavior. Record unavailable release-matrix checks as pending, never qualified. No test skip, mock close behavior or weakened existing assertion.
3. Only the owning Drawer handler and its colocated regression tests change; public API, dependencies, CSS, sibling components and release ledger stay unchanged. Scope and whitespace checks plus independent review pass.

## Boundaries

Do not combine focus reopening, CommandPalette, nested layers, touch redesign or a shared overlay framework. No new dependencies, resource changes, experimental evaluation, remote operation, publication or release qualification. Do not alter the completed diagnostic's raw result to make the repair appear green; record a separate post-fix replay.

## Scope

packages/react/src/drawer/drawer.tsx, packages/react/src/drawer/drawer.browser.test.tsx, plus managed .batuta/ and WORK.md for execution evidence. Do not change anything outside this list; if the task requires it, stop and report.

## Expected evidence

Unmodified-source RED, current-source GREEN, exact focused browser/SSR commands and results, trusted pointer replay with both controls, scoped diff and unchanged dependency/API evidence. Controller selects verification from current configuration before dispatch.

## Stop conditions

Stop if source contradicts the brief, the same command fails twice unexpectedly, or the repair needs edits outside scope. For each acceptance criterion n print BATUTA-PROGRESS n START before edit and BATUTA-PROGRESS n DONE when its proof passes. No redelegation or commit by executor.
