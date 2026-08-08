# Lot C1 — `lyraBottomSheet`

Sits on top of `.batuta/brief-alpine-wave-c.md`. Read both in full before
writing anything. Work from the repo root; do not commit.

<task>
Port the BottomSheet state machine from
`packages/react/src/bottom-sheet/bottom-sheet.tsx`
(tests: `packages/react/src/bottom-sheet/bottom-sheet.browser.test.tsx`).
It is the sibling of the shipped `src/dialog.ts` and `src/drawer.ts` —
start from their structure (presence/`mounted`, focus trap, scroll lock,
opener capture/restore).

Behavior contract (verified against the React source — read it anyway; the
source wins on any detail this list compresses):

- Options: `defaultOpen` (boolean, default false).
- State: `open` — controllable, `x-modelable`-ready. Presence via
  `internal/presence.ts` (single `mounted` flag for `x-show`, `--closing`
  classes via `:class` OBJECT syntax, `animationend` finalizes — exactly
  like dialog/drawer).
- Served markup (consumer's): overlay `lyra-bottomsheet-overlay` wrapping
  panel `lyra-bottomsheet` (with `role="dialog"` `aria-modal="true"`
  `tabindex="-1"` and `aria-labelledby` pointing at the title, or
  `aria-label` when titleless — served, not managed), optional header
  with `lyra-bottomsheet__title` (its id served) and
  `lyra-bottomsheet__close` button, body `lyra-bottomsheet__body`.
- While open: focus trap on the panel (`internal/focus-trap.ts`), scroll
  lock (`internal/scroll-lock.ts` — active while NOT closing, matching
  React's `useScrollLock(!closing)` which releases during the exit
  animation), capture the opener (`document.activeElement` at open) and
  focus the panel's first focusable element (React's
  `INITIAL_FOCUS_SELECTOR` list: `a[href]`, enabled
  button/input/select/textarea, `[tabindex]:not([tabindex="-1"])`),
  falling back to the panel itself — after reveal via `$nextTick` +
  `whenVisible` (shared-brief lesson 2).
- On close: restore focus to the captured opener if still connected;
  clear the capture.
- Backdrop dismissal with the DRAG GUARD, ported exactly: record on the
  overlay's `@mousedown` whether `event.target === event.currentTarget`;
  the overlay's `@click` closes ONLY when that flag is set AND
  `event.target === event.currentTarget`. A drag that starts on the panel
  and releases on the overlay must NOT close (and vice versa).
- Escape: `@keydown` on the PANEL closes (React parity — the panel owns
  the modal-dialog Escape; no document-level listener).
- Closing dispatches nothing by itself; user dismissals (Escape, backdrop,
  close button) set `open = false` — consumers observe via `x-model`. Also
  dispatch a bubbling `lyra:close` custom event on dismissal for
  non-modelable consumers (record this as the Alpine translation of
  React's `onClose`).
- Named bindings:
  - `overlay`: `x-show` reading `mounted` only; `:class` object for
    `lyra-bottomsheet-overlay--closing`; `@mousedown` (drag-guard
    record); `@click` (guarded dismiss).
  - `panel`: `:class` object for `lyra-bottomsheet--closing`;
    `@animationend` presence finalize; `@keydown` Escape dismiss.
  - `close`: `type: 'button'`, `@click` dismiss.
  - `title`: nothing dynamic (id/role served) — OMIT the binding;
  document the served requirements in the factory JSDoc.
  </task>

<scope>
May change ONLY:
- `packages/alpine/src/bottom-sheet.ts` (new)
- `packages/alpine/src/bottom-sheet.browser.test.ts` (new)
- `packages/alpine/src/index.ts` (registration + type surface if needed)
- `packages/alpine/package.json` (size-limit budget line only)
- `.changeset/alpine-lyra-bottom-sheet.md` (new — one-paragraph minor
  changeset for `@lyra-ds/alpine`, mirroring the existing alpine
  changesets' style)
Do not change anything outside this list; if the task requires it, stop
and report.
</scope>

<acceptance_criteria>

1. `pnpm --filter @lyra-ds/alpine run typecheck` passes (or the direct
   `tsc` fallback per the shared brief; paste real output).
2. `pnpm exec prettier --check packages/alpine` passes (or direct
   fallback).
3. `src/bottom-sheet.browser.test.ts` mirrors the React suite's coverage
   for the ported behavior: opening focuses the first focusable inside
   the panel (and the panel itself when none), focus trap wraps Tab and
   Shift+Tab, Escape on the panel closes and restores opener focus,
   close-button dismissal, backdrop click closes, DRAG GUARD both ways
   (mousedown on panel + mouseup/click on overlay does not close;
   mousedown on overlay + click on overlay does), scroll lock applied
   while open and released during the closing animation, `--closing`
   classes appear and the overlay hides after `animationend`,
   `lyra:close` dispatched on dismissal, `x-modelable` + `x-model` works
   BOTH directions on `open`, axe clean open and closed.
4. `Alpine.plugin(lyra)` now registers `lyraBottomSheet`; all existing
   suites pass unmodified.
5. size-limit budget updated per the shared brief's rule (or explicitly
   left for the maestro if pnpm is broken).
   </acceptance_criteria>

<compact_output_contract>
Report back, in order: files touched (paths only); commands run with
their REAL output; the measured size and new budget (or "left to
maestro"); any behavior detail where you diverged from the React source
and why; uncertainties declared as such. No test-result claims for
suites you cannot run.
</compact_output_contract>
