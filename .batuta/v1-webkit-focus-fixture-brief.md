# Prepared opener fixture repair — approved bounded task

## Goal

Repair the opening precondition of existing Drawer/Dialog focus-restoration tests, while keeping the real unprepared WebKit mouse composition documented as unresolved V1 debt.

## Context

Source 574faa1. Controller trusted-pointer trace (12 cases) establishes WebKit mousedown removes trigger focus before click, even after pre-focus; components capture body. Keyboard opening captures and restores the trigger on both engines. Existing tests assume a focused trigger but their setup does not establish it at capture time. GLM read-only scout confirms preparation can be fixed in consumer fixture, without production API changes, only if the real unprepared gap remains explicitly open. Original WebKit suites have exactly six restoration failures (32 pass); Chromium/SSR 43 pass. These unchanged-source logs and trace are preserved. No global tracking or release qualification.

## Conventions

Low/frontend implementation: OpenCode opencode/glm-5.3-flash, narrow prescriptive fixture change. English project prose. Node24.18.0, existing Vitest/Playwright. Controller runs actual browser tests, lint and regression-strength fault injection outside executor. No install, dependency links, commands involving Colima/Docker, builds or remote actions. Do not run tests in the executor or commit.

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

1. In the DrawerHarness and DialogHarness trigger onClick handlers, synchronously focus event.currentTarget before setOpen(true), establishing the focused-opener precondition in the invoking composition. Keep real userEvent.click and all exact restoration assertions. Remove the now-redundant focus-before-click in Dialog openHarness. Add one brief explanatory comment about preparing focus at activation for WebKit; no repetitive comments. Update helper documentation only where it would misdescribe behavior. Proof: controller real Chromium/WebKit suites pass; direct inspection and fault injection show exact restoration assertions still detect broken runtime restoration.
2. Product code, public API, CSS, dependency/configuration/ledger files and historical evidence remain unchanged. Only two test fixture owners change. Do not mark unprepared mouse-return-to-body behavior fixed or qualified. Proof: diff scope/hashes, original diagnostic retained and controller backlog/verification state.

## Boundaries

Do not weaken/delete/mask assertions, add skips, mocks, timers or browser conditionals, switch tests to keyboard-only input, focus after the awaited click, alter product focus restoration, introduce APIs or dependencies, modify global test setup, touch Colima or run remote commands. This fixes test composition only; the unprepared production mouse case stays a required V1 gap.

## Scope

packages/react/src/dialog/dialog.browser.test.tsx, packages/react/src/drawer/drawer.browser.test.tsx. Managed records belong to the controller; executor must not edit them. Do not change anything outside this list; if the task requires it, stop and report.

## Expected evidence

Exact two-file diff, preserved assertions, no tests claimed executed. Report production gap unchanged and controller verification pending.

## Stop conditions

Stop if source contradicts the brief, the same command fails twice unexpectedly or changes beyond scope are needed. No redelegation or commit. Print BATUTA-PROGRESS n START before each criterion and BATUTA-PROGRESS n DONE only when its local proof passes; browser checks are controller-owned and pending. Do not reload unrelated skills/project documentation; this brief contains conventions and authorized scope.
