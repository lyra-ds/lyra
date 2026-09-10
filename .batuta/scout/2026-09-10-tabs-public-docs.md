# Tabs React public documentation scout

GLM5.3Flash98.43s,exit0,unchanged MAIN guard; frozen current pages/examples supplied during runtime retry.

<<<REPORT
## Answer

**Smallest scope = exactly 2 files, React docs only:** `apps/docs/content/docs/en/components/tabs.mdx` + pt-BR mirror. All new prose English in both locales. Zero example `.tsx` edits — both live examples already match the compound contract.

**Must update (en lines; pt mirrors same lines):**
1. Example `id="line"` prose (L14-16): delete "renders labels and empty panels only" → `TabsContent` mounts real opaque children in native div (`ref`/`style` passthrough). Keep `active` required/controlled + `onChange` wording. Add invalid-`active` behavior: no selected tab, no visible panel; Tab reaches first eligible trigger as recovery entry; parent still owns selection (no auto-select, no `onChange` echo).
2. Example `id="pills-and-counts"` prose (L20-21): bare `pills` → `variant="pills"`.
3. `## Accessibility` (L37-44):
   - L37-38: "generated empty `role=\"tabpanel\"`" → panels are `TabsContent` native divs, still `aria-labelledby` by tabs.
   - L39-42: add RTL; arrows/Home/End auto-activate among enabled+eligible tabs only (horizontal); native-consumer prevention vetoes; `onChange` fires on user interaction only — no echo when parent updates `active`.
   - L43-44: delete "does not render panel content".
   - Add: stable element IDs derived from trigger `value`; root `id` optional with SSR-safe generated fallback.
4. `## API and code` React panel (L49-51): `<StackApi stack="react" />` must table all four interfaces — `Tabs` (required `active`, `onChange?`, `variant: line|pills`, neutral root `ref`/`id`), `TabsList` (named native div, `role=tablist`, `className`, `ref`), `TabsTrigger` (`value`, `children`, `count`, `icon`, native button, `disabled`, `ref`, events), `TabsContent` (`value`, opaque mounted children, native div, `ref`, `style`). State: no namespace aliases, no `defaultValue`/uncontrolled, no `items` rendering; `TabItem` type retained. Add complete before/after migration snippet: old list-level `class`/`ref`/label → `TabsList`; manual mapping of placeholder entries to real `TabsContent` children. Add SemVer note: removing placeholder `items` API = explicit pre-1 project exception, earliest 0.6 or stable 1.0. No new live Example — keep the two existing Example IDs only.

**Must preserve (later adapter migration, untouched):**
- Full Alpine `StackPanel` incl. HTML snippet (en/pt L53-98): `lyra-tabs`/`lyra-tab`/`lyra-tab--active`/`lyra-tab__count` classes, index-based `-tab-N`/`-panel-N` ids, empty labelled tabpanels, prose L56. Correct as static-markup adapter contract even after React compound change.
- Blade `StackPanel` (L100-102) with unsupported status.
- `StackTabs` wrapper; frontmatter route/title/description; both `Example` ids.

**Stale claims found:** empty-panel claims en L15-16, L37-38, L43-44 (pt mirror); bare `pills` en/pt L20. Placeholder `items` API not text-visible on pages — lives behind `<StackApi stack="react"/>` PropsTables; verify/fix there.

**Validation hooks visible in pages:** `<Example id="line|pills-and-counts">` live-preview bindings (ids must stay), `<StackPanel stack="react|alpine|blade">` switcher, `<StackApi stack="...">` PropsTable hooks.

**Wording guard:** runtime in high retry — phrase all new behavior prose as contract/spec; no release-qualification or "all behaviors verified" claims.

**Styles floor:** correction to earliest 0.5.1 (or later combined release) belongs on a Styles page — not in frozen set, outside the two-page scope; see Uncertain.

## Files (path:line)

- apps/docs/content/docs/en/components/tabs.mdx:14-16 — stale empty-panel claim, Example line
- apps/docs/content/docs/en/components/tabs.mdx:20 — stale bare `pills`
- apps/docs/content/docs/en/components/tabs.mdx:37-38 — stale empty tabpanel a11y claim
- apps/docs/content/docs/en/components/tabs.mdx:39-42 — keyboard bullet: add RTL/veto/no-echo
- apps/docs/content/docs/en/components/tabs.mdx:43-44 — stale "does not render panel content"
- apps/docs/content/docs/en/components/tabs.mdx:49-51 — React StackApi hook: four interfaces + migration snippet + SemVer note
- apps/docs/content/docs/en/components/tabs.mdx:53-98 — Alpine HTML block, preserve
- apps/docs/content/docs/en/components/tabs.mdx:100-102 — Blade unsupported status, preserve
- apps/docs/content/docs/pt-BR/components/tabs.mdx:15-16,20-21,37-38,39-42,43-44,49-51 — mirror edits; 53-98,100-102 preserve
- apps/docs/components/examples/tabs/line.tsx:3,10-19 — conformant, no edit
- apps/docs/components/examples/tabs/pills-and-counts.tsx:3,10,12-24 — conformant (`variant="pills"`, `count`), no edit

## Evidence (minimal excerpts)

- en:15-16 "Tabs renders labels and empty panels only, so your application renders content."
- en:20 "Use `pills` when the control reads as a compact filter"
- en:37-38 "generated empty `role=\"tabpanel\"` elements are labelled by their tabs"
- en:43-44 "The component does not render panel content. Render that content yourself"
- en:50 `<StackApi stack=\"react\" />`
- en:56 "Tabs emits the tablist and its empty labelled panels. Application content is separate from this markup." (preserve — adapter-scoped)
- line.tsx:10 `<Tabs id=\"project-tabs\" active={active} onChange={setActive}>` — contract-conformant
- pills-and-counts.tsx:10 `variant=\"pills\"` — contract-conformant

## Uncertain (mandatory)

- PropsTables behind `<StackApi stack=\"react\"/>` not in frozen set: cannot confirm it currently shows `items`/`defaultValue`/namespace aliases, nor its file location/edit conventions beyond "existing MDX component conventions".
- Old placeholder-`items` syntax unknown from frozen pages — "before" half of migration snippet must mirror current PropsTables exactly; only "after" half fully specified above.
- Styles page stating current version floor not supplied; path unknown; whether its 0.5.1-floor correction sits beyond the two MDX pages unverifiable.
- `TabItem` current export shape/usages unverified; assumed retained as-is.
- "Native consumer prevention vetoes" interpreted as component-vetoed conflicting native behavior; exact phrasing needs runtime spec confirmation (high-retry runtime).
- pt-BR page receiving English new prose deviates from its locale pattern; instruction followed as given.
REPORT>>>

Controller disposition: React narrative and React StackPanel require migration; preserve exact Alpine and Blade panels in this separate React docs slice. Do not invent StackApi component-selector props or new MDX widgets: current root StackApi plus an explicit concise companion-parts table is sufficient. The known old items example is preserved in the selected design/baseline and supplies the before shape; no need to infer it from generated props. Full Alpine fallback documentation follows its actual runtime cycle. Existing language instruction explicitly requires new English prose in both locale files.
