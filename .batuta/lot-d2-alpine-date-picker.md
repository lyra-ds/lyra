# Lot D2 — `lyraDatePicker`

Sits on top of `.batuta/brief-alpine-wave-d.md`. Read both in full before
writing anything. Work from the repo root; do not commit.

<task>
Port the DatePicker SHELL from
`packages/react/src/date-picker/date-picker.tsx`
(tests: `packages/react/src/date-picker/date-picker.browser.test.tsx`;
mobile switch: `packages/react/src/internal/picker-utils.ts`).

Architecture (pinned — do not redesign): the picker is a THIN
COORDINATOR. The surfaces are the SHIPPED components, nested by the
consumer in the markup and chained to the picker's scope with
`x-modelable` + `x-model`:

- Desktop branch, mounted via `<template x-if="!mobile">`: a
  `x-data="lyraPopover({...})" x-modelable="open" x-model="open"` region
  containing the trigger (the popover's own `trigger` binding) and the
  panel with a nested
  `x-data="lyraCalendar({...})" x-modelable="selected" x-model="selected"`
  region.
- Mobile branch, mounted via `<template x-if="mobile">`: a trigger
  button (`@click="open = true"`, styled like the desktop one) plus a
  `x-data="lyraBottomSheet()" x-modelable="open" x-model="open"` region
  whose body nests the same calendar markup (chained the same way).
  Only ONE branch is mounted at a time, so the duplicated calendar
  markup instantiates once.
- The picker JSDoc MUST include this canonical composition template.

Picker data (`lyraDatePicker`):

- Options: `defaultValue` (ISO `YYYY-MM-DD`), `locale` (default
  `'en-US'`), `placeholder` (default `'Select date'`).
- State: `selected` — controllable, `x-modelable`-ready (the SAME
  property the nested calendar chains to; remember the serialization
  finding — values may arrive as JSON datetime strings; normalize on
  read exactly like `calendar.ts` does with its `normalizeDay`; reuse
  the pattern, extracting to `internal/date-utils.ts` if that avoids
  duplication). `open` — controllable, `x-modelable`-ready. Internal
  `mobile` (boolean, default false — desktop-safe SSR default).
- `init()`: resolve `mobile` via
  `window.matchMedia('(max-width: 640px)')` — set from `matches` and
  attach a `change` listener (React's post-hydration timer becomes a
  plain post-init assignment); `destroy()` removes the listener. Also
  attach a root-level listener for the calendar's bubbling
  `lyra:change`: a SINGLE date selection (string detail, not a range
  object) closes the picker (`open = false`). Range details are
  ignored (React parity: `handleDateChange` returns on non-Date).
- Helpers for the consumer template: `triggerText()` — formatted
  selected date via `Intl.DateTimeFormat(locale)` or the placeholder;
  `hasSelection()` — for the `lyra-datepicker__ph` placeholder class
  toggle (`:class` object syntax).
- Binding `trigger` is NOT provided (the desktop trigger belongs to
the nested popover; the mobile trigger is one `@click`); document
this in the JSDoc.
</task>

<scope>
May change ONLY:
- `packages/alpine/src/date-picker.ts` (new)
- `packages/alpine/src/date-picker.browser.test.ts` (new)
- `packages/alpine/src/internal/date-utils.ts` (only if extracting the
  shared normalize helper)
- `packages/alpine/src/calendar.ts` (only the import swap if the
  helper moves to date-utils)
- `packages/alpine/src/index.ts` (registration + type surface if
  needed)
- `packages/alpine/package.json` (size-limit budget line only)
- `.changeset/alpine-lyra-date-picker.md` (new — one-paragraph minor
  changeset for `@lyra-ds/alpine`, mirroring the existing alpine
  changesets' style)
Do not change anything outside this list; if the task requires it,
stop and report.
</scope>

<acceptance_criteria>

1. `pnpm --filter @lyra-ds/alpine run typecheck` passes (or the direct
   `tsc` fallback; paste real output).
2. `pnpm exec prettier --check packages/alpine` passes (or direct
   fallback).
3. `src/date-picker.browser.test.ts` uses the canonical composition
   fixture and covers: desktop (default `mobile` false) — popover
   opens from its trigger, picking a day writes `selected`, updates
   `triggerText()` (assert the trigger's rendered text), and CLOSES
   the popover (wait for the transition to land, wave-D shared-brief
   lesson 9); placeholder text and class before any selection;
   `defaultValue` seeds the trigger text; mobile — force
   `mobile = true` through the component state (matchMedia itself is
   environment-driven; a boundary stub of `window.matchMedia`
   installed before init is acceptable, mocking the component is not),
   sheet opens from the mobile trigger, picking a day closes it and
   focus returns to the opener (the nested bottom-sheet's own
   machinery — assert it still works through the chain);
   `x-modelable` + `x-model` works BOTH directions on `selected` AND
   `open` (accepting the serialized-string reality on `selected`);
   axe clean closed and open.
4. `Alpine.plugin(lyra)` now registers `lyraDatePicker`; all existing
   suites pass unmodified.
5. size-limit budget updated per the shared brief's rule (or
   explicitly left for the maestro if pnpm is broken).
   </acceptance_criteria>

<compact_output_contract>
Report back, in order: files touched (paths only); commands run with
their REAL output; the measured size and new budget (or "left to
maestro"); any behavior detail where you diverged from the React
source and why; uncertainties declared as such. No test-result claims
for suites you cannot run.
</compact_output_contract>
