# CommandPalette backdrop gesture repair

## Goal
Prevent CommandPalette from dismissing when a mouse gesture crosses between its panel and backdrop, in either direction. Preserve legitimate backdrop clicks and existing keyboard/selection behavior with a narrow compatible fix.

## Context
Active worktree: /Volumes/Home/francisross/Projects/lyra/lyra-v1-stabilization, branch feat/v1-incumbent-stabilization, HEAD 8cc15b5. You are the implementation executor already delegated by Batuta. Implement directly; do not conduct, delegate, ask for workflow approval, or commit.
Named owner: packages/react/src/command-palette/command-palette.tsx, CommandPaletteRoot overlay onClick currently checks only event.target === event.currentTarget. Native mouse cross-boundary clicks target the common ancestor (overlay). Controller reproduction at .batuta/runs/v1-command-palette-pointer/red.json proves BOTH inside-to-backdrop and backdrop-to-inside request onClose once in Chromium and WebKit; expected zero. Genuine backdrop, inside non-option, Escape and selection controls pass. Query must survive cross-boundary gestures. Existing Dialog/Drawer show press-origin conventions, but those alone do not prove reverse gestures safe.
Existing browser tests: packages/react/src/command-palette/command-palette.browser.test.tsx; SSR colocated. Baseline suite has a known WebKit captured-opener precondition failure at line247: a mouse-clicked button is not necessarily focused in WebKit. For this test only, establish a genuinely focused opener via keyboard activation and keep exact restoration assertions after Escape and backdrop close. Existing synthetic bare click must represent a complete mouse gesture after this change. Baseline Chromium had tracing.stopChunk infrastructure failure, not a product assertion; controller will run engines separately. Do not modify responsive Trigger behavior or tracing config.
Controller owns temporary node_modules symlinks and .batuta proof artifacts; preserve them. Existing dependencies are available; no install or pnpm commands. All real checks run by controller outside your sandbox, so report them pending. Controller baseline reproduction is already RED before your edits.

## Conventions
Batuta-only coordination; English docs; CSS-first existing lyra classes; no dependencies, manifests, styles or generated changes. Conventional Commits are controller-owned. Node24.18.0; repo pnpm11.13.1 but do not invoke it (installed global version differs). Worktree medium+, sequential execution. Follow exact surrounding naming and style.

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


Work test-first from the acceptance criteria. Investigate root cause before fixing a bug; never silence a signal (cast, suppression, empty catch, sleep) instead of fixing its source — if you must, mark `// WORKAROUND: <reason>` and say so in your report.
1. Test the behavior, never the mock.
2. A failing test means fix the code, not the test.
3. No test-only flags or branches in production code.

## Acceptance criteria
1. Gestures starting inside the panel and ending on backdrop, and the reverse, do not call onClose or discard the query; a genuine backdrop press/release still calls onClose exactly once. Add deterministic browser regressions including common-ancestor click delivery and a subsequent genuine backdrop click, guarding stale gesture state. Proof: controller trusted runner 12 scenarios across Chromium/WebKit, and scoped browser regression suite with baseline-source RED/current GREEN.
2. Existing inline filtering, keyboard navigation, selection, Escape, hotkey, modal focus/presence/scroll semantics and SSR pass. Preserve exact prepared-opener restoration assertions; fixture preparation must express keyboard opening honestly. Proof: scoped Chromium/SSR and WebKit suites, TypeScript and ESLint.
3. Only the listed files change, no new public API/dependency/framework. Include a React patch changeset per 0.x compatible fix policy. Proof: controller diff/scope review and Prettier check.

## Boundaries
Never touch Colima configuration or restart it. No Docker, resource changes, cleanup of foreign services, new dependencies, installs, lockfiles, API expansion (including returnFocusTo), other component changes, docs generation, CI, experimental work, remote actions, publication, commits or unrelated changes. Do not run tests/checks/builds in executor sandbox; controller performs them.

## Scope
- packages/react/src/command-palette/command-palette.tsx
- packages/react/src/command-palette/command-palette.browser.test.tsx
- .changeset/command-palette-pointer-origin.md (new)
Do not change anything outside this list; if the task requires it, stop and report.

## Expected evidence
Report files changed, behavior and root cause, actual commands/output, and checks not run (controller pending). No invented green. For each acceptance criterion n, print an isolated line `BATUTA-PROGRESS <n> START` before the first edit toward it and `BATUTA-PROGRESS <n> DONE` when its proof passes locally. Plain text, nothing else on that line, no tool required. Since checks belong to controller, do not claim DONE before proof.

## Stop conditions
1. The code's shape contradicts the brief.
2. The same command fails twice for the same unexpected reason (a red test just written is not that).
3. The fix needs edits beyond Scope or Boundaries.
