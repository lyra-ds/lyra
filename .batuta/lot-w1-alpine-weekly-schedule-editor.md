# Lot W1 — `lyraWeeklyScheduleEditor` (post-catalog promotion 3/3)

Sits on top of `.batuta/brief-alpine-wave-e.md` (shared wave brief; delta:
the package now has TWENTY-SEVEN bindings — waves B–F plus
recurrence-selector and slot-picker are merged; the current size budget is
17.5 kB). Read both files in full before writing anything. Work from the
repo root; do not commit.

<task>
Port the WeeklyScheduleEditor from
`packages/react/src/weekly-schedule-editor/weekly-schedule-editor.tsx`
(tests: `weekly-schedule-editor.browser.test.tsx`). Seven weekday rows,
each a switch plus a list of local time ranges with inline validation, a
copy-to-other-days popover, and an optional date-exception section. It
COMPOSES existing bindings: `lyraTimeInput` (range fields),
`lyraPopover` (copy menu) and `lyraDatePicker` (adding an exception) —
all nested through the ALIAS-SCOPE pattern (laws 10/11).

## `lyraWeeklyScheduleEditor`

- Options argument: `value` (a `WeeklySchedule` = `Record<0..6,
TimeRange[]>` merged over the empty schedule; modelable),
  `exceptions` (array of `{ date, ranges }`; modelable),
  `defaultRange` (`{ start: '09:00', end: '17:00' }`), `weekStartsOn`
  (0–6, default 1), `showExceptions` (default true), `labels` (merged
  over the React defaults).
- DECLARED TRANSLATION (JSON-safe labels): every React function label
  becomes an interpolated `{key}` template — `copyToOtherDays` →
  `'Copy {day} to other days'`, `copyFrom` → `'Copy {day} to…'`,
  `startTime` → `'{day} — start'`, `endTime` → `'{day} — end'`,
  `formatDate` and `formatRanges` STAY functions with the React English
  defaults (they format data, not sentences; JSON consumers get the
  defaults). Same idiom as recurrence-selector/slot-picker; record it
  in the changeset and JSDoc.
- Derived, exact port: `order()` — the seven weekday indices rotated by
  `weekStartsOn`; `rangesFor(day)`; `enabled(day)` (`ranges.length > 0`);
  `invalid(range)` (both fields set AND `minutes(end) <= minutes(start)`
  — port `minutes()`); `nextRange(ranges)` (start = last range's end
  else `defaultRange.start`; end = `'23:59'` when start >= `'22:00'`,
  else start's hour + 2 clamped to 23, keeping start's minutes, both
  zero-padded — exact port); `dayLabel(day)`; `exceptionText(exception)`
  (formatted ranges or the all-day label).
- Mutations, exact port: switch on → `[{ ...defaultRange }]`, off →
  `[]`; add interval appends `nextRange`; remove interval (only offered
  when more than one range) filters by index; start/end writes update
  that index only and IGNORE a null time (the React `time &&` guard);
  copy applies a DEEP copy of the source day's ranges to every picked
  target day in one schedule update; adding an exception inserts
  `{ date, ranges: [] }` only when that ISO date is not already present
  and keeps the list sorted by `date.localeCompare`; removing filters by
  index.
- Every interaction-driven change dispatches bubbling `lyra:change`
  with `detail: { value }` for the schedule and `lyra:exceptions` with
  `detail: { exceptions }`; external x-model writes never dispatch.
- Copy menu: a per-row `lyraPopover` (nested, alias-scoped `open`)
  whose picked-days set is component state keyed by the source day —
  opening RESETS the picks (React resets on open), the Apply button is
  disabled while nothing is picked, and applying copies then closes the
  popover. The trigger renders only for enabled days.
