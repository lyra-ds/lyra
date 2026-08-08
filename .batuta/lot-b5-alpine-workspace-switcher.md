# Lot B5 — `lyraWorkspaceSwitcher`

Sits on top of `.batuta/brief-alpine-wave-b.md`. Read both in full before
writing anything. Work from the repo root; do not commit.

<task>
Port the WorkspaceSwitcher listbox-popover state machine from
`packages/react/src/workspace-switcher/workspace-switcher.tsx`
(tests:
`packages/react/src/workspace-switcher/workspace-switcher.browser.test.tsx`).
It is ~90% the shipped `src/dropdown.ts` — start from that structure.

Behavior contract (verified against the React source — read it anyway; the
source wins on any detail this list compresses):

- Options: `defaultOpen` (boolean, default false).
- State: `open` — controllable, `x-modelable`-ready. Internal
  `pendingFocus: number | null` (not exposed).
- Served markup (consumer's): root `lyra-wssw`; trigger button
  `lyra-wssw__trigger` with `aria-controls` pointing at the popover id;
  popover `lyra-wssw__pop` with `role="listbox"` and `aria-labelledby`;
  options as `[role="option"]` buttons `lyra-wssw__item`, each with
  `data-id` and server-rendered `aria-selected` (`'true'` on the current
  workspace) — SELECTION IS SERVER-DRIVEN: the binding never mutates
  `aria-selected` or the trigger's content; it dispatches an event and
  the app re-renders.
- Named bindings:
  - `trigger`: `type: 'button'`, `:aria-expanded` (`'true'`/`'false'`),
    `@click` toggles — closing plainly, opening with `pendingFocus = -2`;
    `@keydown` (return early on `defaultPrevented`): Enter / Space →
    open with `-2`; ArrowDown → open with `0`; ArrowUp → open with `-1`;
    all preventDefault.
  - `popover`: `x-show` on `open`; `:class` OBJECT syntax for
    `lyra-wssw__pop--up` driven by the flip result (shared-brief
    lesson 5).
  - `option`: `@keydown` (return early on `defaultPrevented`): query
    `[role="option"]` from the captured root in DOM order, find the
    index of the event's currentTarget; ArrowDown/ArrowUp move focus
    CIRCULARLY (modulo), Home/End to first/last — all preventDefault and
    `.focus()` the target; Escape preventDefaults and closes RESTORING
    trigger focus; Tab closes WITHOUT restoring (no preventDefault).
    `@click` dispatches a bubbling `lyra:change` custom event with
    `detail: { id }` from `$el.dataset.id ?? ''`, then closes restoring
    trigger focus.
- Focus on open (pendingFocus semantics, ported exactly): after the
  popover is revealed (`$nextTick` + `whenVisible` per shared-brief
  lesson 2), with the option list queried fresh: `-2` → the option whose
  `aria-selected` is `'true'`, falling back to index 0; any other
  negative → last option; `n ≥ 0` → option n clamped to the last;
  `focus({ preventScroll: true })`; then clear `pendingFocus`.
- Outside `mousedown` (document listener attached while open, removed on
  close/destroy): a target outside the captured root closes without
  restoring focus — same shape as `src/dropdown.ts`.
- Flip placement: reuse `internal/flip-placement.ts` exactly as
`src/dropdown.ts` does (attach while open, cleanup on close/destroy);
the up-side class is `lyra-wssw__pop--up`.
</task>

<scope>
May change ONLY:
- `packages/alpine/src/workspace-switcher.ts` (new)
- `packages/alpine/src/workspace-switcher.browser.test.ts` (new)
- `packages/alpine/src/index.ts` (registration + type surface if needed)
- `packages/alpine/package.json` (size-limit budget line only)
- `.changeset/alpine-lyra-workspace-switcher.md` (new — one-paragraph
  minor changeset for `@lyra-ds/alpine`, mirroring the existing alpine
  changesets' style)
Do not change anything outside this list; if the task requires it, stop
and report.
</scope>

<acceptance_criteria>

1. `pnpm --filter @lyra-ds/alpine run typecheck` passes (paste real
   output).
2. `pnpm exec prettier --check packages/alpine` passes.
3. `src/workspace-switcher.browser.test.ts` uses a served-markup fixture
   (≥3 options, `aria-selected="true"` on a NON-first option — that
   makes the `-2` fallback distinguishable) and covers: click toggle +
   aria-expanded; Enter/Space focuses the selected option, ArrowDown the
   first, ArrowUp the last (assert `document.activeElement` with
   `vi.waitFor`); option arrows wrap circularly, Home/End; Escape closes
   and restores trigger focus; Tab closes without restoring; outside
   mousedown closes; option click dispatches `lyra:change` with the
   right `detail.id`, closes, restores trigger focus, and does NOT
   mutate `aria-selected`; flip: a trigger FORCED against the viewport
   bottom (arithmetic per shared-brief lesson 6) gets `--up`, a roomy
   one does not; `x-modelable` + `x-model` works BOTH directions on
   `open`; axe clean open and closed.
4. `Alpine.plugin(lyra)` now registers `lyraWorkspaceSwitcher`; all
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
