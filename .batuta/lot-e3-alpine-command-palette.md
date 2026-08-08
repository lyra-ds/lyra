# Lot E3 — `lyraCommandPalette`

Sits on top of `.batuta/brief-alpine-wave-e.md`. Read both in full before
writing anything. Work from the repo root; do not commit. Lots E1/E2 are
already merged — `internal/active-descendant.ts` exists; REUSE it.

<task>
Port the CommandPalette state machine from
`packages/react/src/command-palette/command-palette.tsx` (tests:
`command-palette.browser.test.tsx`). It combines the dialog overlay
pattern (presence, focus trap, scroll lock, opener restore — like
`src/dialog.ts`) with the APG activedescendant search (like
`src/combobox.ts`) plus a global hotkey. The static `Trigger` button is
pure markup — document it in the JSDoc as a consumer recipe
(`lyra-cmdk-trigger` + inline svg + `lyra-kbd`), no binding needed beyond
`@click` on the consumer's side.

## `lyraCommandPalette` (DATA-driven — groups via `x-for`)

`groups` is data passed to the factory:
`{ label?, items: [{ id, label, hint?, shortcut? }] }` — the React `icon`
ReactNode becomes a consumer template slot; the React per-item `onSelect`
callback becomes the `lyra:select` event. Consumer serves the overlay
(`lyra-cmdk-overlay`), panel (`lyra-cmdk`) with search row, body, footer
hints, nested `<template x-for>` over `visibleGroups()` and over each
group's items. The JSDoc MUST include the canonical template (overlay
mode AND inline mode).

- Options argument: `groups` (default `[]`), `open` (default false,
  controllable/modelable; ignored in inline mode), `placeholder`
  (`'Type a command or search…'`), `emptyMessage` (`'No results for'`),
  `searchLabel` (`'Search commands'`), `hints` (merged over
  `{ navigate: 'navigate', select: 'select', close: 'close' }`), `hotkey`
  (`'k'`; falsy disables), `inline` (false), `label`
  (`'Command palette'` — the dialog's aria-label).
- Derived, exact port: filter items with lowercase `includes` over
  `label` and `hint` (NOT the NFD normalization — that is combobox-only);
  groups with zero matches are omitted; `flatItems()` numbers matched
  items across groups in visit order — that flat index is BOTH the active
  index space and the option id space (unlike combobox there is no
  original-vs-filtered split; ids follow the flat filtered order, exactly
  like React).
- Presence/overlay, exact port of the dialog pattern: `mounted` flag +
  `internal/presence.ts` (`--closing` on panel AND overlay,
  `animationend`), focus trap + scroll lock while open (not inline),
  opener captured at open and restored on close, overlay click closes
  only when `target === currentTarget`, Escape (on the input — the trap
  covers the rest) closes.
- Open sequence: capture opener, reset `query`/`activeIndex`, focus the
  input (rAF in React — use `$nextTick` + `whenVisible`, shared-brief
  lesson 2).
- Search input bindings: `role="combobox"`, `aria-expanded="true"`,
  `:aria-controls`, `aria-autocomplete="list"`,
  `:aria-activedescendant`, `:aria-label` from `searchLabel`, `:value` +
  `@input` (set query, reset activeIndex), `@keydown`: ArrowUp/Down via
  `moveActiveIndex` (clamped; NO Home/End — React handles only the
  arrows), Enter picks the active item, Escape closes; preventDefault
  exactly where React does.
- Items: `role="option"`, `type="button"`, `tabindex="-1"`,
  `:id` from flat index, `:aria-selected` true only for the ACTIVE item
  (exact React quirk — aria-selected tracks active, not a persistent
  selection), `--active` class object syntax, `@mouseenter` sets active,
  `@click` picks. Groups: `role="group"` with `aria-labelledby` only when
  the group has a label (`role="presentation"` is combobox; here labels
  are real group labels). Empty state: `emptyMessage + ' “' + query + '”.'`.
- Active option scrolls into view via
  `internal/active-descendant.ts#scrollActiveIntoView` (watch + $nextTick).
- Pick: dispatch bubbling `lyra:select` with `detail: { item }`, then
  close (overlay mode) — in inline mode dispatch without closing
  (React calls `onClose` unconditionally but inline consumers pass none;
  document this translation).
- Global hotkey (overlay mode only, `hotkey` truthy): document keydown
  listener registered in `init()` and removed in `destroy()`;
  `(meta || ctrl) && key.toLowerCase() === hotkey.toLowerCase()` →
  preventDefault, toggle open/closed.
- Named bindings for the static chrome: `overlay` (x-show on `mounted`,
`:class` object `--closing`, click guard, `animationend`), `panel`
(`:class` object `--closing`, `role="dialog"`, `aria-modal`,
`:aria-label` — all three omitted in inline mode), `search`, `list`
(`:id`, `role="listbox"`), `empty`, plus the per-item/per-group helper
methods for the `x-for` templates (ids, classes, labels, pick,
setActive, `groupLabelledby(group)`).
</task>

<scope>
May change ONLY:
- `packages/alpine/src/command-palette.ts` (new)
- `packages/alpine/src/command-palette.browser.test.ts` (new)
- `packages/alpine/src/index.ts` (registration + type surface if needed)
- `packages/alpine/package.json` (size-limit budget line only)
- `.changeset/alpine-lyra-command-palette.md` (new — one-paragraph minor
  changeset for `@lyra-ds/alpine`, mirroring the existing style)
Do not change anything outside this list; if the task requires it, stop
and report.
</scope>

<acceptance_criteria>

1. `pnpm --filter @lyra-ds/alpine run typecheck` passes (or the direct
   `tsc` fallback; paste real output).
2. `pnpm exec prettier --check packages/alpine` passes (or direct
   fallback).
3. `src/command-palette.browser.test.ts` uses the canonical template and
   mirrors the React suite's coverage: opening mounts the overlay+panel,
   focuses the input (assert `document.activeElement` with `vi.waitFor`),
   resets query/activeIndex, and traps focus (Tab cycles inside the
   panel); the opener regains focus after close (assert with
   `vi.waitFor`); scroll lock applies while open and releases after the
   exit animation; ArrowDown/Up move `aria-activedescendant` across GROUP
   BOUNDARIES through the flat index with clamp at both ends;
   `aria-selected` follows the active item; filtering matches label and
   hint case-insensitively, omits empty groups, resets the active item to
   the first match, and shows the quoted empty message; Enter and click
   dispatch `lyra:select` with the item and close; Escape closes without
   selecting; overlay click closes only on the overlay itself (a click
   inside the panel does not); the meta/ctrl+hotkey toggles open and
   closed (synthetic KeyboardEvent with `metaKey: true`,
   `cancelable: true`) and a custom `hotkey` option is honoured while the
   default no longer fires; the listener is removed on `destroy` (prove
   no further toggles); inline mode renders without overlay, trap,
   scroll lock, dialog role, or hotkey and still filters/navigates/picks
   (dispatch without closing); `x-modelable` + `x-model` both directions
   on `open`; axe clean open (overlay) and inline.
4. `Alpine.plugin(lyra)` now registers `lyraCommandPalette`; all existing
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
