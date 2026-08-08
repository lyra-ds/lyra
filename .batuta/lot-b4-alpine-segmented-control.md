# Lot B4 — `lyraSegmentedControl`

Sits on top of `.batuta/brief-alpine-wave-b.md`. Read both in full before
writing anything. Work from the repo root; do not commit.

<task>
Port the SegmentedControl radiogroup state machine from
`packages/react/src/segmented-control/segmented-control.tsx`
(tests:
`packages/react/src/segmented-control/segmented-control.browser.test.tsx`).

Behavior contract (verified against the React source — read it anyway; the
source wins on any detail this list compresses):

- Options: `value` (string, initial selection; default `''`).
- State: `value` — controllable, `x-modelable`-ready. Changing it (by
  interaction OR externally via x-model) re-derives all option states.
- DOM-driven: options are the served `[role="radio"]` elements inside the
  root, each carrying `data-value` and the served class
  `lyra-segmented__option`; disabled options use the native `disabled`
  attribute. Query them from the captured root in DOM order; never cache
  across calls (the consumer may re-render the list).
- Derived per option (all through the `option` binding, reading
  `$el.dataset.value` / `$el.disabled`):
  - `:aria-checked` — `'true'`/`'false'` string of `value === data-value`.
  - `:tabindex` — roving: 0 for the selected option when it exists and is
    enabled, otherwise 0 for the FIRST enabled option; −1 for all others
    (React's `focusableIndex` derivation — port it exactly).
  - `:class` OBJECT syntax for `lyra-segmented__option--active`
    (shared-brief lesson 5).
  - `type: 'button'`.
- Selection-follows-focus keyboard on the `option` binding's `@keydown`
  (return early on `defaultPrevented`): ArrowLeft/ArrowUp → previous
  enabled, ArrowRight/ArrowDown → next enabled, both CIRCULAR and
  skipping disabled (port `nextEnabledIndex`'s modulo walk); Home → first
  enabled; End → last enabled; a resolved target preventDefaults, focuses
  the target option element, and selects it (sets `value`, dispatches the
  change event). No match → do nothing.
- `@click` on an option selects it (disabled options are unreachable —
  native disabled).
- Selecting dispatches a bubbling `lyra:change` custom event with
  `detail: { value }` — only on interaction, not on external/x-model
  writes (React parity: onChange fires from user action).
- `group` binding: nothing dynamic to manage (`role="radiogroup"` and
`aria-label` are served) — OMIT it entirely; document served
requirements in the factory JSDoc. If during implementation something
genuinely dynamic surfaces for the group element, stop and report per
the stop conditions rather than inventing a binding.
</task>

<scope>
May change ONLY:
- `packages/alpine/src/segmented-control.ts` (new)
- `packages/alpine/src/segmented-control.browser.test.ts` (new)
- `packages/alpine/src/index.ts` (registration + type surface if needed)
- `packages/alpine/package.json` (size-limit budget line only)
- `.changeset/alpine-lyra-segmented-control.md` (new — one-paragraph
  minor changeset for `@lyra-ds/alpine`, mirroring the existing alpine
  changesets' style)
Do not change anything outside this list; if the task requires it, stop
and report.
</scope>

<acceptance_criteria>

1. `pnpm --filter @lyra-ds/alpine run typecheck` passes (paste real
   output).
2. `pnpm exec prettier --check packages/alpine` passes.
3. `src/segmented-control.browser.test.ts` uses a served-markup fixture
   (radiogroup with ≥4 options including a disabled one and a
   server-rendered `--active` on the initial value) and covers: initial
   roving tabindex (selected 0, rest −1) and aria-checked; click selects
   and dispatches `lyra:change` with the right detail; arrows move
   selection AND focus circularly skipping the disabled option (assert
   `document.activeElement`); Home/End land on first/last enabled;
   selecting another option REMOVES the server-rendered `--active` from
   the old one; external `x-model` write re-points aria-checked/tabindex
   WITHOUT dispatching `lyra:change` (record the event with a listener);
   `x-modelable` + `x-model` works BOTH directions; axe clean.
4. `Alpine.plugin(lyra)` now registers `lyraSegmentedControl`; all
   existing suites pass unmodified.
5. size-limit budget updated per the shared brief's rule.
   </acceptance_criteria>

<compact_output_contract>
Report back, in order: files touched (paths only); commands run with
their REAL output (typecheck, prettier, size-limit); the measured size
and new budget; any behavior detail where you diverged from the React
source and why; uncertainties declared as such. No test-result claims
for suites you cannot run.
</compact_output_contract>
