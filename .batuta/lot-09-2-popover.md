# Lote 09-2 — Onda 2: Popover sobre useFlipPlacement (+ eixo horizontal no hook)

Sits on top of `.batuta/brief-fase8-waves.md` — read it first, in full,
including the addendum.

<task>
Two coupled deliverables that only verify together (declared exception):
1. Extend `packages/react/src/internal/use-flip-placement.ts`: the return
   changes from a vertical-only decision to `{ side, align }`, still measured
   against the `visualViewport`, with `down`/`start` as defaults. The three
   existing consumers (Combobox, Dropdown, WorkspaceSwitcher) keep their
   EXACT current behavior — adapt their call sites mechanically to the new
   shape, changing nothing observable (their tests must pass untouched).
2. New `Popover` component built ON the extended hook, per the decided
   architecture in `.batuta/handoff-v1.2-map.md` § "Popover sobre o
   useFlipPlacement — decisão de 2026-07-28" — read that section in full;
   every numbered decision there is binding. In short: the primitive carries
   the overlay BEHAVIOR (outside-click on document mousedown, Escape with
   focus restored to the trigger, trigger fusion via the existing `Slot`
   with aria-haspopup/aria-expanded/aria-controls) plus flip placement;
   in-flow (NOT portaled — the map names the limit and defers portals until
   evidence); handoff contract handoff/components/primitives/Popover.d.ts is
   the API baseline but its a11y gaps are corrected (the map lists them);
   the `.lyra-popover*` classes shipped in 09-0 are the appearance.
</task>

## Pinned traps

- Do NOT wrap the trigger in a span with onClick — that recreates the
  nested-interactive defect the Dropdown already solved with `Slot`. Copy the
  Dropdown's trigger fusion.
- Do NOT migrate Combobox/Dropdown/WorkspaceSwitcher onto Popover in this
  lot (map decision 5) — call-site adaptation to the hook's new return shape
  is the ONLY change they receive.
- The entry keyframe was fixed in 09-0 (transform-only override) — consume,
  never reintroduce opacity.
- `side` prop keeps `top`/`bottom` as explicit overrides; default is the
  hook's automatic decision.

## Acceptance criteria

1. Hook returns `{ side, align }`; the three existing consumers' test files
   pass WITHOUT modification (their behavior is the regression harness).
2. Popover: browser tests for outside-click close, Escape closing AND
   restoring focus to the trigger, trigger ARIA (haspopup/expanded/controls
   wired to the panel id), flip near the viewport bottom (scroll the anchor),
   light+dark axe clean; SSR test per convention.
3. Wiring complete (entry, exports, size-limit budget, barrel, docgen guard
   62 → 63) and changeset minor.
4. All offline gates green; report the docgen count.

## Stop conditions

An existing consumer test needing modification to stay green (that is a
regression, not an adaptation); a `.lyra-popover*` class missing; same
command failing twice.

<default_follow_through_policy>
Proceed without asking questions. Every decision within this contract is
yours; implement end to end and report per the shared brief's report
contract.
</default_follow_through_policy>

## RETRY FEEDBACK (accepted review findings — fix exactly these)

1. MED — `useFlipPlacement` reserves `GAP = 6` but the shipped Popover CSS
   offsets the panel by `var(--space-2)` (8px): near the viewport bottom a
   panel kept below on 6px of room clips its final 2px. Make the gap a
   parameter of the hook (default 6 — the three existing consumers keep
   their exact behavior and their tests stay untouched) and have Popover
   pass 8. Add/adjust a hook test covering the 6-vs-8 boundary.
2. LOW — the "flips near the bottom" popover test never scrolls, so the
   hook's scroll-remeasure path is uncovered: after the flip assertion,
   scroll the window (e.g. `window.scrollTo`) far enough that the anchor
   gains room below, and assert the panel re-measures back to
   `lyra-popover--bottom` while open.
3. JSDoc only — document on the `trigger` prop that it must be an
   interactive element (same contract as Dropdown's fusion; a plain span is
   not focusable/keyboard-operable by design).

Re-run offline gates; the maestro reruns the browser suite.
