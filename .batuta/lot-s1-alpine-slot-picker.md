# Lot S1 — `lyraSlotPicker` (post-catalog promotion 2/3)

Sits on top of `.batuta/brief-alpine-wave-e.md` (shared wave brief; delta:
the package now has TWENTY-SIX bindings — waves B–F plus
recurrence-selector are merged; the current size budget is 16.73 kB; the
canonical select+x-for pattern binds `:selected` PER OPTION, never `:value`
on the select — see recurrence-selector's JSDoc). Read both files in full
before writing anything. Work from the repo root; do not commit.

<task>
Port the SlotPicker from `packages/react/src/slot-picker/slot-picker.tsx`
(tests: `slot-picker.browser.test.tsx`). A two-step, timezone-aware
public booking picker: calendar on the side (days with availability
carry a dot marker and everything else is disabled), slot pills for the
visible day, select → confirm, an optional temporary-hold countdown, and
an embedded time-zone picker. It COMPOSES the existing `lyraCalendar`
and `lyraTimeZonePicker` (both merged; the tzpicker was this
component's blocker until #156).

## `lyraSlotPicker`

- Options argument: `slots` (array of `{ start, end }` UTC ISO strings,
  default `[]`), `date` (visible local `YYYY-MM-DD`; modelable; default
  null → first day with slots), `timezone` (IANA; modelable; default
  `Intl.DateTimeFormat().resolvedOptions().timeZone`), `detectedZone`,
  `holdExpiresAt` (UTC ISO or null), `nextAvailableDate` (ISO),
  `loading` (boolean), `locale` (`'en-US'`), `min`/`max` (ISO, forwarded
  to the calendar), `labels` (merged over the React defaults),
  `tzLabels` (forwarded to the nested tzpicker).
- DECLARED TRANSLATION (JSON-safe labels): the React function labels
  become interpolated string templates — `availableTimes` →
  `'Available times for {date}'`, `nextAvailable` →
  `'Next available time: {date}.'`, `goToDate` → `'Go to {date}'`,
  `hold` → `'Reserved for {minutes}:{seconds}'` — using the existing
  `{key}` interpolation idiom (see recurrence-selector). Record the
  divergence in the changeset and JSDoc.
- Derived, exact port: `byDay()` — group slots by
  `Intl.DateTimeFormat('en-CA', { timeZone, year/month/day 2-digit })`
  of `start` (the en-CA trick yields `YYYY-MM-DD`; UTC slicing would
  mis-group around day boundaries — keep the React comment), each day
  sorted by start time; `firstDay()` (lexicographic min); `day()`
  (`date ?? firstDay`); `daySlots()`; `dayLabel()` (`longDate`: local
  noon → weekday long + day + month long in `locale`); `holdLeft()`
  (whole seconds until `holdExpiresAt`, floor ≥ 0, re-derived from a
  1-second reactive tick — interval started in `init()` only when
  `holdExpiresAt` is set, cleared in `destroy()`);
  `visibleTimeZone()` (label from the exported
  `TIME_ZONE_PICKER_ZONES` list, else the raw IANA id); `hasSlots(date)`
  (Date → local ISO via the existing `internal/date-utils.ts` `isoFrom`
  — do NOT re-implement) for the calendar's disabled/marker wiring.
- State: `selected` (the selected slot or null — internal; picking a
  DAY resets it), `tzOpen` (internal; the zone line shows label+change
  button, the change button reveals the nested tzpicker; picking a zone
  closes it back). Timezone changes and day changes are the two
  modelable states; interactive changes dispatch bubbling `lyra:change`
  with `detail: { date, timezone }`; confirming dispatches
  `lyra:confirm` with `detail: { slot }` (the plain `{ start, end }`).
  External x-model writes never dispatch.
- Composition (canonical JSDoc template MUST show all of it):
  - Nested `lyraCalendar` chained to the visible day through the
    ALIAS-SCOPE pattern (laws 10/11): calendar `selected` → picker
    `date` as ISO string; pass `min`/`max` and, through the x-data
    expression's access to the parent scope,
    `isDateDisabled: (d) => !hasSlots(d)`; the day-cell template's
    consumer marker slot renders `<span class="lyra-cal__dot">` gated
    by the parent's `hasSlots(date)`.
  - Nested `lyraTimeZonePicker` chained to `timezone` the same way
    (its `value` is a plain string — no serialization concern), with
    `detectedZone`, `locale` and `tzLabels` forwarded; shown only when
    `tzOpen` or when the consumer opts into always-open (React shows it
    permanently when `timezone` prop is undefined — translate as: shown
    when `tzOpen` is true; document that a consumer wanting the always-
    open variant serves the tzpicker without the toggle line).
  - Slot pills via `<template x-for>` over `daySlots()` (runtime list —
    same documented exception as file-upload): unselected = button
    `role="option"` `aria-selected="false"` showing
    `timeOf(start, timezone, locale)` (Intl 2-digit hour/minute in the
    active zone), click selects; selected = the pair span with a
    non-button `role="option" aria-selected="true"` time plus the
    confirm `lyra-btn` button dispatching `lyra:confirm`.
  - Main column has `aria-live="polite"`; states: `loading` → six
    `lyra-slotpicker__skeleton` spans with the loading aria-label;
    zero days at all → `fullMessage`; visible day empty → `emptyMessage`
    plus, when `nextAvailableDate` is set, the next-available sentence
    and (only when that day HAS slots) a go-to button that sets the day;
    otherwise day label + listbox + optional hold line (`x-show`
    `holdLeft() > 0`, re-rendering each tick).
  - Class names exactly as React emits: `lyra-slotpicker`, `__side`,
  `__tz`, `__main`, `__slots`, `__slot`, `__pair`, `__skeleton`,
  `__empty`, `__daylabel`, `__hold`, plus `lyra-cal__dot` and the
  `lyra-btn` variants on the buttons. Icons (globe, timer) are
  consumer markup slots.
  </task>

<scope>
May change ONLY:
- `packages/alpine/src/slot-picker.ts` (new)
- `packages/alpine/src/slot-picker.browser.test.ts` (new)
- `packages/alpine/src/index.ts` (registration + type surface if needed)
- `packages/alpine/package.json` (size-limit budget line only)
- `.changeset/alpine-lyra-slot-picker.md` (new — one-paragraph minor
  changeset for `@lyra-ds/alpine`, mirroring the existing style)
Do not change anything outside this list; if the task requires it, stop
and report.
</scope>

<acceptance_criteria>

1. `pnpm --filter @lyra-ds/alpine run typecheck` passes (or the direct
   `tsc` fallback; paste real output).
2. `pnpm exec prettier --check packages/alpine` passes (or direct
   fallback).
3. `src/slot-picker.browser.test.ts` uses the canonical template and
   covers: grouping — slots spanning a display-zone day boundary land on
   different days per zone (fix the zone via the `timezone` option, e.g.
   a 23:30Z slot under `America/Sao_Paulo` vs `Asia/Tokyo` — assert the
   en-CA day grouping, not UTC slicing); default visible day is the
   first day with slots; calendar shows dot markers ONLY on days with
   slots and other days are `aria-disabled`; picking an available
   calendar day switches the pill list, resets any selected slot, and
   dispatches `lyra:change` with `{ date, timezone }`; pill flow —
   click marks `aria-selected="true"` and reveals the confirm button,
   confirm dispatches `lyra:confirm` with the exact slot; times render
   in the ACTIVE zone and re-render when the zone changes through the
   nested tzpicker (which also closes the `tzOpen` reveal and
   dispatches); `x-modelable` + `x-model` both directions on `date` AND
   `timezone`; empty visible day shows `emptyMessage` and the
   go-to-next-available button (only when that day has slots) which
   navigates; zero slots anywhere shows `fullMessage`; `loading` shows
   six skeletons; hold countdown — with a `holdExpiresAt` ~90s out the
   line shows `1:29`-style text and advances on the 1s tick
   (`vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval',
'Date'] })` — NEVER bare `useFakeTimers()`, it deadlocks the flush
   helper), disappears at ≤ 0, and the interval is cleared on
   `destroy` (prove no further updates); axe clean with slots visible
   and in the empty state (run axe while options exist — a filtered-
   empty listbox violates aria-required-children; render the empty
   state WITHOUT the listbox element, as React does).
4. `Alpine.plugin(lyra)` now registers `lyraSlotPicker`; all existing
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
