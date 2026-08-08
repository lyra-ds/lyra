# Lot E1 — `lyraCombobox` + `internal/active-descendant.ts`

Sits on top of `.batuta/brief-alpine-wave-e.md`. Read both in full before
writing anything. Work from the repo root; do not commit.

<task>
Port the Combobox state machine from
`packages/react/src/combobox/combobox.tsx` (tests:
`combobox.browser.test.tsx` AND `combobox.v12.browser.test.tsx` — the v12
suite covers keywords/groups/hint/trailing). This is the wave's foundation:
lot E2 layers time-zone data over it and lot E3 shares the new helper.

## `internal/active-descendant.ts` (new shared helper)

Pure functions shared with the command palette (lot E3):

- `moveActiveIndex(key, current, count): number | null` — the clamped
  (NON-circular) navigation shared by both components: ArrowDown
  `min(current+1, count-1)`, ArrowUp `max(current-1, 0)`, Home `0`, End
  `count-1`; returns `null` for any other key or when `count === 0` (the
  caller preventDefaults only on a non-null result; Home/End handling is
  combobox-only — the palette passes a flag or filters keys itself, match
  the React sources).
- `scrollActiveIntoView(list: HTMLElement, option: HTMLElement | null)` —
  the exact React scroll logic: `offsetTop < scrollTop` → align top; option
  bottom beyond the visible band → align bottom; otherwise untouched.

## `lyraCombobox` (DATA-driven — options via `x-for` over `filtered()`)

Options are DATA passed to the factory (`options` array of
`{ value, label, hint?, group?, keywords? }` — the React `icon`/`trailing`
ReactNodes become consumer template slots; document that in the JSDoc
canonical template). Consumer serves the root (`lyra-combobox`), trigger
button, popup (`lyra-combobox__pop`) with search row + list, an empty-state
element, and ONE `<template x-for>` over `filtered()` whose child renders
the optional group heading (gated per the rule below) and the option
button. The JSDoc MUST include the canonical template.

- Options argument: `options` (default `[]`), `value` (initial selected
  value, ISO of the React `defaultValue`), `open` (default false),
  `placeholder` (`'Select…'`), `searchPlaceholder` (`'Search…'`),
  `emptyMessage` (`'No results.'`), `disabled` (false), `id` (optional —
  otherwise derive a stable unique base id in `init()`).
- State: `value` and `open` — both controllable, `x-modelable`-ready.
  Internal reactive: `query`, `activeIndex` (index into the FILTERED
  collection), plus the flip-placement side.
- Derived: `filtered()` — `{ option, index }` pairs keeping the ORIGINAL
  index, filtering with the exact React normalization (NFD, strip
  the combining range `/[\u0300-\u036f]/g`, `toLocaleLowerCase`) over `label` and `keywords`;
  `selected()` — the option matching `value`; `activeOptionId()` — from
  the ORIGINAL index of the active filtered entry.
- Named bindings: `trigger` (`type: 'button'`, `:id`, `:aria-haspopup`
  `'listbox'`, `:aria-expanded`, `:aria-controls` listbox id,
  `:disabled`, `:class` object for `lyra-input--error` only if you port
  the `error` option — see below; `@click` toggles `open`),
  `triggerValue` (`:class` object switching
  `lyra-combobox__value`/`lyra-combobox__placeholder`, `x-text` selected
  label or placeholder), `pop` (`x-show` on `open`, `:class` object for
  `lyra-combobox__pop--up` from flip placement), `search` (the input:
  `role="combobox"`, `:aria-expanded`, `:aria-controls`,
  `aria-autocomplete="list"`, `:aria-activedescendant`, `x-model`-free —
  bind `value` via `:value` + `@input` setting `query` and resetting
  `activeIndex` to 0, `@keydown` per below), `list` (`:id`, `role`
  `listbox`), `empty` (`x-show` when `filtered()` is empty).
- Per-item helpers for the `x-for` template: `optionId(index)` (original
  index), `optionClass(filteredIndex)` (object syntax, `--active`),
  `optionSelected(option)` (`'true'`/`'false'` for `:aria-selected`),
  `showGroup(filteredIndex)` (group present AND different from the
  previous filtered entry's group — presentational heading,
  `role="presentation"`), `pick(option)`, `setActive(filteredIndex)` (for
  `@mouseenter`). Option buttons: `type="button"`, `tabindex="-1"`,
  `role="option"`.
- Behavior, exact port: opening resets `query`/`activeIndex` and focuses
  the search input with `preventScroll: true` (through `$nextTick` +
  `whenVisible` — shared-brief lesson 2); outside `mousedown` closes
  (document listener only while open, torn down in `destroy()`); Escape
  and selection close AND return focus to the trigger; Enter picks the
  active option; ArrowUp/Down/Home/End via `moveActiveIndex` with
  preventDefault only when it acts; query change resets `activeIndex` to
  0; active change scrolls via `scrollActiveIntoView` (watch the active
  id, `$nextTick` first); `@mouseenter` sets active. Flip placement via
  `internal/flip-placement.ts` exactly as `src/dropdown.ts` does.
- Selection dispatches bubbling `lyra:change` with
  `detail: { value, option }`; external x-model writes to `value` do not
  dispatch.
- The React field wrapper (label/hint/error ids, `aria-describedby`) is
consumer markup: port only an optional `error` boolean option that adds
`lyra-input--error` on the trigger, and `:aria-describedby` via an
optional `describedBy` id option (`Unknown` in React — it derives ids;
here the consumer owns ids). Document the field-wrapper recipe in the
JSDoc.
</task>

<scope>
May change ONLY:
- `packages/alpine/src/internal/active-descendant.ts` (new)
- `packages/alpine/src/combobox.ts` (new)
- `packages/alpine/src/combobox.browser.test.ts` (new)
- `packages/alpine/src/index.ts` (registration + type surface if needed)
- `packages/alpine/package.json` (size-limit budget line only)
- `.changeset/alpine-lyra-combobox.md` (new — one-paragraph minor
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
3. `src/combobox.browser.test.ts` uses the canonical template fixture and
   mirrors the React suites' coverage: trigger toggles `aria-expanded` and
   reveals the pop with the search input focused (assert
   `document.activeElement` with `vi.waitFor`); DOM focus STAYS on the
   input while ArrowDown/Up move `aria-activedescendant` through option
   ids derived from ORIGINAL indices (assert the id strings and the
   `--active` class); filtering: query narrows by label AND keywords,
   diacritics-insensitive both ways (e.g. query `sao` matches label
   `São Paulo`), filtered ids keep original indices, query change resets
   the active descendant to the first result, empty query restores all;
   empty state shows `emptyMessage`; group headings render once per
   contiguous group and disappear when filtering removes the group;
   clamp at both ends (no wrap), Home/End; Enter picks the active option,
   click picks a clicked option, both set `value`, close the pop, return
   focus to the trigger and dispatch `lyra:change` with
   `{ value, option }`; Escape closes and restores trigger focus without
   dispatching; outside mousedown closes; `aria-selected` follows
   `value`; mouseenter moves the active descendant; a long list scrolls
   the active option into the visible band (force the geometry with a
   fixed-height list); external x-model write re-renders without
   dispatching (listener records); `x-modelable` + `x-model` works BOTH
   directions on `value` and on `open`; axe clean closed and open.
4. `Alpine.plugin(lyra)` now registers `lyraCombobox`; all existing
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
