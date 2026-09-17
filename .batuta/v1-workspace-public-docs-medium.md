You are the documentation implementation worker already delegated by Batuta. Edit directly; no further delegation/orchestration/worktrees/package managers/hooks/config/ignores/services/commits.
# WorkspaceSwitcher public documentation — medium
## Goal
Bring the two existing public component pages into agreement with verified React/Alpine behavior. Correct old first/last opening, Create-as-option claims and the misleading Alpine creation sample.
## Context
Current verified source: React/Alpine always focus selected workspace on opening when available. React fallback first; Alpine no-served-selection ArrowDown first/ArrowUp last. React Create is a native button OUTSIDE an inner labelled listbox, within the visual .lyra-wssw__pop. Roving workspace arrows/Home/End exclude Create; native Tab reaches Create, Shift+Tab returns to roving option; forward exit or backward-to-trigger closes. No-create Tab exits; empty-create entry focuses Create and empty-create backward exits/closes; entirely empty keeps trigger and Escape closes. onCreate remains the same consumer effect, never onChange. Existing root onKeyDown executes before cancelable keyboard defaults; click cancellation is a pending separate runtime fix, do not promise it here.
Both MDX pages currently say onCreate adds an option; popup labelled by trigger (actually Workspaces label); first/last opening; all Tab closes. Their Alpine code is static .lyra markup without actual x-data/x-bind/data-id and incorrectly includes a Create role=option. Alpine has no create binding/event; keep the example strictly a workspace selector, consumer owns served aria-selected and handles lyra:change {id}. Existing bindings: x-data="lyraWorkspaceSwitcher()" on root; x-bind="trigger" on trigger, x-bind="popover" on listbox, x-bind="option" and data-id on workspace buttons. Trigger/listbox IDs and label are consumer-served. Preserve the existing Atlas/Northstar content/classes; add explicit trigger tabindex0 for native keyboard eligibility. No invented creation event, new binding/API or claimed React-equivalent creation support.
## Conventions
All NEW/UPDATED documentation prose must be English, including changes in the pt-BR path, per user rule. Do not translate unrelated old sections. Preserve frontmatter/Example IDs/StackTabs/StackApi/Blade blocks and existing page structure. No runtime/tests/generated docs changes. Current pinnedNode24.18.0/pnpm11.13.1. Follow existing MDX/HTML formatting.
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
1. React creation explanation and accessibility text accurately describe selected entry, actual Workspaces label and separate command with native Tab/Shift+Tab, Escape and unchanged consumer effects. Existing inaccurate first/last/create-option sentences removed in both languages; no general click-cancellation promise. Proof: controller scoped text/source comparison and MDX compilation/format.
2. Alpine subsection explicitly limits support to consumer-served workspace selection, no creation binding/event. Its example becomes an actual supported selector with the existing4bindings/data-id/consumer ARIA; omit the misleading create option/separator and do not replace it with a fictitious Lyra action. Served aria-selected stays consumer-owned; selection emits lyra:change with activated data-id, closes/restores trigger. Two snippets must be byte-identical; new prose English. Proof: controller exact snippet native3engine checks, source contract comparison and MDX compilation.
3. Exactly2MDX files only. Preserve all unrelated prose/content/component IDs and no API/CSS/dependency/generated/config changes. No changeset for documentation-only follow-up (runtime changeset already records migration). Proof: scoped diff and formatter; controller owns checks.
## Boundaries
No source/examples/tests/styles/generated output/WORK/.batuta/dependencies/exports/config/hooks/settings/ignores including .impeccable changes. No package managers/validation commands/Colima/Docker/foreign services/remote action/commits/git writes including stash/pop/reset/restore/checkout or further delegation. Scoped formatting only exception below.
## Scope
apps/docs/content/docs/en/components/workspace-switcher.mdx
apps/docs/content/docs/pt-BR/components/workspace-switcher.mdx
Do not change anything outside this list; if the task requires it, stop and report.
## Expected evidence
Only read/edit/report; controller owns validation. Scoped formatting allowed with pinned /Volumes/Home/francisross/.local/share/mise/installs/node/24.18.0/bin/node node_modules/prettier/bin/prettier.cjs --write and only the2scoped MDX paths. Report exact files/content changed, actual command output, unverified items. For each acceptance criterion n, print an isolated line `BATUTA-PROGRESS <n> START` before the first edit toward it and `BATUTA-PROGRESS <n> DONE` when its proof passes locally. Plain text, nothing else on that line, no tool required. Do not print DONE for pending controller proof.
## Stop conditions
Code/docs shape contradicts brief. Same command fails twice unexpectedly. Changes beyond scope or a new public binding/API appear required. Stop/report; do not modify configuration/suppressions or invent unsupported behavior.

## Escalation feedback — precise prose only
Low initial/retry passed all controller proofs; independent review accepted3criteria but found two low ambiguities. Change only the2existing accessibility bullets in BOTH scoped MDX pages: opening keys prefer selected workspace/fallback first when any workspaces exist, empty-list with onCreate focuses Create, entirely empty retains trigger. Explicitly prefix the onChange(id, workspace) bullet with In React. Preserve all other current edits/snippet bytes. Scoped pinned formatting allowed. No tests/config/git writes. Report only; controller verifies.
