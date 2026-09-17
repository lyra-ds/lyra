# React initial focus — critical numeric default-filter completion
## Goal
Complete the existing negative-tabindex default-filter requirement after one high retry; preserve all declared-target and native-control eligibility semantics.
## Context
High CodexTerra367.62s initial +287.50s retry. Retry source144/130/130/static/build/docgen passes; API/lifecycle/default native60/60. Controller explicit whitespace-native probe reproduces actual active negative-region with tabindex attribute " -2", reflected tabIndex=-2 instead of task input. Root cause: private shared default selector filters raw attribute prefix, not the browser's numeric tabindex. The initial filter excluded only literal-1; retry excluded raw strings beginning'-', so leading whitespace remains unsafe and a valid numeric-0 spelling is incorrectly excluded. All three default owners delegate to this helper. Declared negative programmatic targets must remain valid; return-focus/Tab helpers have different semantics and remain outside scope. No new component/dependency/config/contract.
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
1. Generic tabindex-only regions with reflected negative tabIndex are never default targets regardless of lexical spelling. Numeric zero remains a default sequential target, and native task controls preserve current default intent even when explicitly negative. Add lowest-owner browser regressions for whitespace negative, ordinarynegative and numericnegativezero, plus explicitnegative/nativecontrol preservation. Run RED on retryhelper, GREEN after narrow fix; all shared helper tests threeengines. No source skips, mocked focus, permissive assertions or budget changes.
2. Only helper, its test and the scoped additive changeset may change. Correct the conductor-authored minor metadata to patch under existing VERSIONING.md:20-37 (current React0.x additive features are patch); the earlier Task33 design used post1.0 convention prematurely. No version command. Controller final build/static/docgen plus existing API60, lifecycle42, originalhidden9 and nativewhitespace9 prove no other behavior regression; crossfamilyEscape48 retained for the earlier CPpanel-handler addition. Full prior scopedsource144/130/130 remains evidence for unchanged owners; do not claim it was rerun after finalhelper unless actually run. Record sizes honestly. Independent GLM threecriteria review of wholeTask33 follows.
3. Existing Task33 implementation scope/design/feedback remain; publicdocs immediate follow-up, all fullqualification gaps remain. Record two high attempts then critical/controller completion; preserve bytes without gitreset. No remote/Colima/services actions.
## Boundaries
Only product paths below; shared trap/return/presence/portal/otherowners/styles/dependencies/config/generated artifacts read-only except owner-generated docgen. No budget/baseline/version changes. Controller owns raw evidence and managed Batuta documents.
## Scope
packages/react/src/internal/use-initial-focus.ts
packages/react/src/internal/use-initial-focus.browser.test.tsx
.changeset/modal-initial-focus-destination.md
Controller-generated only: tools/docgen/output/props.json, tools/docgen/output/llms.txt.
Do not change anything outside this list; if the task requires it, stop and report.
## Expected evidence
Lowest-layer RED/GREEN, three-engine helper and actual modal native results, exact final diff/scope/static/build/docgen/size and independent review; source diff traceable. No unsupported claims from previous delivery.
## Stop conditions
Three failed fixes require questioning design; unexpected command fails twice; correction needs unrelated scope. Preserve delivery, do not reset shared worktree. No broader modal ownership redesign.
