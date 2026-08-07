# Lot 05 — `lyraTabs`

Sits on top of `.batuta/brief-alpine-wave1.md`. Read both in full before
writing anything. Work from the repo root; do not commit.

<task>
Port the Tabs state machine from `packages/react/src/tabs/tabs.tsx`
(tests: `packages/react/src/tabs/tabs.browser.test.tsx`) to
`Alpine.data('lyraTabs', ...)`. Tabs is pure — no shared internals, no
presence, no overlay. Copy `packages/alpine/src/dropdown.ts`'s structure
(root captured in `init()`, binding objects, id generation).

Identity model (DECIDED — record it in your report, do not revisit): the
consumer marks each tab button AND its panel with a matching `data-value`
attribute; `active` holds the active tab's value string. DOM order of the
`data-value`-carrying tab elements under the `list` binding defines the
keyboard-navigation order. Generate element ids (`${rootId}-tab-N` /
`${rootId}-panel-N` by index) only when the elements have none, and wire
`aria-controls`/`aria-labelledby` from whatever ids result.

Behavior contract (verified against the React source — read it anyway; the
source wins on any detail this list compresses):

- State: `active` (string, seeded by a REQUIRED `active` argument — mirror
  React's controlled prop; when the value matches no tab, the FIRST tab is
  treated as active, like React's `Math.max(0, findIndex)`). `active` is
  the controllable state for `x-modelable`.
- Named bindings: `list` (the tablist container), `tab` (each tab button),
  `panel` (each tabpanel).
- `list`: `role="tablist"`. Variant classes (`lyra-tabs`,
  `lyra-tabs--pills`) stay in the consumer's markup — do not manage them.
- `tab`: `role="tab"`, `type="button"`, reactive `aria-selected`,
  `aria-controls` → its panel id, `tabindex` roving (0 active / -1 rest),
  reactive `lyra-tab--active` class (base `lyra-tab` class stays in the
  consumer's markup), `@click` activates, `@keydown` navigation:
  ArrowRight/ArrowLeft with wrap, Home, End — `preventDefault`, focus the
  target tab AND activate it (automatic activation), respecting
  `event.defaultPrevented` and doing nothing when there are no tabs.
- `panel`: `role="tabpanel"`, `aria-labelledby` → its tab id,
`tabindex="0"`, reactive `hidden` (hidden unless its `data-value`
matches `active`).
</task>

<scope>
May change ONLY:
- `packages/alpine/src/tabs.ts` (new)
- `packages/alpine/src/tabs.browser.test.ts` (new)
- `packages/alpine/src/index.ts` (registration + type surface if needed)
- `packages/alpine/package.json` (size-limit budget line only)
- `.changeset/alpine-lyra-tabs.md` (new — one-paragraph minor changeset
  for `@lyra-ds/alpine`, mirroring the existing alpine changesets' style)
Do not change anything outside this list; if the task requires it, stop
and report.
</scope>

<acceptance_criteria>

1. `pnpm --filter @lyra-ds/alpine run typecheck` passes (paste real output).
2. `pnpm exec prettier --check packages/alpine` passes.
3. `src/tabs.browser.test.ts` mirrors the React suite's coverage for the
   ported behavior: ARIA wiring (roles, aria-selected, aria-controls,
   labelledby), `lyra-tab--active` emission, `hidden` panel toggling,
   roving tabindex, keyboard navigation (arrows with wrap, Home, End,
   automatic activation moving focus AND state), click activation, axe
   clean (both variants' consumer markup: line and pills), and the two-way
   `x-modelable`/`x-model` test. Follow shared-brief lesson 6 (flush after
   synthetic dispatch; prefer real `userEvent.keyboard` for keys).
4. `Alpine.plugin(lyra)` now registers `lyraTabs`; all existing suites
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
