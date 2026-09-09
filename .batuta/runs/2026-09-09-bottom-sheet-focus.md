# Run — BottomSheet return focus

**Date:** 2026-09-09 · **Lane:** react/high · **Executor:** Codex gpt-5.6-terra/high
**Commit:** pending · **Verdict:** ✅ approved

## Brief
# BottomSheet return focus — high / React — Codex gpt-5.6-terra
You are the implementation executor, not the Batuta conductor. Implement directly in this already isolated stabilization worktree. Do not delegate, invoke Batuta orchestration, create a worktree, or change git metadata. The controller owns orchestration, verification and commits. The two node_modules symlinks are controller-provided verification infrastructure, not user dirt; preserve them. Existing .batuta raw evidence is controller-owned.

## Goal
Integrate BottomSheet with the existing approved modal return-focus contract, closing the two proven WebKit opener-return failures without introducing another focus owner.
## Context
Current HEAD fe9b302. BottomSheet owns a private openerRef and blindly focuses its captured HTMLElement. Real WebKit pointer activation can leave body as activeElement. Existing BottomSheet tests at lines 160 and 251 fail returning focus; previous raw baseline is .batuta/runs/v1-webkit-tab/baseline-bottom-sheet.log. Dialog, Drawer and CommandPalette already expose optional returnFocusTo and use internal/use-return-focus.ts. Read those precedents and .batuta/specs/2026-09-08-modal-return-focus-design.md. The user authorized continued incumbent stabilization through completion. BottomSheet's accessible-name union must remain intact. Shared hook is already verified and is read-only. No Superpowers workflow.
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
1. Optional returnFocusTo uses the existing shared owner, resolves latest committed logical target once only on accepted open-to-closed, never leaks as DOM prop or resolves on SSR. Explicit resolver works under StrictMode and keyboard fallback remains compatible. Proof: focused browser and SSR tests plus source review.
2. Unprepared pointer activation returns exact trigger on Escape, close button and backdrop. Refuse ignored close requests; exclude closing panel/overlay targets; a rapid accepted close/reopen captures the fresh opener and resolves once each cycle. Proof: focused browser cases; controller runs real Playwright Chromium/WebKit. No pre-focusing pointer triggers, no assertion weakening, no timing sleeps.
3. Existing 12 browser cases and accessible-name typing remain valid. Public JSDoc describes resolver and fallback honestly. Add patch changeset. Proof: focused suites, tsc, eslint, prettier.
## Boundaries
Do not alter shared hooks, styles, dependencies, configs, lockfile, generated docs, existing unrelated tests, or experimental artifacts. No git commit, install, Docker/Colima, service operations, remote writes. Docs examples/API pages follow as a separately scoped task. Do not widen nested dismissal or initial-focus behavior here.
## Scope
packages/react/src/bottom-sheet/bottom-sheet.tsx
packages/react/src/bottom-sheet/bottom-sheet.browser.test.tsx
packages/react/src/bottom-sheet/bottom-sheet.ssr.test.ts
.changeset/bottom-sheet-return-focus.md
Do not change anything outside this list; if the task requires it, stop and report.
## Expected evidence
Report changed paths, actual commands/output, and unverified criteria. Browser command: node ../../node_modules/vitest/vitest.mjs run --project 'browser (chromium)' --project ssr src/bottom-sheet/ from packages/react. Browser sandbox bind restrictions are known: report rather than invent green. Dependencies may be supplied via existing workspace symlinks by controller.
## Stop conditions
1. The code's shape contradicts the brief.
2. The same command fails twice for the same unexpected reason (a red test the executor just wrote is not that).
3. The fix needs edits beyond Scope or Boundaries.
For each acceptance criterion n, print an isolated line `BATUTA-PROGRESS <n> START` before the first edit toward it and `BATUTA-PROGRESS <n> DONE` when its proof passes locally. Plain text, nothing else on that line, no tool required.

## Executor report
Implemented BottomSheet return-focus integration; no commit made.

Changed:

- `bottom-sheet.tsx`: adds `returnFocusTo`, uses shared `useReturnFocus`, and supplies panel/overlay refs.
- Browser/SSR regression coverage for explicit pointer return, ignored close, rapid reopen, StrictMode, SSR non-resolution, and invalid panel/overlay targets.
- Added `.changeset/bottom-sheet-return-focus.md`.

Verified:

- TypeScript: passed.
- ESLint: passed.
- Prettier: passed.
- `git diff --check`: passed.

Unverified: focused Vitest browser/SSR command cannot start in this sandbox because Vite cannot create `packages/react/node_modules/.vite-temp/...` (`EPERM`). No tests were discovered or run. `BATUTA-PROGRESS` criteria remain without `DONE` because browser proof is pending controller execution.

I left the controller-owned `WORK.md` and `.batuta` changes untouched.

## Retry report
Applied the bounded correction without touching runtime ownership or committing.

- Migrated `BottomSheetHarness` to stable trigger-ref `returnFocusTo`.
- Added latest-committed-resolver regression coverage.
- Clarified public `returnFocusTo` JSDoc.

Validation passed:

- `tsc --noEmit`
- ESLint scoped to BottomSheet files
- Prettier check
- `git diff --check`

Focused SSR/browser tests remain unverified: Vitest hit sandbox `EPERM` while writing Vite’s temporary config, and I did not retry it.

## Verification
# BottomSheet return-focus verification — 2026-09-09

Approved bounded runtime/API integration. Implementation commit: pending. The shared owner is unchanged; BottomSheet now exposes optional returnFocusTo, supplies panel/overlay exclusions and captures from its panel ownerDocument. Accessible-name union preserved. First-party docs/examples follow as Task2.

Controller final checks: native StrictMode Chromium151.0.7922.34/WebKit26.5 pointer paths6/6; focused Chromium/SSR24; WebKit21; types/lint/format all PASS. Original source2638dd4209517a558a8328a7d28a210f77be50003e6da4d0c4750caa0a8ce4aa fails all six exact-trigger native cases; final sourcef6e73dec37b1a2ed382226faa2989f90ba6991a48caeed427de94989e3fb5182 passes. No pointer pre-focus or relaxed assertions. Tests cover ignored requests, rapid fresh capture, latest resolver, StrictMode, invalid closing targets and SSR non-resolution.

Two medium setup attempts misinterpreted worker role and tried orchestration; no product changes. High/Codex gpt-5.6-terra then implemented directly. Its global pnpm checks hung; controller terminated only the identified child checks, preserving foreign processes/configuration. Actual static checks eventually passed through direct tool paths. First controller verification: Chromium/SSR23 and native6 pass, WebKit18/20 retains unmigrated original invoking-harness failures. One high retry migrated its real trigger composition, added latest-resolver coverage and clarified JSDoc. Final controller checks above pass. No critical product-code completion.

Independent OpenCode opencode/glm-5.3-flash:3/3 DONE, findings none, exit0, exact status/diff/four-file guard unchanged, Batuta verifier PASS. Report required markers present on first round. Scope and test hygiene PASS. Raw runs are .batuta/runs/v1-bottom-sheet-focus/ in this checkout; review raw/guards/verifier in main checkout .batuta/runs/2026-09-09-bottom-sheet-focus-review/.

The separate exploratory full repository-policy baseline had2 obsolete freeze failures plus2 pnpm environment-launcher failures; these are pending maintenance work, not a green full suite. The focused freeze proof confirms both fail independently. No dependency updates installed, no Colima/Docker/service configuration/foreign cleanup/remote/release actions. Full packed Firefox/Linux qualification, remaining P1/modal contracts and all23acceptance cells remain open.
