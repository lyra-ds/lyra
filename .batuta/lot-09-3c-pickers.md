# Lote 09-3c — Onda 3c: TimePicker, DatePicker, DateRangePicker

Sits on top of `.batuta/brief-fase8-waves.md` — read it first, in full,
including the addendum. This lot closes wave 3: the three pickers compose
components that are ALL in the repo now — `Calendar`, `Popover`,
`BottomSheet` (plus `Input`/`Select` where the reference uses them).

<task>
Three components from handoff/components/forms/:
1. `TimePicker` — TimePicker.{d.ts,jsx,prompt.md}.
2. `DatePicker` — DatePicker.*; the reference imports BottomSheet from
   `../feedback/BottomSheet.jsx` (a path that never existed in the package) —
   adapt to the repo's real `BottomSheet`, whose contract matches llms.txt.
3. `DateRangePicker` — DateRangePicker.*; composes Calendar in range mode.
</task>

## Pinned traps

- ≤640px behavior: the pickers open in a BottomSheet instead of the Popover
  (the README-announced behavior the missing component blocked). Reproduce
  the reference's mechanism; if the reference gates by matchMedia, keep it
  SSR-safe (no matchMedia on the server — resolve on effect, default to
  popover).
- Repo `Popover` replaces whatever ad-hoc popup the reference builds — the
  primitive exists precisely for these consumers (map decision: the pickers
  prove it). Trigger stays an interactive element (Slot fusion).
- i18n per the Calendar precedent: `locale` prop + Intl for every formatted
  date/time string; labels props for every UI string (the reference
  hardcodes pt-BR).
- Controlled/uncontrolled per each `.d.ts`; DateRangePicker ordering (end
  before start) must follow the reference's normalization.
- Local time throughout (Calendar contract); no UTC mixing.

## Acceptance criteria

1. Each matches its handoff `.d.ts` (adapted imports aside); composition
   uses the repo's Calendar/Popover/BottomSheet — no re-implementation of
   any of the three.
2. Zero hardcoded user-visible strings or date formats.
3. Browser tests per component: open/select/close round trip via Popover,
   keyboard path (Calendar grid reachable from the trigger), the ≤640px
   sheet path (set viewport via page context or matchMedia emulation),
   range normalization for DateRangePicker, light+dark axe clean; SSR tests.
4. Wiring complete ×3 (entries, exports, size-limit, barrel, docgen
   65 → 68); one changeset minor naming the three. Report the docgen count.

## Stop conditions

Any of Calendar/Popover/BottomSheet lacking an API the reference needs
(report the gap, do not fork or re-implement); same command failing twice.

<default_follow_through_policy>
Proceed without asking questions. Every decision within this contract is
yours; implement end to end and report per the shared brief's report
contract.
</default_follow_through_policy>

## RETRY FEEDBACK (verification failure — the browser tests never ran in your

sandbox and their trigger locators are wrong)

All 8 open/keyboard/sheet failures share one cause: the tests locate the
trigger by the formatted VALUE (e.g. /5\/1\/2024/), but the trigger's
accessible name comes from the `<label htmlFor>` ("Start date" etc.) — the
value is visible content, not the accessible name (label wins). Fix every
trigger locator to use the actual accessible name, and assert the formatted
value SEPARATELY as visible text (per locale). Re-check each of the three
test files' queries against the real rendered DOM, then confirm the whole
picker suites logically pass a dry read. Re-run offline gates; the maestro
runs the browser suite.
