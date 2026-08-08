# Lot D3 — `lyraDateRangePicker`

Sits on top of `.batuta/brief-alpine-wave-d.md`. Read both in full before
writing anything. Work from the repo root; do not commit.

<task>
Port the DateRangePicker SHELL from
`packages/react/src/date-range-picker/date-range-picker.tsx`
(tests:
`packages/react/src/date-range-picker/date-range-picker.browser.test.tsx`).

Same pinned coordinator architecture as the shipped `lyraDatePicker`
(read `src/date-picker.ts` first and mirror its structure, composition
template, and matchMedia handling — this lot is its range sibling):
nested `lyraPopover`/`lyraBottomSheet` + `lyraCalendar({ range: true })`
chained by `x-modelable`/`x-model` to the picker's `selected` and
`open`. TWO composition laws from lot D2 (already visible in
`src/date-picker.ts`'s canonical JSDoc template — follow them exactly):
each nested component is wrapped in an ALIAS SCOPE
(`get/set pickerOpen`, `get/set pickerSelected`) because a same-name
`x-model` chain entangles the component with itself; and every
`<template x-if>` has exactly ONE root element.

Differences from lyraDatePicker (verified against the React source —
read it anyway; the source wins on any detail this list compresses):

- Options: `defaultValue` (`{ start, end }` of ISO strings), `locale`,
  `placeholder` (default `'Select period'`), `rangeSeparator` (default
  `' – '`), `incompleteRange` (default `'…'`).
- State: `selected` is the RANGE object `{ start, end }`
  (Date-or-string-or-null per bound — normalize each on read with the
  shared helper).
- Calendar `lyra:change` listener: a RANGE detail (object with
  `start`/`end`) — close ONLY when `end` is non-null (complete range);
  incomplete ranges keep the surface open. Single-date details are
  ignored. React parity: `onChange` fires at each bound — the chained
  x-model already propagates each bound; nothing extra to dispatch.
- `triggerText()`: no start → placeholder; with start →
`format(start) + rangeSeparator + (end ? format(end) : incompleteRange)`.
</task>

<scope>
May change ONLY:
- `packages/alpine/src/date-range-picker.ts` (new)
- `packages/alpine/src/date-range-picker.browser.test.ts` (new)
- `packages/alpine/src/index.ts` (registration + type surface if
  needed)
- `packages/alpine/package.json` (size-limit budget line only)
- `.changeset/alpine-lyra-date-range-picker.md` (new — one-paragraph
  minor changeset for `@lyra-ds/alpine`, mirroring the existing
  alpine changesets' style)
Do not change anything outside this list; if the task requires it,
stop and report.
</scope>

<acceptance_criteria>

1. `pnpm --filter @lyra-ds/alpine run typecheck` passes (or the direct
   `tsc` fallback; paste real output).
2. `pnpm exec prettier --check packages/alpine` passes (or direct
   fallback).
3. `src/date-range-picker.browser.test.ts` covers: picking only a
   START keeps the popover OPEN and renders
   `start + separator + incompleteRange` in the trigger; completing
   the range closes it and renders both bounds; restarting a range
   (third click) keeps it open again; placeholder before any
   selection; `defaultValue` seeds the trigger; the mobile sheet
   branch (state-forced `mobile`, per the D2 pattern) closes only on
   the complete range; `x-modelable` + `x-model` works BOTH directions
   on `selected`; axe clean.
4. `Alpine.plugin(lyra)` now registers `lyraDateRangePicker`; all
   existing suites pass unmodified.
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
