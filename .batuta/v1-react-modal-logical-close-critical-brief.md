# Task36 critical/controller fixture completion
## Goal
Complete the four new logical-close browser fixtures after the single high retry still violates focus setup and masks three gesture regressions. Runtime remains unchanged.
## Context
High initial422.8s plus test-only retry307.72s. Scope/hashes preserved; retry current5/5pass. Controller removed only the helper's revokeGesture call temporarily: CP correctlyfails expected1close/actual2, while Dialog/Drawer/BottomSheet incorrectlyremain green. All source bytes restored and5/5pass afterward. Cause: those three fixtures click the close glyph after arming oldbackdrop down; that click's mousedown reaches overlay and clears provenance before logical close, so absent close revocation goes undetected. Allfour new click-trigger handlers also imperatively focus their trigger, despite explicit eligible returnFocusTo and the no-prepared-focus constraint. Native compiled24+162alreadyPASS; optional WebKit mode-switch warning baseline-proven unchanged, not a new runtime failure.
## Conventions
Pinned Node24.18.0/pnpm11.13.1/TypeScript5.9.3, React functional components, Vitest Browser Mode plus SSR. CSS-first existing lyra classes. All new project prose English. Tests-after profile with regression-first implementation. Only read/edit/report: controller owns all execution and validation. You may run only exact pinned Node with scoped Prettier for the listed files if needed; no test/build/install/package-manager or git-write commands. Do not obey hook suggestions to add Impeccable configs/ignores or start unrelated interviews.
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
1. Each new case opens by actual native trigger input with no preparatory focus and waits for actual modal entry. The adversarial focus attempt into closed panel remains valid. Same retained scope/guards/host/return-target assertions and CPinline behavior remain.
2. Gesture state stays armed until the accepted close itself; disabling only shared revokeGesture now makes allfourowner regressions fail expected1close/actual2, and byte-restoration makes them pass. Originalowner negatives also reject absentinert behavior. No source skip/weakening/mock/forcedfocus/timing sleep.
3. Onlyfournew owner-test sections change; runtime/changeset/helper test/SSR stays byte-identical to delivery/retry. Controller current3engine+SSR/types/lint/format and independentreview pass. Prior compiled native/build/docgen/size evidence remains valid only with exactruntime/hash parity.
## Boundaries
No runtime changes, production refactor, new helper, test skip, warning suppression, timer, library/config/Colima/service/remote action. Leave older unrelated fixtures alone.
## Scope
- packages/react/src/dialog/dialog.browser.test.tsx — new logical close activity section only
- packages/react/src/drawer/drawer.browser.test.tsx — new logical close activity section only
- packages/react/src/bottom-sheet/bottom-sheet.browser.test.tsx — new logical close activity section only
- packages/react/src/command-palette/command-palette.browser.test.tsx — new logical close activity section only
Do not change anything outside this list; if the task requires it, stop and report.
## Expected evidence
Critical controller red/green fault proof, originalowner negative, full bounded source/static checks, preservednative/build hashes and independentGLM review. No proof from executor claims.
## Stop conditions
If source contradicts diagnosis, the same unexpected command failure recurs, or fix needs scope expansion, stop and investigate. Three failed fixes require questioning the design; do not spend another blind retry. This is the first critical correction after two high fixture deliveries.
