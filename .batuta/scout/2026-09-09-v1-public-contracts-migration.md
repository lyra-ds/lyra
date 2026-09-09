<<<REPORT
## Answer

- **CreateWorkspaceDialog**: consumers exist only in docs examples (2, both live). API shape `open?, onClose?, onCreate?, title?, slugPrefix?` (packages/react/src/create-workspace-dialog/create-workspace-dialog.tsx:8-15). No apps/site consumer. `onCreate` unused by both examples. Exported via packages/react/src/index.ts:82-83.
- **Tabs**: controlled API `items: TabItem[]` + `active: string` + `onChange?` + `variant?: 'line'|'pills'` (packages/react/src/tabs/tabs.tsx:16-25; TabItem at :5-11 = `id/label/count?/icon?`). 3 consumers: apps/site showcase (1) + docs examples (2, both live).
- **DataTable onRowClick**: definition-only — zero consumers in apps/docs examples, apps/site, or other packages/react/src files. Only data-table.tsx itself. All 4 live DataTable examples use other props (hover/sorting/selectable/loading).
- **Docgen**: `pnpm run docgen` (package.json:22 → `node tools/docgen/generate.mjs`). Reads built `packages/react/dist/*.d.ts` (index.d.ts skipped) + category ownership from `handoff/components/<category>/*.d.ts`; writes exactly `tools/docgen/output/llms.txt` + `tools/docgen/output/props.json`. `--check` mode verifies drift. Alpine/blade outputs are separate scripts (`pnpm run docgen:alpine` / `docgen:blade`, package.json:23-24).
- Path note: task said `apps/docs/src/components/examples`; actual location is `apps/docs/components/examples` (no `src/`).

## Files

- packages/react/src/create-workspace-dialog/create-workspace-dialog.tsx:8-15,31 — props + component
- packages/react/src/create-workspace-dialog/index.ts:1-2 — family export
- packages/react/src/index.ts:82-83 — barrel export
- packages/react/src/tabs/tabs.tsx:5-11,16-25,41 — TabItem, TabsProps, activeIndex clamp
- packages/react/src/data-table/data-table.tsx:88,164,235,322 — onRowClick definition + wiring
- apps/docs/components/examples/create-workspace-dialog/basic.tsx:12 — consumer
- apps/docs/components/examples/create-workspace-dialog/custom-copy.tsx:14-19 — consumer
- apps/docs/components/examples/tabs/line.tsx:17 — consumer
- apps/docs/components/examples/tabs/pills-and-counts.tsx:16 — consumer
- apps/site/components/sections/component-showcase.tsx:3,42-50 — Tabs consumer (only site hit)
- apps/docs/components/examples/index.ts:83-84,270-272,431-433,530-531 — live registry
- apps/docs/lib/components.ts:477,560-561 — docs component metadata
- MDX per family (en + pt-BR, 2 each): apps/docs/content/docs/en/components/create-workspace-dialog.mdx:13,18; apps/docs/content/docs/en/components/tabs.mdx:13,19; apps/docs/content/docs/en/components/data-table.mdx:13,18,23; pt-BR counterparts at apps/docs/content/docs/pt-BR/components/{create-workspace-dialog,tabs,data-table}.mdx
- tools/docgen/generate.mjs:20-22,94-108,139-141,170-174,310-313,285-304 — discovery, ownership map, outputs, check

## Evidence

CreateWorkspaceDialog shape (create-workspace-dialog.tsx:8-15):
```ts
export interface CreateWorkspaceDialogProps {
  open?: boolean; onClose?: () => void;
  onCreate?: (data: { name: string; slug: string }) => void;
  title?: string; slugPrefix?: string;
}
```
basic.tsx:12: `<CreateWorkspaceDialog open={open} onClose={() => setOpen(false)} />`
custom-copy.tsx:14-19: `open / onClose / title="Create a team space" / slugPrefix="teams.example/"`

Tabs API (tabs.tsx:16-25): `items: TabItem[]; active: string; onChange?: (id) => void; variant?: 'line' | 'pills'`
site consumer component-showcase.tsx:42-50: `items={[{id:'preview',label:...},{id:'code',label:...}]} active={tab} onChange={setTab}` (import line 3: `from '@lyra-ds/react'`)
line.tsx:17: `<Tabs id="project-tabs" items={items} active={active} onChange={setActive} />`
pills-and-counts.tsx:16: `<Tabs items={items} active={active} onChange={setActive} variant="pills" />` (items carry `count`)

onRowClick (data-table.tsx:88): `onRowClick?: (row: RowShape) => void;` — consumers rg over scoped dirs: 0 hits. Live DataTable examples instead use:
- basic.tsx:36 `<DataTable columns={columns} rows={rows} hover />`
- sortable-selectable.tsx:23-28 `columns/rows/sorting/onSortChange={setSorting}/selectable`
- loading.tsx:10 `<DataTable columns={columns} rows={[]} loading={3} selectable />`
- person-cell/in-data-table.tsx:22 `<DataTable columns={columns} rows={rows} />`

Docgen (generate.mjs:139-141): `for (const file of readdirSync(DIST).sort()) { if (!file.endsWith('.d.ts') || file === 'index.d.ts') continue;` — DIST = `packages/react/dist` (:20). Ownership map (:94-108): category from `handoff/components/<dir>/*.d.ts` filenames; owner name = pascalFromKebab of d.ts filename (:150); throws if exported `XProps` lacks exported owner `X` or no category (:166-174). Writes (:310-313): `writeFileSync(LLMS_FILE…); writeFileSync(PROPS_FILE…)` = `tools/docgen/output/{llms.txt, props.json}`. Drift check (:285-292): "run `pnpm run docgen` and commit the result". Output dir listing confirms generated artifacts: `llms.txt props.json alpine-llms.txt alpine-props.json blade-llms.txt` (alpine/blade from separate scripts).

Live-example registry (index.ts): create-workspace-dialog `basic` (:530) + `custom-copy` (:531); data-table `basic/sortable-selectable/loading` (:270-272); tabs `pills-and-counts` (:433) under `tabs:` family (:431) — each rendered by matching `<Example id=…>` in the MDX pages cited above.

## Uncertain

- `packages/react/dist` is a build artifact and did not resolve in this checkout; docgen may require `packages/react` build before regen (`pnpm run docgen` alone may fail if dist is absent). Verify with `pnpm --filter @lyra-ds/react build` before docgen — not run (read-only task).
- "ownership/index exports": docgen has no literal "ownership file" — interpreted as the handoff/components category map + filename→owner-name rule + barrel index.ts. Confirm intended meaning with controller.
- `onCreate` is defined and typed sync `(data: {name; slug}) => void`; no scoped consumer exercises it, so a migration changing its signature affects zero scoped call sites (docs prose in MDX may reference it — not checked beyond Example tags).
- pt-BR MDX Example tags assumed mirror en (same ids) — verified by file existence only, not per-line.
REPORT>>>
