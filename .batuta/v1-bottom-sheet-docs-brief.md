# BottomSheet public invoking compositions — React / medium
You are the implementation worker already delegated by Batuta. Edit directly in the existing stabilization worktree; no further delegation, orchestration, worktree creation or commits. Read only this brief and listed source/docs precedents. Controller owns WORK and .batuta. Existing node_modules symlinks are controller-owned tool infrastructure.
## Goal
Publish usable BottomSheet first-party examples and migration documentation for the verified optional returnFocusTo contract.
## Context
BottomSheet now shares the same return-focus owner as Dialog/Drawer/CommandPalette. Read packages/react/src/bottom-sheet/bottom-sheet.tsx and apps/docs/components/examples/drawer/basic.tsx plus the matching Drawer API page as reference only. BottomSheet current examples basic.tsx and labelled-without-title.tsx use unprepared pointer triggers with no declared target. Both must expose actual invoking Button refs through the approved resolver. Accessible-name/title branch and translated close labels remain intact. Public consumer docs must distinguish eligible captured-opener fallback from a guaranteed arbitrary mouse trigger.
## Conventions
English documentation/JSDoc; existing CSS-first styling; no dependency changes; tests-after project convention plus method below; controller runs browser tests outside executor sandbox. Read packages/react/CONVENTIONS.md. No commit. No service or configuration operations. Use pinned Node /Volumes/Home/francisross/.local/share/mise/installs/node/24.18.0/bin/node with installed tool JS paths. Do not invoke pnpm: the global launcher can auto-install and uses another Node version.

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
1. Both real examples declare their own invoking target, and native Chromium/WebKit Escape, close-button and backdrop closure returns exactly to that Button without pre-focusing it. Proof: controller imports actual built-package examples and clicks them.
2. Both English and pt-BR component pages document current accepted-close resolution, eligible captured fallback, ignored-close behavior, and composition responsibility for a meaningful successor when opener is removed/disabled. Include one concise complete React usage snippet with imports, refs and resolver. New/updated prose is English, even under pt-BR. Do not change unrelated localized text or add planning docs outside .batuta. Proof: page review and snippet typecheck against current declarations.
3. Owner-generated tools/docgen/output/props.json and llms.txt expose the new prop and match fresh built declarations. Do not hand-edit generated files; controller runs existing build and docgen owner. Proof: docgen --check, types, scoped lint/format. Runtime and dependencies unchanged.
## Boundaries
No runtime/test/shared-hook/style/config/dependency/lockfile/workflow edits, no installs, services, Docker/Colima or remote writes. Do not invoke pnpm/npm/npx/corepack; global launchers can hang or auto-install. Use pinned Node with existing JS tool paths for scoped formatting/lint only. Controller handles build, types and browser proof after delivery.
## Scope
apps/docs/components/examples/bottom-sheet/basic.tsx
apps/docs/components/examples/bottom-sheet/labelled-without-title.tsx
apps/docs/content/docs/en/components/bottom-sheet.mdx
apps/docs/content/docs/pt-BR/components/bottom-sheet.mdx
tools/docgen/output/props.json
tools/docgen/output/llms.txt
Do not change anything outside this list; if the task requires it, stop and report.
## Expected evidence
Changed paths, actual commands/output, unverified checks. No claiming generated references done until owner generation actually ran; report controller step needed. No need new changeset: current BottomSheet patch changeset covers its documentation.
## Stop conditions
1. The code's shape contradicts the brief.
2. The same command fails twice for the same unexpected reason.
3. The fix needs edits beyond Scope or Boundaries.
For each acceptance criterion n, print an isolated line `BATUTA-PROGRESS <n> START` before the first edit toward it and `BATUTA-PROGRESS <n> DONE` when its proof passes locally. Plain text, nothing else on that line, no tool required.
