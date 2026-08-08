# Lot R1 — `lyraRecurrenceSelector` + `describeRecurrence` (post-catalog promotion)

Sits on top of `.batuta/brief-alpine-wave-e.md` (shared wave brief; delta:
the package now has TWENTY-FIVE bindings — waves B–F are merged, including
data-table; the current size budget is 14.75 kB). Read both files in full
before writing anything. Work from the repo root; do not commit.

<task>
Port the RecurrenceSelector from
`packages/react/src/recurrence-selector/recurrence-selector.tsx` (tests:
`recurrence-selector.browser.test.tsx`). The PRD promoted it now that
`lyraDatePicker` exists: an RRULE-subset editor with native controls
(selects, number inputs, weekday toggle buttons), JSON state, and a live
natural-language summary. It COMPOSES the existing `lyraDatePicker` for
the date-bounded end (nested component — shared-brief laws 10 and 11
apply: the x-model channel serializes Dates, and chaining a modelable
needs the alias-scope pattern from the date-picker JSDoc).

## `describeRecurrence` (exported utility)

Exact port of the React function and its whole-sentence template system
(never concatenate fragments — word order lives in the labels):
`toDate` (`'YYYY-MM-DD'` string → local NOON via `+ 'T12:00:00'`, Date
passthrough), `ordinalWeekday`, `interpolate('{key}')`, the full
`DEFAULT_LABELS` table VERBATIM (all 13 sentence templates, presets,
control labels, `formatWeekdays` via `Intl.ListFormat`, `formatOrdinal`
english ordinals, `formatDate`), and the freq × interval × end template
selection. Export the function, the label defaults, and the types
(`RecurrenceRule`, `RecurrenceEnd`, labels interface) from the module;
surface them in `src/index.ts` like `TIME_ZONE_PICKER_ZONES` is.

DECLARED TRANSLATION (JSON-safe labels): the React `conflicts` label is
a function `(count) => sentence`. Port it as TWO whole-sentence string
templates instead — `conflictsOne` and `conflictsMany` with `{count}` —
with the React English sentences as defaults; record the divergence in
the changeset and JSDoc. All other function labels (`formatWeekdays`,
`formatOrdinal`, `formatDate`) stay functions with the English defaults
— JS consumers can override them; JSON consumers get the defaults.

## `lyraRecurrenceSelector`

- Options argument: `value` (a `RecurrenceRule` or null → NONE_RULE;
  controllable, `x-modelable`-ready — hold `end.date` as an ISO
  `YYYY-MM-DD` STRING or null, never a Date instance, so the state is
  JSON/entangle-safe; normalize any incoming Date on read per law 10),
  `startDate` (ISO string or Date; default today), `defaultEndCount`,
  `conflicts` (array of `{ date, reason? }`), `labels` (merged over the
  defaults).
- Internal reactive: `custom` (boolean). Derived, exact port: `presets()`
  (none / weekly / biweekly / monthly built from the start weekday and
  `defaultEnd`), `matchedPreset()` (freq + interval + sorted byWeekday
  string equality), `selectedValue()` (`custom` flag wins, else matched
  id, else `'custom'`), `showCustom()`
  (`custom || (!matchedPreset && freq !== 'none')`), `summary()` (
  `describeRecurrence(value, start, labels)`), `conflictsText()`.
- Behavior, exact port: preset select `@change` — `'custom'` sets the
  flag and, if freq is none, seeds a weekly rule on the start weekday;
  a preset id clears the flag and REPLACES the rule with the preset's;
  interval input clamps `Math.max(1, Number || 1)`; frequency select
  swaps weekly/monthly keeping the rest; weekday toggle NEVER empties
  the set (removing the last selected day is a no-op); end select maps
  never/count/date exactly (count seeds `end.count ?? defaultEndCount
?? 8`, date seeds `end.date ?? null`); count input clamps ≥1; the
  weekday group renders only for non-monthly rules; count input and
  date picker render only for their end types.
- Every interaction-driven rule change dispatches bubbling `lyra:change`
  with `detail: { value }` (the plain JSON rule); external x-model
  writes never dispatch.
