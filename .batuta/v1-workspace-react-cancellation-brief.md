You are the implementation worker already delegated by Batuta. Edit directly; no further delegation/orchestration/worktrees/package managers/hooks/config/ignores/services/commits.
# React WorkspaceSwitcher consumer-first keyboard events — medium
## Goal
Honor the existing root onKeyDown callback before cancellable keyboard defaults on the trigger and options. Preserve native React event identity/currentTarget and one delivery per key.
## Context
Controller inspected the guarded GLM workspace scout and compiled native cases. At3c000ab options handle ArrowDown/ArrowUp/Home/End/Escape/Tab before the root forwards onKeyDown. All18 native cases across3 engines show consumer preventDefault too late: focus already moved or popup closed. Trigger instead calls the root callback with a button currentTarget using a cast. Governing architecture: docs/superpowers/specs/lyra-v1/04-component-architecture.md:251-275 requires original-event consumer first, defaultPrevented check, at-most-once notification, no partial focus/state changes on cancellation; stopPropagation retains platform meaning and is not cancellation. Current Dropdown implements that same contract in its existing root event owner; use it as local context, do not edit it. Existing selected-entry behavior and create-as-option behavior remain exactly in scope as regressions, not a request to redesign markup now.
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
1. With current middle workspace selected, root onKeyDown receives each supported opening/navigation/dismissal key once, with currentTarget=root, original target and uncanceled pre-default event/focus state. preventDefault on trigger Enter/Space/ArrowDown/ArrowUp prevents opening; on option ArrowDown/ArrowUp/Home/End/Escape/Tab prevents focus movement and closing. No change/create callback from navigation or canceled activation. Proof: controller three-engine scoped/browser/native checks and source-rollback RED/restored GREEN.
2. Without prevention, selected entry, existing roving/Home/End, Escape restoration, Tab close without forced restoration, selection/create activation and forwarded-root ref/attrs remain. stopPropagation alone still allows Lyra default but prevents external ancestor delivery. Preserve original descendant handler cancellation and no duplicated callback or synthetic redispatch. No public API/markup/creation semantics changes. Proof: colocated existing/new tests, SSR and native cases.
3. Only scoped paths change; typecheck, eslint, formatting, build/docgen and measured bundle size checked by controller. No budget/hash updates. Add English React-only patch changeset. Meaningful precise tests, no source skips/only, no platform branches/permissive assertions/expected-option.focus, sleeps or broad test edits.
## Boundaries
Do not edit Alpine, Dropdown, styles, dependencies, exports, configs, WORK/.batuta, hooks/settings/ignores including .impeccable, Colima/Docker/foreign services. No remote action, commits, other git writes including stash/pop/reset/restore/checkout, validation commands/package managers or further delegation. Do not investigate unrelated warnings. Existing managed files are controller-owned.
## Scope
packages/react/src/workspace-switcher/workspace-switcher.tsx
packages/react/src/workspace-switcher/workspace-switcher.browser.test.tsx
.changeset/workspace-react-keyboard-cancellation.md
Do not change anything outside this list; if the task requires it, stop and report.
## Expected evidence
Report exact changed paths, behavior, uncertainty, commands actually run. Do not run validation commands; controller owns all pinned proof. For each acceptance criterion n, print an isolated line `BATUTA-PROGRESS <n> START` before the first edit toward it and `BATUTA-PROGRESS <n> DONE` when its proof passes locally. Plain text, nothing else on that line, no tool required. As execution is controller-owned, leave proof pending rather than emit unproven DONE.
## Stop conditions
The code's shape contradicts the brief. The same command fails twice for the same unexpected reason. The fix needs edits beyond Scope or Boundaries. Additional public API/state/infrastructure or unrelated suppression/config changes appear necessary. Preserve edits and report.
