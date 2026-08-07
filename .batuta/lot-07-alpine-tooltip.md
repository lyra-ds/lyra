# Lot 07 — `lyraTooltip`

Sits on top of `.batuta/brief-alpine-wave1.md`. Read both in full before
writing anything. Work from the repo root; do not commit.

<task>
Port the Tooltip state machine from
`packages/react/src/tooltip/tooltip.tsx`
(tests: `packages/react/src/tooltip/tooltip.browser.test.tsx`), including
its placement utility `packages/react/src/internal/use-tooltip-placement.ts`
→ `packages/alpine/src/internal/tooltip-placement.ts` as a plain-function
module (attach/measure/cleanup form like `flip-placement.ts`; keep the
`::after` measurement via `getComputedStyle(node, '::after')`, the
visualViewport-based room math, the one-way flip that never leaves a side
that fits, the reset-to-requested-on-close, and the same
scroll/resize/visualViewport listeners — port faithfully).

Behavior contract (verified against the React source — read it anyway; the
source wins on any detail this list compresses):

- State: `open`, ALWAYS starting false and NOT controllable — React parity:
  Tooltip exposes no control; there is NO `x-modelable` here and no
  `defaultOpen` (record this as the parity decision).
- Options: `tip` (string, required — becomes `data-tip` and the hidden
  bubble text is already in the consumer markup), `placement`
  (`'top' | 'bottom' | 'left' | 'right'`, default `'top'` — a preference,
  not a promise).
- Named bindings: `root` (the `.lyra-tooltip` span carrying `data-tip` and
  the CSS `::after` bubble) and `target` (the focusable child).
- `root`: reactive `data-state` (`open`/`closed`), reactive `data-tip`
  from the option, reactive placement class — `lyra-tooltip--${side}` for
  every side EXCEPT resolved `top` (top emits no modifier), where the side
  is the RESOLVED placement from the flip logic, not the requested one.
  `@mouseenter`/`@mouseleave` show/hide (the wrapper hears pointer
  transitions between target and bubble — WCAG 1.4.13), `@focusin`/
  `@focusout` show/hide, `@keydown` Escape hides with `preventDefault`.
- `target`: `aria-describedby` appending the bubble id (generate ids like
  the other components; do not clobber an existing describedby — append).
- Consumer markup carries a hidden `<span role="tooltip" hidden>` bubble
  text node — a `bubble` binding wires its id (and nothing else; it stays
  `hidden` — the visual bubble is the CSS `::after`).
- Escape at the DOCUMENT level while open (WCAG 1.4.13 — a hover-opened
  tip has no focus inside): document keydown listener attached only while
  open, removed on close/destroy, hides the tip.
- Placement resolution runs while open (attach on open, cleanup on close),
driven by the ported utility; closed resets the resolved side to the
requested one.
</task>

<scope>
May change ONLY:
- `packages/alpine/src/tooltip.ts` (new)
- `packages/alpine/src/tooltip.browser.test.ts` (new)
- `packages/alpine/src/internal/tooltip-placement.ts` (new)
- `packages/alpine/src/index.ts` (registration + type surface if needed)
- `packages/alpine/package.json` (size-limit budget line only)
- `.changeset/alpine-lyra-tooltip.md` (new — one-paragraph minor
  changeset for `@lyra-ds/alpine`, mirroring the existing alpine
  changesets' style)
Do not change anything outside this list; if the task requires it, stop
and report.
</scope>

<acceptance_criteria>

1. `pnpm --filter @lyra-ds/alpine run typecheck` passes (paste real output).
2. `pnpm exec prettier --check packages/alpine` passes.
3. `src/tooltip.browser.test.ts` mirrors the React suite's coverage for
   the ported behavior: aria-describedby wiring (incl. appending to an
   existing value), `data-state` on hover enter/leave and focus/blur,
   document-level Escape closing a hover-opened tip without moving focus,
   Escape on the focused target closing while focus stays, placement kept
   when it fits / flipped when clipped (FORCE the flip scenario per
   shared-brief lesson 4 — check the room arithmetic against the measured
   `::after` size in chromium), explicit placement honoured when it fits,
   axe clean open and closed. No modelable test — parity decision above.
4. `Alpine.plugin(lyra)` now registers `lyraTooltip`; all existing suites
   pass unmodified.
5. size-limit budget updated per the shared brief's rule.
   </acceptance_criteria>

<compact_output_contract>
Report back, in order: files touched (paths only); commands run with their
REAL output (typecheck, prettier, size-limit); the measured size and new
budget; any behavior detail where you diverged from the React source and
why; uncertainties declared as such. No test-result claims for suites you
cannot run.
</compact_output_contract>
