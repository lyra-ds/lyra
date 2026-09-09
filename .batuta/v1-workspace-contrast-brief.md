You are the implementation worker already delegated by Batuta. Edit directly; no delegation/orchestration/worktree creation or commits.
# WorkspaceSwitcher metadata contrast — medium/react
## Goal
Make WorkspaceSwitcher metadata readable on its existing hover surface in both actual themes, with deterministic regression coverage.
## Context
Existing full React Chromium/SSR baseline at87f7775 has761/763 passing: both WorkspaceSwitcher theme axe cases fail color-contrast on Free · 2 members. Foreground#64748b on hovered background#f1f5f9 is4.34:1, below4.5. Current test uses toggleAttribute, which produces an empty data-theme rather than data-theme="dark". CSS theme owner requires the latter. navigation.css has additive contrast precedents for tabs/kbd using existing semantic colors. The original handoff region must remain byte-identical; tools/parity/parity.mjs owns a narrow ADDITIVE_EXTENSIONS inventory. Read these exact precedents and .claude/CLAUDE.md Constraints. This task does not change WorkspaceSwitcher behavior/API or global theme tokens.
## Conventions

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


English docs. CSS-first; all visual changes in styles, existing semantic tokens, no new dependencies. Preserve exact class assertions and full axe checks. Work in existing stabilization checkout. Tests run with Node24.18.0, existing Vitest4.1.10 and Playwright1.62.1. Controller runs browsers outside executor sandbox. You may run local formatting/type tools through direct Node paths, but NEVER pnpm/npm/npx/corepack or installations.
1. Test the behavior, never the mock.
2. A failing test means fix the code, not the test.
3. No test-only flags or branches in production code.
Work test-first from the acceptance criteria. Investigate root cause before fixing a bug; never silence a signal (cast, suppression, empty catch, sleep) instead of fixing its source — if you must, mark // WORKAROUND: <reason> and say so in your report.
## Acceptance criteria
1. Metadata satisfies full axe contrast requirements in light and actual dark theme in rest, hovered and keyboard-focused workspace states, including selected/unselected rows. Tests establish actual computed theme surface and native hover/focus before axe; no moving pointer merely to avoid hover failure. Proof: controller focused Chromium/WebKit suite, original CSS mutation RED.
2. Handoff region, tokens, existing classes and behavior remain intact. Only local additive metadata color change and precise parity declaration allowed; styles patch changeset. Proof: parity, styles lint, diff review, React types/lint/format.
## Boundaries
No global palette/hand-off/baseline edits; no test skips/axe rule exclusions/new library. No services/Docker/Colima/network/remote actions. Do not edit WORK/.batuta or commit. Do not read other Batuta briefs/history or executor logs.
## Scope
packages/styles/components/navigation/navigation.css
packages/react/src/workspace-switcher/workspace-switcher.browser.test.tsx
tools/parity/parity.mjs
.changeset/workspace-switcher-contrast.md
Do not change anything outside this list; if the task requires it, stop and report.
## Expected evidence
Paths, actual commands/results; browser tests honestly pending for controller. Report why original regression fails with stronger coverage.
## Stop conditions
The code's shape contradicts the brief. The same command fails twice for the same unexpected reason. The fix needs edits beyond Scope or Boundaries.
For each acceptance criterion n, print an isolated line BATUTA-PROGRESS <n> START before the first edit toward it and BATUTA-PROGRESS <n> DONE when its proof passes locally.