- Markup model: consumer serves the controls with named bindings —
  `presetSelect`, `customSection` (x-show), `intervalInput`,
  `freqSelect`, `weekdayGroup` (`role="group"`, `:aria-label`),
  `endSelect`, `countInput`, `countSuffix`, `summary` (x-text,
  `aria-live="polite"`), `conflictsNote` (x-show + x-text,
  `role="status"`). Weekday buttons via `<template x-for>` over
  `weekdayEntries()` (index + short label) with per-item helpers
  (`dayPressed(index)` `'true'`/`'false'`, `dayClass(index)` object
  syntax for `lyra-recur__day--on`, `toggleDay(index)`,
  `type="button"`). Preset/freq/end `<option>` elements are consumer
  markup fed by helper label methods (or `x-for` over
  `presetEntries()` — pick one and show it in the canonical template).
  Class names come from the React output: `lyra-recur`,
  `lyra-recur__custom`, `__freqrow`, `__days`, `__day`, `__day--on`,
  `__endrow`, `__enddate`, `__summary`, plus `lyra-input` /
  `lyra-select-wrap` on the controls.
- End-date picker: the canonical template nests
`x-data="lyraDatePicker({ ... })"` inside `lyra-recur__enddate` with
`min` = startDate and the placeholder label, chained to the rule's
`end.date` through the ALIAS-SCOPE pattern (law 11 — copy the
date-picker JSDoc's wrapper), converting picker writes to the ISO
string stored in the rule (law 10) and dispatching `lyra:change`.
The JSDoc MUST include the full canonical template.
</task>

<scope>
May change ONLY:
- `packages/alpine/src/recurrence-selector.ts` (new)
- `packages/alpine/src/recurrence-selector.browser.test.ts` (new)
- `packages/alpine/src/index.ts` (registration + type surface if needed)
- `packages/alpine/package.json` (size-limit budget line only)
- `.changeset/alpine-lyra-recurrence-selector.md` (new — one-paragraph
  minor changeset for `@lyra-ds/alpine`, mirroring the existing style)
Do not change anything outside this list; if the task requires it, stop
and report.
</scope>

<acceptance_criteria>

1. `pnpm --filter @lyra-ds/alpine run typecheck` passes (or the direct
   `tsc` fallback; paste real output).
2. `pnpm exec prettier --check packages/alpine` passes (or direct
   fallback).
3. `src/recurrence-selector.browser.test.ts` uses the canonical
   template and mirrors the React suite plus the state machine:
   `describeRecurrence` unit coverage in-browser (none; weekly single
   day; weekly multi-day list via Intl.ListFormat; interval variants;
   monthly ordinal — e.g. a start date on the 15th → `3rd`; count and
   date endings; label override changes the whole sentence); presets:
   the select shows the four preset labels built from the start
   weekday; picking each preset replaces the rule and updates the
   live summary (assert `aria-live="polite"` present); a rule matching
   the biweekly preset selects it, an unmatched rule shows custom with
   the editor open; choosing Custom from none seeds the weekly rule and
   opens the editor; interval clamp (`0` → 1), frequency swap hides the
   weekday group in monthly, weekday toggle adds/removes days but a
   lone selected day cannot be removed (aria-pressed stays true);
   end select: count shows the number input seeded with
   `defaultEndCount ?? 8`, date shows the nested date picker; choosing
   a date in the nested lyraDatePicker writes the ISO string into
   `value.end.date`, updates the summary sentence, and dispatches
   `lyra:change` (JSON-safe payload — assert the detail survives
   `JSON.parse(JSON.stringify(...))` unchanged); every interactive
   change dispatches `lyra:change`; external x-model write re-renders
   the summary without dispatching; `x-modelable` + `x-model` both
   directions on `value`; `conflicts` renders the pluralized status
   note (1 vs many); axe clean with the editor closed and open.
4. `Alpine.plugin(lyra)` now registers `lyraRecurrenceSelector`; all
   existing suites pass unmodified.
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
