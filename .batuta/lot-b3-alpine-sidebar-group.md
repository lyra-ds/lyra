# Lot B3 — `lyraSidebarGroup`

Sits on top of `.batuta/brief-alpine-wave-b.md`. Read both in full before
writing anything. Work from the repo root; do not commit.

<task>
Port the SidebarGroup disclosure state machine from
`packages/react/src/sidebar-group/sidebar-group.tsx`
(tests: `packages/react/src/sidebar-group/sidebar-group.browser.test.tsx`).

Behavior contract (verified against the React source — read it anyway; the
source wins on any detail this list compresses):

- Options: `defaultCollapsed` (boolean, default false).
- State: `collapsed` — controllable, `x-modelable`-ready. In the Alpine
  model a group is collapsible exactly when the consumer wires the
  `label` binding onto a button; a non-collapsible group simply uses no
  bindings (record this as the porting decision — React's `collapsible`
  prop has no Alpine equivalent).
- Named bindings:
  - `root`: `:class` OBJECT syntax for `lyra-sbgroup--collapsed`
    (shared-brief lesson 5 — the server may render it and the component
    must remove it on expand). Base class `lyra-sbgroup` is served.
  - `label`: the disclosure button (`lyra-sbgroup__label
lyra-sbgroup__label--btn` served) — `type: 'button'`,
    `:aria-expanded` = `!collapsed` (string values `'true'`/`'false'`),
    `@click` toggles `collapsed`.
  - `item`: `type: 'button'`, `@click` dispatches a bubbling
    `lyra:select` custom event with `detail: { id }` where `id` comes
    from the element's `data-id` attribute (`$el.dataset.id ?? ''`).
    React parity: the per-item and group-level callbacks collapse into
    this one event; active state (`--active`, `aria-current="page"`) is
    server-rendered by the consumer, not managed here.
- Items unmount when collapsed: document in the factory JSDoc that the
consumer wraps `.lyra-sbgroup__items` in `<template
x-if="!collapsed">` (React parity: items are unmounted, not hidden).
The binding set does not need an `items` binding.
</task>

<scope>
May change ONLY:
- `packages/alpine/src/sidebar-group.ts` (new)
- `packages/alpine/src/sidebar-group.browser.test.ts` (new)
- `packages/alpine/src/index.ts` (registration + type surface if needed)
- `packages/alpine/package.json` (size-limit budget line only)
- `.changeset/alpine-lyra-sidebar-group.md` (new — one-paragraph minor
  changeset for `@lyra-ds/alpine`, mirroring the existing alpine
  changesets' style)
Do not change anything outside this list; if the task requires it, stop
and report.
</scope>

<acceptance_criteria>

1. `pnpm --filter @lyra-ds/alpine run typecheck` passes (paste real
   output).
2. `pnpm exec prettier --check packages/alpine` passes.
3. `src/sidebar-group.browser.test.ts` uses a fixture with the served
   markup shape (root, label button, `<template x-if>` items with
   `data-id`) and covers: `defaultCollapsed` seeds the state;
   toggling flips `aria-expanded`, the `--collapsed` class (including
   REMOVING a server-rendered `--collapsed`), and mounts/unmounts the
   items via the template; item click dispatches `lyra:select` with the
   right `detail.id`; `x-modelable` + `x-model` works BOTH directions
   on `collapsed`; axe clean expanded and collapsed.
4. `Alpine.plugin(lyra)` now registers `lyraSidebarGroup`; all existing
   suites pass unmodified.
5. size-limit budget updated per the shared brief's rule.
   </acceptance_criteria>

<compact_output_contract>
Report back, in order: files touched (paths only); commands run with
their REAL output (typecheck, prettier, size-limit); the measured size
and new budget; any behavior detail where you diverged from the React
source and why; uncertainties declared as such. No test-result claims
for suites you cannot run.
</compact_output_contract>
