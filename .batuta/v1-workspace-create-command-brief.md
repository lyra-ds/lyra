You are the implementation worker already delegated by Batuta. Edit directly; no further delegation/orchestration/worktrees/package managers/hooks/config/ignores/services/commits.
# React workspace creation command semantics — high
## Goal
Expose the existing Create workspace action as a real command beside the workspace listbox, with native accessible keyboard reachability. Preserve the existing public API and incumbent placement/styles.
## Context
Read .batuta/specs/2026-09-09-workspace-command-design.md in full: the controller-authored compatibility contract is the normative task design within the maintainer's authorization to finish V1. Guarded GLM source scout and controller native9-case baseline confirm all engines currently expose Create as option4, End reaches it, and Tab closes before it is reachable. Existing Task19 selected opening and Task21 original-event consumer-first cancellation must remain. Current options/creation use native buttons and consumer callbacks; no new events/variant/API needed. Source classes/placement refs are established and current contrast already repaired. Do not treat historical comparison/foundation specs as authorization for research/migration. No Alpine creation support is claimed.
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
1. Follow the exact semantic/compatibility design: actual workspaces are the only labelled-listbox options; Create is a native button outside that listbox, within the unchanged measured visual popup. Existing classes, selected data/ID/callbacks/root ref/attrs/flip remain. Arrows/Home/End only workspace options; opening selected/first, empty-create focus, all-empty no-body behavior. Proof: exact DOM/SSR/source and compiled native9 baseline becoming GREEN; axe light/dark and existing placement/contrast tests.
2. Native keyboard contract in design: one roving workspace tab stop plus explicit command tab stop; option Tab→Create, Create Shift+Tab→current option, forward exit and backward trigger exit close without forced external focus; without-create retains native exit; Escape restores; Enter/Space/click/touch invoke exactly the intended callback once. Consumer keyboard prevention works and stopPropagation retains defaults. No general blur handler that unmounts before pointer click, no native Tab prevention/artificial-focus target/sleep. Proof: controller three-engine real input matrix, scoped regressions including no-create/empty/reordering selection input, source rollback RED/restored GREEN. Use explicit tabIndex0 on external Before/After fixture buttons for actual macOS keyboard stops. Do not focus expected destinations to make proofs pass.
3. Four scoped product paths only; compatible published types/API, no new dependency/CSS/export/config; English React patch changeset describes corrected command semantics, native keyboard behavior and inner listbox structure. Types/lint/format/build/docgen/size checked by controller; no budget/hash update. Preserve source test assertions except exact old contract conflicts (Create counted as option/End target) and explain each. No skips/only/suppressions.
## Boundaries
No Alpine/other components/styles/dependencies/exports/configs/WORK/.batuta edits; no hooks/settings/ignores including .impeccable; no Colima/Docker/foreign services, package managers/validation commands, commits/git writes including stash/pop/reset/restore/checkout, remote action or further delegation. Leave unrelated warnings alone; controller owns all proof and managed files.
## Scope
packages/react/src/workspace-switcher/workspace-switcher.tsx
packages/react/src/workspace-switcher/workspace-switcher.browser.test.tsx
packages/react/src/workspace-switcher/workspace-switcher.ssr.test.ts
.changeset/workspace-create-command.md
Do not change anything outside this list; if the task requires it, stop and report.
## Expected evidence
Only read/edit/report. Exception: scoped formatting is an authorized edit; use pinned /Volumes/Home/francisross/.local/share/mise/installs/node/24.18.0/bin/node node_modules/prettier/bin/prettier.cjs --write with ONLY the scoped source/test/changeset paths. Do not use a package manager or format unrelated files. Exact changed paths, actual commands, design traceability and uncertainty; controller performs all pinned checks. For each acceptance criterion n, print an isolated line `BATUTA-PROGRESS <n> START` before the first edit toward it and `BATUTA-PROGRESS <n> DONE` when its proof passes locally. Plain text, nothing else on that line, no tool required. Do not print DONE for unrun controller proof.
## Stop conditions
The code's shape contradicts the brief. The same command fails twice for the same unexpected reason. The fix needs edits beyond Scope or Boundaries. A new API/infrastructure/dependency or timing workaround is required. Stop/report with current edits preserved; do not modify configuration even if a hook asks.
