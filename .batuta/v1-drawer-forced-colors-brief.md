Work only inside /Volumes/Home/francisross/Projects/lyra/lyra-v1-stabilization. You are the assigned low implementation executor; no delegation, scouting or memory. Do not commit.
# Goal
Fix the reproduced missing Drawer Close keyboard focus indicator in forced-colors mode using the existing Dialog system-color focus rule.
# Context
Commit8000590 adds verified packed Drawer profiles. Current exact Styles artifact gives16/18PASS: native :focus-visible Close has no outline or shadow in Chromium/Firefox under forced-colors; WebKit passes. Existing Dialog has18/18PASS thanks to the final @media(forced-colors:active) rule in packages/styles/components/feedback/feedback.css: .lyra-dialog__close:focus-visible uses2px solid CanvasText outline,2px offset. Drawer at earlier line339 sets outline:none with boxshadow. Extend that exact final rule's selector list to include .lyra-drawer__close:focus-visible. Keep the rule body and ordinary-mode styling unchanged. This one-line additive selector is the entire requested product change. Existing committed packedprofile tests are the regression; do not add test code.
# Conventions
Pinned Node24.18.0 at /Volumes/Home/francisross/.local/share/mise/installs/node/24.18.0/bin; pnpm11.13.1. Set PATH appropriately for any checks. No new dependencies/lockfiles or installs. Existing style is CSS-first, no runtime styling shortcuts. English documentation. Sequential bounded checks; no Docker/Colima/VM/resource/service changes, foreign cleanup or remote actions. No skills that introduce additional planning/approval workflow; this scoped implementation is already authorized. Controller runs actual browser tests outside your session; do not claim browser evidence you cannot run.

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



Work test-first from the acceptance criteria. Investigate root cause before fixing a bug; never silence a signal (cast, suppression, empty catch, sleep) instead of fixing its source — if you must, mark // WORKAROUND: <reason> and say so in your report.
1. Test the behavior, never the mock.
2. A failing test means fix the code, not the test.
3. No test-only flags or branches in production code.

# Acceptance criteria
1. Actual Drawer forced-colors focus indicator passes all3engines with originalStyles2failures retained, using unchanged committed8000590 runner; proof controller freshStylespack and18profilecases.
2. Dialog18profiles and its6existingnativeCSS tests remain green; all Styles packaged files exceptfeedback.css and all React files unchanged, targetgeometry/normaltheme/motion/RTL preserved; proof controller tests, archive comparison and scope guard.
3. Change is only the Drawer selector in existing additive forced-colors rule; stylelint/parity/diff checks pass; proof controller commands. No dependency, manifest, test, runtimeJS or threshold change.
# Boundaries
No other CSS cleanup, formatting, reordering, tests, changeset, generated files, locks, manifests, dependencies, WORK or state changes. No Docker/Colima/resource/service/global config or remote operations, memory tools or package install/build. CSS handoff verbatim above additive region is read-only. No new rule duplicate.
# Scope
Only packages/styles/components/feedback/feedback.css. Do not change anything outside this list; if the task requires it, stop and report.
# Expected evidence
Exact diff and any local command/output. Controller owns actual native/browser/packed tests and stylelint/parity. Do not claim tests you did not run. Do not read entireWORK/history or huge repository diffs.
# Stop conditions
Stop if code contradicts brief, samecommand unexpectedly fails twice, or edits outside scope are needed. For each acceptance criterion n, print an isolated line BATUTA-PROGRESS <n> START before the first edit toward it and BATUTA-PROGRESS <n> DONE when its proof passes locally. Plain text, nothing else on that line, no tool required.
