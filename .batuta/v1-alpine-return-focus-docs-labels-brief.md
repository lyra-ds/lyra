You are the implementation worker already delegated by Batuta. Make only this small label completion, directly. No further delegation/orchestration/config/git writes. Original runtime is verified; do not inspect unrelated files or replan.
# Alpine documentation labels — high escalation after medium initial/retry
## Goal
Complete accessible labels in six existing Alpine snippets without changing their verified behavior.
## Context
Eight-page documentation migration already passes MDX8/format/stack303 and native48focuscases. Independent GLMreview3DONEunchangedguard found BottomSheet header icon-only close lost its old aria-labelClose. Current Alpine bottom-sheet.ts closebinding only assigns typebutton/click. Dialog/Drawer closebinding assigns aria-labelClose, so their new footer visibleDone is announced Close; sourceboundary confirmed bycontroller. This is a six-MDX-only completion; no runtime source edits. Read only each listed page's AlpineStackPanel, not wholepages/unrelated React content.
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
1. Both BottomSheet Alpine header close buttons have static aria-label="Close" while preserving x-bind="close" and glyph/classes. Proof controller native served closebutton name equalsClose.
2. Both Dialog and both Drawer Alpine footer buttons using x-bind="close" have visible label Close, matching the binding-owned accessibleClose; preserve existing class/binding. No fake domain action; existing neutralProjectdetails flow remains. Proof controller actual native button text and accessible labels plus unchanged focus48.
3. Only sixMDXlabel edits (one perpage), localeHTML remains identical, no othercontent touched. Proof exactdiff, MDX/format/stack and minimal affectednative labels/focus checks. Report all controllerchecks unrun.
## Boundaries
No CommandPalette/React/Blade/top-levelprose/callback/DOMstructure/runtime/style/dependency/catalog/WORK/.batuta edits. No tests/builds/package managers/git writes/hooks/ignores/config/services/remote/Docker/Colima. No new ARIA role, helper or API.
## Scope
apps/docs/content/docs/en/components/dialog.mdx
apps/docs/content/docs/en/components/drawer.mdx
apps/docs/content/docs/en/components/bottom-sheet.mdx
apps/docs/content/docs/pt-BR/components/dialog.mdx
apps/docs/content/docs/pt-BR/components/drawer.mdx
apps/docs/content/docs/pt-BR/components/bottom-sheet.mdx
Do not change anything outside this list; if the task requires it, stop and report.
## Expected evidence
Exact six changedlines/paths and unverifiedchecks. Only permitted execution: /Volumes/Home/francisross/.local/share/mise/installs/node/24.18.0/bin/node node_modules/prettier/bin/prettier.cjs --write plusONLY six scopedpaths. Read-only rg/gitdiff allowed, no validation. For each criterion n print isolated BATUTA-PROGRESS <n> START before edits; DONE only ifproofactuallypasses. Do not run tests.
## Stop conditions
Listed text differs from current snippet, samecommand fails twice, or outside scope needed. Preserve/report; do not broaden or rewrite sections.
