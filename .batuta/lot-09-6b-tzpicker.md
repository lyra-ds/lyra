# Lote 09-6b — Onda 6b: extensão do Combobox + TimeZonePicker

Sits on top of `.batuta/brief-fase8-waves.md` — read it first, in full,
including the addendum. Two coupled deliverables (the extension exists FOR
the picker — declared exception, verified together).

<task>
1. Extend the EXISTING `Combobox` with the v1.2 option fields, per
   handoff/components/forms/Combobox.{d.ts,jsx}: `options[].group` (group
   headers in the list), `options[].trailing` (right-aligned content) and
   `options[].keywords` (invisible search terms). Additive API — every
   existing Combobox consumer and test keeps passing UNTOUCHED (they are the
   regression harness).
2. `TimeZonePicker` — handoff/components/scheduling/TimeZonePicker.{d.ts,jsx,prompt.md},
   composing the extended Combobox.
</task>

## Pinned traps (from the map — binding)

- TimeZonePicker values are ALWAYS IANA zone ids, never fixed offsets; the
  `(GMT±X)` display text is derived from the `referenceDate` prop so DST
  resolves correctly — test with a reference date in each half of the year
  for a DST zone (e.g. America/New_York → -5 in January, -4 in July).
- The reference `.jsx` calls `onChange(v, opt)` while the `.d.ts` declares
  `(zone: string)`. DECIDED: the `.d.ts` wins (phase precedent — the .d.ts
  is the public contract); JSDoc may note the second argument was dropped
  deliberately.
- Combobox `keywords` are searchable but never rendered; `group` headers are
  presentational (not options — keyboard skips them).

## Acceptance criteria

1. All existing Combobox browser/SSR tests pass WITHOUT modification.
2. New Combobox coverage: group headers rendered + skipped by keyboard;
   trailing content rendered; keyword-only match finds the option while the
   keyword text never appears in the DOM.
3. TimeZonePicker: IANA values on change; GMT offsets derived from
   referenceDate (both DST halves tested); i18n per the phase law;
   light+dark axe per the suite pattern; SSR test.
4. Wiring for the new component (docgen 73 → 74); changeset minor covering
   both (Combobox extension is a feature of @lyra-ds/react too). Report the
   count.

## Stop conditions

An existing Combobox test needing modification (that is a regression);
`.lyra-*` classes for groups/trailing missing from styles; same command
failing twice.

<default_follow_through_policy>
Proceed without asking questions. Every decision within this contract is
yours; implement end to end and report per the shared brief's report
contract.
</default_follow_through_policy>

## RETRY FEEDBACK (accepted review findings — fix exactly these four)

1. MED — Combobox: Home/End are unhandled with a grouped/filtered list open;
   they must move the active option to the first/last SELECTABLE option
   (skipping headers). Test both keys on a grouped, filtered list.
2. MED — Combobox matching: fold Unicode diacritics before comparing
   (NFD + strip combining marks) so `cafe` finds a `café` keyword/label.
   Apply to label and keyword search alike; test one diacritic case.
3. MED — TimeZonePicker: deduplicate `recentZones` (and any overlap with the
   main list) before rendering — duplicated ids currently emit duplicate
   React keys and twin rows. Test with a repeated id.
4. LOW — offset formatting test only covers whole hours: assert
   `Asia/Kolkata` renders GMT+5:30 with the same referenceDate mechanism.

Re-run offline gates; the maestro reruns the browser suite.
