# Lote 09-1b — Onda 1b: DataTable + PersonCell, ActionBar, delta do SidebarGroup

Sits on top of `.batuta/brief-fase8-waves.md` — read it first, in full,
including the addendum.

<task>
Three new components plus a two-line delta to an existing one:
1. `DataTable` — handoff/components/data/DataTable.{d.ts,jsx,prompt.md}.
2. `PersonCell` — NO reference .jsx exists; its contract is in
   handoff/llms.txt (search "PersonCell") and its CSS is already in
   packages/styles (data.css). Compose the existing `Avatar` + two lines.
3. `ActionBar` — handoff/components/layout/ActionBar.*.
4. `SidebarGroup` delta — handoff/components/navigation/SidebarGroup.jsx
   changed in v1.1: `title?: string` on `SidebarGroupItem` and
   `title={item.title}` on the item button (native tooltip for the future
   AppSidebar rail). Apply to the existing component + its test.
</task>

## Pinned traps (from .batuta/handoff-v1.2-map.md — read its DataTable/i18n

sections too)

- DataTable COEXISTS with the existing `Table` and does NOT use it internally:
  it renders its own `<table>`, sharing only `.lyra-*` classes, wrapped in
  `.lyra-table-scroll` (needed for maxHeight + sticky). Do not refactor Table.
  One reconciliation decision is already made: DataTable adopts the repo's
  `.lyra-table__primary` on the first cell (repo convention wins over the
  handoff's omission) — note it in the JSDoc.
- i18n: the handoff hardcodes pt-BR ("Selecionar tudo", "Nenhum registro.",
  ActionBar's "selecionados"). ALL become translatable props with English
  defaults, following the existing labels-prop convention.
- DataTable selection state (controlled/uncontrolled), sorting and empty
  state per the reference .jsx; keyboard/a11y semantics per the .prompt.md.
- ActionBar's entry keyframe was corrected in 09-0 (transform-only) — do not
  reintroduce opacity; the CSS is final, consume it.

## Acceptance criteria

1. The three components match their contracts; SidebarGroup delta applied
   with its test updated (title tooltip asserted via `expect.element` +
   attribute check).
2. No hardcoded user-visible strings.
3. Browser tests: DataTable composed real shape (columns + rows + selection +
   sort + empty state), light+dark axe clean; ActionBar appears/announces
   selection count; PersonCell renders Avatar + name/meta. SSR tests per
   convention.
4. All offline gates green; docgen 59 → 62 with the guard bumped; changeset
   minor naming the three components + the SidebarGroup addition.
5. Report the final docgen count for the maestro's landing-stats follow-up.

## Stop conditions

A `.lyra-*` class missing from styles; the llms.txt PersonCell contract
ambiguous beyond reconstruction; same command failing twice.

<default_follow_through_policy>
Proceed without asking questions. Every decision within this contract is
yours; implement end to end and report per the shared brief's report
contract.
</default_follow_through_policy>

## RETRY FEEDBACK (verification failure — fix exactly these two)

1. Test defect (the failing test was never run in your sandbox): in
   data-table.browser.test.tsx:115 the locator
   `getByRole('checkbox', { name: 'Select row' })` is ambiguous — it matches
   every data row. Scope the click through its row
   (`getByRole('row', …).getByRole('checkbox')`) or an equivalent
   unambiguous locator.
2. The ambiguity exposes a real a11y defect the handoff also has: every row
   checkbox carries the SAME accessible name, so screen-reader users cannot
   tell rows apart. Change `labels.selectRow` to
   `string | ((row: RowShape) => string)` — plain string stays the default
   (`'Select row'`, faithful to the contract), the function form derives a
   per-row name; JSDoc documents the recommendation with an example. Add one
   browser test asserting distinct accessible names when the function form is
   used.

Re-run offline gates; the maestro reruns the browser suite.
