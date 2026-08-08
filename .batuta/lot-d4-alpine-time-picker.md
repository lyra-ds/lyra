# Lot D4 — `lyraTimePicker`

Sits on top of `.batuta/brief-alpine-wave-d.md`. Read both in full before
writing anything. Work from the repo root; do not commit.

<task>
Port the TimePicker from
`packages/react/src/time-picker/time-picker.tsx`
(tests: `packages/react/src/time-picker/time-picker.browser.test.tsx`).

Same pinned coordinator architecture as the shipped `lyraDatePicker`
(read `src/date-picker.ts` first — mirror its matchMedia handling,
surface composition with nested `lyraPopover`/`lyraBottomSheet`, the
ALIAS-SCOPE chains for `open`, and the single-root `x-if` law). The
difference: no nested calendar — the option LIST belongs to the picker
itself, rendered by the consumer with `x-for` over the picker's
`options()`.

Behavior contract (verified against the React source — read it anyway;
the source wins on any detail this list compresses):

- Options: `defaultValue` (`HH:mm`), `step` (minutes, default 30 —
  non-finite/≤0 falls back to 30, floored), `min` (default `'00:00'`),
  `max` (default `'23:59'`), `locale` (default `'en-US'`),
  `placeholder` (default `'Select time'`).
- State: `selected` (`HH:mm | null`) and `open` — both controllable,
  `x-modelable`-ready. Standalone helpers ported exactly: strict
  2-digit `minutesFromTime`, padded `timeFromMinutes` (do NOT import
  from time-input — it keeps its own private copies; note this in the
  changeset only if asked).
- `options()`: generated `min → max` inclusive stepping by `step`;
  invalid min/max fall back to 0 / 23:59; `min > max` → empty list.
- `formatTime(time)`: `Intl.DateTimeFormat(locale, { hour: '2-digit',
minute: '2-digit', hourCycle: 'h23' })` over a year-2000 anchor
  date; invalid input returned verbatim.
- `triggerText()` / `hasSelection()` like the date picker.
- `pick(time)`: sets `selected`, closes (`open = false`).
- List keyboard (`list` binding: `role="listbox"`, `:aria-label`
  option, `tabindex: '-1'`, `@keydown`): ArrowDown/ArrowUp CLAMP at
  the edges (NOT circular — deliberate divergence from dropdown),
  Home/End; navigation is relative to `document.activeElement` among
  the list's `[role="option"]` buttons; preventDefault on a match.
- Per-option template calls (documented in the JSDoc canonical
  template): `:class` object with `lyra-timelist__item--selected`,
  `:aria-selected` (`'true'` or false — removed when not selected),
  `@click="pick(time)"`, `x-text="formatTime(time)"`,
  `type="button"`, `role="option"`.
- Scroll on open: `$watch('open')` + `$nextTick` + `whenVisible` on
  the list element (query it from the root), then
  `list.scrollTop = max(0, selectedOption.offsetTop - 84)` where
  selectedOption is the `[aria-selected="true"]` item (exact port).
- The `lyra:change`-listener close used by the date pickers does not
apply here — `pick` closes directly. Selection SHOULD dispatch a
bubbling `lyra:change` with `detail: { value }` (`HH:mm`) on
interaction only (translation of React's `onChange`).
</task>

<scope>
May change ONLY:
- `packages/alpine/src/time-picker.ts` (new)
- `packages/alpine/src/time-picker.browser.test.ts` (new)
- `packages/alpine/src/index.ts` (registration + type surface if
  needed)
- `packages/alpine/package.json` (size-limit budget line only)
- `.changeset/alpine-lyra-time-picker.md` (new — one-paragraph minor
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
3. `src/time-picker.browser.test.ts` covers: option generation
   honours step/min/max (assert first/last/count for a small window),
   `min > max` renders an empty list, invalid step falls back to 30;
   desktop popover opens, picking an option writes `selected`,
   dispatches `lyra:change`, updates the trigger text (h23 format) and
   closes; the selected option scrolls into view on open (FORCE the
   geometry: a tall list with the selected option deep enough that
   `offsetTop - 84 > 0`, assert `scrollTop` — use `vi.waitFor`);
   arrows CLAMP at both edges (assert the first/last option keeps
   focus — the deliberate non-circular divergence), Home/End;
   mobile sheet branch closes on pick (presence finalized with a
   synthetic `animationend`, asserting the OVERLAY's display — see
   the D3 suite); external x-model write does not dispatch (listener
   records); `x-modelable` + `x-model` works BOTH directions on
   `selected` AND `open`; axe clean open and closed.
4. `Alpine.plugin(lyra)` now registers `lyraTimePicker`; all existing
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
