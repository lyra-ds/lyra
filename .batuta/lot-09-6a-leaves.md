# Lote 09-6a — Onda 6a: SegmentedRing e TimeInput

Sits on top of `.batuta/brief-fase8-waves.md` — read it first, in full,
including the addendum. These are the two leaves of the scheduling group.

<task>
1. `SegmentedRing` — handoff/components/scheduling/SegmentedRing.{d.ts,jsx,prompt.md}.
2. `TimeInput` — handoff/components/forms/TimeInput.{d.ts,jsx,prompt.md}.
The scheduling CSS shipped in 09-0 (`packages/styles/components/scheduling/`).
</task>

## Pinned traps (from the map — binding; each has a wrong "fix" that is worse)

- SegmentedRing: the `<svg>` AND the legend are BOTH `aria-hidden` — the
  accessibility source is a visually-hidden span. "Fixing" this by removing
  aria-hidden produces double screen-reader output. Reproduce the pattern;
  test that exactly one accessible rendering of the data exists.
- TimeInput: `parse()` has THREE semantically distinct returns — `null`
  (empty input: commits the clear), `undefined` (invalid: does NOT commit
  and PRESERVES the wrong text for the user to fix), string (valid:
  commits). A `if (!p)` collapses null/undefined and breaks the explicit
  never-clear-typed-text requirement. Tests must cover the three paths,
  including that invalid input keeps the typed text after blur.
- TimeInput `aria-valuetext` is pt-BR hardcoded in the reference → prop.

## Acceptance criteria

1. Both match their `.d.ts`; i18n per the phase law; light+dark axe clean;
   SSR tests; keyboard behavior per the references.
2. TimeInput: the three parse paths browser-tested (empty→clears,
   invalid→value preserved + not committed, valid→committed on blur/Enter
   per the reference).
3. SegmentedRing: single-accessible-source asserted (the hidden span holds
   the name; svg and legend hidden from AT).
4. Wiring ×2 (docgen 71 → 73); changeset minor. Report the count.

## Stop conditions

A `.lyra-*` scheduling/forms class missing; `.d.ts` vs `.jsx` contradiction
(report, don't pick); same command failing twice.

<default_follow_through_policy>
Proceed without asking questions. Every decision within this contract is
yours; implement end to end and report per the shared brief's report
contract.
</default_follow_through_policy>

## RETRY FEEDBACK (accepted review findings — fix exactly these three)

1. MED — TimeInput: `9:5:99` splits into 3+ fields but only two are read, so
   malformed input normalizes and COMMITS `09:05` instead of taking the
   invalid path. Guard the field count (exactly 1 or 2 fields per the
   reference's grammar); extra separators → `undefined` (preserve text).
   Add the browser test.
2. MED — SegmentedRing: a segment value exceeding `total` produces a
   negative dash length (invalid dasharray, segment may vanish). Clamp each
   fraction to [0, remaining] so an over-total segment renders a full,
   bounded ring. Test with value > total.
3. MED — SegmentedRing: non-finite or overflow sums (two MAX_VALUEs →
   Infinity denominator) paint zero segments while the accessible text still
   reports data. Guard non-finite inputs (treat as 0) and test one case.

Re-run offline gates; the maestro reruns the browser suite.
