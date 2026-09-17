You are the documentation worker already delegated by Batuta. Edit directly in this worktree; no orchestration/delegation/commits/config/services/validation.
# Alpine modal return destination — public documentation
## Goal
Make the four Alpine modal sections usable with the existing plugin and new returnFocusTo option, with current trigger/successor ownership accurately explained in both locale paths.
## Context
Read .batuta/specs/2026-09-09-alpine-return-focus-design.md and current packages/alpine/src/{dialog,drawer,bottom-sheet,command-palette}.ts read-only. The optional returnFocusTo: () => HTMLElement | null is initial factory configuration; resolver reads current application state at accepted close. Existing default plugin registers all four names; only option TYPES are root exports, never import factories. Current public Alpine snippets are static class skeletons and misleadingly claim consumers must implement focus/scroll/Escape that registered bindings already own. Replace these Alpine sections with real binding examples. Leave unrelated React/Blade content intact. New prose is English even in pt-BR; keep unrelated historical translations.
## Conventions
Pinned Node24.18.0/pnpm11.13.1, TypeScript5.9.3, React functional components, Vitest Browser Mode+SSR. CSS-first .lyra-* styling; no CSS changes. All project docs English. Tests-after profile, but write regression from acceptance first. Only read/edit/report in this worker: all execution/validation belongs to controller. No suppression/config changes even if Stop hooks request them.
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
1. All eight pages document Alpine accepted-close resolution once, eligible explicit target preferred with preventScroll:true, eligible captured opener fallback retaining ordinary focus/scroll behavior, no arbitrary body fallback, and application-provided meaningful successor when trigger disappears/becomes unsafe. Eligibility: same-document connected visible enabled focusable outside closing overlay/panel and hidden/inert/aria-hidden. Initial closed/opening/ignored request/exit/destroy do not resolve; inline CommandPalette ignores option. Synchronous resolver only reads state/refs; do not focus or mutate inside it. No development-warning claim for Alpine. State option configured at initialization, not mutable callback data. Proof: scoped content review against design.
2. Each Alpine section has a complete usable HTML binding composition with stable explicit invoking trigger plus a named tabindex=-1 successor outside overlay; resolver reads current availability. Use only registered lyraDialog/lyraDrawer/lyraBottomSheet/lyraCommandPalette with actual overlay/panel/close/title/search/list/empty bindings supported by that owner. Include normal plugin setup explanation referencing existing install, not CDN or framework setup. Resolver function supplied in x-data initial options may use Alpine refs in same consumer scope, or outer Alpine.data setup. Ensure closing controls work, required title/search labels exist, default overlay is hidden before enhancement (style=display:none consistent binding ownership), and generic composition is not described as portaled automatically. Do not invent destructive commands/network behavior. CommandPalette modal example can use empty groups/search/empty state to keep concise, hotkey:false to avoid docs shortcut conflict. Proof: controller extracts exact snippets, initializes built plugin, native pointer open/Escape returns to trigger or successor after removal, threeengines.
3. Only eight MDX files change. Keep React examples and generated StackApi wrappers, unrelated content and existing live-example paths unchanged. Can qualify generic React heading as React where Alpine-specific wording differs, but do not redesign pages. No new dependency/API/CSS/changeset. Proof: MDX compile, scopedformat, existing stack-contract tests, diffreview. All full V1/AT/packed qualification remains separate.
## Boundaries
No runtime/test/index/generatedcatalog/style/dependency/lock/config/WORK/.batuta changes. No package managers/tests/builds/git writes/hooks/ignores/services/remote/Docker/Colima. Do not invoke pnpm/npm/npx/corepack. Exact Node24 Prettier may format only listedMDXfiles. No validation commands.
## Scope
apps/docs/content/docs/en/components/dialog.mdx
apps/docs/content/docs/en/components/drawer.mdx
apps/docs/content/docs/en/components/bottom-sheet.mdx
apps/docs/content/docs/en/components/command-palette.mdx
apps/docs/content/docs/pt-BR/components/dialog.mdx
apps/docs/content/docs/pt-BR/components/drawer.mdx
apps/docs/content/docs/pt-BR/components/bottom-sheet.mdx
apps/docs/content/docs/pt-BR/components/command-palette.mdx
Do not change anything outside this list; if the task requires it, stop and report.
## Expected evidence
Report changed paths, actual commands, controller checks pending. For each acceptance criterion n, print an isolated line BATUTA-PROGRESS <n> START before edits and DONE only after its proof actually passes. Do not claim unrun validation. Controller owns runtime/native/generated verification.
## Stop conditions
Code contradicts brief; same unexpected command fails twice; fix needs outside scope. Preserve work/report, do not broaden.
