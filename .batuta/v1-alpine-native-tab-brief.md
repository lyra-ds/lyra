You are the implementation worker already delegated by Batuta. Edit directly, no delegation/orchestration/git writes/worktrees/hooks/config/services/tests.
# Alpine native modal Tab containment — high
## Goal
Repair the demonstrated native WebKit Tab escape in the existing shared Alpine focus-trap owner, retaining native intermediate navigation and complete cleanup.
## Context
Read .batuta/specs/2026-09-09-alpine-native-tab-design.md and .batuta/v1-alpine-bottom-sheet-diagnosis.md. Current24compiled baseline: all8WebKit cases escape, other16contained, no errors. Existing BottomSheet source suites10/9/10 retain one separate WebKit implicit pointer-opener restoration failure, not this task. Existing React internal use-focus-trap.ts has a verified local-boundary protocol. Reuse its observable design in Alpine's existing owner without importing React/new layers. Four callers Dialog,Drawer,BottomSheet,modalCommandPalette stay unchanged. Preserve current Alpine negative-tabindex eligibility filtering.
## Conventions
Pinned Node24.18.0/pnpm11.13.1, TypeScript5.9.3, React functional components, Vitest Browser Mode+SSR. CSS-first .lyra-* styling; no CSS changes. All project docs English. Tests-after profile, but write regression from acceptance first. Only read/edit/report in this worker: all execution/validation belongs to controller. No suppression/config changes even if Stop hooks request them.
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

Test the behavior, never the mock.
A failing test means fix the code, not the test.
No test-only flags or branches in production code.
Work test-first from the acceptance criteria. Investigate root cause before fixing a bug; never silence a signal (cast, suppression, empty catch, sleep) instead of fixing its source — if you must, mark `// WORKAROUND: <reason>` and say so in your report.
## Acceptance criteria
1. Native Tab and Shift+Tab stay within an active panel even when a browser skips remaining implicit button candidates after an input. Preserve native intermediate stops (do not enumerate/intercept every Tab); keep current panel-focused/zero/edge and live hidden/disabled/inert/aria-hidden/negative-tabindex eligibility behavior. Honor descendant defaultPrevented before arming boundaries or changing focus. Regression uses real userEvent keyboard traversal, exact active-node or actual panel containment plus reached Middle; no expected destination focus in traversal. Controller native3engines, old-source RED/restored GREEN.
2. All local boundary nodes/listeners are inactive between gestures and disposed on cleanup/repeatedattach. No stale focus redirection on pointer/programmatic movement or detached former boundary. Use actual panel.ownerDocument. Existing attachFocusTrap(panel):()=>void API/callers unmodified; inlineCommandPalette gets no trap. Preserve close/destroy behavior, no opener restoration/successor change. Prove direct owner cleanup/re-attach and current modal integration. Preserve ALL existing BottomSheet tests/assertions, including known unrelated pointer-opener failure.
3. Exactly4files scope: one existing internal runtimeowner, one new dedicated colocated internal browser test, bounded additions to BottomSheet browser tests, English Alpine patch changeset. No styles/publicAPI/deps/export/newframework/config. Controller types/format/build/current modal suites/size (known budget risk recorded, never raise limit). No skipped/weakened tests/sleeps/casts/suppressions.
## Boundaries
No other component caller or React/style/dependency/publicAPI/exports/config/WORK/.batuta modification. No hooks/ignores/settings/.impeccable/Colima/Docker/services/package managers/tests/validation/git writes/remote/delegation. Scoped pinned formatter only allowed exception. No browser-specific branches, event synthesis in runtime, persistent Tab stops or global focus manager.
## Scope
packages/alpine/src/internal/focus-trap.ts
packages/alpine/src/internal/focus-trap.browser.test.ts
packages/alpine/src/bottom-sheet.browser.test.ts
.changeset/alpine-native-modal-tab.md
Do not change anything outside this list; stop/report if required.
## Expected evidence
Controller owns validation; no test execution. Scoped pinned Node24 Prettier --write allowed on scoped files only. Add new regression before owner fix. Direct-owner fixture starts by focusing the panel (initial condition), then real keyboard navigation; do not force expected wrap target. BottomSheet integration uses existing trigger focused then Enter (actual keyboard-owned opener), preserving older pointer tests unchanged. Report exact files/commands and remaining uncertainties. BATUTA-PROGRESS n START before criterion edits; DONE only for proof actually run, never pretend controller checks ran.
## Stop conditions
Actual source contradicts design, change outside scope needed, same unexpected command fails twice, requirement needs new API/dependency or suppression. Stop/report with edits preserved.

## Exact design
# Alpine native modal Tab containment — bounded incumbent design

Status: controller bounded design for the already authorized incumbent repair after unchanged guarded GLM scout and native24-case diagnosis. Implementation follows Task24; no public API change. Keep opener restoration as a separate task. The existing shared attachFocusTrap(panel) owner is the only runtime source scope; no public options/bindings, modal callers, dependency or styles change.

## Proven problem
Current edge-only trap checks the first/last selector candidate. Native WebKit can skip implicit button stops after Middle, so focus escapes while activeElement is not that computed last candidate. Current synthetic/manual-edge fixtures miss this path. All8native WebKit variants fail containment; Chromium/Firefox16/16pass. Source return-focus failure is separate. The existing React hook already has a verified local-boundary protocol in this branch; reuse its observable design within the existing Alpine owner without importing React or creating a new foundation.

## Retained contract and ownership
Preserve attachFocusTrap(panel: HTMLElement): () => void and the live existing isTabbable eligibility filter, including its negative-tabindex exclusion. Four direct consumers remain unedited: Dialog, Drawer, BottomSheet and modal CommandPalette; inline CommandPalette must acquire no trap resources. The scout's suggestion that cleanup must remain literally the old removeEventListener closure is declined: its callable API must remain, while it must dispose every resource this correction creates.

Own local hidden boundaries around the actual panel, using existing lyra-visually-hidden and aria-hidden semantics. They must only participate in the originating panel's current Tab gesture, never remain ordinary tab stops. Native intermediate navigation remains native. If the browser reaches the matching boundary instead of a remaining control, wrap to the opposite live eligible edge or panel fallback. Unrelated pointer/programmatic focus must not trigger a stale wrap. Respect native defaultPrevented before any trap/default focus operation. Preserve existing zero-candidate/panel-focused/edge behavior, live hidden/disabled/inert filtering and normal Tab direction. Use actual panel ownerDocument for DOM/focus operations; no window-global registry/listener, generalized focus manager or platform-specific branch.

Cleanup deactivates/removes local boundaries and every installed listener on close, destroy and reattach. Detached/destroyed owner must not move focus later. No return-focus capture/restoration/successor change in this slice. No retained transient keyboard stops or axe filtering. No tests-only runtime branch, arbitrary sleep or forced focus on expected test destinations.

## Proof
Add bounded native/browser regression using actual Enter opening and real forward/reverse Tabs through the Middle fixture, exact inside-panel focus, default-prevented descendant Tab retaining focus, dynamic eligibility and cleanup/reattach. Test the shared owner through current modal consumers, with the smallest closed test scope identified from direct callers. Keep original return assertion unchanged; its known WebKit mouse-opener baseline failure must remain explicitly attributed until the separate restoration task. Native source-disabled correction must fail the new containment proof, and restored code must pass. Controller runs scoped three-engine suites/native scenarios, types/format/build/size and independent review. Current Alpine size21.09kB/21.2kB; measure any delta without budget/hash update or qualification waiver. All P1/packed Linux qualification stays pending.
