# Lot 03 — `lyraDialog`

Sits on top of `.batuta/brief-alpine-wave1.md`. Read both in full before
writing anything. Work from the repo root; do not commit.

<task>
Port the Dialog state machine from `packages/react/src/dialog/dialog.tsx`
(tests: `packages/react/src/dialog/dialog.browser.test.tsx`) to
`Alpine.data('lyraDialog', ...)`, including the three shared utilities it
depends on, ported as plain-function modules into `packages/alpine/src/internal/`
(Drawer reuses all three in a later lot):

- `packages/react/src/internal/use-focus-trap.ts` → `internal/focus-trap.ts`
  (attach/detach form: a function that binds the keydown trap to a panel
  element and returns a cleanup; keep the FOCUSABLE_SELECTOR + `isTabbable`
  filter, live re-query per keydown, edge wrap, zero-candidate containment,
  and panel-focused routing EXACTLY as the React hook implements them).
- `packages/react/src/internal/use-scroll-lock.ts` → `internal/scroll-lock.ts`
  (lock/unlock pair sharing the SAME module-level reference count and saved
  inline values; additive scrollbar-width padding compensation preserved).
- `packages/react/src/internal/use-presence.ts` → `internal/presence.ts`
  (open → closing → unmounted machine as a plain helper the Alpine data
  drives: `closing` flag, `animationend` finalize gated on
  `event.target === event.currentTarget`, and the 250ms wedge-proof fallback
  timeout, cancelled on reopen/finalize).

Layer decision (DECIDED — record it in your report, do not revisit): the
overlay markup is rendered in place by the consumer (server-side markup),
NO `x-teleport`. `.lyra-dialog-overlay` is position:fixed and needs no
portal in this consumer model.

Behavior contract (verified against the React source — read it anyway; the
source wins on any detail this list compresses):

- State: `open` (seeded by optional `defaultOpen` argument, default false).
  `open` is the controllable state for `x-modelable`. Derived presence:
  the overlay stays in the DOM (`x-show` via the `overlay` binding) while
  `open || closing`.
- Options (x-data argument object): `defaultOpen`, `closeOnEsc` (default
  true), `closeOnOverlayClick` (default true), `labelId` (optional — when
  absent generate the title id like Dropdown generates the menu id).
- Named bindings: `overlay` (the `.lyra-dialog-overlay` element), `panel`
  (the `.lyra-dialog` element), `title` (the heading — wires the id for
  `aria-labelledby`), `close` (the × button). The consumer's own trigger
  simply sets `open = true` (plus `x-modelable`); there is no trigger
  binding — React parity: the Dialog is controlled and renders no trigger.
- Classes: `overlay` binding emits `lyra-dialog-overlay--closing` and the
  `panel` binding emits `lyra-dialog--closing` while `closing` holds. The
  base classes (`lyra-dialog-overlay`, `lyra-dialog`, header/body/footer)
  stay in the consumer's markup — bindings must not strip or fight them.
- ARIA on the panel: `role="dialog"`, `aria-modal="true"`,
  `aria-labelledby` → title id, `tabindex="-1"` (programmatic focus target
  and zero-candidate containment fallback).
- Initial focus (on every false→true flip, not just the first): capture
  `document.activeElement` as the opener, then focus the panel's first
  focusable per the React `INITIAL_FOCUS_SELECTOR`, falling back to the
  panel itself. Remember lesson 2 in the shared brief: the panel is
  revealed by `x-show`, so the focus move goes in `$nextTick`.
- Focus restore: when `open` flips to false (any close path), restore focus
  to the captured opener, then clear it. Keyed on the state flip, exactly
  like the React effect.
- Focus trap: attach the ported trap to the panel while open; detach on
  close/destroy.
- Scroll lock: keys on `open` (NOT on the presence/mounted state) — the
  page scrolls again the moment close is requested, while the exit
  animation still plays.
- Close paths: Esc (keydown on the PANEL, as in React — focus is inside),
  gated by `closeOnEsc`; overlay backdrop click gated by
  `closeOnOverlayClick` AND by the React WR-02 rule — the `mousedown` AND
  the `click` target must BOTH be the overlay itself (a drag that starts
  on the panel and releases on the backdrop must not close); the `close`
  binding's click. Every close path is a plain `this.open = false`
  assignment (x-modelable reactivity).
- Exit presence: on open→false set `closing`, keep the overlay shown,
  finalize on the panel's own `animationend` (target===currentTarget) or
  the 250ms fallback, whichever first; reopen during the exit window
  cancels the close cleanly and re-runs initial focus (mirror the React
  WR-03 test).
</task>

<scope>
May change ONLY:
- `packages/alpine/src/dialog.ts` (new)
- `packages/alpine/src/dialog.browser.test.ts` (new)
- `packages/alpine/src/internal/focus-trap.ts` (new)
- `packages/alpine/src/internal/scroll-lock.ts` (new)
- `packages/alpine/src/internal/presence.ts` (new)
- `packages/alpine/src/index.ts` (registration + type surface if needed)
- `packages/alpine/package.json` (size-limit budget line only)
Do not change anything outside this list; if the task requires it, stop and
report.
</scope>

<acceptance_criteria>
1. `pnpm --filter @lyra-ds/alpine run typecheck` passes (paste real output).
2. `pnpm exec prettier --check packages/alpine` passes.
3. `src/dialog.browser.test.ts` mirrors the React suite's coverage for the
   ported behavior: focus trap (edge wrap, background never reached,
   zero-focusable containment, panel-focused routing), initial focus
   (first focusable, deep-in-body, reopen-during-exit re-entry), close
   paths (Esc, Esc disabled, overlay press+release, overlay disabled,
   inside click never closes, panel→backdrop drag never closes, × button,
   focus restore on each), presence (`--closing` classes then removal
   within 500ms), scroll lock (overflow hidden + additive paddingRight,
   restored on close, page scrollable again during the exit window), axe
   clean open AND closed, and the two-way `x-modelable`/`x-model` test.
4. `Alpine.plugin(lyra)` now registers `lyraDialog`; the existing dropdown
   and smoke suites still pass unmodified (do not touch their files).
5. size-limit budget updated per the shared brief's rule.
</acceptance_criteria>

<compact_output_contract>
Report back, in order: files touched (paths only); commands run with their
REAL output (typecheck, prettier, size-limit); the measured size and new
budget; any behavior detail where you diverged from the React source and
why; uncertainties declared as such. No test-result claims for suites you
cannot run.
</compact_output_contract>
