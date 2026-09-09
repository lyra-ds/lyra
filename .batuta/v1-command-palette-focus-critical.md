# Critical completion — CommandPalette verification

## Goal
Complete the verified high-lane implementation by fixing the test readiness race and restoring the required missing-target diagnostic sentence in both API pages. No runtime change.

## Context
High/Codex gpt-5.6-terra delivered, then received one retry for incomplete tests/docs, missing effect dependency and formatting. Second verification: scoped Chromium/SSR30 pass, WebKit25/26; explicit mouse Escape case fails because the panel remains open, not because restored focus differs. All48 native complete interactions, build/types/lint/docgen/docs snippets/example6/format pass.
Controller traced CommandPalettePanel effect: it renders the panel and schedules input focus for requestAnimationFrame. The new tests waited only for panel existence before issuing keyboard Escape. A controlled external readiness probe holds frame callbacks after native mouse open: the panel exists, activeElement is body, and trusted Escape targets BODY without closing. Releasing frames yields focused INPUT; trusted Escape then closes and returns to the declared button. Exact .batuta/runs/v1-command-palette-focus/readiness.json in main checkout proves the race; runtime unchanged. Test actions must wait for the real input-focus precondition, not a sleep or forced focus. Sibling new Escape tests have the same panel-only readiness guard.
Both API pages currently explain invalid-target behavior but dropped the required development diagnostic during retry. Restore that contractual fact without expanding API documentation scope.

## Conventions
Batuta coordination only; English documentation; React TypeScript CSS-first existing classes, no style changes. Node24.18.0/pnpm11.13.1 repository; global pnpm differs and must not be invoked. Worktree high lane sequential; Conventional Commits controller-owned. Follow surrounding file naming/style. New .changeset entry uses React patch per 0.x additive version policy.

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
1. New keyboard-dismissal fixtures await actual combobox focus before sending keys; exact close/return assertions remain. Proof: readiness RED-before-release/GREEN-after-release probe, final Chromium/SSR30 and WebKit26 scoped suites.
2. Both API pages retain complete current-state successor examples and explicitly explain the development diagnostic for an invalid composition. Proof: diff review, Prettier and scoped docs/snippet typecheck.
3. Runtime/shared owner/examples/generated artifacts remain byte-identical to the successfully verified retry. Proof: SHA256 guard, final independent reviewer3/3 DONE; native48 and example6 still bind unchanged source/artifact.

## Boundaries
No production edit, deps/install, resource/Colima/Docker changes, test suppression, direct focus workaround in mouse activation, arbitrary delay, unrelated docs or remote/release operation. Controller is self/critical per Batuta escalation after one failed retry. No reset/discard of the verified implementation; preserve its diff and original logs.

## Scope
- packages/react/src/command-palette/command-palette.browser.test.tsx
- apps/docs/content/docs/en/components/command-palette.mdx
- apps/docs/content/docs/pt-BR/components/command-palette.mdx
Do not change anything outside this list; if the task requires it, stop and report.

## Expected evidence
Controller records precise source diagnosis, actual command exits and independent read-only review. For each acceptance criterion n, print an isolated line BATUTA-PROGRESS <n> START before editing toward it and DONE only when its proof passes locally.

## Stop conditions
1. The code shape contradicts the diagnosis.
2. The same unexpected command failure repeats twice.
3. A correction requires edits outside scope; re-evaluate before expanding.
