# BottomSheet return-focus retry — high / React

You are the implementation worker. Correct the current diff directly in this existing worktree; no orchestration/delegation/worktree creation/commit. This is one bounded verification retry, not a restart. Read only this feedback, the original brief, the four scoped product files, and the shared return-focus owner if necessary. Do not reread WORK/history/profile or raw executor logs.

## Goal
Complete the invoking-composition migration and public proof omitted from the first implementation.
## Context
Controller native Chromium/WebKit StrictMode pointer proof is green6/6 against current source; original source red6/6. Controller Chromium/SSR23 pass, WebKit18/20: exactly the original BottomSheetHarness pointer-opener failures remain at browser test lines160 and440. Both still expect exact opener but BottomSheetHarness supplies no returnFocusTo. New explicit resolver cases pass. Types/lint/format pass. Runtime shared owner integration is otherwise correct; preserve it.
## Conventions
Use the original brief conventions/method/test laws unchanged. All docs English. DO NOT invoke pnpm, npm, npx, corepack or installs: the global pnpm launcher hung repeatedly. ONLY use pinned Node /Volumes/Home/francisross/.local/share/mise/installs/node/24.18.0/bin/node and installed JS executables for local checks. Browser checks belong to controller; do not retry sandbox startup.
## Acceptance criteria
1. BottomSheetHarness models the invoking composition with a stable trigger ref and returnFocusTo; its original exact focus assertions and unprepared mouse activation must remain. This is the same required public-consumer migration used for Dialog/Drawer. Do not prepare focus inside the mouse handler. Proof: controller WebKit all cases pass.
2. Add focused latest-committed-resolver test with two distinct eligible targets, proving closed mount/rerender does not resolve and accepted close invokes only the current resolver once. Reuse shared owner; no runtime behavior expansion. Proof: focused browser suite.
3. Public prop JSDoc explains eligible logical target/keyboard-captured fallback, current-close resolution and composition successor responsibility concisely. Preserve accessible-name union and all source boundaries. Proof: source review/types/lint/format.
## Boundaries
No shared hook, other component, dependency/config/workflow/generated docs or raw evidence edits. No services/Colima/Docker. No commits or new worktrees.
## Scope
packages/react/src/bottom-sheet/bottom-sheet.tsx
packages/react/src/bottom-sheet/bottom-sheet.browser.test.tsx
packages/react/src/bottom-sheet/bottom-sheet.ssr.test.ts
.changeset/bottom-sheet-return-focus.md
Do not change anything outside this list; if the task requires it, stop and report.
## Expected evidence
Changed paths, actual commands and output, unverified browser proof. Formatting uses pinned Node with /Volumes/Home/francisross/Projects/lyra/lyra/node_modules/prettier/bin/prettier.cjs; types /Volumes/Home/francisross/Projects/lyra/lyra/node_modules/typescript/bin/tsc; lint /Volumes/Home/francisross/Projects/lyra/lyra/node_modules/eslint/bin/eslint.js. Run types/lint from packages/react.
## Stop conditions
The code contradicts the brief; same unexpected command failure twice; edits beyond scope required. Report once complete, do not broaden work.
For each acceptance criterion n, print an isolated line `BATUTA-PROGRESS <n> START` before the first edit toward it and `BATUTA-PROGRESS <n> DONE` when its proof passes locally. Plain text, nothing else on that line, no tool required.
