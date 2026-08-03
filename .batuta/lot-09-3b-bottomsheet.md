# Lote 09-3b — Onda 3b: BottomSheet (componente ausente do pacote)

Sits on top of `.batuta/brief-fase8-waves.md` — read it first, in full,
including the addendum.

<task>
`BottomSheet` — the ONLY component of the phase with no handoff code and no
handoff CSS (the package's DatePicker/DateRangePicker import it from a path
that does not exist; the map documents the gap). Its public contract is the
`BottomSheetProps` interface in `handoff/llms.txt` (search "### BottomSheet")
— reproduce it EXACTLY (open, onClose, title, children + HTMLAttributes).
Everything else follows the repo's own overlay machinery: `Drawer` is the
nearest template (portal, focus trap with restore, Escape + overlay close,
exit animation pattern, translated close-button label prop) — copy its shape.
</task>

## CSS (the exception lot: new classes, ours)

New `.lyra-bottomsheet*` classes appended to
`packages/styles/components/feedback/feedback.css`'s additive region, in the
established additive-extension comment style, registered in
`ADDITIVE_EXTENSIONS` (`tools/parity/parity.mjs`, data structure only) —
both files are inside Boundaries for this lot. Design language comes from
the existing tokens and the Drawer/Dialog CSS: panel fixed to the bottom
edge, full width, top corners `--radius-lg`-class rounding, surface/border/
shadow per the foundations (dark elevation = surface + border, not shadow),
overlay identical to the Dialog's, entry animation transform-only
(slide-up), exit animation per the repo's exit pattern, close button with a
44px touch target. `pnpm run parity` must stay green.

## Acceptance criteria

1. Contract == llms.txt interface; `role="dialog"` + `aria-modal` + labelled
   by the title (or a translated aria-label prop when title is absent —
   compile-time union like Brand if the repo precedent applies).
2. Focus trap + focus restore on close; Escape and overlay click close;
   browser tests for all three plus light+dark axe clean; SSR test.
3. Exit animation proven the way the repo tests Drawer's (copy that test's
   mechanism).
4. Wiring complete (entry, exports, size-limit, barrel, docgen 64 → 65);
   changeset minor. Report the docgen count.

## Stop conditions

Drawer's machinery not reusable without refactoring it (report, don't
refactor); parity unable to express the new classes; same command failing
twice.

<default_follow_through_policy>
Proceed without asking questions. Every decision within this contract is
yours; implement end to end and report per the shared brief's report
contract.
</default_follow_through_policy>

## RETRY FEEDBACK (accepted review findings — fix exactly these seven)

1. HIGH — reopening while the exit animation is mounted leaves focus outside
   the modal (the mount-only focus effect never reruns after usePresence
   cancels the exit). Re-run the focus-capture path on every open
   transition, not only on mount. Browser test: open → close → reopen before
   the exit finishes → Tab stays trapped in the sheet.
2. HIGH — backdrop dismissal must copy the Dialog's mousedown-origin guard
   (dialog.tsx:160-166): a drag that starts inside the panel and releases
   over the overlay must NOT close. Test both directions.
3. MED — focus restore: if the captured opener is no longer connected on
   close, fall back (document.body or skip) instead of calling focus() on a
   detached node. Test with an opener removed while the sheet is open.
4. MED — the scrollable body gains `overscroll-behavior: contain` (additive
   CSS, same discipline).
5. MED — the `100dvh` max-height needs a `100vh` fallback declaration before
   it AND `env(safe-area-inset-bottom)` padding on the body (additive CSS).
6. LOW — the presence test renders only `open`; make it exercise a real
   close (animationend) so it proves presence bookkeeping.
7. LOW — add the missing focus edges: a sheet with NO focusable children
   traps Tab on the panel itself, and closing via the × button restores
   focus to the opener.

closeLabel/container stay — they are Drawer parity, contracted. Re-run
offline gates; the maestro reruns the browser suite.
