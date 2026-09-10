# CreateWorkspaceDialog lifecycle — critical test-fixture completion
## Goal
Complete the original Task26 verification after the high initial delivery and its single retry. Repair the diagnosed browser fixtures, preserving all real behavior assertions and existing runtime scope.
## Context
The high retry completed in339.27s. Scope and protected source hashes pass. All three source browser runs fail the same two tests: native click waits forever on an intentionally disabled submit; native click of the external Force close button is intercepted by the valid modal overlay. Chromium10/12 and WebKit/Firefox9/11 pass. Typecheck reports TS2339 on test226: Window has no Promise property. Runtime null guards are corrected; build, lint, formatting and docgen pass. Current compiled native81 + commit6 + actual consumer6 are being checked independently against the unchanged built runtime. The old source test failure output is preserved in MAIN .batuta/runs/v1-create-workspace-operation-retry-checks. These failures originate in test actions/types, not evidence that disabled buttons or modal backdrop behavior should change.
The forced-close criterion concerns an external controlled input change, not pointer access to background content. Preserve the real React transition and parent layout-effect settlement boundary. Duplicate submission must prove both the disabled native control and the independent native form submission guard. The iframe Promise must remain a genuine foreign-realm native Promise. No prepared focus, synthetic Escape target, timer, forced click, or unblocking of disabled controls.
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
1. Source browser11 cases plusSSR and full React types/lint/format pass. Native Escape remains real and at-most-once abort/order/acknowledgment assertions are retained.
2. The forced close fixture actually commits the parent input change and settlement, then proves no onClose and exactly one abort. Counterfactual passive cleanup must fail the lifetime test and restore byte-for-byte; initial implementation must fail representative new regressions before restoring the final source.
3. Product runtime/examples/generated outputs remain unchanged in this test repair; current native81+commit6 and examples6+visual8 independently qualify the runtime. Existing size failure remains open Task10; no release/remote qualification claimed.
## Boundaries
Original ten-file task scope retained; this escalation only changes the existing browser test unless newly reproduced runtime evidence requires an explicit additional critical diagnosis. No production conditionals for tests, skipped tests, weak assertions, assertion removals, warning suppression, services, Colima, Docker, dependencies, git reset, config, MDX or public API changes. Keep all high delivery bytes as evidence.
## Scope
packages/react/src/create-workspace-dialog/create-workspace-dialog.browser.test.tsx
Do not change anything outside this list; if the task requires it, stop and report.
## Expected evidence
Controller command exit codes, exact failed signals, current proof and negative/restoration hashes, final scoped diff; independent GLM review after validation. Raw evidence stays in MAIN .batuta/runs; durable English records stay in Batuta.
## Stop conditions
1. The code's shape contradicts the brief.
2. The same command fails twice for the same unexpected reason (a red test the executor just wrote is not that).
3. The fix needs edits beyond Scope or Boundaries.
For each acceptance criterion n, print an isolated line `BATUTA-PROGRESS <n> START` before the first edit toward it and `BATUTA-PROGRESS <n> DONE` when its proof passes locally. Plain text, nothing else on that line, no tool required.
