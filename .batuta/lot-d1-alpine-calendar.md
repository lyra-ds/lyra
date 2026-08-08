# Lot D1 — `lyraCalendar` + `internal/date-utils.ts`

Sits on top of `.batuta/brief-alpine-wave-d.md`. Read both in full before
writing anything. Work from the repo root; do not commit.

<task>
Port the Calendar state machine from
`packages/react/src/calendar/calendar.tsx`
(tests: `packages/react/src/calendar/calendar.browser.test.tsx`). This is
the wave's largest lot; the wave-D pickers compose it next.

## `internal/date-utils.ts` (new shared helper)

Extract the pure date functions as EXACT ports: `dateFrom` (Date →
midnight local copy, NaN → null; ISO `YYYY-MM-DD` with rollover
validation → null on mismatch), `sameDay`, `dateKey`
(`Y-M-D` with the RAW month index — no padding, exactly like React),
`addMonths` (day clamped to the target month's last day). Also
`isoFrom(date)` → `YYYY-MM-DD` (zero-padded; new — the events need it).

## `lyraCalendar` (DATA-driven — cells via `x-for` over getters)

Consumer serves the container (`lyra-cal`, optional `--md`), the header
chrome, and `<template x-for>` blocks for weekday headings, day cells,
month cells, and year cells (the day-cell template may include a
consumer marker slot — the `renderDayMarker` translation; document it).
The lot's JSDoc MUST include the canonical template (weekdays via
`weekdays()`, days via `days()` with the helper calls below, month/year
grids gated by `x-if` on `mode`).

- Options: `range` (default false), `defaultValue` (ISO string or
  `{start,end}` of ISO strings), `min`/`max` (ISO), `disabledDates`
  (array of ISO strings; the functional `isDateDisabled` becomes this
  data option — record the translation) plus `isDateDisabled`
  (optional function for JS consumers; either may disable),
  `weekStartsOn` (0–6, default 0), `locale` (default `'en-US'`).
- State: `selected` — controllable, `x-modelable`-ready. Single mode:
  `Date | null`; range mode: `{ start: Date | null, end: Date | null }`.
  Normalize option input through `dateFrom`. Internal reactive: `view`
  (first-of-month Date), `mode` (`'days' | 'months' | 'years'`),
  `focusedDate` (Date).
- Derived getters for `x-for`: `days()` — the fixed 42-cell grid
  starting at the first day of the week containing the 1st
  (`weekStartsOn` shift, exact port); `months()` — 12 first-of-month
  dates of the view year; `years()` — 12 years from
  `Math.floor(view.getFullYear() / 12) * 12`; `weekdays()` — 7 heading
  entries with narrow + long labels (React's 2024-01 anchor trick).
- Intl formatters (5, exact port): month+year header, short month name,
  narrow weekday, long weekday, long date label. Built once per locale.
- Per-cell helper methods for the consumer template (binding objects
  cannot see `x-for` scope — same decision as file-upload):
  `dayClass(date)` returning the OBJECT for `:class`
  (`lyra-cal__day--out/--today/--selected/--in-range` — selected is
  start OR end; in-range strictly between), `dayDisabled(date)`
  (min/max/`disabledDates`/`isDateDisabled` — drives `:aria-disabled`,
  string `'true'` or false, NOT native disabled), `dayTabindex(date)`
  (0 only for the active date — the grid day matching `focusedDate`,
  else the grid's first cell), `dayLabel(date)`, `dayPressed(date)`
  (`'true'` or false), `dayKey(date)` (for `:data-key`),
  `selectDate(date)`, `onDayFocus(date)`, `onDayKeydown(event, date)`,
  `monthClass(month)`/`yearClass(year)` (`--selected` from the anchor),
  `pickMonth(date)`, `pickYear(year)`, `headerLabel()`,
  `prevLabel()`/`nextLabel()` (mode-dependent aria-labels from a
  `labels` option merged over the React English defaults).
- Named bindings for static chrome: `prev`/`next` (`type: 'button'`,
  `:aria-label`, `@click` navigate ±1 — months in days mode, years in
  months mode, ±12 years in years mode), `viewButton`
  (`type: 'button'`, static aria-label, `@click` days→months→years),
  `today` (`type: 'button'`, `@click` resets view to today's month and
  selects today).
- Selection, exact port: disabled → no-op. Single → `selected = date`.
  Range → no start or complete range → `{ start: date, end: null }`;
  otherwise `date < start` → `{ start: date, end: start }` else
  `{ start, end: date }`. Interaction-driven selection dispatches a
  bubbling `lyra:change` with
  `detail: { value }` where value is the ISO string (single) or
  `{ start, end }` of ISO-or-null (range) — use `isoFrom`; external
  x-model writes do not dispatch.
- Keyboard on day cells, exact port: arrows ±1/±7 days, Home/End to the
  week boundaries (`weekStartsOn` math), PageUp/PageDown ±1 month with
  day clamp; preventDefault on a match; move = set `focusedDate` +
  `view` to the target's month + focus the cell after re-render
  (pendingFocus by `data-key`, `$nextTick` + `whenVisible` per
  shared-brief lesson 2).
- `@focus` on a day cell updates `focusedDate` (roving follows real
focus).
</task>

<scope>
May change ONLY:
- `packages/alpine/src/internal/date-utils.ts` (new)
- `packages/alpine/src/calendar.ts` (new)
- `packages/alpine/src/calendar.browser.test.ts` (new)
- `packages/alpine/src/index.ts` (registration + type surface if needed)
- `packages/alpine/package.json` (size-limit budget line only)
- `.changeset/alpine-lyra-calendar.md` (new — one-paragraph minor
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
3. `src/calendar.browser.test.ts` uses the canonical template fixture
   and mirrors the React suite's coverage: 42-cell grid honouring
   `weekStartsOn` (assert the first cell's date for a month whose 1st
   is mid-week); `--out` on adjacent-month cells; `--today`; single
   select sets `--selected` + `aria-pressed` and dispatches
   `lyra:change` with the ISO detail; range flow start → incomplete →
   complete with `--in-range` strictly between, reorder when picking an
   earlier date, and restart after a complete range; min/max +
   `disabledDates` render `aria-disabled` cells that do not select;
   keyboard: all four arrows, Home/End week boundaries, PageUp/Down
   with end-of-month clamp (e.g. Jan 31 → Feb 28), focus follows to the
   NEW month's cell (assert `document.activeElement` via `data-key`
   with `vi.waitFor`); roving tabindex (exactly one cell at 0);
   months/years drill-down: viewButton cycles the mode, picking a month
   returns to days with the view moved, years grid shows the
   `floor/12` block; ISO defaultValue seeds selection and view;
   external x-model write re-renders without dispatching (listener
   records); `x-modelable` + `x-model` works BOTH directions on
   `selected`; axe clean in days, months, and years modes.
4. `Alpine.plugin(lyra)` now registers `lyraCalendar`; all existing
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