- Markup model: the consumer serves the seven rows via
`<template x-for="day in order()">` (each row a single root — law 12
applies to x-for too, proven in slot-picker), with per-item helper
methods (binding objects cannot see x-for scope). Inside a row, the
ranges list is a nested `x-for` over `rangesFor(day)` — again ONE
root per item, holding the range fields, the remove button and the
inline error. Nested `lyraTimeInput` instances are chained to
`range.start` / `range.end` through alias scopes calling
`setRangeStart(day, index, value)` / `setRangeEnd(day, index, value)`.
Class names exactly as React emits: `lyra-sched`, `__row`,
`__daycell`, `__ranges`, `__range`, `__dash`, `__ghostbtn`,
`__addrange`, `__error`, `__off`, `__actions`, `__copy`,
`__copy-title`, `__exc`, `__exc-row`, `__exc-date`, plus
`lyra-switch`/`lyra-check-row`/`lyra-checkbox`/`lyra-btn`/`lyra-label`
on the composed controls. Icons are consumer markup slots.
The JSDoc MUST include the full canonical template.
</task>

<scope>
May change ONLY:
- `packages/alpine/src/weekly-schedule-editor.ts` (new)
- `packages/alpine/src/weekly-schedule-editor.browser.test.ts` (new)
- `packages/alpine/src/index.ts` (registration + type surface if needed)
- `packages/alpine/package.json` (size-limit budget line only)
- `.changeset/alpine-lyra-weekly-schedule-editor.md` (new — one-paragraph
  minor changeset for `@lyra-ds/alpine`, mirroring the existing style)
Do not change anything outside this list; if the task requires it, stop
and report.
</scope>

<acceptance_criteria>

1. `pnpm --filter @lyra-ds/alpine run typecheck` passes (or the direct
   `tsc` fallback; paste real output).
2. `pnpm exec prettier --check packages/alpine` passes (or direct
   fallback).
3. `src/weekly-schedule-editor.browser.test.ts` uses the canonical
   template and covers: seven rows in `weekStartsOn` order (default
   Monday first; assert the first row's label); a disabled day shows the
   unavailable text and no ranges; switching a day ON seeds exactly the
   `defaultRange` and dispatches `lyra:change`; add interval appends the
   computed next range (assert the arithmetic: 09:00–17:00 → next is
   17:00–19:00; a 22:30 start yields 23:59) and the remove button
   appears only from the second range on, removing the right index;
   editing start/end through the nested `lyraTimeInput` writes only that
   range and a null (cleared) time is IGNORED; an inverted range renders
   the inline error and marks the end field invalid, without corrupting
   state; copy menu — opens with an empty pick set even after a previous
   run, lists the six other weekdays, Apply is disabled until a day is
   picked, applying deep-copies the ranges to the picked days (mutating
   the source afterwards must NOT affect a target — assert
   independence) and closes the popover; exceptions — the nested
   `lyraDatePicker` adds `{ date, ranges: [] }` sorted by date,
   refuses a duplicate date, renders the all-day text for empty ranges
   and the formatted list otherwise, and removing one filters the right
   entry, each dispatching `lyra:exceptions`; `showExceptions: false`
   omits the section; `x-modelable` + `x-model` both directions on
   `value` AND `exceptions`, with external writes not dispatching and
   the payloads surviving `JSON.parse(JSON.stringify(...))` unchanged;
   axe clean with a mix of enabled/disabled days and with the copy
   popover open.
4. `Alpine.plugin(lyra)` now registers `lyraWeeklyScheduleEditor`; all
   existing suites pass unmodified.
5. size-limit budget updated per the shared brief's rule (or explicitly
   left for the maestro if pnpm is broken).
   </acceptance_criteria>

<fixture_laws>
Paid for in the slot-picker lot — ignoring these costs a round:

- x-data option strings in fixtures use SINGLE quotes only; a
  `JSON.stringify` payload inside a double-quoted attribute truncates the
  expression and the resulting syntax error kills the whole component
  (every child then reports "X is not defined").
- `<template x-if>` AND `<template x-for>` mount exactly ONE root
  element each. Sibling branches need a single wrapper; when a wrapper
  would change the CSS layout, give it `display: contents`.
- Assert every x-show transition with `vi.waitFor` on real visibility;
  never assert mere existence of an x-show-gated element.
- Run axe only with the listbox/group populated — an empty one is an
  `aria-required-children` violation by itself.
  </fixture_laws>

<compact_output_contract>
Report back, in order: files touched (paths only); commands run with
their REAL output; the measured size and new budget (or "left to
maestro"); any behavior detail where you diverged from the React source
and why; uncertainties declared as such. No test-result claims for
suites you cannot run.
</compact_output_contract>
