# Lote 09-3a — Onda 3a: Calendar

Sits on top of `.batuta/brief-fase8-waves.md` — read it first, in full,
including the addendum.

<task>
One component: `Calendar`, from
handoff/components/forms/Calendar.{d.ts,jsx,prompt.md} (the v1.2 file — it
already includes the v1.2 extensions over v1.1). The `.lyra-cal*` classes
shipped in 09-0 are the appearance.
</task>

## Pinned traps (from the map's i18n section + the reference)

- The handoff hardcodes pt-BR weekday initials AND
  `toLocaleDateString("pt-BR")`. ALL user-visible strings and date formatting
  become props: a `locale?: string` prop (default `'en-US'`) drives
  `Intl`-based weekday/month rendering, and any label strings follow the
  labels-prop convention. NO hardcoded weekday arrays.
- Calendar is LOCAL time throughout (the map contrasts it with SlotPicker's
  UTC — never mix). Date values in/out are `Date` objects or ISO `YYYY-MM-DD`
  strings exactly as the `.d.ts` declares — reproduce its contract.
- Keyboard: the reference implements grid navigation (arrows, Home/End,
  PageUp/Down if present) — reproduce what the reference and .prompt.md
  specify, with the roving tabindex the reference uses. Do not invent beyond
  the reference.
- Range support: the `.d.ts` contract decides (single/range modes); the
  DateRangePicker in the next lot will compose it — expose what the contract
  declares, nothing extra.

## Acceptance criteria

1. Matches the handoff `.d.ts`; renders the `.lyra-cal*` classes of the
   reference; keyboard grid navigation per the reference, tested with real
   key events in Browser Mode.
2. Zero hardcoded locale artifacts (weekdays/months derived from `locale`).
3. Browser tests: month navigation, selection (and range if contracted),
   keyboard nav, disabled dates if contracted, light+dark axe clean;
   `expect.element` for existence; SSR test.
4. Wiring complete (entry, exports, size-limit, barrel, docgen 63 → 64);
   changeset minor. Report the docgen count.

## Stop conditions

A `.lyra-cal*` class missing from styles; the `.d.ts` contradicting the
`.jsx` (report the divergence, do not pick silently); same command failing
twice.

<default_follow_through_policy>
Proceed without asking questions. Every decision within this contract is
yours; implement end to end and report per the shared brief's report
contract.
</default_follow_through_policy>

## RETRY FEEDBACK (one addition — the declared divergence gets its CSS)

Your aria-disabled decision is CORRECT (the .d.ts and the APG pattern win over
the reference's native `disabled`). Complete it: add an ADDITIVE extension to
`packages/styles/components/forms/forms.css` (this one styles edit is now
inside Boundaries, FormRow precedent) re-declaring the day class in the
additive region so `[aria-disabled='true']` gets the SAME declarations the
canonical `:disabled` rule applies, with the same comment style, registered in
`ADDITIVE_EXTENSIONS` in `tools/parity/parity.mjs` (that data structure only)
if the class is not already covered. `pnpm run parity` must stay green. Add a
browser test asserting an aria-disabled day is focusable AND visually dimmed
(computed opacity/color matches a natively disabled control's).
