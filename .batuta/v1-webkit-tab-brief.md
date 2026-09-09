# WebKit modal Tab containment

## Goal
Prevent Tab/Shift+Tab from leaving an active modal when WebKit skips native button stops. Preserve native intermediate navigation; repair the shared focus owner without new dependencies or a layer framework.

## Context
You are the implementation executor already delegated by Batuta. Implement directly; no recursive delegation, Superpowers, workflow approval or commit. Worktree /Volumes/Home/francisross/Projects/lyra/lyra-v1-stabilization, branch feat/v1-incumbent-stabilization, base6e166ec. Controller-owned WORK/.batuta records and temporary root/React node_modules links must be preserved.
Known owner packages/react/src/internal/use-focus-trap.ts. It queries visible eligible candidates and handles only panel/zero-candidate routing and first/last wrapping. Native intermediate steps are left alone. Callers are Dialog, Drawer, BottomSheet and modal CommandPalette; do not change their implementations/API. Native WebKit26.5 on this machine skips buttons without explicit tabindex; Chromium151 visits them. Plain HTML probe .batuta/runs/v1-webkit-tab/plain.json proves input Tab→BODY and reverse Tab→BODY without Lyra; tabindex=0 controls are traversed. WebKit source reference https://bugs.webkit.org/show_bug.cgi?id=199671 documents platform keyboard policy. Do not change any browser/system setting or add a platform sniff.
Consequently Lyra's theoretical first/last candidates do not always equal native Tab boundaries. The prior retained nested reproduction .batuta/runs/v1-dialog-nested-escape/diagnostic-green.json shows input Tab→BODY. Current .batuta/runs/v1-webkit-tab/run.mjs uses real trusted keys, StrictMode, current Dialog and shared hook; red.json is controller baseline proof for single/nested panels. All files are inside this worktree. Baseline hook snapshot is baseline.ts. Target requirement is containment, not forcing WebKit to visit skipped native buttons. Source tests already cover explicit edge wrapping, panel/zero-content paths, dynamic visibility, portals and restore. Do not weaken existing tests.
Existing .lyra-visually-hidden CSS utility lives in packages/styles/components/primitives/primitives.css and is available through the existing styles import; styling must remain CSS-first. Any owned DOM/listener resources must not alter caller semantics or remain after deactivation/unmount. Initial focus, logical sibling-modal ordering, inert coordination, outside-click dismissal and non-Tab keys remain separate requirements; no global focus enforcement or focus-stealing on unrelated pointer/programmatic interactions.
Controller runs actual checks outside executor sandbox with installed tools/pinned Node24.18.0. Do not run tests/lint/build/package managers/install in your sandbox. You may run installed Prettier --write on exactly your scoped files: Node /Volumes/Home/francisross/.local/share/mise/installs/node/24.18.0/bin/node, Prettier /Volumes/Home/francisross/Projects/lyra/lyra/node_modules/prettier/bin/prettier.cjs. No global pnpm. The executor report is not proof.

## Conventions
Batuta only; English docs; React TypeScript with existing CSS-first conventions; no new library. Sequential high lane, existing feature worktree. Conventional Commit by controller. React patch changeset per incumbent 0.x policy.

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
1. Trusted Tab and Shift+Tab from an input between native buttons stay within the active panel in WebKit and Chromium, in single and React-portal-nested Dialogs. Final focus is an eligible user control or the zero-candidate panel, never BODY or an internal boundary node. Preserve native intermediate input/textarea/radio/explicit-tabindex traversal rather than replacing every Tab with an unconditional manual walk. Proof: controller native red/green and focused new browser regressions, including reverse first action from the input.
2. Existing wrapping, panel routing and zero-candidate containment remain correct; re-read current eligible content after children mount/unmount or become hidden/disabled. Active=false, repeated activation, unmount and StrictMode release all task-owned resources; no duplicated stops, leaked focus callbacks, changed panel DOM content or return-focus regression. Nested default-body portals must not route into the parent's controls. Respect a descendant native Tab preventDefault; unrelated keys and pointer/programmatic focus remain unchanged. Proof: behavioral hook/real-component regressions and controller existing Dialog/Drawer/BottomSheet/CommandPalette browser+SSR suites.
3. Keep product changes within the shared hook, its focused browser tests and one React patch changeset. No public API/dependency/CSS contract/global modal ownership change, UA detection, browser/system preference change, observer polling loop or new background service. Add only resources demonstrably necessary for native containment and clean them up. Proof: diff/scope review, independent review, TypeScript/scoped ESLint/Prettier plus controller suites.

## Boundaries
No Colima/Docker/configuration/resource operation, installs/dependency/lockfile changes, global registry/listener framework, component API/caller implementation changes, experiments, unrelated cleanup, CI/ledger qualification, remote actions/versioning/publication. No arbitrary timing waits, ignored failing assertions or hidden unqualified cases. Do not edit managed controller records/raw fixtures. Preserve native user preference inside panels; no blanket override of Tab order.

## Scope
- packages/react/src/internal/use-focus-trap.ts
- packages/react/src/internal/use-focus-trap.browser.test.tsx (new)
- .changeset/modal-native-tab-containment.md (new)
Do not change anything outside this list; if the task requires it, stop and report.

## Expected evidence
Report files touched, cause, actual commands/output, lifecycle/native-navigation tradeoffs and all controller-pending checks. For each acceptance criterion n, print an isolated line `BATUTA-PROGRESS <n> START` before the first edit toward it and `BATUTA-PROGRESS <n> DONE` when its proof passes locally. Plain text, nothing else on that line, no tool required.

## Stop conditions
1. The code shape contradicts this brief.
2. The same command fails twice for the same unexpected reason (a new red test does not count).
3. The correction requires edits beyond Scope or Boundaries.
