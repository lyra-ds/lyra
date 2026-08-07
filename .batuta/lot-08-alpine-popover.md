# Lot 08 — `lyraPopover`

Sits on top of `.batuta/brief-alpine-wave1.md`. Read both in full before
writing anything. Work from the repo root; do not commit.

<task>
Port the Popover state machine from
`packages/react/src/popover/popover.tsx`
(tests: `packages/react/src/popover/popover.browser.test.tsx`) to
`Alpine.data('lyraPopover', ...)`, REUSING
`packages/alpine/src/internal/flip-placement.ts` landed by lyraDropdown —
do not fork or modify it; the dropdown suite must keep passing unchanged.
Copy `packages/alpine/src/dropdown.ts`'s structure (it is the closest
sibling: trigger + floating panel + flip + outside-click).

Trigger model (DECIDED — record it, do not revisit): React fuses semantics
into the consumer's element via Slot; in Alpine the consumer simply puts
`x-bind="trigger"` on their own focusable control — no Slot equivalent, no
fallback wrapper span. Document nothing else.

Behavior contract (verified against the React source — read it anyway; the
source wins on any detail this list compresses):

- State: `open` (seeded by optional `defaultOpen`, default false),
  controllable via `x-modelable`. The panel is conditionally VISIBLE via
  `x-show` on the panel binding — single-dep getter (no presence here;
  React renders `{open && ...}` with no exit animation).
- Options: `defaultOpen`, `side` (`'auto' | 'bottom' | 'top'`, default
  `'auto'`), `align` (`'start' | 'end' | 'center'`, optional — explicit
  value overrides automatic), `width` (number, optional — sets inline
  width in px on the panel), `ariaLabel` (default `'Popover'`).
- Named bindings: `trigger` (the consumer's control) and `panel`.
- `trigger`: `aria-haspopup="dialog"`, reactive `aria-expanded`,
  `aria-controls` → panel id (generate `${rootId}-panel`), `@click`
  toggles, `@keydown` Enter/Space toggling with `preventDefault`,
  respecting `event.defaultPrevented`. `type: 'button'` per shared-brief
  lesson 3.
- `panel`: `role="dialog"`, reactive `aria-label`, id, inline `width`
  when the option is set, reactive classes: base `lyra-popover` stays in
  consumer markup; emit `lyra-popover--bottom` or `lyra-popover--top`
  (side `'auto'` resolves from flip-placement, explicit side wins) and
  `lyra-popover--align-${resolved}` (explicit `align` wins over the
  flip-placement's automatic alignment).
- Flip placement: drive with the shared `flip-placement` util (offset 8),
  measuring trigger + panel while open, exactly as lyraDropdown does.
- Document listeners while open (attach in watch, detach on close/destroy):
  `mousedown` outside the ROOT (captured in init) closes; `keydown` Escape
  `preventDefault`s, closes AND focuses the trigger.
</task>

<scope>
May change ONLY:
- `packages/alpine/src/popover.ts` (new)
- `packages/alpine/src/popover.browser.test.ts` (new)
- `packages/alpine/src/index.ts` (registration + type surface if needed)
- `packages/alpine/package.json` (size-limit budget line only)
- `.changeset/alpine-lyra-popover.md` (new — one-paragraph minor
  changeset for `@lyra-ds/alpine`, mirroring the existing alpine
  changesets' style)
Do not change anything outside this list — in particular do NOT touch
`src/internal/*`; if the task requires it, stop and report.
</scope>

<acceptance_criteria>
1. `pnpm --filter @lyra-ds/alpine run typecheck` passes (paste real output).
2. `pnpm exec prettier --check packages/alpine` passes.
3. `src/popover.browser.test.ts` mirrors the React suite's coverage for
   the ported behavior (trigger-fusion tests adapted to the binding
   model): ARIA trio on the trigger, click + Enter + Space toggling with
   defaultPrevented respected (synthetic prevented events need
   `cancelable: true` — see shared-brief lesson 6), outside mousedown
   closes / inside does not, document Escape closes and refocuses the
   trigger, side/align class resolution incl. a FORCED flip scenario
   (lesson 4) and explicit side/align overrides, inline width option, axe
   clean open and closed, and the two-way `x-modelable`/`x-model` test.
4. `Alpine.plugin(lyra)` now registers `lyraPopover`; all existing suites
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
