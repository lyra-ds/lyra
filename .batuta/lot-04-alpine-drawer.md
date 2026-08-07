# Lot 04 — `lyraDrawer`

Sits on top of `.batuta/brief-alpine-wave1.md`. Read both in full before
writing anything. Work from the repo root; do not commit.

<task>
Port the Drawer state machine from `packages/react/src/drawer/drawer.tsx`
(tests: `packages/react/src/drawer/drawer.browser.test.tsx`) to
`Alpine.data('lyraDrawer', ...)`, REUSING the shared internals landed by
lyraDialog: `internal/focus-trap.ts`, `internal/scroll-lock.ts`,
`internal/presence.ts`. Do not fork or modify them — `lyraDialog`'s suite
must keep passing unchanged.

Copy `packages/alpine/src/dialog.ts` as the structural template — Drawer is
Dialog with a slide-over panel and a SIMPLER close surface. The React source
wins on any detail this list compresses; the differences from Dialog that
matter:

- State: `open` (seeded by optional `defaultOpen`, default false),
  controllable via `x-modelable`. Single derived `mounted` flag drives the
  overlay `x-show` (shared-brief lesson 5 — never `open || closing`).
- Options (x-data argument object): `defaultOpen`, `labelId` (optional —
  generate the title id like Dialog when absent). There are NO
  `closeOnEsc`/`closeOnOverlayClick` options — React parity: Drawer always
  closes on Esc and backdrop click.
- Named bindings: `overlay` (`.lyra-drawer-overlay`), `panel`
  (`.lyra-drawer`), `title`, `close`. Base classes stay in the consumer's
  markup.
- Classes while closing: `lyra-drawer-overlay--closing` on the overlay,
  `lyra-drawer--closing` on the panel.
- ARIA on the panel: `role="dialog"`, `aria-modal="true"`,
  `aria-labelledby` → title id, `tabindex="-1"`.
- Backdrop close: plain `click` where `event.target === event.currentTarget`
  closes — NO mousedown tracking (React Drawer has no WR-02 drag guard;
  parity means not adding one).
- Esc: keydown on the PANEL always closes (no option gate).
- Scroll lock: React keys it on `!closing` within the mounted window —
  net behavior: locked while open, unlocked the moment close is requested,
  while the exit still plays. Match that observable behavior.
- Initial focus (every false→true flip): capture opener, focus first
  focusable (same selector as Dialog) else the panel, in `$nextTick`.
  Focus restore to the opener when `open` flips false.
- Focus trap on the panel while open.
- Exit presence: `--closing` classes, finalize on the panel's own
  `animationend` (target===currentTarget) or the 250ms fallback; reopen
  during exit cancels cleanly.
- Layer: markup in-place, no `x-teleport` (same decided model as Dialog).
</task>

<scope>
May change ONLY:
- `packages/alpine/src/drawer.ts` (new)
- `packages/alpine/src/drawer.browser.test.ts` (new)
- `packages/alpine/src/index.ts` (registration + type surface if needed)
- `packages/alpine/package.json` (size-limit budget line only)
- `.changeset/alpine-lyra-drawer.md` (new — one-paragraph minor changeset
  for `@lyra-ds/alpine`, mirroring `.changeset/alpine-lyra-dialog.md`'s
  style)
Do not change anything outside this list — in particular do NOT touch
`src/internal/*` or the dialog/dropdown files; if the task requires it,
stop and report.
</scope>

<acceptance_criteria>
1. `pnpm --filter @lyra-ds/alpine run typecheck` passes (paste real output).
2. `pnpm exec prettier --check packages/alpine` passes.
3. `src/drawer.browser.test.ts` mirrors the React suite's coverage for the
   ported behavior: exact class emission incl. `--closing` pair, focus trap,
   scroll lock (locked open, unlocked at close request), Esc + backdrop +
   close-button paths each restoring focus to the opener, exit presence
   (animates out, never vanishes same-frame; child animationend never
   finalizes), axe clean open AND closed, and the two-way
   `x-modelable`/`x-model` test. Follow shared-brief lesson 6 for test
   construction (flush after synthetic dispatch, `vi.waitFor` for focus
   re-entry, no stacked open overlays, interactive fixture elements inside
   the panel).
4. `Alpine.plugin(lyra)` now registers `lyraDrawer`; dialog, dropdown and
   smoke suites still pass unmodified.
5. size-limit budget updated per the shared brief's rule.
</acceptance_criteria>

<compact_output_contract>
Report back, in order: files touched (paths only); commands run with their
REAL output (typecheck, prettier, size-limit); the measured size and new
budget; any behavior detail where you diverged from the React source and
why; uncertainties declared as such. No test-result claims for suites you
cannot run.
</compact_output_contract>
