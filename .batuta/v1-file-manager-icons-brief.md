# file-manager icon optimization

## Goal
Replace FileManager private finite glyph usage of the global Icon registry with the exact existing Lucide glyphs, retaining all behavior and DOM contracts. Do not change the public Icon registry/API or custom action ReactNodes.
## Context
User explicitly approved implementing the two measured icon optimizations on2026-09-11. Active branchfeat/v1-incumbent-stabilization; baseline8376d8b. .batuta/v1-size-limit-evaluation.md records independently packed prototypes: FileManager9808→5654/9500B and WorkspaceSwitcher8364→2886/8250B. These are evidence, not an accepted implementation. Work only on this component. The other component follows as a separate task.
## Conventions
PinnedNode24.18.0/pnpm11.13.1, existing React/CSS-first conventions. English documentation. Existing lucide-react dependency only, no new dependencies/config/limits. Scope has no CSS or public API changes. Private decorative icon classes are stable consumer hooks.

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


## Acceptance criteria
1. Every existing private glyph (file-type mapping, toolbar, breadcrumb, share marker, default actions) remains identical in list/grid, including case-insensitive extensions and fallback. Exact SVG shapes, lyra-icon/lucide classes, decorative aria-hidden, dimensions/color and existing semantics remain. No new publicly exposed names/types. Controller checks original-versus-final actual SVG DOM and visual snapshots across three engines, both themes and supported states.
2. Scoped source/browser/SSR tests, types/lint/build/docgen and byte-identical emitted declarations; controller runs them. Add only meaningful behavior regression coverage if existing coverage misses the finite glyph contract. Test the behavior, never the mock. A failing test means fix the code, not the test. No test-only flags or branches in production code.
3. Packed standalone is below its unchanged cap and affected scenario shows measured savings; scope has no dead imports/unnecessary abstractions or generic new icon framework. React patch changeset describes avoided unused-icon loading.
## Boundaries
No other product component, global Icon/registry, generated file, package/lock/build config, styling, budgets, immutable baseline, Blade, experimental code, external config, resource/service, remote or release changes. No commits. No worker package-manager/build/test commands: controller owns sequential verification against the exact code.
## Scope
packages/react/src/file-manager/file-manager.tsx; packages/react/src/file-manager/file-manager.browser.test.tsx; packages/react/src/file-manager/file-manager.ssr.test.ts; .changeset/file-manager-private-icons.md. Do not change anything outside this list; if the task requires it, stop and report.
## Expected evidence
Files changed and why, actual checks run (none if deferred to controller), any unverified uncertainty. Keep change narrow. Existing test behavior/expectations must not be weakened.
## Stop conditions
Source shape contradicts brief, same unexpected failure twice, or edits beyond scope require stopping and reporting. Do not delegate nested workers. Work test-first from acceptance criteria; investigate cause before any fix, never silence a signal instead of fixing it. Report isolated BATUTA-PROGRESS n START before criterion work and DONE only if its proof actually passes; controller-owned checks remain pending.
