# Lot C5 — `lyraFileManager`

Sits on top of `.batuta/brief-alpine-wave-c.md`. Read both in full before
writing anything. Work from the repo root; do not commit.

<task>
Port the FileManager SHELL state machine from
`packages/react/src/file-manager/file-manager.tsx`
(tests: `packages/react/src/file-manager/file-manager.browser.test.tsx`).

Alpine scope decision (PRD, closed): the Alpine binding is only the
shell — search filter, list/grid view toggle, empty state. Per-item
action menus are the consumer's markup reusing the shipped
`lyraDropdown`; breadcrumb navigation and open actions are consumer
links/forms; folder-before-file ordering is server-side. Record this in
the factory JSDoc.

Behavior contract (verified against the React source — read it anyway;
the source wins on any detail this list compresses):

- Options: `defaultView` (`'list' | 'grid'`, default `'list'`),
  `defaultQuery` (string, default `''`).
- State: `view` and `query` — BOTH controllable, `x-modelable`-ready.
- DOM-driven filtering WITHOUT re-render: the consumer serves BOTH
  trees (list `lyra-fm__list` and grid `lyra-fm__grid`), each item row/
  card carrying `data-name`. On every `query` change (a `$watch` +
  initial pass in `init`), for EVERY element with `data-name` inside
  the root: matches = `data-name` lowercased includes the lowercased
  trimmed query (empty query matches all); toggle the native `hidden`
  property/attribute on non-matches. Match count = matched elements of
  the CURRENTLY VISIBLE tree (they carry the same names — count from
  one tree by scoping the query to the visible container, or count
  distinct names; pick one and document it).
- Named bindings:
  - `search`: the toolbar `<input>` — `:value` = `query`, `@input`
    writes `query`.
  - `listButton` / `gridButton`: `type: 'button'`,
    `:aria-pressed` (`'true'`/`'false'`), `:class` OBJECT syntax for
    `lyra-fm__view--on` (server may render the active one — must be
    removable), `@click` sets `view`. View changes by interaction
    dispatch a bubbling `lyra:view` with `detail: { view }`; external
    x-model writes do not.
  - `list` / `grid`: `x-show` on `view === 'list'` / `'grid'`
    respectively (both trees stay in the DOM — no unmounting).
  - `empty`: `x-show` on `matchCount === 0` (the served
    `lyra-fm__empty` paragraph).
- The `role="group"`/`aria-label` on the view toggle and all other
static ARIA are served — not managed.
</task>

<scope>
May change ONLY:
- `packages/alpine/src/file-manager.ts` (new)
- `packages/alpine/src/file-manager.browser.test.ts` (new)
- `packages/alpine/src/index.ts` (registration + type surface if needed)
- `packages/alpine/package.json` (size-limit budget line only)
- `.changeset/alpine-lyra-file-manager.md` (new — one-paragraph minor
  changeset for `@lyra-ds/alpine`, mirroring the existing alpine
  changesets' style)
Do not change anything outside this list; if the task requires it, stop
and report.
</scope>

<acceptance_criteria>

1. `pnpm --filter @lyra-ds/alpine run typecheck` passes (or the direct
   `tsc` fallback; paste real output).
2. `pnpm exec prettier --check packages/alpine` passes (or direct
   fallback).
3. `src/file-manager.browser.test.ts` uses a served fixture (toolbar,
   both trees with ≥3 `data-name` items each incl. mixed case, empty
   paragraph) and covers: typing in search hides non-matching items in
   BOTH trees (case-insensitive) without removing them from the DOM;
   clearing the query restores all; a query matching nothing shows the
   empty state and hides it again on match; view buttons swap
   `aria-pressed`, the `--on` class (removing a server-rendered one),
   and which tree is visible; interaction dispatches `lyra:view`,
   external x-model write does not (listener records); `x-modelable` +
   `x-model` works BOTH directions on `view` AND `query`; axe clean in
   list and grid views.
4. `Alpine.plugin(lyra)` now registers `lyraFileManager`; all existing
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
