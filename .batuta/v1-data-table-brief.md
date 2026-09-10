You are the already delegated IMPLEMENTATION worker. Work only inside /Volumes/Home/francisross/Projects/lyra/lyra-v1-stabilization. Read/edit/report; do not delegate, use app-server/model discovery, start another planning workflow, run tests/builds/services or commit. Controller owns validation.
# DataTable semantic cell actions — high
## Goal
Remove the unsafe pointer-only onRowClick API and demonstrate its semantic replacement using existing ReactNode action cells, preserving the native table and all sorting/selection behavior.
## Context
Follow .batuta/specs/2026-09-10-data-table-semantic-actions-design.md (selected contract; technical review status recorded by controller before dispatch). Current owner packages/react/src/data-table/data-table.tsx has onRowClick declaration, destructured callback, tr listener and implicit hover. It already accepts opaque ReactNode cell values. Source baseline7eachengine passes but native15case proof confirms row pointer command has no native keyboard destination and cell click/Enter/preventDefault invokes both cell and row callback. Checkbox alone avoids rowcallback. No first-party call site passes onRowClick. Existing DataTableBasic is the actual consumer to migrate; same ID/registry.
Selected correction removes declared onRowClick and all Lyra-owned row-click behavior; no new rowAction API or cell wrapper. Assert default no-hover and explicit hover=true classes, and no implicit hover from retired callback. Keep hover as explicit visual bool, existing rootdiv/ref/native props, columns/rows, native table/thead/tbody/tr/td, sort/selection controlled/uncontrolled callbacks and checkbox propagation unchanged. ReactNode cell button/link is consumer-owned; native control semantics supply keyboard/pointer action. Never role=button/tabindex on tr, target filtering, deep child inspection, cloning, new dependencies/styles or a grid. Root consumer onClick remains native, not row-command API. Stale JS onRowClick callers are unsupported and may get React's normal unknown-event warning; no special legacy manager/shim solely to hide it.
Existing basic example retains three projects Atlas/Orbit/Nova, owners and Badge status values. Add Actions column with named native button per row, using existing Button presentation, tabIndex0 for native WebKit entry if needed. An accepted button visibly updates consumer-owned project details/status text below the table; no alert/modal/network/mock action. All three example actions are enabled; disabled/cancelled examples belong to focused tests. Use stable domain IDs, no inferred selected row command. Preserve existing sortable-selectable and loading examples unchanged.
Update general/React prose of both DataTable MDX pages in English; preserve frontmatter, Example IDs/registrations and entire Alpine/Blade StackPanel bodies byte-for-byte. Explain separate commands/selection/sort and manual onRowClick migration with explicit native control intent, stable identity and optional hover. Exactly one complete current TSX snippet per page, named exported ProjectTable with imports and real visible consumer effect; concise historical diff/text must not look like a supported current callback. Explain project pre1 unsafe-contract exception, earliest correction0.6.0 or stable1.0.0, manual migration and unchanged Styles/Alpine contract. Do not claim publication or Alpine DataTable runtime. Add React minor changeset only.
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
1. DataTable public Props and runtime no longer provide onRowClick or implicit hover; preserve native table/ref/styles/opaque cells and existing sorting/selection/loading/empty/footer semantics. Root+subpath declaration removal must satisfy controller types/public.tsx (two TS2344 on old declarations, current must pass). Controller source/browser/SSR and native actual consumer3engine proof checks Tab/ShiftTab/Enter/Space and pointer exactly once, native disabled/cancelled/link behavior, no command on row/plain cell/checkbox/header sort, identity after reorder/sort and controlled/uncontrolled selection. No supported-consumer console/page errors.
2. Add meaningful colocated browser/SSR regressions for native action cells and independence from sorting/selection, preserving all old coverage and both-theme axe. SSR contains real labelled controls and plain table rows, hydrates without mismatches. Keep arbitrary child nodes opaque and callbacks consumer-owned; no mock replacing DataTable/native event behavior. Include an isolated stale-JS-prop regression to prove a supplied retired callback no longer runs on row/cell interactions and no longer implies hover; controller swaps old source back to prove that regression RED. Public TS declaration still rejects the prop. Only the expected React unknown-event-property diagnostic may be explicitly accounted for in that isolated misuse test; no general console suppression or aliases. Controller runs all source tests3engines/SSR, type/build/public declarations/docgen and exact source/type negative proofs.
3. Existing DataTableBasic and both exact MDX current snippets execute meaningful actions. Preserve all outside-scope/protected sections/Example IDs and current public sorting/selection explanations. Controller native examples/snippets, pinned format/ESLint/stack/MDX/type/docgen checks and independent review pass. DataTable full existing standalone limit2250B unchanged (baseline1661B); no budget/dependency/style/Alpine/Blade edits. Final core/Alpine V1 qualification remains Task39.
## Boundaries
No tests/build/package-manager/install/gitwrites/docgen/remote/services/Colima/Docker/config/hook/memory/other agents. Only exact /Volumes/Home/francisross/.local/share/mise/installs/node/24.18.0/bin/node with existing scoped node_modules/prettier/bin/prettier.cjs may run for formatting. No changes outside Scope; generated docs are controller-only. No new public props/types/support files/classes/generic action API or speculative variants. No formatter edits to protected Alpine/Blade sections; report conflict.
## Scope
- packages/react/src/data-table/data-table.tsx
- packages/react/src/data-table/data-table.browser.test.tsx
- packages/react/src/data-table/data-table.ssr.test.ts
- apps/docs/components/examples/data-table/basic.tsx
- apps/docs/content/docs/en/components/data-table.mdx
- apps/docs/content/docs/pt-BR/components/data-table.mdx
- .changeset/data-table-semantic-actions.md
Controller-only owner-generated tools/docgen/output/props.json and tools/docgen/output/llms.txt.
Do not change anything outside this list; if the task requires it, stop and report.
## Expected evidence
List changed paths, regression names, actual commands/output and unrun checks. For each acceptance criterion n, print an isolated line `BATUTA-PROGRESS <n> START` before the first edit toward it and `BATUTA-PROGRESS <n> DONE` when its proof passes locally. Plain text, nothing else on that line, no tool required. Controller owns all validation; do not claim tests pass without execution.
## Stop conditions
1. The code's shape contradicts the brief.
2. The same command fails twice for the same unexpected reason (a red test just written is not that).
3. The fix needs edits beyond Scope or Boundaries.
Report concrete discrepancies without reopening approved planning or expanding scope.
