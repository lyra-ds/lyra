# Lote 09-6c — Onda 6c: RecurrenceSelector, WeeklyScheduleEditor, SlotPicker

Sits on top of `.batuta/brief-fase8-waves.md` — read it first, in full,
including the addendum.

<task>
Three scheduling components from handoff/components/scheduling/:
1. `RecurrenceSelector` (+ exported `describeRecurrence`) —
   RecurrenceSelector.{d.ts,jsx,prompt.md}.
2. `WeeklyScheduleEditor` — WeeklyScheduleEditor.{d.ts,jsx,prompt.md}.
3. `SlotPicker` — SlotPicker.{d.ts,jsx,prompt.md}.
</task>

## Pinned traps (from the map — each is the component's #1 trap, binding)

- RecurrenceSelector: `describeRecurrence(rule, startDate)` builds the WHOLE
  sentence per rule, deliberately — the `.prompt.md` FORBIDS assembling it
  from concatenated fragments (fragments do not survive i18n). The reference
  is pt-BR throughout: the i18n conversion here means the sentence builder
  itself becomes locale-driven via a labels/strings prop carrying whole
  sentence templates per rule shape, English defaults. Never concatenate.
- SlotPicker: slots arrive in UTC; day grouping uses
  `Intl.DateTimeFormat('en-CA', { timeZone })` to derive `YYYY-MM-DD` — the
  en-CA trick IS the ISO output. Replacing it with
  `toISOString().slice(0,10)` breaks the timezone (the exact bug the map
  predicts an executor introduces). Preserve the mechanism; test a slot that
  falls on DIFFERENT calendar days in UTC vs the display zone.
- SlotPicker is UTC; WeeklyScheduleEditor and the rest are LOCAL time —
  never mix the two models.
- WeeklyScheduleEditor: whole component is pt-BR in the reference — full
  labels-prop conversion; its "Copiar para…" popover composes the repo
  `Popover` (in flow — the map's known overflow limit stands, do not portal).

## Acceptance criteria

1. Three components matching their `.d.ts`; `describeRecurrence` exported and
   sentence-templated (grep proof: no string concatenation of rule fragments
   in the sentence path); i18n complete.
2. SlotPicker: the en-CA/timeZone grouping preserved; browser test proving a
   UTC slot lands on the correct display-zone day (both directions of the
   boundary).
3. WeeklyScheduleEditor: add/remove/copy interactions per the reference,
   Popover composed; keyboard reachability; light+dark axe per suite
   pattern.
4. SSR tests ×3; wiring ×3 (docgen 74 → 77); changeset minor. Report count.

## Stop conditions

A scheduling `.lyra-*` class missing; the reference's drag interactions
(declared out of scope by the handoff itself — do not implement); same
command failing twice.

<default_follow_through_policy>
Proceed without asking questions. Every decision within this contract is
yours; implement end to end and report per the shared brief's report
contract.
</default_follow_through_policy>

## RETRY FEEDBACK (accepted review findings — fix exactly these two)

1. HIGH — `describeRecurrence`: a `{ freq: 'monthly', interval: 2 }` rule
   renders the plain monthly sentence ("every month") — the interval is
   silently dropped. Add whole-sentence interval templates for monthly (and
   audit every freq × interval combination the public rule type allows — each
   must have its own template; the no-concatenation law stands). Test the
   monthly-interval case and one audit-found gap if any.
2. MED — SlotPicker's embedded TimeZonePicker receives neither `locale` nor
   labels: with `locale="fr-FR"` the slots localize but the zone control
   stays English. Thread `locale` through and expose the zone control's
   labels on SlotPicker's labels surface. Test that a non-default locale
   reaches the embedded control.

Re-run offline gates; the maestro reruns the browser suite.
