# Lote 09-6d — Onda 6d: CalendarView (o último componente do porte)

Sits on top of `.batuta/brief-fase8-waves.md` — read it first, in full,
including the addendum. This is the phase's most expensive component,
deliberately alone in its lot.

<task>
`CalendarView` — handoff/components/scheduling/CalendarView.{d.ts,jsx,prompt.md}:
the month view + hour-grid week view with event chips.
</task>

## Pinned traps (from the map — binding)

- The 5 chip kinds are distinguished by SHAPE + COLOR (solid, dashed,
  hatched, outline…) — an a11y requirement, not aesthetics. Losing the
  hatch/dash pattern is a regression. Assert at least one non-color
  distinction per kind in tests (class or computed style).
- The reference duplicates the kind→color mapping in TWO places: a JS map
  (`KIND_M`, month view) and CSS classes (hour grid). They MUST stay in
  sync — collapse to a single source in the port (CSS classes driven by a
  kind modifier; the JS map dies) IF that preserves rendering exactly;
  otherwise keep both and add a unit test asserting the two sources agree
  kind by kind.
- LOCAL time everywhere (the SlotPicker UTC model never leaks here).
- The component measures real DOM (`getBoundingClientRect` + `scrollTop`)
  to place chips — tests REQUIRE Browser Mode (jsdom returns zeros); write
  them accordingly, and gate positioning assertions on real measured
  values.
- Drag interactions and grid roving-tabindex are DECLARED NOT IMPLEMENTED
  by the handoff — left to the app. Do NOT invent them.
- i18n per the phase law: weekday/month strings via `locale` + Intl
  (Calendar precedent); every UI string a label prop.

## Acceptance criteria

1. Month view and week hour-grid per the reference, chips placed by real
   measurement; the 5 kinds visually distinct by shape+color with a
   non-color assertion per kind; single source (or agreement test) for the
   kind mapping.
2. Zero hardcoded date words; light+dark axe per suite pattern; SSR test
   (no DOM measurement on the server — guard it).
3. Wiring complete (docgen 77 → 78 — the FULL delta count); changeset
   minor. Report the count.

## Stop conditions

A `.lyra-*` scheduling class missing; the reference's measurement model not
reproducible in the runner (report with the exact failing measurement);
same command failing twice.

<default_follow_through_policy>
Proceed without asking questions. Every decision within this contract is
yours; implement end to end and report per the shared brief's report
contract.
</default_follow_through_policy>

## RETRY FEEDBACK (accepted review findings — fix exactly these five)

1. MED — the open popover never remeasures: close it on window resize (the
   honest cheap behavior; do not build a reposition engine). Test: open a
   chip popover, dispatch a resize, assert it closed.
2. MED — on a scroll container narrower than 240px the computed left goes
   negative: clamp to >= 0. Test with a narrow container.
3. LOW — add the month-view overflow test: four+ events on one day exercises
   the reference's "+N more" path with the correct count.
4. MED — the popover-position test SKIPS itself when a measured width is 0:
   invert it — assert the widths are > 0 (the suite runs in a real browser;
   zero rects mean broken layout and must FAIL).
5. Document as KNOWN LIMITATIONS (JSDoc on the component, mirroring the
   drag/roving note): overlapping same-day events render stacked full-width
   (no column packing) and an event crossing midnight renders only on its
   start day — both faithful to the reference; candidates for the behavior
   milestone.

Re-run offline gates; the maestro reruns the browser suite.
