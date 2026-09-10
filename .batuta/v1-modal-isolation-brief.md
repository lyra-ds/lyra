# Modal branch isolation implementation brief

## Goal
Implement the exact technically reviewed .batuta/specs/2026-09-10-modal-isolation-design.md contract in the incumbent four React modal owners. You are the already delegated high-lane implementation worker. The controller owns coordination/review/tests/build/commit; do not delegate or start another planning workflow.

## Context
Read the design in full and .batuta/scout/2026-09-10-modal-isolation-owners.md for exact source anchors. Base a9c6e3f. The controller reproduced 12 compiled background isolation failures and six nested/sibling mixed-subpath lifetime failures, with zero page errors. Source owners: internal portal, modal-activity, focus-trap, initial-focus, return-focus, scroll-lock; DialogPanel/DrawerPanel/BottomSheetPanel/CommandPalettePanel effects live inside portal timing. Existing body-local Portal, independently bundled entries and one-shot return-focus are material constraints. Preserve Task40 dynamic recovery (35 shared tests each engine), all 121 current four-owner tests, 14 SSR cases, existing 252 compiled native focus scenarios. Current returnFocusTo and initialFocusTo semantics/API are settled. New documentation English. CSS-first classes/ref/rest-spread rules packages/react/CONVENTIONS.md; newer VERSIONING.md 0.x fix=patch supersedes older convention text.

## Conventions
Pinned Node24.18.0/pnpm11.13.1, TypeScript5.9.3, React18/19 peers. Named exports and forwardRef, no CSS imports in shipped React. No new dependency/framework. Existing branch is the authorized isolated worktree. Do not install, build, run tests or package managers: this worker sandbox cannot bind Browser Mode and controller runs all proofs. You may format only scoped files with /Volumes/Home/francisross/.local/share/mise/installs/node/24.18.0/bin/node node_modules/prettier/bin/prettier.cjs. Do not change tool configuration or hook caches.

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
1. Design isolation criterion: single/sibling/nested/custom-container/background mutation/preserved inert/cleanup behavior covered by deterministic native browser tests. Controller reruns three engines and current compiled baseline.
2. Design lifecycle criterion: accepted ancestor close, ignored requests, current topmost defaults, captured/restored focus, initially-open nested portals, StrictMode, retained reopen, nonfinal unmount, inline exclusion and mixed independently compiled entries. Existing behavior preserved. Controller reruns owner/internal source and native suites. Use exact activeElement/real focus/native input. Use expect.element for DOM existence; never assertion on locator object. Stable keys when proving actual node removal. Negative focus assertions must await real observer delivery, not immediately-true polling. No console suppression.
3. Scope/compatibility criterion: no public API/dependency/CSS/build configuration change; scoped source tests, types/lint/format/SSR/build/docgen/declaration parity run by controller, then independent review and measured size growth without cap edits. Report unverified claims honestly.

## Boundaries
No edits to Alpine, Blade, styles, exports/indexes, tsdown configuration, package manifests, lockfiles, generated artifacts, documentation apps, historical evidence, other tools' configuration. No git writes/commit/merge/push, no service/Docker/Colima/resources, no new dependencies, no unapproved external API/provider. Preserve external application state, callback ordering/cancellation and existing public signature. No speculative nonmodal portal API.

## Scope
- packages/react/src/internal/use-modal-layer.tsx OR use-modal-layer.ts, and use-modal-layer.browser.test.tsx
- packages/react/src/internal/{portal,use-modal-activity,use-focus-trap,use-initial-focus,use-return-focus,use-scroll-lock}.tsx or .ts as existing, and their existing direct browser tests; internal.browser.test.tsx only scroll proof
- packages/react/src/{dialog,drawer,bottom-sheet,command-palette}/ corresponding current component .tsx, .browser.test.tsx and .ssr.test.ts
- .changeset/modal-branch-isolation.md (React patch)
Do not change anything outside this list; if the task requires it, stop and report.

## Expected evidence
List exact changed files and contract-to-test mapping, chosen minimal ownership/lifecycle and cross-entry sharing, commands actually run, and all unverified behavior. Finish with report; no claim tests/build passed because you do not run them. Controller supplies independent validation.

## Stop conditions
1. The code's shape contradicts the brief.
2. The same command fails twice for the same unexpected reason (a red test just written is not that).
3. The fix needs edits beyond Scope or Boundaries.
For each acceptance criterion n, print an isolated line `BATUTA-PROGRESS <n> START` before the first edit toward it and `BATUTA-PROGRESS <n> DONE` when its proof passes locally. Plain text, nothing else on that line, no tool required. Do not print DONE for controller-pending proofs.
