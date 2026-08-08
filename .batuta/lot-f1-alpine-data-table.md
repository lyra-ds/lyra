# Lot F1 — `lyraDataTable` (wave F — closes the PRD catalog)

Sits on top of `.batuta/brief-alpine-wave-e.md` (shared wave brief; delta:
the package now has TWENTY-FOUR bindings — waves B–E are merged, including
combobox/time-zone-picker/command-palette and `internal/active-descendant.ts`;
the current size budget is 13.9 kB). Read both files in full before writing
anything. Work from the repo root; do not commit.

<task>
Port the DataTable state machine from
`packages/react/src/data-table/data-table.tsx` (tests:
`data-table.browser.test.tsx`). Alpine translation is DOM-driven per the
PRD decision (2026-08-08, locked): the consumer serves the FULL `<table>`
server-side (headers, rows, checkboxes); the binding manages selection and
sort state only. React's loading skeletons, empty state, footer, density,
sticky and column styling are server-rendered consumer concerns — document
that in the JSDoc, do not port them.

## `lyraDataTable` (DOM-driven — reads `<tr data-row-id>` and `data-sort-key`)

- Options argument: `sorting` (`{ key, dir } | null`, default null),
  `selected` (array of string ids, default `[]`) — BOTH controllable and
  `x-modelable`-ready; `clientSort` (boolean, default false).
- Consumer contract (JSDoc MUST include the canonical template): each data
  `<tr>` carries `data-row-id` (string, unique, in the SERVED order);
  each sortable `<th>` carries `data-sort-key` and `x-bind="header"` with
  a `<button x-bind="sortButton">` inside; in clientSort mode each data
  `<td>` MAY carry `data-sort-value` on the cell, or the `<tr>` carries
  `data-sort-<key>` — pick ONE mechanism: `<td data-sort-value>` matched
  by column INDEX derived from the th's position (document precisely);
  missing value = null.
- Row ids come from `data-row-id` in the ORIGINAL served order, captured
  once in `init()` (`this.root` per lesson 1) — NEVER derived from the
  current (possibly sorted) DOM order; selection after a client sort must
  keep toggling the right rows (the React source comment records the bug).
- Named bindings:
  - `selectAll` — the header checkbox: `:checked` (all row ids selected,
    false when zero rows), `@change` (all → `[]`, otherwise all ids in
    ORIGINAL order), and IMPERATIVE `indeterminate` via `$watch` on the
    selection (some but not all selected) — set the property on the
    element, there is no attribute.
  - `rowCheckbox` — per-row checkbox: `:checked` from the row's
    `data-row-id` (read from `$el.closest('[data-row-id]')` — lesson 1:
    `$el` is the binding carrier), `@change` toggles that id,
    `@click.stop` so row-level click handlers never fire from the
    checkbox.
  - `row` — per data `<tr>`: `:class` OBJECT syntax for
    `lyra-table__row--selected` (server may pre-render it — must be
    removable).
  - `header` — per sortable `<th>`: `:aria-sort` returning
    `'ascending'`/`'descending'` when this th's `data-sort-key` is the
    active sort, undefined otherwise (undefined must REMOVE the
    attribute).
  - `sortButton` — `type: 'button'`, `:class` object for
    `lyra-table__sortbtn--active`, `@click` cycles the th's key:
    inactive → `{ key, dir: 'asc' }` → `desc` → `null` (exact React
    cycle).
- Helper for consumer templates: `sortDir(key)` returning
  `'asc' | 'desc' | null` (drives the consumer's sort-icon markup — the
  React SortIcon svg states become consumer slots gated by it; show the
  three variants in the JSDoc template).
- Events: interaction-driven changes dispatch bubbling `lyra:sort` with
  `detail: { sorting }` and `lyra:selection` with `detail: { selected } `;
  external x-model writes never dispatch.
- `clientSort: true` — after the cycle updates `sorting`, reorder the
  served `<tr>` elements inside their `<tbody>` via `insertBefore`:
  comparator is the exact React port —
  `localeCompare(..., undefined, { numeric: true, sensitivity: 'base' })`
  for strings, numeric subtraction when both parse as numbers is NOT in
  React (React only subtracts genuine numbers; DOM values are strings —
  document that data-sort-value is compared with localeCompare
  numeric:true, which handles numeric strings), nulls (missing
  attribute) LAST regardless of direction (`left == null → 1`,
  `right == null → -1`), `desc` = sorted ascending then reversed. When
  sorting becomes null, RESTORE the original served order (captured in
  `init()`). External x-model writes to `sorting` also re-sort in
  clientSort mode (watch), without dispatching.
- Default (server) mode: the binding never moves rows — it only manages
`aria-sort`/classes/events; the app re-renders via links/forms.
</task>

<scope>
May change ONLY:
- `packages/alpine/src/data-table.ts` (new)
- `packages/alpine/src/data-table.browser.test.ts` (new)
- `packages/alpine/src/index.ts` (registration + type surface if needed)
- `packages/alpine/package.json` (size-limit budget line only)
- `.changeset/alpine-lyra-data-table.md` (new — one-paragraph minor
  changeset for `@lyra-ds/alpine`, mirroring the existing style)
Do not change anything outside this list; if the task requires it, stop
and report.
</scope>

<acceptance_criteria>

1. `pnpm --filter @lyra-ds/alpine run typecheck` passes (or the direct
   `tsc` fallback; paste real output).
2. `pnpm exec prettier --check packages/alpine` passes (or direct
   fallback).
3. `src/data-table.browser.test.ts` uses the canonical template fixture
   (a real `<table class="lyra-table">` with `lyra-table__check`
   checkboxes, per the styles package) and mirrors the React suite's
   coverage adapted to the DOM-driven model: select-all checks all rows
   (ids in ORIGINAL order), unchecks all, and shows IMPERATIVE
   indeterminate when a subset is selected (assert the property, not an
   attribute); row checkbox toggles its id, sets/removes
   `lyra-table__row--selected` (object syntax removes a server-rendered
   instance), and `@click.stop` keeps a row click listener from firing;
   sort cycle on a header: asc (`aria-sort="ascending"`,
   `--active`) → desc → null (attribute REMOVED, class off), dispatching
   `lyra:sort` each step; a second column takes over from the first;
   server mode never reorders rows; `clientSort: true` reorders `<tr>`s
   by `data-sort-value` (numeric strings order numerically — '2' before
   '10'), missing values sort LAST in BOTH directions, desc reverses,
   and null sorting restores the ORIGINAL served order; selection made
   before a client sort still maps to the same rows after it; external
   x-model write to `sorting` re-sorts without dispatching;
   `x-modelable` + `x-model` both directions on `selected` AND on
   `sorting`; axe clean (selectable table, sorted and unsorted).
4. `Alpine.plugin(lyra)` now registers `lyraDataTable`; all existing
   suites pass unmodified.
5. size-limit budget updated per the shared brief's rule (or explicitly
   left for the maestro if pnpm is broken).
   </acceptance_criteria>

<compact_output_contract>
Report back, in order: files touched (paths only); commands run with
their REAL output; the measured size and new budget (or "left to
maestro"); any behavior detail where you diverged from the React source
and why; uncertainties declared as such. No test-result claims for
suites you cannot run.
</compact_output_contract>
