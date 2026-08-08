# Lot E2 — `lyraTimeZonePicker` (data layer over `lyraCombobox`)

Sits on top of `.batuta/brief-alpine-wave-e.md`. Read both in full before
writing anything. Work from the repo root; do not commit. Lot E1
(`src/combobox.ts`) is already merged — read it first; this lot must REUSE
its implementation, never fork it.

<task>
Port the TimeZonePicker data layer from
`packages/react/src/time-zone-picker/time-zone-picker.tsx` (tests:
`time-zone-picker.browser.test.tsx`). In React it renders a `Combobox`
with decorated options; in Alpine, implement `lyraTimeZonePicker` as a
factory that EXTENDS the combobox factory object: export the combobox
factory from `src/combobox.ts` as a plain reusable function if E1 did not
already, spread/extend it, and override/add only the time-zone concerns.
The consumer uses the SAME canonical combobox template (root class
`lyra-tzpicker` alongside `lyra-combobox` — copy the exact class the React
component emits). The JSDoc MUST include the canonical template.

- Options argument: `value` (IANA id, controllable/modelable), `zones`
  (replaces the curated list), `recentZones` (default `[]`),
  `detectedZone`, `referenceDate` (ISO `YYYY-MM-DD` → local noon, else
  `new Date(value)`; default now), `locale` (`'en-US'`), `labels` (merged
  over the React English defaults: placeholder, searchPlaceholder,
  emptyMessage, detectedGroup, recentGroup), plus the pass-through
  combobox options that still apply (`open`, `disabled`, `placeholder`
  overriding `labels.placeholder`).
- Curated default zone list: port the React `DEFAULT_ZONES` (27 entries)
  VERBATIM — values, labels, regions, keywords. Export it on the type
  surface the same way React exposes `TimeZonePicker.ZONES` (a named
  export is fine; document it).
- Option decoration, exact port: `gmtOffset` via
  `Intl.DateTimeFormat('en', { timeZone, timeZoneName: 'shortOffset' })`
  `.formatToParts`, `UTC`→`GMT` replacement, try/catch → `''`;
  `label = "City (GMT-3)"`; keywords = curated keywords + IANA id with
  `[_/]` → spaces + lowercased offset; `trailing` = the zone's live local
  time via `Intl` hour/minute 2-digit (try/catch → `''`) — since combobox
  options are plain data, `trailing` here is a STRING the template renders
  (`lyra-combobox__trailing`); grouping: pinned Detected first, then
  Recent (deduped against detected and each other), then the remaining
  zones grouped by their `region`, pinned values excluded from the
  regional block; unknown pinned values get the React `fallbackZone`
  (last path segment, `_`→space, empty region).
- Live clock: a 60s `setInterval` started in `init()` and cleared in
  `destroy()` re-derives the options' `trailing` (a reactive tick counter
  the options getter reads is the simple route).
- `referenceDate` (not the clock) defines the displayed offsets — DST
  cases must hold.
- Selection behavior, events (`lyra:change`), APG navigation, and
modelable `value`/`open` all come from the combobox base — do not
reimplement; the change event's `detail.value` is the IANA id.
</task>

<scope>
May change ONLY:
- `packages/alpine/src/time-zone-picker.ts` (new)
- `packages/alpine/src/time-zone-picker.browser.test.ts` (new)
- `packages/alpine/src/combobox.ts` (ONLY if needed to export its factory
  for reuse — no behavior change; existing combobox tests must pass
  unmodified)
- `packages/alpine/src/index.ts` (registration + type surface if needed)
- `packages/alpine/package.json` (size-limit budget line only)
- `.changeset/alpine-lyra-time-zone-picker.md` (new — one-paragraph minor
  changeset for `@lyra-ds/alpine`, mirroring the existing style)
Do not change anything outside this list; if the task requires it, stop
and report.
</scope>

<acceptance_criteria>

1. `pnpm --filter @lyra-ds/alpine run typecheck` passes (or the direct
   `tsc` fallback; paste real output).
2. `pnpm exec prettier --check packages/alpine` passes (or direct
   fallback).
3. `src/time-zone-picker.browser.test.ts` mirrors the React suite's
   coverage: default list renders the 27 curated zones grouped by region;
   labels carry the `(GMT±N)` offset derived from a FIXED `referenceDate`
   (assert an exact known offset, e.g. `America/Sao_Paulo` on a chosen
   date); `detectedZone` pins a Detected group first and `recentZones`
   pin a deduped Recent group (a zone that is both detected and recent
   appears once, under Detected); an unknown IANA id in `recentZones`
   renders the fallback label; searching by keyword (`brasil`), by IANA
   token (`sao paulo`), and by offset (`gmt`) matches; selecting sets
   `value` to the IANA id and dispatches `lyra:change` with it;
   `x-modelable` + `x-model` both directions on `value`; the trailing
   local time updates when the 60s interval fires (use
   `vi.useFakeTimers`/advance or prove the tick re-derivation another
   real way) and the interval is cleared on `destroy` (no vacuous spy —
   prove no further updates); `zones` replaces the curated list; axe
   clean open.
4. `Alpine.plugin(lyra)` now registers `lyraTimeZonePicker`; all existing
   suites (including combobox) pass unmodified.
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
