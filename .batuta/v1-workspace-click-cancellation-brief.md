You are the implementation worker already delegated by Batuta. Edit directly; no further delegation/orchestration/worktrees/package managers/hooks/config/ignores/services/commits.
# React workspace click cancellation — medium
## Goal
Honor the existing root onClick before cancellable trigger/selection/creation defaults, with original native React event delivery and stable activated workspace identity.
## Context
Read .batuta/v1-workspace-click-cancellation-diagnosis.md and current WorkspaceSwitcher. At36fe361 and again after Task22 at0ac89d0 (artifact180c8395709634e95e1f50ae78dd9c6f68d1316cc74779cb43f5ec3c4f2889fd), controller compiled pointer9/9 cases fail: the component opens/emits selection/creation before the root consumer prevents default. Keyboard Task21 already fixed original root callback ordering; Task22 now separately makes Create a real command beside the listbox with native Tab access. Preserve both completed contracts. Governing 04-component-architecture.md:251-275 requires original event consumer first, defaultPrevented before acceptance, at most once, stopPropagation is not cancellation. Existing Dropdown captures clicked command identity before synchronous consumer updates; this is local context, not permission to edit that owner. Consumer callbacks retain their existing argument meanings and control of domain effects. onClick cancels actual click defaults only. Trigger Enter/Space already follows the enhanced keydown path and prevents the native click; preserve its onKeyDown cancellation contract. Native keyboard-generated option/Create clicks must honor onClick. Do not synthesize callback events or rewrite the keyboard model.
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
1. Root onClick receives the original event once with currentTarget=root and original target before any Lyra opening/selection/creation effect. Consumer preventDefault blocks trigger open/close, workspace onChange/close and Create onCreate/close. Descendant-native prevention remains honored; stopPropagation alone preserves the Lyra default and prevents outer delivery. Proof: controller pointer/touch/keyboard-activation tests and original-source RED/restored GREEN, existing keyboard regressions retained.
2. Unprevented workspace activation invokes onChange(id,workspace) exactly once for the originally clicked item even if root onClick synchronously reorders/replaces workspaces. Unprevented Create invokes onCreate exactly once, never onChange; selection never creates. Trigger toggles once. Preserve controlled selected identity, native focus/return behavior, command/listbox markup, selected entry, roving/Tab and flip/contrast/SSR. Proof: colocated exact regression with synchronous consumer rerender and compiled native effects.
3. Three scoped files only; public API/classes/styles/exports/dependencies unchanged. English React patch changeset; types/lint/format/build/docgen and measured size verified by controller without budget/hash update. No test skip/only, suppressed checks, permissive assertions, artificial expected-destination.focus or timing sleeps.
## Boundaries
No Alpine/other components/styles/dependencies/exports/configs/WORK/.batuta edits; no hooks/settings/ignores including .impeccable, Colima/Docker/foreign services, package managers/tests/validation commands, commits/git writes including stash/pop/reset/restore/checkout, remote action or delegation. Leave unrelated warnings alone.
## Scope
packages/react/src/workspace-switcher/workspace-switcher.tsx
packages/react/src/workspace-switcher/workspace-switcher.browser.test.tsx
.changeset/workspace-click-cancellation.md
Do not change anything outside this list; if the task requires it, stop and report.
## Expected evidence
Only read/edit/report; controller owns verification. Exception: apply scoped formatting with pinned /Volumes/Home/francisross/.local/share/mise/installs/node/24.18.0/bin/node node_modules/prettier/bin/prettier.cjs --write and ONLY the scoped files. Report exact touched paths, actual command output, remaining uncertainties. For each acceptance criterion n, print an isolated line `BATUTA-PROGRESS <n> START` before the first edit toward it and `BATUTA-PROGRESS <n> DONE` when its proof passes locally. Plain text, nothing else on that line, no tool required. Do not print DONE for unrun controller proof.
## Stop conditions
The code's shape contradicts the brief. The same command fails twice for the same unexpected reason. The fix needs edits beyond Scope or Boundaries. A new API/helper framework/dependency or unrelated suppression is necessary. Stop and report with edits preserved.
